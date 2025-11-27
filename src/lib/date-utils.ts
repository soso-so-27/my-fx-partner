export type Period = 'today' | 'week' | 'month' | 'all'

export interface DateRange {
    start: Date
    end: Date
}

export function getToday(): DateRange {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    return { start, end }
}

export function getThisWeek(): DateRange {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // Monday as start of week
    const start = new Date(now)
    start.setDate(now.getDate() + diff)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    return { start, end }
}

export function getThisMonth(): DateRange {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    return { start, end }
}

export function getPeriodRange(period: Period): DateRange | null {
    switch (period) {
        case 'today':
            return getToday()
        case 'week':
            return getThisWeek()
        case 'month':
            return getThisMonth()
        case 'all':
            return null // null means no filtering
    }
}

export function filterByPeriod<T extends { entryTime: string }>(
    items: T[],
    period: Period
): T[] {
    const range = getPeriodRange(period)
    if (!range) return items // 'all' - return everything

    return items.filter(item => {
        const itemDate = new Date(item.entryTime)
        return itemDate >= range.start && itemDate <= range.end
    })
}
