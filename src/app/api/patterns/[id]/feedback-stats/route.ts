import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getSupabaseAdmin, getOrCreateUserProfile } from '@/lib/supabase-admin'

/**
 * GET /api/patterns/[id]/feedback-stats
 * Get feedback statistics for a pattern to help optimize threshold
 */
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: patternId } = await context.params
        const supabase = getSupabaseAdmin()
        const userProfile = await getOrCreateUserProfile(supabase, session.user.email)

        // Get all alerts for this pattern with feedback
        const { data: alerts, error } = await supabase
            .from('alerts')
            .select('similarity_score, feedback')
            .eq('pattern_id', patternId)
            .eq('user_id', userProfile?.id)
            .not('feedback', 'is', null)

        if (error) {
            console.error('Error fetching feedback:', error)
            return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
        }

        // Calculate statistics
        const positiveAlerts = alerts?.filter(a => a.feedback === 'positive') || []
        const negativeAlerts = alerts?.filter(a => a.feedback === 'negative') || []

        const avgPositiveScore = positiveAlerts.length > 0
            ? positiveAlerts.reduce((sum, a) => sum + (a.similarity_score || 0), 0) / positiveAlerts.length
            : null

        const avgNegativeScore = negativeAlerts.length > 0
            ? negativeAlerts.reduce((sum, a) => sum + (a.similarity_score || 0), 0) / negativeAlerts.length
            : null

        // Calculate suggested threshold
        // If we have both positive and negative feedback, suggest a threshold between them
        let suggestedThreshold: number | null = null
        if (avgPositiveScore !== null && avgNegativeScore !== null && avgPositiveScore > avgNegativeScore) {
            // Suggest threshold midway between average positive and negative
            suggestedThreshold = Math.round((avgPositiveScore + avgNegativeScore) / 2)
        } else if (avgPositiveScore !== null) {
            // Only positive feedback: suggest slightly below average
            suggestedThreshold = Math.max(50, Math.round(avgPositiveScore - 5))
        } else if (avgNegativeScore !== null) {
            // Only negative feedback: suggest above average negative
            suggestedThreshold = Math.min(95, Math.round(avgNegativeScore + 10))
        }

        return NextResponse.json({
            totalFeedback: alerts?.length || 0,
            positiveCount: positiveAlerts.length,
            negativeCount: negativeAlerts.length,
            avgPositiveScore: avgPositiveScore ? Math.round(avgPositiveScore) : null,
            avgNegativeScore: avgNegativeScore ? Math.round(avgNegativeScore) : null,
            suggestedThreshold,
            precision: positiveAlerts.length + negativeAlerts.length > 0
                ? Math.round((positiveAlerts.length / (positiveAlerts.length + negativeAlerts.length)) * 100)
                : null
        })
    } catch (error) {
        console.error('Feedback stats error:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}

/**
 * POST /api/patterns/[id]/feedback-stats
 * Apply suggested threshold adjustment
 */
export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: patternId } = await context.params
        const { threshold } = await request.json()

        if (typeof threshold !== 'number' || threshold < 50 || threshold > 100) {
            return NextResponse.json({ error: 'Invalid threshold' }, { status: 400 })
        }

        const supabase = getSupabaseAdmin()
        const userProfile = await getOrCreateUserProfile(supabase, session.user.email)

        // Update pattern's similarity threshold
        const { error } = await supabase
            .from('patterns')
            .update({ similarity_threshold: threshold })
            .eq('id', patternId)
            .eq('user_id', userProfile?.id)

        if (error) {
            console.error('Error updating threshold:', error)
            return NextResponse.json({ error: 'Failed to update threshold' }, { status: 500 })
        }

        return NextResponse.json({ success: true, newThreshold: threshold })
    } catch (error) {
        console.error('Threshold update error:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
