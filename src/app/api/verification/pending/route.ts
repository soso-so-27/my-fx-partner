import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/verification/pending
 * Returns the current user's pending Gmail forwarding verification
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = getSupabaseAdmin()

        // Get user profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', session.user.email)
            .single()

        if (!profile) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Get pending verification
        const { data: verification, error } = await supabase
            .from('pending_verifications')
            .select('*')
            .eq('user_id', profile.id)
            .eq('verification_type', 'gmail_forwarding')
            .is('confirmed_at', null)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('[verification/pending] Error:', error)
            return NextResponse.json({ error: 'Failed to fetch verification' }, { status: 500 })
        }

        if (!verification) {
            return NextResponse.json({ pending: false })
        }

        return NextResponse.json({
            pending: true,
            confirmationUrl: verification.confirmation_url,
            createdAt: verification.created_at
        })

    } catch (error) {
        console.error('[verification/pending] Unexpected error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * DELETE /api/verification/pending
 * Marks a pending verification as confirmed
 */
export async function DELETE() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = getSupabaseAdmin()

        // Get user profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', session.user.email)
            .single()

        if (!profile) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Mark as confirmed
        const { error } = await supabase
            .from('pending_verifications')
            .update({ confirmed_at: new Date().toISOString() })
            .eq('user_id', profile.id)
            .eq('verification_type', 'gmail_forwarding')

        if (error) {
            console.error('[verification/pending] Delete error:', error)
            return NextResponse.json({ error: 'Failed to update verification' }, { status: 500 })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('[verification/pending] Unexpected error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
