import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { patternService, PatternInput } from '@/lib/pattern-service'
import { getSupabaseAdmin, getOrCreateUserProfile } from '@/lib/supabase-admin'

// GET /api/patterns - Get all patterns for the current user
export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user profile UUID
        const supabase = getSupabaseAdmin()
        const userId = await getOrCreateUserProfile(supabase, session.user.email, session.user.name || undefined)

        const patterns = await patternService.getPatterns(userId)

        return NextResponse.json({ patterns })
    } catch (error) {
        console.error('Error in GET /api/patterns:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/patterns - Create a new pattern
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json() as PatternInput

        // Validate required fields
        if (!body.name || !body.imageUrl || !body.currencyPair || !body.timeframe) {
            return NextResponse.json({
                error: 'Missing required fields: name, imageUrl, currencyPair, timeframe'
            }, { status: 400 })
        }

        // Get user profile UUID
        const supabase = getSupabaseAdmin()
        const userId = await getOrCreateUserProfile(supabase, session.user.email, session.user.name || undefined)

        // Check pattern limit (Free: 1, Pro: 5, Premium: 10+)
        const currentCount = await patternService.getPatternCount(userId)
        const limit = 1 // TODO: Get from user's plan

        if (currentCount >= limit) {
            return NextResponse.json({
                error: 'Pattern limit reached. Upgrade to Pro for more patterns.',
                currentCount,
                limit
            }, { status: 403 })
        }

        const pattern = await patternService.createPattern(userId, body)

        if (!pattern) {
            return NextResponse.json({ error: 'Failed to create pattern' }, { status: 500 })
        }

        return NextResponse.json({ pattern }, { status: 201 })
    } catch (error) {
        console.error('Error in POST /api/patterns:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
