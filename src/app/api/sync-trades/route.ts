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

    if (!session || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

        for (const msg of messages) {
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

            console.log(`Processing email: ${subject}`, { bodyPreview: body.substring(0, 100) })

            const parsedTrade = emailParser.parse(subject, body, msg.id)

            if (parsedTrade) {
                // Check for duplicates using the authenticated client
                const { data: existing } = await authenticatedSupabase
                    .from('trades')
                    .select('id')
                    .eq('original_email_id', msg.id)
                    .single()

                if (!existing) {
                    // Direct insert using authenticated client
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
