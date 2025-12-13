import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { clipService, ClipInput } from '@/lib/clip-service'
import { getSupabaseAdmin, getOrCreateUserProfile } from '@/lib/supabase-admin'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/clips/[id] - Get a single clip
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user profile UUID
        const supabase = getSupabaseAdmin()
        const userId = await getOrCreateUserProfile(supabase, session.user.email, session.user.name || undefined)

        const { id } = await params
        const clip = await clipService.getClip(id)

        if (!clip) {
            return NextResponse.json({ error: 'Clip not found' }, { status: 404 })
        }

        // Check ownership
        if (clip.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        return NextResponse.json({ clip })
    } catch (error) {
        console.error('Error in GET /api/clips/[id]:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PATCH /api/clips/[id] - Update a clip
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user profile UUID
        const supabase = getSupabaseAdmin()
        const userId = await getOrCreateUserProfile(supabase, session.user.email, session.user.name || undefined)

        const { id } = await params
        const body = await request.json() as Partial<ClipInput>

        const clip = await clipService.updateClip(id, userId, body)

        if (!clip) {
            return NextResponse.json({ error: 'Clip not found or update failed' }, { status: 404 })
        }

        return NextResponse.json({ clip })
    } catch (error) {
        console.error('Error in PATCH /api/clips/[id]:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/clips/[id] - Delete a clip
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user profile UUID
        const supabase = getSupabaseAdmin()
        const userId = await getOrCreateUserProfile(supabase, session.user.email, session.user.name || undefined)

        const { id } = await params
        const success = await clipService.deleteClip(id, userId)

        if (!success) {
            return NextResponse.json({ error: 'Clip not found or delete failed' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in DELETE /api/clips/[id]:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
