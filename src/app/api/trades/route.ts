import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getSupabaseAdmin, getOrCreateUserProfile } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// Calculate trading session based on Tokyo time

// Calculate trading session based on Tokyo time
function calculateSession(entryTime: string): 'Tokyo' | 'London' | 'NewYork' | 'Sydney' {
    const date = new Date(entryTime)
    const tokyoHour = (date.getUTCHours() + 9) % 24

    if (tokyoHour >= 9 && tokyoHour < 15) return 'Tokyo'
    if (tokyoHour >= 16 && tokyoHour < 24) return 'London'
    if (tokyoHour >= 21 || tokyoHour < 6) return 'NewYork'
    return 'Sydney'
}

// GET /api/trades - Get user's trades
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabaseAdmin = getSupabaseAdmin()
        const userId = await getOrCreateUserProfile(supabaseAdmin, session.user.email, session.user.name || undefined)

        const { searchParams } = new URL(request.url)
        const dataSource = searchParams.get('dataSource')
        console.log(`DEBUG: GET trades for userId: ${userId}, dataSource: ${dataSource}`)

        let query = supabaseAdmin
            .from('trades')
            .select('*')
            .eq('user_id', userId)

        // Filter based on dataSource
        if (dataSource) {
            if (dataSource === 'real') {
                query = query.in('data_source', ['gmail_sync', 'manual'])
            } else if (dataSource === 'demo') {
                query = query.in('data_source', ['demo'])
                // Also include tagged legacy demo data if specifically asking for demo
                // query = query.or(`data_source.eq.demo,tags.cs.{'#DEMO'}`) // This is complex in ORM, simplified for now
            } else if (dataSource === 'all') {
                // No filter
            } else {
                query = query.eq('data_source', dataSource)
            }
        }

        const { data, error } = await query.order('entry_time', { ascending: false })

        if (error) {
            console.error('Error fetching trades:', error)
            return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (error: any) {
        console.error('API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST /api/trades - Create new trade
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabaseAdmin = getSupabaseAdmin()
        const userId = await getOrCreateUserProfile(supabaseAdmin, session.user.email, session.user.name || undefined)

        console.log(`DEBUG: POST trade with userId: ${userId}`)

        // Verify profile exists (Safe guard)
        const { data: verifyProfile } = await supabaseAdmin.from('profiles').select('id').eq('id', userId).single()
        if (!verifyProfile) {
            console.error(`CRITICAL: Profile ${userId} returned by helper but not found in DB!`)
            throw new Error(`Profile internal inconsistency`)
        }

        const body = await request.json()
        const entryTime = body.entryTime || new Date().toISOString()

        const dbInput = {
            user_id: userId,
            pair: body.pair,
            pair_normalized: body.pair.toUpperCase().replace(/[/\s]/g, ''),
            direction: body.direction,
            entry_price: body.entryPrice || 0,
            entry_time: entryTime,
            exit_price: body.exitPrice,
            exit_time: body.exitTime,
            timezone: body.timezone || 'Asia/Tokyo',
            session: calculateSession(entryTime),
            stop_loss: body.stopLoss,
            take_profit: body.takeProfit,
            lot_size: body.lotSize,
            lot_size_raw: body.lotSizeRaw,
            pnl: body.pnl || { currency: 'JPY' },
            pnl_source: body.pnlSource || 'manual',
            chart_images: body.chartImages || [],
            notes: body.notes,
            tags: body.tags || [],
            is_verified: body.isVerified || false,
            verification_source: body.verificationSource,
            broker: body.broker,
            original_email_id: body.originalEmailId,
            rule_compliance: body.ruleCompliance || [],
            data_source: body.dataSource || 'manual' // Default to manual if not specified
        }

        const { data, error } = await supabaseAdmin
            .from('trades')
            .insert(dbInput)
            .select()
            .single()

        if (error) {
            console.error('Insert error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (error: any) {
        console.error('API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE /api/trades?id=xxx - Delete trade
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabaseAdmin = getSupabaseAdmin()
        const userId = await getOrCreateUserProfile(supabaseAdmin, session.user.email, session.user.name || undefined)

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        const dataSource = searchParams.get('dataSource')

        if (id) {
            const { error: deleteError } = await supabaseAdmin
                .from('trades')
                .delete()
                .eq('id', id)

            if (deleteError) throw deleteError
        } else if (dataSource === 'demo') {
            // Bulk delete demo data
            const { error: deleteError } = await supabaseAdmin
                .from('trades')
                .delete()
                .eq('user_id', userId) // Security: Ensure own user
                .eq('data_source', 'demo')

            if (deleteError) throw deleteError
        } else {
            return NextResponse.json({ error: 'Missing trade ID or valid dataSource' }, { status: 400 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PATCH /api/trades - Update trade
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabaseAdmin = getSupabaseAdmin()
        const body = await request.json()
        const { id, ...updates } = body

        if (!id) {
            return NextResponse.json({ error: 'Missing trade ID' }, { status: 400 })
        }

        // Convert camelCase to snake_case for DB
        const dbUpdates: any = { updated_at: new Date().toISOString() }
        if (updates.pair) {
            dbUpdates.pair = updates.pair
            dbUpdates.pair_normalized = updates.pair.toUpperCase().replace(/[/\s]/g, '')
        }
        if (updates.direction) dbUpdates.direction = updates.direction
        if (updates.entryPrice) dbUpdates.entry_price = updates.entryPrice
        if (updates.entryTime) dbUpdates.entry_time = updates.entryTime
        if (updates.exitPrice !== undefined) dbUpdates.exit_price = updates.exitPrice
        if (updates.exitTime) dbUpdates.exit_time = updates.exitTime
        if (updates.stopLoss) dbUpdates.stop_loss = updates.stopLoss
        if (updates.takeProfit) dbUpdates.take_profit = updates.takeProfit
        if (updates.lotSize) dbUpdates.lot_size = updates.lotSize
        if (updates.pnl) dbUpdates.pnl = updates.pnl
        if (updates.chartImages) dbUpdates.chart_images = updates.chartImages
        if (updates.notes) dbUpdates.notes = updates.notes
        if (updates.tags) dbUpdates.tags = updates.tags
        if (updates.dataSource) dbUpdates.data_source = updates.dataSource
        if (updates.wasModified !== undefined) dbUpdates.was_modified = updates.wasModified

        // Check current trade status to handle modification tracking
        const { data: currentTrade } = await supabaseAdmin
            .from('trades')
            .select('data_source, was_modified')
            .eq('id', id)
            .single()

        // If editing a Gmail-synced trade, mark as modified and unverified
        if (currentTrade?.data_source === 'gmail_sync') {
            dbUpdates.was_modified = true
            // Only force unverified if it wasn't already manually set in this update
            if (updates.isVerified === undefined) {
                dbUpdates.is_verified = false
            }
        }

        const { error } = await supabaseAdmin
            .from('trades')
            .update(dbUpdates)
            .eq('id', id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
