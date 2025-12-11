import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseServiceKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

// Calculate trading session based on Tokyo time
function calculateSession(entryTime: string): 'Tokyo' | 'London' | 'NewYork' | 'Sydney' {
    const date = new Date(entryTime)
    const tokyoHour = (date.getUTCHours() + 9) % 24

    if (tokyoHour >= 9 && tokyoHour < 15) return 'Tokyo'
    if (tokyoHour >= 16 && tokyoHour < 24) return 'London'
    if (tokyoHour >= 21 || tokyoHour < 6) return 'NewYork'
    return 'Sydney'
}

// POST /api/trades - Create new trade
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabaseAdmin = getSupabaseAdmin()
        const body = await request.json()

        // Get user ID from profiles table
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', session.user.email)
            .single()

        if (profileError || !profile) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
        }

        const entryTime = body.entryTime || new Date().toISOString()

        const dbInput = {
            user_id: profile.id,
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
            rule_compliance: body.ruleCompliance || []
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
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Missing trade ID' }, { status: 400 })
        }

        const { error } = await supabaseAdmin
            .from('trades')
            .delete()
            .eq('id', id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
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
