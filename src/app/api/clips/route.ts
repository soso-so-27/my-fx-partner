import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { clipService, ClipInput } from '@/lib/clip-service'
import { getSupabaseAdmin, getOrCreateUserProfile } from '@/lib/supabase-admin'

// GET /api/clips - Get all clips for the current user
export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user profile UUID
        const supabase = getSupabaseAdmin()
        const userId = await getOrCreateUserProfile(supabase, session.user.email, session.user.name || undefined)

        const clips = await clipService.getClips(userId)

        return NextResponse.json({ clips })
    } catch (error) {
        console.error('Error in GET /api/clips:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/clips - Create a new clip
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json() as ClipInput

        // Validate required fields
        if (!body.url) {
            return NextResponse.json({
                error: 'Missing required field: url'
            }, { status: 400 })
        }

        // Get user profile UUID
        const supabase = getSupabaseAdmin()
        const userId = await getOrCreateUserProfile(supabase, session.user.email, session.user.name || undefined)

        const clip = await clipService.createClip(userId, body)

        if (!clip) {
            return NextResponse.json({ error: 'Failed to create clip' }, { status: 500 })
        }

        return NextResponse.json({ clip }, { status: 201 })
    } catch (error) {
        console.error('Error in POST /api/clips:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
