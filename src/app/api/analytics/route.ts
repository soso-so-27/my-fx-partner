import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getSupabaseAdmin, getOrCreateUserProfile } from '@/lib/supabase-admin'
import { AnalyticsService, EventType } from '@/lib/analytics-service'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const eventType = body.eventType as EventType
        const metadata = body.metadata || {}

        if (!eventType) {
            return NextResponse.json({ error: 'Missing eventType' }, { status: 400 })
        }

        const supabaseAdmin = getSupabaseAdmin()
        // Ensure profile exists or get ID
        const userId = await getOrCreateUserProfile(supabaseAdmin, session.user.email)

        await AnalyticsService.trackEvent(supabaseAdmin, userId, eventType, metadata)

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Analytics API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
