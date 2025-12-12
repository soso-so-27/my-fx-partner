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

// Get or create user profile by email
async function getOrCreateUserProfile(supabaseAdmin: any, email: string, name?: string) {
    // First try to find existing profile using maybeSingle (returns null if not found, no error)
    const { data: existingProfile, error: findError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle()

    if (findError) {
        console.error('Error finding profile:', findError)
    }

    if (existingProfile) {
        console.log('Found existing profile:', existingProfile.id)
        return existingProfile.id
    }

    console.log('Profile not found, creating new one for:', email)

    // Profile not found, create one
    const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
            email,
            display_name: name || email.split('@')[0],
            created_at: new Date().toISOString()
        })
        .select('id')
        .single()

    if (createError) {
        console.error('Error creating profile:', createError)
        // If creation failed due to unique constraint, try to find again
        if (createError.code === '23505') {
            const { data: retryProfile } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('email', email)
                .maybeSingle()
            if (retryProfile) return retryProfile.id
        }
        throw new Error('Failed to create user profile')
    }

    console.log('Created new profile:', newProfile.id)
    console.log('Created new profile:', newProfile.id)
    return newProfile.id
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

// GET /api/trades - Get user's trades
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabaseAdmin = getSupabaseAdmin()
        const userId = await getOrCreateUserProfile(supabaseAdmin, session.user.email, session.user.name || undefined)

        const { data, error } = await supabaseAdmin
            .from('trades')
            .select('*')
            .eq('user_id', userId)
            .order('entry_time', { ascending: false })

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

        console.log('DEBUG: Creating trade for email:', session.user.email)

        const supabaseAdmin = getSupabaseAdmin()
        const userId = await getOrCreateUserProfile(supabaseAdmin, session.user.email, session.user.name || undefined)

        console.log('DEBUG: Resolved userId:', userId)

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
