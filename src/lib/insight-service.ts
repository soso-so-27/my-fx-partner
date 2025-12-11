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
        // Use API route to bypass RLS
        const response = await fetch('/api/insights', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: input.content,
                mode: input.mode,
                userNote: input.userNote,
                tags: input.tags || []
            })
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to create insight')
        }

        return await response.json()
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
        const response = await fetch(`/api/insights?id=${id}`, {
            method: 'DELETE'
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to delete insight')
        }
    }

    async updateInsightNote(id: string, userNote: string): Promise<void> {
        await this.updateInsight(id, { userNote })
    }

    async updateInsight(id: string, updates: { userNote?: string, tags?: string[] }): Promise<void> {
        const response = await fetch('/api/insights', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...updates })
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to update insight')
        }
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
