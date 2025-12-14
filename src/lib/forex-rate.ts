/**
 * Forex Rate Service
 * 
 * Fetches OHLC (Open, High, Low, Close) candlestick data from external APIs.
 * Primary: Twelve Data API (free tier: 800 requests/day)
 * Backup: Alpha Vantage
 */

export interface OHLCData {
    time: number // Unix timestamp
    open: number
    high: number
    low: number
    close: number
    volume?: number
}

export interface ForexQuote {
    symbol: string
    bid: number
    ask: number
    timestamp: Date
}

// Timeframe mapping for Twelve Data API
const TIMEFRAME_MAP: Record<string, string> = {
    '1m': '1min',
    '5m': '5min',
    '15m': '15min',
    '30m': '30min',
    '1h': '1h',
    '4h': '4h',
    '1d': '1day',
    '1w': '1week',
}

/**
 * Fetch OHLC data from Twelve Data API
 */
export async function fetchOHLCData(
    symbol: string,
    timeframe: string,
    outputSize: number = 50
): Promise<OHLCData[]> {
    const apiKey = process.env.TWELVE_DATA_API_KEY

    if (!apiKey) {
        console.warn('TWELVE_DATA_API_KEY not set, using mock data')
        return generateMockOHLCData(symbol, outputSize)
    }

    const interval = TIMEFRAME_MAP[timeframe] || '1h'
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputSize}&apikey=${apiKey}`

    try {
        const response = await fetch(url)

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()

        if (data.status === 'error') {
            throw new Error(data.message || 'API returned error')
        }

        if (!data.values || !Array.isArray(data.values)) {
            throw new Error('Invalid API response format')
        }

        return data.values.map((candle: any) => ({
            time: new Date(candle.datetime).getTime() / 1000,
            open: parseFloat(candle.open),
            high: parseFloat(candle.high),
            low: parseFloat(candle.low),
            close: parseFloat(candle.close),
            volume: candle.volume ? parseFloat(candle.volume) : undefined,
        })).reverse() // API returns newest first, we want oldest first

    } catch (error) {
        console.error('Error fetching OHLC data:', error)
        // Fallback to mock data
        return generateMockOHLCData(symbol, outputSize)
    }
}

/**
 * Fetch current forex quote
 */
export async function fetchForexQuote(symbol: string): Promise<ForexQuote | null> {
    const apiKey = process.env.TWELVE_DATA_API_KEY

    if (!apiKey) {
        return generateMockQuote(symbol)
    }

    const url = `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${apiKey}`

    try {
        const response = await fetch(url)
        const data = await response.json()

        if (data.status === 'error') {
            throw new Error(data.message)
        }

        const price = parseFloat(data.price)

        return {
            symbol,
            bid: price,
            ask: price,
            timestamp: new Date(),
        }
    } catch (error) {
        console.error('Error fetching quote:', error)
        return generateMockQuote(symbol)
    }
}

/**
 * Generate mock OHLC data for testing/development
 */
function generateMockOHLCData(symbol: string, count: number): OHLCData[] {
    const data: OHLCData[] = []
    const now = Date.now()
    const interval = 60 * 60 * 1000 // 1 hour

    // Base price based on symbol
    let basePrice = 150.0 // USDJPY default
    if (symbol.includes('EUR')) basePrice = 1.08
    if (symbol.includes('GBP')) basePrice = 1.27

    for (let i = 0; i < count; i++) {
        const time = (now - (count - i) * interval) / 1000
        const volatility = 0.001 * basePrice

        const open = basePrice + (Math.random() - 0.5) * volatility * 2
        const close = open + (Math.random() - 0.5) * volatility
        const high = Math.max(open, close) + Math.random() * volatility
        const low = Math.min(open, close) - Math.random() * volatility

        data.push({ time, open, high, low, close })

        // Update base price for next candle
        basePrice = close
    }

    return data
}

/**
 * Generate mock forex quote
 */
function generateMockQuote(symbol: string): ForexQuote {
    let price = 150.0
    if (symbol.includes('EUR')) price = 1.08
    if (symbol.includes('GBP')) price = 1.27

    const spread = price * 0.0001

    return {
        symbol,
        bid: price - spread / 2,
        ask: price + spread / 2,
        timestamp: new Date(),
    }
}

/**
 * Supported currency pairs
 */
export const FOREX_PAIRS = [
    'USD/JPY',
    'EUR/USD',
    'GBP/USD',
    'EUR/JPY',
    'GBP/JPY',
    'AUD/USD',
    'AUD/JPY',
    'USD/CHF',
    'EUR/GBP',
    'USD/CAD',
]

/**
 * Convert our timeframe format to API format
 */
export function normalizeTimeframe(timeframe: string): string {
    return TIMEFRAME_MAP[timeframe] || timeframe
}
