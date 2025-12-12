
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

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const email = session.user.email
        const logs: string[] = []
        const log = (msg: string) => logs.push(msg)

        log(`Starting debug for email: ${email}`)

        const supabaseAdmin = getSupabaseAdmin()

        // 1. Search for profile
        log('1. Searching for profile...')
        const { data: profile, error: findError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .ilike('email', email)
            .maybeSingle()

        if (findError) {
            log(`Error finding profile: ${findError.message}`)
            return NextResponse.json({ logs, error: findError }, { status: 500 })
        }

        if (!profile) {
            log('Profile NOT found via ilike search.')
            // Try creating
            log('Attempting to create...')
            const { data: newProfile, error: createError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    email,
                    display_name: email.split('@')[0],
                    created_at: new Date().toISOString()
                })
                .select()
                .single()

            if (createError) {
                log(`Creation failed: ${createError.message}`)
                return NextResponse.json({ logs, error: createError })
            }
            log(`Created new profile: ${newProfile.id}`)
        } else {
            log(`Found profile: ${profile.id}`)
            log(`Email in DB: ${profile.email}`)
        }

        const targetId = profile ? profile.id : 'unknown'

        if (targetId === 'unknown') return NextResponse.json({ logs })

        // 2. Try Dummy Trade Insert
        log('2. Attempting dummy trade insert...')
        const dummyTrade = {
            user_id: targetId,
            pair: 'DEBUG',
            direction: 'BUY',
            entry_time: new Date().toISOString(),
            session: 'Tokyo'
        }

        const { data: trade, error: tradeError } = await supabaseAdmin
            .from('trades')
            .insert(dummyTrade)
            .select()
            .single()

        if (tradeError) {
            log(`TRADE INSERT FAILED: ${tradeError.message}`)
            log(`Details: ${JSON.stringify(tradeError)}`)
        } else {
            log(`TRADE INSERT SUCCESS: ${trade.id}`)
            // Cleanup
            await supabaseAdmin.from('trades').delete().eq('id', trade.id)
            log('Cleaned up dummy trade')
        }

        return NextResponse.json({ logs, success: !tradeError })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
