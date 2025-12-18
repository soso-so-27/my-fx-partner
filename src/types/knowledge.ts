// ============================================
// Knowledge Types
// ============================================

export type KnowledgeContentType = 'x' | 'youtube' | 'blog' | 'note' | 'memo' | 'rule' | 'other'
export type KnowledgeCategory = 'technique' | 'rule' | 'mistake' | 'learning' | 'analysis' | 'other'
export type LinkType = 'manual' | 'suggested' | 'auto'

export interface Knowledge {
    id: string
    userId: string

    // Content
    title: string
    content?: string
    url?: string

    // Categorization
    contentType: KnowledgeContentType
    category?: KnowledgeCategory
    tags: string[]

    // Organization
    isPinned: boolean
    isProcessed: boolean
    importance: number

    // Timestamps
    createdAt: string
    updatedAt: string

    // Computed (for UI)
    linkedTradeCount?: number
}

export interface KnowledgeInput {
    title: string
    content?: string
    url?: string
    contentType?: KnowledgeContentType
    category?: KnowledgeCategory
    tags?: string[]
    isPinned?: boolean
    isProcessed?: boolean
    importance?: number
}

export interface TradeKnowledgeLink {
    id: string
    tradeId: string
    knowledgeId: string
    userId: string
    linkType: LinkType
    relevanceScore?: number
    linkedAt: string
}

export interface DailyReflection {
    id: string
    userId: string
    date: string
    biggestMistake?: string
    tomorrowFocus?: string
    note?: string
    createdAt: string
    updatedAt: string
}

export interface DailyReflectionInput {
    date: string
    biggestMistake?: string
    tomorrowFocus?: string
    note?: string
}
