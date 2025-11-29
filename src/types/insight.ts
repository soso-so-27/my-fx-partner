export type InsightMode = 'pre-trade' | 'post-trade' | 'review'

export interface Insight {
    id: string
    userId: string
    content: string
    mode: InsightMode
    userNote?: string
    createdAt: string
    tags?: string[]
}
