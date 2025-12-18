import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { knowledgeService } from '@/lib/knowledge-service'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const filter = searchParams.get('filter') // 'unprocessed', 'pinned', 'all'
        const tradeId = searchParams.get('tradeId')

        let knowledge

        if (tradeId) {
            // Get knowledge linked to a specific trade
            knowledge = await knowledgeService.getKnowledgeForTrade(tradeId, session.user.email)
        } else if (filter === 'unprocessed') {
            knowledge = await knowledgeService.getUnprocessedKnowledge(session.user.email)
        } else if (filter === 'pinned') {
            knowledge = await knowledgeService.getPinnedKnowledge(session.user.email)
        } else {
            knowledge = await knowledgeService.getKnowledge(session.user.email)
        }

        return NextResponse.json(knowledge)
    } catch (error) {
        console.error('Knowledge GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { title, content, url, contentType, category, tags, isPinned, isProcessed, importance } = body

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 })
        }

        const knowledge = await knowledgeService.createKnowledge(session.user.email, {
            title,
            content,
            url,
            contentType,
            category,
            tags,
            isPinned,
            isProcessed,
            importance
        })

        if (!knowledge) {
            return NextResponse.json({ error: 'Failed to create knowledge' }, { status: 500 })
        }

        return NextResponse.json(knowledge, { status: 201 })
    } catch (error) {
        console.error('Knowledge POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { id, ...updates } = body

        if (!id) {
            return NextResponse.json({ error: 'Knowledge ID is required' }, { status: 400 })
        }

        const knowledge = await knowledgeService.updateKnowledge(id, session.user.email, updates)

        if (!knowledge) {
            return NextResponse.json({ error: 'Failed to update knowledge' }, { status: 500 })
        }

        return NextResponse.json(knowledge)
    } catch (error) {
        console.error('Knowledge PATCH error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Knowledge ID is required' }, { status: 400 })
        }

        const success = await knowledgeService.deleteKnowledge(id, session.user.email)

        if (!success) {
            return NextResponse.json({ error: 'Failed to delete knowledge' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Knowledge DELETE error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
