export interface Pattern {
    id: string
    userId: string
    name: string
    description?: string
    imageUrl: string
    currencyPair: string
    timeframe: string
    direction?: 'long' | 'short' | null
    tags: string[]
    isActive: boolean
    similarityThreshold: number
    checkFrequency: string
    featureVector?: number[]
    createdAt: Date
    updatedAt: Date
}

export const SUPPORTED_CURRENCY_PAIRS = [
    "USD/JPY", "EUR/USD", "GBP/USD", "AUD/USD", "EUR/JPY", "GBP/JPY", "XAU/USD", "BTC/USD"
]

export const SUPPORTED_TIMEFRAMES = [
    { value: '15m', label: '15分足' },
    { value: '1h', label: '1時間足' },
    { value: '4h', label: '4時間足' },
    { value: '1d', label: '日足' },
]
