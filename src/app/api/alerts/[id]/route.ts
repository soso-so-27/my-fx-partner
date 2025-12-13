import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { alertService } from '@/lib/pattern-service'

interface RouteParams {
    params: Promise<{ id: string }>
}

// PATCH /api/alerts/[id] - Update alert status or feedback
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json() as {
            action: 'read' | 'acted' | 'feedback'
            feedback?: 'thumbs_up' | 'thumbs_down'
        }

        let success = false

        switch (body.action) {
            case 'read':
                success = await alertService.markAsRead(id, session.user.email)
                break
            case 'acted':
                success = await alertService.markAsActed(id, session.user.email)
                break
            case 'feedback':
                if (body.feedback) {
                    success = await alertService.submitFeedback(id, session.user.email, body.feedback)
                }
                break
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        if (!success) {
            return NextResponse.json({ error: 'Alert not found or update failed' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in PATCH /api/alerts/[id]:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
