import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getSupabaseAdmin, getOrCreateUserProfile } from '@/lib/supabase-admin'
import { PollService } from '@/lib/poll-service'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { pollId, choice, confidence } = await request.json()

        if (!pollId || !choice) {
            return NextResponse.json({ error: 'Missing pollId or choice' }, { status: 400 })
        }

        const supabaseAdmin = getSupabaseAdmin()
        const userId = await getOrCreateUserProfile(supabaseAdmin, session.user.email)

        // Check if already voted
        const existingVote = await PollService.getUserVote(supabaseAdmin, userId, pollId)
        if (existingVote) {
            return NextResponse.json({ error: 'Already voted' }, { status: 409 })
        }

        // Submit vote
        await PollService.submitVote(supabaseAdmin, userId, pollId, choice, confidence)

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Vote API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
