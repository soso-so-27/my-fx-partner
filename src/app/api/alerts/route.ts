import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { alertService } from '@/lib/pattern-service'

// GET /api/alerts - Get all alerts for the current user
export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const alerts = await alertService.getAlerts(session.user.email)
        const unreadCount = await alertService.getUnreadCount(session.user.email)

        return NextResponse.json({
            alerts,
            unreadCount
        })
    } catch (error) {
        console.error('Error in GET /api/alerts:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
