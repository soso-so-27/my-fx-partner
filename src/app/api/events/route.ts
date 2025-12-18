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

// Japanese Translation Dictionary
const JA_TRANSLATION: Record<string, string> = {
    // US Matches
    "Core PCE Price Index m/m": "PCEデフレーター(前月比)",
    "PCE Price Index m/m": "PCEデフレーター(前月比)",
    "CPI m/m": "消費者物価指数(前月比)",
    "CPI y/y": "消費者物価指数(前年比)",
    "Core CPI m/m": "コアCPI(前月比)",
    "Non-Farm Employment Change": "非農業部門雇用者数",
    "Unemployment Rate": "失業率",
    "Average Hourly Earnings m/m": "平均時給(前月比)",
    "Fed Funds Rate": "FRB政策金利発表",
    "FOMC Statement": "FOMC声明",
    "FOMC Press Conference": "FOMC記者会見",
    "FOMC Economic Projections": "FOMC経済見通し",
    "ISM Manufacturing PMI": "ISM製造業景況指数",
    "ISM Services PMI": "ISM非製造業景況指数",
    "Retail Sales m/m": "小売売上高(前月比)",
    "Core Retail Sales m/m": "コア小売売上高(前月比)",
    "PPI m/m": "生産者物価指数(前月比)",
    "Core PPI m/m": "コアPPI(前月比)",
    "GDP q/q": "実質GDP(前期比)",
    "Advance GDP q/q": "実質GDP速報値(前期比)",
    "CB Consumer Confidence": "CB消費者信頼感指数",
    "JOLTS Job Openings": "JOLTS求人件数",
    "ADP Non-Farm Employment Change": "ADP雇用統計",
    "Philly Fed Manufacturing Index": "フィラデルフィア連銀製造業景況指数",
    "Empire State Manufacturing Index": "NY連銀製造業景況指数",
    "Unemployment Claims": "新規失業保険申請件数",
    "Building Permits": "住宅着工許可件数",
    "Existing Home Sales": "中古住宅販売件数",
    "New Home Sales": "新築住宅販売件数",
    "Prelim UoM Consumer Sentiment": "ミシガン大学消費者信頼感指数(速報値)",
    "Revised UoM Consumer Sentiment": "ミシガン大学消費者信頼感指数(確報値)",

    // JP Matches
    "BOJ Policy Rate": "日銀政策金利",
    "Monetary Policy Statement": "金融政策決定会合 声明",
    "BOJ Press Conference": "日銀総裁記者会見",
    "National Core CPI y/y": "全国消費者物価指数(前年比)",
    "Tokyo Core CPI y/y": "東京都区部消費者物価指数(前年比)",
    "Tankan Large Manufacturing Index": "日銀短観(大企業製造業)",
    "Tankan Large Non-Manufacturing Index": "日銀短観(大企業非製造業)",
    "Trade Balance": "貿易収支",

    // EUR/GBP Matches
    "Main Refinancing Rate": "ECB政策金利",
    "Monetary Policy Summary": "金融政策サマリー",
    "Official Bank Rate": "英中銀政策金利",
    "German Ifo Business Climate": "独IFO景況感指数",
    "German ZEW Economic Sentiment": "独ZEW景況感指数",
    "French Flash Manufacturing PMI": "仏製造業PMI(速報値)",
    "French Flash Services PMI": "仏非製造業PMI(速報値)",
    "German Flash Manufacturing PMI": "独製造業PMI(速報値)",
    "German Flash Services PMI": "独非製造業PMI(速報値)",

    // General Terms
    "m/m": "(前月比)",
    "q/q": "(前期比)",
    "y/y": "(前年比)",
    "Speech": "発言",
    "Tentative": "未定",
}

function translateTitle(title: string): string {
    // 1. Direct Match
    if (JA_TRANSLATION[title]) return JA_TRANSLATION[title]

    // 2. Partial Replacement for unmapped titles
    let translated = title
    // Match specific suffixes
    translated = translated.replace(/ m\/m/g, "(前月比)")
    translated = translated.replace(/ q\/q/g, "(前期比)")
    translated = translated.replace(/ y\/y/g, "(前年比)")

    // Pattern Match: "Name Speaks" -> "Name 発言"
    if (translated.includes(" Speaks")) {
        return translated.replace(" Speaks", " 発言")
    }

    return translated
}

// Helper to extract values from XML tags (handles CDATA and simple text)
function getTagValue(xmlFragment: string, tagName: string): string {
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

// ForexFactory XML Time Conversion
// Base assumption: XML time is EST/EDT (New York Time)
// JST is UTC+9. EST is UTC-5. Difference is +14 hours.
// (Ignoring DST dynamics for now to prioritize stability - Winter Time)
function convertFFTimetoJST(dateStr: string, timeStr: string): Date {
    // dateStr: "12-14-2025" (MM-DD-YYYY)
    // timeStr: "9:30pm" or "2:00am"

    // Parse Date
    const [month, day, year] = dateStr.split('-').map(Number)

    // Parse Time
    const timeMatch = timeStr.match(/(\d+):(\d+)(am|pm)/i)
    if (!timeMatch) {
        // Fallback usually means "All Day" or Tentative.
        // Treat as start of day EST -> +14h
        return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) + 14 * 60 * 60 * 1000)
    }

    let hours = parseInt(timeMatch[1], 10)
    const minutes = parseInt(timeMatch[2], 10)
    const meridian = timeMatch[3].toLowerCase()

    if (meridian === 'pm' && hours < 12) hours += 12
    if (meridian === 'am' && hours === 12) hours = 0

    // Create Date object in UTC (treating parsed numbers as UTC representation of EST)
    const estDateAsUtc = Date.UTC(year, month - 1, day, hours, minutes)

    // Add 14 hours to shift to JST
    return new Date(estDateAsUtc + 14 * 60 * 60 * 1000)
}

async function fetchFromForexFactory(): Promise<{ events: EconomicEvent[], debug: any }> {
    let rawCount = 0

    try {
        const response = await fetch(FF_XML_URL, { next: { revalidate: 300 } })
        if (!response.ok) {
            throw new Error(`FF XML Error: ${response.status}`)
        }

        const xmlText = await response.text()
        const eventFragments = xmlText.match(/<event>([\s\S]*?)<\/event>/g) || []

        rawCount = eventFragments.length
        const events: EconomicEvent[] = []

        eventFragments.forEach((fragment, index) => {
            const originalTitle = getTagValue(fragment, 'title')
            const country = getTagValue(fragment, 'country')
            const dateStr = getTagValue(fragment, 'date')
            const timeStr = getTagValue(fragment, 'time')
            const impactStr = getTagValue(fragment, 'impact')
            const forecast = getTagValue(fragment, 'forecast')
            const previous = getTagValue(fragment, 'previous')

            // Filter: Only Major Currencies
            const ALLOWED_CURRENCIES = ['USD', 'JPY', 'EUR', 'GBP']
            if (!ALLOWED_CURRENCIES.includes(country)) return

            // Filter: Impact High/Medium
            const importance = convertImpactToStars(impactStr)
            if (importance < 3) return // Skip Low

            // Skip invalid dates
            if (!dateStr.includes('-')) return

            // Convert Time (EST -> JST)
            const jstDate = convertFFTimetoJST(dateStr, timeStr)

            // Translation
            const translatedTitle = translateTitle(originalTitle)

            // Format strings
            const formattedDate = `${jstDate.getUTCMonth() + 1}/${jstDate.getUTCDate()}`
            const hours = jstDate.getUTCHours().toString().padStart(2, '0')
            const mins = jstDate.getUTCMinutes().toString().padStart(2, '0')
            const formattedTime = `${hours}:${mins}`

            // Clean up html entities if present
            const cleanPrev = previous ? previous.replace(/&lt;/g, '<').replace(/&gt;/g, '>') : undefined
            const cleanFore = forecast ? forecast.replace(/&lt;/g, '<').replace(/&gt;/g, '>') : undefined

            events.push({
                id: `ff-${index}-${dateStr}`,
                date: formattedDate,
                time: formattedTime,
                currency: country,
                name: translatedTitle,
                importance: importance,
                actual: undefined, // "thisweek" XML often lacks actuals until later
                forecast: cleanFore,
                previous: cleanPrev
            })
        })

        // Sort by Time
        events.sort((a, b) => {
            // Basic String sort for "MM/DD" works if same year (which it usually is)
            // But across year boundary it might fail. 
            // Ideally use timestamp but string sort "M/D" is risky if "12/31" vs "1/1".
            // However, "thisweek" usually is within one month or adjacent.
            // We'll stick to string sort for simplicity as `jstDate` isn't stored in array.
            if (a.date !== b.date) {
                const [m1, d1] = a.date.split('/').map(Number)
                const [m2, d2] = b.date.split('/').map(Number)
                if (m1 !== m2) return m1 - m2
                return d1 - d2
            }
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

// Fallback Mock Data
function getMockData(error?: any): { events: EconomicEvent[], debug: any } {
    const today = new Date()
    const mockEvents: EconomicEvent[] = []

    const dates = [0, 1, 2].map(d => new Date(today.getTime() + d * 24 * 60 * 60 * 1000))

    mockEvents.push(
        { id: 'm1', date: `${dates[0].getMonth() + 1}/${dates[0].getDate()}`, time: '21:30', currency: 'USD', name: '消費者物価指数(CPI) [Mock]', importance: 5, forecast: '3.2%' },
        { id: 'm2', date: `${dates[1].getMonth() + 1}/${dates[1].getDate()}`, time: '21:30', currency: 'USD', name: '新規失業保険申請件数 [Mock]', importance: 4, forecast: '210K' }
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
