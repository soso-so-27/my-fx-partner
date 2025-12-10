import { supabase } from '@/lib/supabase/client'
import { Insight, InsightMode } from "@/types/insight"

class InsightService {
    async createInsight(
        input: {
            content: string
            mode: InsightMode
            userNote?: string
            tags?: string[]
        },
        userId: string
    ): Promise<Insight> {
        const dbInput = {
            user_id: userId,
            content: input.content,
            mode: input.mode,
            user_note: input.userNote,
            tags: input.tags || []
            // created_at is default
        }

        const { data, error } = await supabase
            .from('insights')
            .insert(dbInput)
            .select()
            .single()

        if (error) throw error
        return this.mapDbInsightToInsight(data)
    }

    async getInsightsByUser(userId: string, limit?: number): Promise<Insight[]> {
        let query = supabase
            .from('insights')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (limit) {
            query = query.limit(limit)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching insights:', error)
            return []
        }

        return (data || []).map(this.mapDbInsightToInsight)
    }

    async getAllInsights(userId: string): Promise<Insight[]> {
        return this.getInsightsByUser(userId)
    }

    async deleteInsight(id: string): Promise<void> {
        const { error } = await supabase
            .from('insights')
            .delete()
            .eq('id', id)

        if (error) console.error('Error deleting insight:', error)
    }

    async updateInsightNote(id: string, userNote: string): Promise<void> {
        const { error } = await supabase
            .from('insights')
            .update({ user_note: userNote })
            .eq('id', id)

        if (error) console.error('Error updating insight note:', error)
    }

    async updateInsight(id: string, updates: { userNote?: string, tags?: string[] }): Promise<void> {
        const dbUpdates: any = {}
        if (updates.userNote !== undefined) dbUpdates.user_note = updates.userNote
        if (updates.tags !== undefined) dbUpdates.tags = updates.tags

        const { error } = await supabase
            .from('insights')
            .update(dbUpdates)
            .eq('id', id)

        if (error) throw error
    }

    private mapDbInsightToInsight(dbInsight: any): Insight {
        return {
            id: dbInsight.id,
            userId: dbInsight.user_id,
            content: dbInsight.content,
            mode: dbInsight.mode,
            userNote: dbInsight.user_note,
            createdAt: dbInsight.created_at,
            tags: dbInsight.tags || []
        }
    }
}

export const insightService = new InsightService()
