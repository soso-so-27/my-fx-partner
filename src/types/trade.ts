// Chart Image type
export interface ChartImage {
    id: string
    url: string
    thumbnailUrl?: string
    type: 'entry' | 'exit' | 'analysis' | 'other'
    label?: string
    aiAnalyzed: boolean
    aiInsights?: string
    uploadedAt: string
    fileSize: number
    mimeType: string
}

// PnL information
export interface PnlInfo {
    pips?: number          // ±15.5 pips
    amount?: number        // ±1500
    percentage?: number    // ±2.5% of account balance
    currency: string       // "JPY", "USD", etc.
}

// Lot size raw data (from email)
export interface LotSizeRaw {
    value: number         // Original value from email
    unit: string          // "万通貨", "Lot", "K", "Units"
    broker: string        // "GMOクリック証券", "XM", etc.
}

// Market session
export type MarketSession = 'tokyo' | 'london' | 'newyork' | 'sydney'

// PnL source
export type PnlSource = 'manual' | 'email' | 'calculated'

// Rule compliance status
export interface RuleCompliance {
    ruleId: string
    status: 'complied' | 'violated' | 'ignored'
    note?: string
}

// Main Trade interface
export interface Trade {
    // Basic information
    id: string
    userId: string
    createdAt: string
    updatedAt: string

    // Trade details
    pair: string                    // User input (can be "USD/JPY", "USDJPY", etc.)
    pairNormalized: string          // Normalized format: "USDJPY"
    direction: 'BUY' | 'SELL' | 'ANALYSIS'

    // Price information
    entryPrice: number
    exitPrice?: number
    stopLoss?: number
    takeProfit?: number

    // Time information (ISO 8601 with timezone)
    entryTime: string              // "2024-11-29T10:30:00+09:00"
    exitTime?: string
    timezone: string               // "Asia/Tokyo" (IANA Timezone)
    session?: MarketSession        // Auto-calculated market session

    // Lot size
    lotSize?: number               // Standard lot (1.0 = 100,000 units)
    lotSizeRaw?: LotSizeRaw        // Original data from email

    // PnL (both pips and amount)
    pnl: PnlInfo
    pnlSource: PnlSource

    // Chart images
    chartImages: ChartImage[]

    // Rules
    ruleCompliance?: RuleCompliance[]

    // Notes and tags
    notes: string
    tags: string[]

    // Verification
    isVerified: boolean
    verificationSource?: string    // "gmail", "manual"
    broker?: string
    originalEmailId?: string

    // Meta
    isFrequentPair?: boolean       // User's frequently traded pair
}

// Input for creating a trade (simplified)
export interface CreateTradeInput {
    // Required
    pair: string
    direction: 'BUY' | 'SELL' | 'ANALYSIS'
    entryPrice: number
    notes: string

    // Optional - time
    entryTime?: string
    exitTime?: string
    timezone?: string

    // Optional - price
    exitPrice?: number
    stopLoss?: number
    takeProfit?: number

    // Optional - lot
    lotSize?: number
    lotSizeRaw?: LotSizeRaw

    // Optional - PnL
    pnl?: Partial<PnlInfo>
    pnlSource?: PnlSource

    // Optional - images
    chartImages?: ChartImage[]

    // Optional - rules
    ruleCompliance?: RuleCompliance[]

    // Optional - tags
    tags?: string[]

    // Optional - verification
    isVerified?: boolean
    verificationSource?: string
    broker?: string
    originalEmailId?: string
}

// Trade statistics
export interface TradeStats {
    totalTrades: number
    winRate: number
    profitFactor: number
    totalPnl: number
    totalPnlPips?: number
    averageWin: number
    averageLoss: number
    largestWin: number
    largestLoss: number
    consecutiveWins: number
    consecutiveLosses: number
}
