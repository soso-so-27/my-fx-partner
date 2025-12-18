import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { knowledgeService } from '@/lib/knowledge-service'

// Get reflection for a specific date
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const date = searchParams.get('date')
        const limit = searchParams.get('limit')

        if (date) {
            // Get specific date's reflection
            const reflection = await knowledgeService.getReflection(session.user.email, date)
            return NextResponse.json(reflection)
        } else {
            // Get recent reflections
            const reflections = await knowledgeService.getRecentReflections(
                session.user.email,
                limit ? parseInt(limit) : 7
            )
            return NextResponse.json(reflections)
        }
    } catch (error) {
        console.error('Reflections GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// Save reflection
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { date, biggestMistake, tomorrowFocus, note } = body

        if (!date) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 })
        }

        const reflection = await knowledgeService.saveReflection(session.user.email, {
            date,
            biggestMistake,
            tomorrowFocus,
            note
        })

        if (!reflection) {
            return NextResponse.json({ error: 'Failed to save reflection' }, { status: 500 })
        }

        return NextResponse.json(reflection, { status: 201 })
    } catch (error) {
        console.error('Reflections POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
