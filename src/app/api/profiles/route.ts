import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { display_name, bio, avatar_url } = body

        const supabase = getSupabaseAdmin()

        const { error } = await supabase
            .from('profiles')
            .update({
                display_name,
                bio,
                avatar_url,
                updated_at: new Date().toISOString()
            })
            .eq('email', session.user.email)

        if (error) {
            console.error('Profile update error:', error)
            return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Profile API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = getSupabaseAdmin()

        const { data, error } = await supabase
            .from('profiles')
            .select('display_name, bio, avatar_url')
            .eq('email', session.user.email)
            .single()

        if (error) {
            console.error('Profile fetch error:', error)
            return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Profile API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
