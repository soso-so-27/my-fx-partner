import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { patternService, PatternInput } from '@/lib/pattern-service'
import { getSupabaseAdmin, getOrCreateUserProfile } from '@/lib/supabase-admin'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/patterns/[id] - Get a single pattern
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
        const pattern = await patternService.getPattern(id)

        if (!pattern) {
            return NextResponse.json({ error: 'Pattern not found' }, { status: 404 })
        }

        // Check ownership
        if (pattern.userId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        return NextResponse.json({ pattern })
    } catch (error) {
        console.error('Error in GET /api/patterns/[id]:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PATCH /api/patterns/[id] - Update a pattern
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
        const body = await request.json() as Partial<PatternInput>

        const pattern = await patternService.updatePattern(id, userId, body)

        if (!pattern) {
            return NextResponse.json({ error: 'Pattern not found or update failed' }, { status: 404 })
        }

        return NextResponse.json({ pattern })
    } catch (error) {
        console.error('Error in PATCH /api/patterns/[id]:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/patterns/[id] - Delete a pattern
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
        const success = await patternService.deletePattern(id, userId)

        if (!success) {
            return NextResponse.json({ error: 'Pattern not found or delete failed' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in DELETE /api/patterns/[id]:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
