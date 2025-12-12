import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseServiceKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

// Get or create user profile by email
async function getOrCreateUserProfile(supabaseAdmin: any, email: string, name?: string) {
    // First try to find existing profile
    const { data: existingProfile, error: findError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

    if (existingProfile) {
        return existingProfile.id
    }

    // Profile not found, create one
    const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
            email,
            display_name: name || email.split('@')[0],
            created_at: new Date().toISOString()
        })
        .select('id')
        .single()

    if (createError) {
        console.error('Error creating profile:', createError)
        throw new Error('Failed to create user profile')
    }

    return newProfile.id
}

// GET /api/insights - Get user's insights
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabaseAdmin = getSupabaseAdmin()
        const userId = await getOrCreateUserProfile(supabaseAdmin, session.user.email, session.user.name || undefined)

        const { data, error } = await supabaseAdmin
            .from('insights')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching insights:', error)
            return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 })
        }

        const insights = (data || []).map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            content: d.content,
            mode: d.mode,
            userNote: d.user_note,
            createdAt: d.created_at,
            tags: d.tags || []
        }))

        return NextResponse.json(insights)
    } catch (error: any) {
        console.error('API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST /api/insights - Create new insight
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        // Debug logging
        console.log('Session debug:', JSON.stringify(session, null, 2))

        if (!session?.user?.email) {
            console.log('Unauthorized: No session or email', { session })
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabaseAdmin = getSupabaseAdmin()
        const userId = await getOrCreateUserProfile(supabaseAdmin, session.user.email, session.user.name || undefined)

        const body = await request.json()
        const { content, mode, userNote, tags } = body

        if (!content || !mode) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('insights')
            .insert({
                user_id: userId,
                content,
                mode,
                user_note: userNote,
                tags: tags || []
            })
            .select()
            .single()

        if (error) {
            console.error('Insert error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            id: data.id,
            userId: data.user_id,
            content: data.content,
            mode: data.mode,
            userNote: data.user_note,
            createdAt: data.created_at,
            tags: data.tags || []
        })
    } catch (error: any) {
        console.error('API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE /api/insights?id=xxx - Delete insight
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabaseAdmin = getSupabaseAdmin()
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Missing insight ID' }, { status: 400 })
        }

        const { error } = await supabaseAdmin
            .from('insights')
            .delete()
            .eq('id', id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PATCH /api/insights - Update insight
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabaseAdmin = getSupabaseAdmin()
        const body = await request.json()
        const { id, userNote, tags } = body

        if (!id) {
            return NextResponse.json({ error: 'Missing insight ID' }, { status: 400 })
        }

        const updates: any = {}
        if (userNote !== undefined) updates.user_note = userNote
        if (tags !== undefined) updates.tags = tags

        const { error } = await supabaseAdmin
            .from('insights')
            .update(updates)
            .eq('id', id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
