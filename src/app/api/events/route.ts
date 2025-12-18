import { NextRequest, NextResponse } from 'next/server'

// Types for Frontend
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
const CACHE_DURATION_MS = 5 * 60 * 1000 // 5 minutes cache
let cachedEvents: EconomicEvent[] = []
let cacheTimestamp = 0

// Configuration
const FF_XML_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.xml'

// Helper to extract values from XML tags (handles CDATA and simple text)
function getTagValue(xmlFragment: string, tagName: string): string {
    // Match <tag><![CDATA[value]]></tag> OR <tag>value</tag>
    const regex = new RegExp(`<${tagName}>(?:<!\\[CDATA\\[(.*?)\\]\\]>|([^<]*))<\\/${tagName}>`, 'i')
    const match = xmlFragment.match(regex)
    return match ? (match[1] || match[2] || '').trim() : ''
}

function convertImpactToStars(impact: string): number {
    switch (impact?.toLowerCase()) {
        case 'high': return 5
        case 'medium': return 3
        case 'low': return 1
        default: return 0
    }
}

// ForexFactory XML time appears to be GMT based on analysis (e.g. Tankan 11:50pm = 8:50am JST)
// JST is GMT+9
function convertGMTtoJST(dateStr: string, timeStr: string): Date {
    // dateStr: "12-14-2025" (MM-DD-YYYY)
    // timeStr: "9:30pm" or "2:00am"

    // Parse Date
    const [month, day, year] = dateStr.split('-').map(Number)

    // Parse Time
    const timeMatch = timeStr.match(/(\d+):(\d+)(am|pm)/i)
    if (!timeMatch) {
        // Fallback if time is not parsable (e.g. "All Day"), return date at 00:00 GMT
        return new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
    }

    let hours = parseInt(timeMatch[1], 10)
    const minutes = parseInt(timeMatch[2], 10)
    const meridian = timeMatch[3].toLowerCase()

    if (meridian === 'pm' && hours < 12) hours += 12
    if (meridian === 'am' && hours === 12) hours = 0

    // Create Date object in UTC (treating the parsed time as GMT)
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes))

    // Add 9 hours for JST
    // actually, if we create it as UTC, to display it in JST (frontend uses string),
    // we just need to shift the timestamp by +9 hours.
    return new Date(utcDate.getTime() + 9 * 60 * 60 * 1000)
}

async function fetchFromForexFactory(): Promise<{ events: EconomicEvent[], debug: any }> {
    let rawCount = 0

    try {
        const response = await fetch(FF_XML_URL, { next: { revalidate: 300 } })
        if (!response.ok) {
            throw new Error(`FF XML Error: ${response.status}`)
        }

        const xmlText = await response.text()

        // Manual Simple Parsing using Regex
        // Split by <event> tags
        const eventFragments = xmlText.match(/<event>([\s\S]*?)<\/event>/g) || []

        rawCount = eventFragments.length
        const events: EconomicEvent[] = []

        eventFragments.forEach((fragment, index) => {
            const title = getTagValue(fragment, 'title')
            const country = getTagValue(fragment, 'country') // "USD", "JPY" etc
            const dateStr = getTagValue(fragment, 'date')
            const timeStr = getTagValue(fragment, 'time')
            const impactStr = getTagValue(fragment, 'impact')
            const forecast = getTagValue(fragment, 'forecast')
            const previous = getTagValue(fragment, 'previous')

            // Filter: Only Major Currencies
            const ALLOWED_CURRENCIES = ['USD', 'JPY', 'EUR', 'GBP']
            if (!ALLOWED_CURRENCIES.includes(country)) return

            // Filter: Impact High/Medium (ForexFactory uses 'High', 'Medium', 'Low')
            const importance = convertImpactToStars(impactStr)
            if (importance < 3) return // Skip Low

            // DateTime Conversion
            // Handle "Tentative" or empty times if necessary (usually specific times in FF)
            if (!dateStr.includes('-')) return // Invalid date

            const jstDate = convertGMTtoJST(dateStr, timeStr)

            // Format for Frontend
            // date: "M/D"
            // time: "HH:MM"
            const formattedDate = `${jstDate.getUTCMonth() + 1}/${jstDate.getUTCDate()}`
            const hours = jstDate.getUTCHours().toString().padStart(2, '0')
            const mins = jstDate.getUTCMinutes().toString().padStart(2, '0')
            const formattedTime = `${hours}:${mins}`

            events.push({
                id: `ff-${index}-${dateStr}`,
                date: formattedDate,
                time: formattedTime,
                currency: country,
                name: title,
                importance: importance,
                actual: undefined, // FF XML "thisweek" often doesn't have actuals populated instantly? Check <previous>?
                forecast: forecast || undefined,
                previous: previous || undefined
            })
        })

        // Sort by Time
        events.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date)
            return a.time.localeCompare(b.time)
        })

        return {
            events,
            debug: {
                provider: 'ForexFactory(XML)',
                rawCount,
                filteredCount: events.length
            }
        }

    } catch (error) {
        console.error('Error fetching/parsing ForexFactory:', error)
        return getMockData(error)
    }
}

// Fallback Mock Data (Same as before)
function getMockData(error?: any): { events: EconomicEvent[], debug: any } {
    const today = new Date()
    const mockEvents: EconomicEvent[] = []

    // Generate dates
    const dates = [0, 1, 2].map(d => new Date(today.getTime() + d * 24 * 60 * 60 * 1000))

    mockEvents.push(
        { id: 'm1', date: `${dates[0].getMonth() + 1}/${dates[0].getDate()}`, time: '21:30', currency: 'USD', name: 'CPI (消費者物価指数) [Mock]', importance: 5, forecast: '3.2%' },
        { id: 'm2', date: `${dates[1].getMonth() + 1}/${dates[1].getDate()}`, time: '21:30', currency: 'USD', name: '失業保険申請件数 [Mock]', importance: 4, forecast: '210K' }
    )

    return {
        events: mockEvents,
        debug: {
            provider: 'Mock(Fallback)',
            isMock: true,
            error: String(error)
        }
    }
}

export async function GET(request: NextRequest) {
    const now = Date.now()
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force')

    if (!force && cachedEvents.length > 0 && (now - cacheTimestamp) < CACHE_DURATION_MS) {
        return NextResponse.json({
            events: cachedEvents,
            cached: true,
            debug: { cached: true }
        })
    }

    const { events, debug } = await fetchFromForexFactory()

    if (events.length > 0) {
        cachedEvents = events
        cacheTimestamp = now
    }

    return NextResponse.json({
        events: events.length > 0 ? events : cachedEvents,
        cached: false,
        debug
    })
}
