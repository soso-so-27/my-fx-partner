import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { knowledgeService } from '@/lib/knowledge-service'

// Link a trade to a knowledge item
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { tradeId, knowledgeId, linkType } = body

        if (!tradeId || !knowledgeId) {
            return NextResponse.json({ error: 'tradeId and knowledgeId are required' }, { status: 400 })
        }

        const link = await knowledgeService.linkTradeToKnowledge(
            tradeId,
            knowledgeId,
            session.user.email,
            linkType || 'manual'
        )

        if (!link) {
            return NextResponse.json({ error: 'Failed to link trade to knowledge' }, { status: 500 })
        }

        return NextResponse.json(link, { status: 201 })
    } catch (error) {
        console.error('Trade-Knowledge link error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// Unlink a trade from a knowledge item
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const tradeId = searchParams.get('tradeId')
        const knowledgeId = searchParams.get('knowledgeId')

        if (!tradeId || !knowledgeId) {
            return NextResponse.json({ error: 'tradeId and knowledgeId are required' }, { status: 400 })
        }

        const success = await knowledgeService.unlinkTradeFromKnowledge(
            tradeId,
            knowledgeId,
            session.user.email
        )

        if (!success) {
            return NextResponse.json({ error: 'Failed to unlink trade from knowledge' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Trade-Knowledge unlink error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
