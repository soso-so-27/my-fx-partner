import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getSupabaseAdmin, getOrCreateUserProfile } from '@/lib/supabase-admin'

// POST /api/push/subscribe - Save push subscription
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = getSupabaseAdmin()
        const userId = await getOrCreateUserProfile(supabase, session.user.email)

        if (!userId) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
        }

        const { subscription } = await req.json()

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
        }

        // Save or update push subscription
        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: userId,
                endpoint: subscription.endpoint,
                keys: subscription.keys,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'endpoint'
            })

        if (error) {
            console.error('Error saving push subscription:', error)
            return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in push subscribe:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/push/subscribe - Remove push subscription
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = getSupabaseAdmin()
        const userId = await getOrCreateUserProfile(supabase, session.user.email)

        if (!userId) {
            return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
        }

        const { endpoint } = await req.json()

        const { error } = await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', userId)
            .eq('endpoint', endpoint)

        if (error) {
            console.error('Error removing push subscription:', error)
            return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in push unsubscribe:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
