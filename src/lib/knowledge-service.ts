import { getSupabaseAdmin } from './supabase-admin'
import {
    Knowledge,
    KnowledgeInput,
    TradeKnowledgeLink,
    DailyReflection,
    DailyReflectionInput,
    KnowledgeContentType
} from '@/types/knowledge'

// ============================================
// Helper Functions
// ============================================

function mapKnowledge(data: Record<string, unknown>): Knowledge {
    return {
        id: data.id as string,
        userId: data.user_id as string,
        title: data.title as string,
        content: data.content as string | undefined,
        url: data.url as string | undefined,
        contentType: data.content_type as KnowledgeContentType,
        category: data.category as Knowledge['category'],
        tags: (data.tags as string[]) || [],
        isPinned: data.is_pinned as boolean,
        isProcessed: data.is_processed as boolean,
        importance: data.importance as number,
        createdAt: data.created_at as string,
        updatedAt: data.updated_at as string,
        linkedTradeCount: data.linked_trade_count as number | undefined
    }
}

function mapTradeKnowledgeLink(data: Record<string, unknown>): TradeKnowledgeLink {
    return {
        id: data.id as string,
        tradeId: data.trade_id as string,
        knowledgeId: data.knowledge_id as string,
        userId: data.user_id as string,
        linkType: data.link_type as TradeKnowledgeLink['linkType'],
        relevanceScore: data.relevance_score as number | undefined,
        linkedAt: data.linked_at as string
    }
}

function mapDailyReflection(data: Record<string, unknown>): DailyReflection {
    return {
        id: data.id as string,
        userId: data.user_id as string,
        date: data.date as string,
        biggestMistake: data.biggest_mistake as string | undefined,
        tomorrowFocus: data.tomorrow_focus as string | undefined,
        note: data.note as string | undefined,
        createdAt: data.created_at as string,
        updatedAt: data.updated_at as string
    }
}

function detectContentType(url: string): KnowledgeContentType {
    const lowerUrl = url.toLowerCase()
    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'x'
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube'
    if (lowerUrl.includes('note.com')) return 'note'
    if (lowerUrl) return 'blog'
    return 'memo'
}

// ============================================
// Knowledge Service
// ============================================

export const knowledgeService = {
    // ============================================
    // Knowledge CRUD
    // ============================================

    async getKnowledge(userId: string): Promise<Knowledge[]> {
        const supabase = getSupabaseAdmin()
        const { data, error } = await supabase
            .from('knowledge')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching knowledge:', error)
            return []
        }

        return (data || []).map(mapKnowledge)
    },

    async getKnowledgeById(id: string): Promise<Knowledge | null> {
        const supabase = getSupabaseAdmin()
        const { data, error } = await supabase
            .from('knowledge')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            console.error('Error fetching knowledge:', error)
            return null
        }

        return data ? mapKnowledge(data) : null
    },

    async getUnprocessedKnowledge(userId: string): Promise<Knowledge[]> {
        const supabase = getSupabaseAdmin()
        const { data, error } = await supabase
            .from('knowledge')
            .select('*')
            .eq('user_id', userId)
            .eq('is_processed', false)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching unprocessed knowledge:', error)
            return []
        }

        return (data || []).map(mapKnowledge)
    },

    async getPinnedKnowledge(userId: string): Promise<Knowledge[]> {
        const supabase = getSupabaseAdmin()
        const { data, error } = await supabase
            .from('knowledge')
            .select('*')
            .eq('user_id', userId)
            .eq('is_pinned', true)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching pinned knowledge:', error)
            return []
        }

        return (data || []).map(mapKnowledge)
    },

    async createKnowledge(userId: string, input: KnowledgeInput): Promise<Knowledge | null> {
        const supabase = getSupabaseAdmin()

        // Auto-detect content type from URL if not provided
        const contentType = input.contentType || (input.url ? detectContentType(input.url) : 'memo')

        const { data, error } = await supabase
            .from('knowledge')
            .insert({
                user_id: userId,
                title: input.title,
                content: input.content || null,
                url: input.url || null,
                content_type: contentType,
                category: input.category || null,
                tags: input.tags || [],
                is_pinned: input.isPinned || false,
                is_processed: input.isProcessed || false,
                importance: input.importance || 1
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating knowledge:', error)
            return null
        }

        return data ? mapKnowledge(data) : null
    },

    async updateKnowledge(id: string, userId: string, input: Partial<KnowledgeInput>): Promise<Knowledge | null> {
        const supabase = getSupabaseAdmin()

        const updateData: Record<string, unknown> = {}
        if (input.title !== undefined) updateData.title = input.title
        if (input.content !== undefined) updateData.content = input.content
        if (input.url !== undefined) updateData.url = input.url
        if (input.contentType !== undefined) updateData.content_type = input.contentType
        if (input.category !== undefined) updateData.category = input.category
        if (input.tags !== undefined) updateData.tags = input.tags
        if (input.isPinned !== undefined) updateData.is_pinned = input.isPinned
        if (input.isProcessed !== undefined) updateData.is_processed = input.isProcessed
        if (input.importance !== undefined) updateData.importance = input.importance

        const { data, error } = await supabase
            .from('knowledge')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single()

        if (error) {
            console.error('Error updating knowledge:', error)
            return null
        }

        return data ? mapKnowledge(data) : null
    },

    async deleteKnowledge(id: string, userId: string): Promise<boolean> {
        const supabase = getSupabaseAdmin()
        const { error } = await supabase
            .from('knowledge')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)

        if (error) {
            console.error('Error deleting knowledge:', error)
            return false
        }

        return true
    },

    async togglePin(id: string, userId: string): Promise<Knowledge | null> {
        const supabase = getSupabaseAdmin()

        // Get current state
        const { data: current } = await supabase
            .from('knowledge')
            .select('is_pinned')
            .eq('id', id)
            .eq('user_id', userId)
            .single()

        if (!current) return null

        // Toggle
        return this.updateKnowledge(id, userId, { isPinned: !current.is_pinned })
    },

    // ============================================
    // Trade-Knowledge Links
    // ============================================

    async linkTradeToKnowledge(tradeId: string, knowledgeId: string, userId: string, linkType: 'manual' | 'suggested' | 'auto' = 'manual'): Promise<TradeKnowledgeLink | null> {
        const supabase = getSupabaseAdmin()

        const { data, error } = await supabase
            .from('trade_knowledge')
            .insert({
                trade_id: tradeId,
                knowledge_id: knowledgeId,
                user_id: userId,
                link_type: linkType
            })
            .select()
            .single()

        if (error) {
            console.error('Error linking trade to knowledge:', error)
            return null
        }

        return data ? mapTradeKnowledgeLink(data) : null
    },

    async unlinkTradeFromKnowledge(tradeId: string, knowledgeId: string, userId: string): Promise<boolean> {
        const supabase = getSupabaseAdmin()

        const { error } = await supabase
            .from('trade_knowledge')
            .delete()
            .eq('trade_id', tradeId)
            .eq('knowledge_id', knowledgeId)
            .eq('user_id', userId)

        if (error) {
            console.error('Error unlinking trade from knowledge:', error)
            return false
        }

        return true
    },

    async getKnowledgeForTrade(tradeId: string, userId: string): Promise<Knowledge[]> {
        const supabase = getSupabaseAdmin()

        const { data, error } = await supabase
            .from('trade_knowledge')
            .select('knowledge_id')
            .eq('trade_id', tradeId)
            .eq('user_id', userId)

        if (error || !data) {
            console.error('Error fetching knowledge for trade:', error)
            return []
        }

        const knowledgeIds = data.map(d => d.knowledge_id)
        if (knowledgeIds.length === 0) return []

        const { data: knowledgeData, error: knowledgeError } = await supabase
            .from('knowledge')
            .select('*')
            .in('id', knowledgeIds)

        if (knowledgeError) {
            console.error('Error fetching knowledge data:', knowledgeError)
            return []
        }

        return (knowledgeData || []).map(mapKnowledge)
    },

    async getTradesForKnowledge(knowledgeId: string, userId: string): Promise<string[]> {
        const supabase = getSupabaseAdmin()

        const { data, error } = await supabase
            .from('trade_knowledge')
            .select('trade_id')
            .eq('knowledge_id', knowledgeId)
            .eq('user_id', userId)

        if (error) {
            console.error('Error fetching trades for knowledge:', error)
            return []
        }

        return (data || []).map(d => d.trade_id)
    },

    async getUnlinkedKnowledgeCount(userId: string): Promise<number> {
        const supabase = getSupabaseAdmin()

        // Get all knowledge IDs
        const { data: allKnowledge } = await supabase
            .from('knowledge')
            .select('id')
            .eq('user_id', userId)

        if (!allKnowledge || allKnowledge.length === 0) return 0

        // Get linked knowledge IDs
        const { data: linked } = await supabase
            .from('trade_knowledge')
            .select('knowledge_id')
            .eq('user_id', userId)

        const linkedIds = new Set((linked || []).map(d => d.knowledge_id))
        return allKnowledge.filter(k => !linkedIds.has(k.id)).length
    },

    // ============================================
    // Daily Reflections
    // ============================================

    async getReflection(userId: string, date: string): Promise<DailyReflection | null> {
        const supabase = getSupabaseAdmin()

        const { data, error } = await supabase
            .from('daily_reflections')
            .select('*')
            .eq('user_id', userId)
            .eq('date', date)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            console.error('Error fetching reflection:', error)
        }

        return data ? mapDailyReflection(data) : null
    },

    async saveReflection(userId: string, input: DailyReflectionInput): Promise<DailyReflection | null> {
        const supabase = getSupabaseAdmin()

        // Upsert - insert or update
        const { data, error } = await supabase
            .from('daily_reflections')
            .upsert({
                user_id: userId,
                date: input.date,
                biggest_mistake: input.biggestMistake || null,
                tomorrow_focus: input.tomorrowFocus || null,
                note: input.note || null
            }, {
                onConflict: 'user_id,date'
            })
            .select()
            .single()

        if (error) {
            console.error('Error saving reflection:', error)
            return null
        }

        return data ? mapDailyReflection(data) : null
    },

    async getRecentReflections(userId: string, limit: number = 7): Promise<DailyReflection[]> {
        const supabase = getSupabaseAdmin()

        const { data, error } = await supabase
            .from('daily_reflections')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('Error fetching reflections:', error)
            return []
        }

        return (data || []).map(mapDailyReflection)
    }
}
