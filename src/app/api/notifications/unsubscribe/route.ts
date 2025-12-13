import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getSupabaseAdmin, getOrCreateUserProfile } from '@/lib/supabase-admin'

// POST /api/notifications/unsubscribe - Remove push subscription
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = getSupabaseAdmin()
        const userId = await getOrCreateUserProfile(supabase, session.user.email, session.user.name || undefined)

        const { endpoint } = await request.json()

        if (!endpoint) {
            return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 })
        }

        // Delete subscription
        const { error } = await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', userId)
            .eq('endpoint', endpoint)

        if (error) {
            console.error('Error deleting subscription:', error)
            return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in POST /api/notifications/unsubscribe:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
