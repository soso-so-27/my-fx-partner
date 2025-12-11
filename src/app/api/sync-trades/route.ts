import { NextResponse } from "next/server"
// FORCE DEPLOY FIX
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { gmailService } from "@/lib/gmail-service"
import { emailParser } from "@/lib/email-parser"
import { createClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Define interface locally to avoid build errors
interface SessionWithToken {
    accessToken?: string
    user?: {
        name?: string | null
        email?: string | null
        image?: string | null
    }
}

export async function POST() {
    const session = await getServerSession(authOptions) as unknown as SessionWithToken


    if (!session) {
        return NextResponse.json({ error: "No session - please reconnect Gmail" }, { status: 401 })
    }

    if ((session as any)?.error === "RefreshAccessTokenError") {
        return NextResponse.json({ error: "Token expired - please disconnect and reconnect Gmail" }, { status: 401 })
    }

    if (!session.accessToken) {
        return NextResponse.json({ error: "No access token - try disconnecting and reconnecting Gmail" }, { status: 401 })
    }


    try {
        // 1. Get recent emails
        const messages = await gmailService.getRecentEmails(session.accessToken)

        // 2. Parse emails
        const newTrades = []

        // Get Supabase session to ensure we have the token
        const supabase = await createClient()
        const { data: { session: supabaseSession }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !supabaseSession) {
            console.error("Supabase Session Error:", sessionError)
            return NextResponse.json({ error: "Supabase Session not found" }, { status: 401 })
        }

        // Create a direct client with the access token to ensure RLS works
        const authenticatedSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${supabaseSession.access_token}`
                    }
                }
            }
        )

        const userId = supabaseSession.user.id

        // Process emails in chronological order (oldest first) so entries are saved before settlements
        const sortedMessages = [...messages].reverse()

        for (const msg of sortedMessages) {
            const subject = msg.payload.headers.find(h => h.name === 'Subject')?.value || ''

            // Helper to extract body from parts
            const getBody = (payload: any): string => {
                if (payload.body?.data) {
                    return Buffer.from(payload.body.data, 'base64').toString()
                }
                if (payload.parts) {
                    for (const part of payload.parts) {
                        if (part.mimeType === 'text/plain') {
                            return part.body?.data ? Buffer.from(part.body.data, 'base64').toString() : ''
                        }
                    }
                    // If no text/plain, try text/html and strip tags (simplified)
                    for (const part of payload.parts) {
                        if (part.mimeType === 'text/html') {
                            return part.body?.data ? Buffer.from(part.body.data, 'base64').toString() : ''
                        }
                    }
                }
                return ''
            }

            const rawBody = getBody(msg.payload) || msg.snippet
            // Simple HTML tag stripping for robustness
            const body = rawBody.replace(/<[^>]*>/g, ' ')


            const parsedTrade = emailParser.parse(subject, body, msg.id)

            if (parsedTrade) {
                // Check for duplicates using the authenticated client
                const { data: existing } = await authenticatedSupabase
                    .from('trades')
                    .select('id')
                    .eq('original_email_id', msg.id)
                    .single()

                if (!existing) {
                    // Check if this is a settlement/exit trade (has exitPrice but no entryPrice)
                    const isSettlement = parsedTrade.exitPrice && parsedTrade.entryPrice === 0

                    if (isSettlement) {
                        // Try to find matching open position
                        // For settlement: 売 direction means closing a 買 position, and vice versa
                        const oppositeDirection = parsedTrade.direction === 'BUY' ? 'SELL' : 'BUY'

                        // Find open trades with same pair that don't have exit_price yet
                        const { data: openTrades, error: findError } = await authenticatedSupabase
                            .from('trades')
                            .select('*')
                            .eq('user_id', userId)
                            .eq('pair', parsedTrade.pair)
                            .eq('direction', oppositeDirection)  // Opposite because closing
                            .is('exit_price', null)
                            .order('entry_time', { ascending: true })

                        if (findError) {
                            console.error("Error finding open trades:", findError)
                        }


                        if (openTrades && openTrades.length > 0) {
                            // Match with the oldest open position (FIFO)
                            let remainingQuantity = parsedTrade.lotSize || 0

                            for (const openTrade of openTrades) {
                                if (remainingQuantity <= 0) break

                                const openLotSize = openTrade.lot_size || 0
                                const matchedLotSize = Math.min(openLotSize, remainingQuantity)

                                // Calculate PnL
                                const entryPrice = openTrade.entry_price
                                const exitPrice = parsedTrade.exitPrice!
                                const direction = openTrade.direction

                                // For BUY: profit = (exit - entry) * lots * 100000 / exit (for JPY pairs)
                                // For SELL: profit = (entry - exit) * lots * 100000 / exit
                                let pnlPips = 0
                                let pnlAmount = 0

                                // Determine if it's a JPY pair for pip calculation
                                const isJPYPair = parsedTrade.pair.includes('JPY')
                                const pipMultiplier = isJPYPair ? 100 : 10000

                                if (direction === 'BUY') {
                                    pnlPips = (exitPrice - entryPrice) * pipMultiplier
                                } else {
                                    pnlPips = (entryPrice - exitPrice) * pipMultiplier
                                }

                                // Calculate amount (approximate for JPY pairs)
                                // 1 lot = 100,000 units, 1 pip for JPY pair ≈ 1000 JPY per lot
                                pnlAmount = pnlPips * matchedLotSize * (isJPYPair ? 1000 : 10)


                                // Update the open trade with exit info
                                const { error: updateError } = await authenticatedSupabase
                                    .from('trades')
                                    .update({
                                        exit_price: exitPrice,
                                        exit_time: parsedTrade.exitTime,
                                        pnl: {
                                            pips: Math.round(pnlPips * 10) / 10,
                                            amount: Math.round(pnlAmount),
                                            currency: 'JPY'
                                        },
                                        notes: (openTrade.notes || '') + ` | 決済: ${exitPrice}`
                                    })
                                    .eq('id', openTrade.id)

                                if (updateError) {
                                    console.error("Error updating trade:", updateError)
                                } else {
                                    newTrades.push({ ...openTrade, matched: true })
                                }

                                remainingQuantity -= matchedLotSize
                            }

                            // If there's remaining quantity, it might be a partial close without matching entry
                            if (remainingQuantity > 0) {
                            }

                            continue // Don't insert the settlement as a new trade
                        } else {
                            // No matching open trade found, insert settlement as new record
                        }
                    }

                    // Direct insert for new trades (or unmatched settlements)
                    const dbInput = {
                        user_id: userId,
                        pair: parsedTrade.pair,
                        direction: parsedTrade.direction,
                        entry_price: parsedTrade.entryPrice,
                        entry_time: parsedTrade.entryTime || new Date().toISOString(),
                        exit_price: parsedTrade.exitPrice,
                        exit_time: parsedTrade.exitTime,
                        stop_loss: parsedTrade.stopLoss,
                        take_profit: parsedTrade.takeProfit,
                        lot_size: parsedTrade.lotSize,
                        pnl: parsedTrade.pnl,
                        notes: parsedTrade.notes,
                        tags: parsedTrade.tags,
                        is_verified: parsedTrade.isVerified,
                        verification_source: parsedTrade.verificationSource,
                        broker: parsedTrade.broker,
                        original_email_id: parsedTrade.originalEmailId
                    }

                    const { data: trade, error } = await authenticatedSupabase
                        .from('trades')
                        .insert(dbInput)
                        .select()
                        .single()

                    if (error) {
                        console.error("Insert Error:", error)
                        // Continue to next email instead of failing all
                        continue
                    }
                    newTrades.push(trade)
                }
            }
        }

        return NextResponse.json({
            success: true,
            count: newTrades.length,
            trades: newTrades
        })

    } catch (error: any) {
        console.error("Sync Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
