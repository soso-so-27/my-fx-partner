import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { alertService } from '@/lib/pattern-service'
import { getSupabaseAdmin, getOrCreateUserProfile } from '@/lib/supabase-admin'

// GET /api/alerts - Get all alerts for the current user
export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user profile UUID
        const supabase = getSupabaseAdmin()
        const userId = await getOrCreateUserProfile(supabase, session.user.email, session.user.name || undefined)

        const alerts = await alertService.getAlerts(userId)
        const unreadCount = await alertService.getUnreadCount(userId)

        return NextResponse.json({
            alerts,
            unreadCount
        })
    } catch (error) {
        console.error('Error in GET /api/alerts:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
