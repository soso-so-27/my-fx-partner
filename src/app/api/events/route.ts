import { NextRequest, NextResponse } from 'next/server'

// Types for Financial Modeling Prep (FMP)
interface FMPEvent {
    event: string
    date: string // "2024-12-18 08:30:00" (Typically EST/EDT)
    country: string
    actual?: number | null
    estimate?: number | null
    previous?: number | null
    impact: string // "High", "Medium", "Low", "None"
    currency: string
    unit?: string
}

interface EconomicEvent {
    id: string
    date: string
    time: string
    currency: string
    name: string
    importance: number
    actual?: string
    forecast?: string
    previous?: string
}

// Cache configuration
// FMP Free Tier: 250 requests/day
// 24 * 60 / 15 = 96 requests/day -> 15 min cache is safe
const CACHE_DURATION_MS = 15 * 60 * 1000
let cachedEvents: EconomicEvent[] = []
let cacheTimestamp = 0

// Filter configuration
const ALLOWED_COUNTRIES = ['US', 'JP', 'EU', 'GB', 'DE', 'FR']
const COUNTRY_TO_CURRENCY: Record<string, string> = {
    'US': 'USD',
    'JP': 'JPY',
    'EU': 'EUR',
    'GB': 'GBP',
    'DE': 'EUR',
    'FR': 'EUR'
}

function convertImpactToStars(impact: string): number {
    switch (impact?.toLowerCase()) {
        case 'high': return 5
        case 'medium': return 3
        case 'low': return 1
        default: return 0
    }
}

function formatEventDate(date: Date): string {
    return `${date.getMonth() + 1}/${date.getDate()}`
}

function formatEventTime(date: Date): string {
    const hours = date.getHours()
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours.toString().padStart(2, '0')}:${minutes}`
}

// Helper to convert FMP time (assumed EST/EDT) to JST
function convertFMPDateToJST(dateString: string): Date {
    // FMP usually returns Eastern Time (ET).
    // Strategy: Parse as UTC (to preserve numbers), then add offset.
    // EST (UTC-5) to JST (UTC+9) is +14 hours.
    // EDT (UTC-4) to JST (UTC+9) is +13 hours.
    // Ideally we check date for DST, but for MVP we assume Standard Time (+14) or average?
    // Let's assume Standard Time (+14) for now as it's December/Winter.
    const TIME_OFFSET_HOURS = 14

    // Parse partial string "YYYY-MM-DD HH:MM:SS" as UTC to keep the hours/minutes "as is" in the object
    const safeDateStr = dateString.replace(' ', 'T') + 'Z'
    const utcDate = new Date(safeDateStr)

    // Add offset
    return new Date(utcDate.getTime() + TIME_OFFSET_HOURS * 60 * 60 * 1000)
}

async function fetchFromFMP(): Promise<{ events: EconomicEvent[], debug: any }> {
    // Try FMP_API_KEY first, then fallback to FINNHUB_API_KEY just in case user reused the variable
    const apiKey = process.env.FMP_API_KEY || process.env.FINNHUB_API_KEY

    if (!apiKey) {
        console.error('FMP_API_KEY is not set')
        return { events: [], debug: { error: 'API Key missing' } }
    }

    const today = new Date()
    const from = today.toISOString().split('T')[0]
    // Get next 7 days
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const to = nextWeek.toISOString().split('T')[0]

    let rawCount = 0

    try {
        const url = `https://financialmodelingprep.com/api/v3/economic_calendar?from=${from}&to=${to}&apikey=${apiKey}`
        const response = await fetch(url, { next: { revalidate: 900 } }) // 15 min revalidate

        let events: FMPEvent[] = []
        if (response.ok) {
            events = await response.json()
        } else {
            return { events: [], debug: { error: `FMP API Error: ${response.status}` } }
        }
        rawCount = events.length

        // Filter (Disabled for Debug)
        let filteredEvents = events.filter(event => {
            // Country check - Allow all for now
            // if (!ALLOWED_COUNTRIES.includes(event.country)) return false

            // Impact checks - Allow all for now
            // const impact = event.impact?.toLowerCase()
            // return impact === 'high' || impact === 'medium'

            return true
        })

        // Transform
        const finalEvents = filteredEvents.map((event, index) => {
            const actual = event.actual !== null && event.actual !== undefined ? String(event.actual) : undefined
            const estimate = event.estimate !== null && event.estimate !== undefined ? String(event.estimate) : undefined
            const previous = event.previous !== null && event.previous !== undefined ? String(event.previous) : undefined

            // Convert Time
            const jstDate = convertFMPDateToJST(event.date)

            return {
                id: `${event.event}-${event.date}-${index}`,
                date: formatEventDate(jstDate),
                time: formatEventTime(jstDate),
                currency: event.currency || COUNTRY_TO_CURRENCY[event.country] || event.country,
                name: event.event,
                importance: convertImpactToStars(event.impact),
                actual,
                forecast: estimate,
                previous
            }
        }).sort((a, b) => {
            // Sort by date/time string "MM/DD HH:MM"
            // This works reasonably well for near-term
            if (a.date !== b.date) return a.date.localeCompare(b.date)
            return a.time.localeCompare(b.time)
        })

        return {
            events: finalEvents,
            debug: {
                provider: 'FMP',
                apiKeySet: true,
                rawCount,
                filteredCount: finalEvents.length,
                dateRange: { from, to },
                availableCountries: Array.from(new Set(events.map(e => e.country))),
                availableImpacts: Array.from(new Set(events.map(e => e.impact)))
            }
        }

    } catch (error) {
        console.error('Error fetching from FMP:', error)
        return { events: [], debug: { error: String(error) } }
    }
}

export async function GET(request: NextRequest) {
    const now = Date.now()
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force')

    // Check cache
    if (!force && cachedEvents.length > 0 && (now - cacheTimestamp) < CACHE_DURATION_MS) {
        return NextResponse.json({
            events: cachedEvents,
            cached: true,
            cacheAge: Math.round((now - cacheTimestamp) / 1000),
            debug: { cached: true }
        })
    }

    // Fetch fresh data
    const { events, debug } = await fetchFromFMP()

    // Update cache
    if (events.length > 0) {
        cachedEvents = events
        cacheTimestamp = now
    }

    return NextResponse.json({
        events: events.length > 0 ? events : cachedEvents,
        cached: false,
        fetchedAt: new Date().toISOString(),
        debug
    })
}
