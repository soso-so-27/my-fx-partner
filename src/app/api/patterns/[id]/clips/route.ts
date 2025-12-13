import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getSupabaseAdmin, getOrCreateUserProfile } from '@/lib/supabase-admin'

// GET /api/patterns/[id]/clips - Get all clips linked to a pattern
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = getSupabaseAdmin()
        const userId = await getOrCreateUserProfile(supabase, session.user.email, session.user.name || undefined)
        const { id: patternId } = await params

        // Verify pattern ownership
        const { data: pattern } = await supabase
            .from('patterns')
            .select('id')
            .eq('id', patternId)
            .eq('user_id', userId)
            .single()

        if (!pattern) {
            return NextResponse.json({ error: 'Pattern not found' }, { status: 404 })
        }

        // Get linked clips
        const { data: links, error } = await supabase
            .from('pattern_clips')
            .select(`
                clip_id,
                created_at,
                clips (
                    id,
                    url,
                    title,
                    content_type,
                    thumbnail_url,
                    memo,
                    tags,
                    importance
                )
            `)
            .eq('pattern_id', patternId)

        if (error) {
            console.error('Error fetching pattern clips:', error)
            return NextResponse.json({ error: 'Failed to fetch linked clips' }, { status: 500 })
        }

        const clips = links?.map(link => ({
            ...link.clips,
            linkedAt: link.created_at
        })) || []

        return NextResponse.json({ clips })
    } catch (error) {
        console.error('Error in GET /api/patterns/[id]/clips:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/patterns/[id]/clips - Link a clip to a pattern
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = getSupabaseAdmin()
        const userId = await getOrCreateUserProfile(supabase, session.user.email, session.user.name || undefined)
        const { id: patternId } = await params
        const { clipId } = await request.json()

        if (!clipId) {
            return NextResponse.json({ error: 'clipId is required' }, { status: 400 })
        }

        // Verify pattern ownership
        const { data: pattern } = await supabase
            .from('patterns')
            .select('id')
            .eq('id', patternId)
            .eq('user_id', userId)
            .single()

        if (!pattern) {
            return NextResponse.json({ error: 'Pattern not found' }, { status: 404 })
        }

        // Verify clip ownership
        const { data: clip } = await supabase
            .from('clips')
            .select('id')
            .eq('id', clipId)
            .eq('user_id', userId)
            .single()

        if (!clip) {
            return NextResponse.json({ error: 'Clip not found' }, { status: 404 })
        }

        // Create link
        const { error } = await supabase
            .from('pattern_clips')
            .insert({
                pattern_id: patternId,
                clip_id: clipId
            })

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: 'Clip already linked' }, { status: 409 })
            }
            console.error('Error linking clip:', error)
            return NextResponse.json({ error: 'Failed to link clip' }, { status: 500 })
        }

        return NextResponse.json({ success: true }, { status: 201 })
    } catch (error) {
        console.error('Error in POST /api/patterns/[id]/clips:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/patterns/[id]/clips - Unlink a clip from a pattern
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = getSupabaseAdmin()
        const userId = await getOrCreateUserProfile(supabase, session.user.email, session.user.name || undefined)
        const { id: patternId } = await params
        const { clipId } = await request.json()

        if (!clipId) {
            return NextResponse.json({ error: 'clipId is required' }, { status: 400 })
        }

        // Verify pattern ownership
        const { data: pattern } = await supabase
            .from('patterns')
            .select('id')
            .eq('id', patternId)
            .eq('user_id', userId)
            .single()

        if (!pattern) {
            return NextResponse.json({ error: 'Pattern not found' }, { status: 404 })
        }

        // Delete link
        const { error } = await supabase
            .from('pattern_clips')
            .delete()
            .eq('pattern_id', patternId)
            .eq('clip_id', clipId)

        if (error) {
            console.error('Error unlinking clip:', error)
            return NextResponse.json({ error: 'Failed to unlink clip' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in DELETE /api/patterns/[id]/clips:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
