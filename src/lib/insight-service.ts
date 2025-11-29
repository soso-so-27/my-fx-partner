import { Insight, InsightMode } from "@/types/insight"

const STORAGE_KEY = 'solo_insights'

class InsightService {
    private getInsights(): Insight[] {
        if (typeof window === 'undefined') return []
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
    }

    private saveInsights(insights: Insight[]): void {
        if (typeof window === 'undefined') return
        localStorage.setItem(STORAGE_KEY, JSON.stringify(insights))
    }

    async createInsight(
        content: string,
        mode: InsightMode,
        userId: string
    ): Promise<Insight> {
        const insights = this.getInsights()
        const newInsight: Insight = {
            id: Date.now().toString(),
            userId,
            content,
            mode,
            createdAt: new Date().toISOString(),
        }
        insights.unshift(newInsight) // Add to beginning
        this.saveInsights(insights)
        return newInsight
    }

    async getInsightsByUser(userId: string, limit?: number): Promise<Insight[]> {
        const insights = this.getInsights()
        const userInsights = insights.filter(i => i.userId === userId)
        return limit ? userInsights.slice(0, limit) : userInsights
    }

    async getAllInsights(userId: string): Promise<Insight[]> {
        return this.getInsightsByUser(userId)
    }

    async deleteInsight(id: string): Promise<void> {
        const insights = this.getInsights()
        const filtered = insights.filter(i => i.id !== id)
        this.saveInsights(filtered)
    }

    async updateInsightNote(id: string, userNote: string): Promise<void> {
        const insights = this.getInsights()
        const insight = insights.find(i => i.id === id)
        if (insight) {
            insight.userNote = userNote
            this.saveInsights(insights)
        }
    }
}

export const insightService = new InsightService()
