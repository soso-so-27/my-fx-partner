import { MarketSession } from '@/types/trade'

// Get current timestamp in ISO 8601 format with timezone
export function getCurrentTimestamp(timezone: string = 'Asia/Tokyo'): string {
    const now = new Date()
    return formatDateWithTimezone(now, timezone)
}

// Format date with timezone (ISO 8601)
export function formatDateWithTimezone(date: Date, timezone: string = 'Asia/Tokyo'): string {
    // Get timezone offset
    const offset = getTimezoneOffset(timezone, date)
    const offsetHours = Math.floor(Math.abs(offset) / 60)
    const offsetMinutes = Math.abs(offset) % 60
    const offsetSign = offset >= 0 ? '+' : '-'

    // Format: YYYY-MM-DDTHH:mm:ss+09:00
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`
}

// Get timezone offset in minutes
function getTimezoneOffset(timezone: string, date: Date = new Date()): number {
    // For JST (Asia/Tokyo), offset is +540 minutes (+9 hours)
    if (timezone === 'Asia/Tokyo') {
        return 540
    }

    // For other timezones, use Intl API
    try {
        const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
        const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }))
        return (tzDate.getTime() - utcDate.getTime()) / 60000
    } catch (e) {
        // Fallback to JST
        return 540
    }
}

// Detect market session from time (JST-based)
export function detectMarketSession(timestamp: string): MarketSession | undefined {
    const date = new Date(timestamp)
    const jstHour = date.getHours() // Assuming already in JST

    // Tokyo Session: 9:00 - 15:00 JST
    if (jstHour >= 9 && jstHour < 15) {
        return 'tokyo'
    }

    // London Session: 17:00 - 01:00 JST (next day)
    if (jstHour >= 17 || jstHour < 1) {
        return 'london'
    }

    // New York Session: 22:00 - 06:00 JST (next day)
    if (jstHour >= 22 || jstHour < 6) {
        return 'newyork'
    }

    // Sydney Session: 6:00 - 15:00 JST
    if (jstHour >= 6 && jstHour < 15) {
        return 'sydney'
    }

    return undefined
}

// Get session display name
export function getSessionDisplayName(session: MarketSession): string {
    const names: Record<MarketSession, string> = {
        tokyo: '東京',
        london: 'ロンドン',
        newyork: 'ニューヨーク',
        sydney: 'シドニー'
    }
    return names[session]
}

// Parse timestamp (handle various formats)
export function parseTimestamp(input: string, defaultTimezone: string = 'Asia/Tokyo'): string {
    // If already in ISO format with timezone, return as-is
    if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}/.test(input)) {
        return input
    }

    // Parse and add default timezone
    const date = new Date(input)
    if (isNaN(date.getTime())) {
        // Invalid date, return current timestamp
        return getCurrentTimestamp(defaultTimezone)
    }

    return formatDateWithTimezone(date, defaultTimezone)
}

// Format timestamp for display
export function formatTimestampDisplay(timestamp: string, format: 'short' | 'long' = 'short'): string {
    const date = new Date(timestamp)

    if (format === 'short') {
        // "11/29 10:30"
        const month = date.getMonth() + 1
        const day = date.getDate()
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${month}/${day} ${hours}:${minutes}`
    } else {
        // "2024年11月29日 10:30:00"
        return date.toLocaleString('ja-JP')
    }
}
