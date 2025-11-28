export interface Trade {
    id: string
    userId: string
    pair: string
    direction: 'BUY' | 'SELL'
    entryPrice: number
    entryTime: string
    exitPrice?: number
    exitTime?: string
    stopLoss?: number
    takeProfit?: number
    lotSize?: number
    pnl?: number
    notes: string
    tags?: string[]  // Tags for categorization
    isVerified?: boolean
    verificationSource?: string
    broker?: string
    originalEmailId?: string
}

export interface CreateTradeInput {
    pair: string
    direction: 'BUY' | 'SELL'
    entryPrice: number
    entryTime?: string
    exitTime?: string
    exitPrice?: number
    stopLoss?: number
    takeProfit?: number
    lotSize?: number
    pnl?: number
    notes: string
    tags?: string[]  // Tags for categorization
    isVerified?: boolean
    verificationSource?: string
    broker?: string
    originalEmailId?: string
}
