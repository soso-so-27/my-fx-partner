"use client"

import { useMemo } from "react"
import { Trade } from "@/types/trade"
import { cn } from "@/lib/utils"
import { startOfMonth, endOfMonth, startOfWeek, addDays, isSameMonth, isSameDay, format } from "date-fns"
import { ja } from "date-fns/locale"

interface MonthlyCalendarProps {
    trades: Trade[]
}

interface DayData {
    date: Date
    pnl: number
    hasTraded: boolean
    isCurrentMonth: boolean
}

export function MonthlyCalendar({ trades }: MonthlyCalendarProps) {
    const { weeks, monthYear } = useMemo(() => {
        const today = new Date()
        const monthStart = startOfMonth(today)
        const monthEnd = endOfMonth(today)
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })

        const weeks: DayData[][] = []
        let currentWeek: DayData[] = []
        let day = calendarStart

        // Generate 5-6 weeks of data
        for (let i = 0; i < 42; i++) {
            const dayTrades = trades.filter(t => isSameDay(new Date(t.entryTime), day))
            const pnl = dayTrades.reduce((sum, t) => sum + (t.pnl?.pips ?? 0), 0)

            currentWeek.push({
                date: day,
                pnl,
                hasTraded: dayTrades.length > 0,
                isCurrentMonth: isSameMonth(day, today)
            })

            if (currentWeek.length === 7) {
                weeks.push(currentWeek)
                currentWeek = []
                // Stop after we've passed the month end and completed the week
                if (day > monthEnd && weeks.length >= 5) break
            }
            day = addDays(day, 1)
        }

        return {
            weeks,
            monthYear: format(today, 'yyyy年M月', { locale: ja })
        }
    }, [trades])

    const weekDays = ['月', '火', '水', '木', '金', '土', '日']
    const isToday = (date: Date) => isSameDay(date, new Date())

    return (
        <div className="space-y-2">
            <div className="text-center text-sm font-medium text-muted-foreground">{monthYear}</div>

            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day, i) => (
                    <div key={day} className={cn(
                        "text-[10px] text-center text-muted-foreground",
                        i === 5 && "text-blue-500",
                        i === 6 && "text-red-500"
                    )}>
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {weeks.flat().map((day, i) => (
                    <div
                        key={i}
                        className={cn(
                            "aspect-square flex flex-col items-center justify-center rounded text-[10px] transition-colors",
                            !day.isCurrentMonth && "opacity-30",
                            isToday(day.date) && "ring-1 ring-solo-gold",
                            day.hasTraded && day.pnl > 0 && "bg-green-500/20 text-green-600 dark:text-green-400",
                            day.hasTraded && day.pnl < 0 && "bg-red-500/20 text-red-600 dark:text-red-400",
                            day.hasTraded && day.pnl === 0 && "bg-muted/50",
                            !day.hasTraded && day.isCurrentMonth && "text-muted-foreground"
                        )}
                    >
                        <span className="text-[9px]">{format(day.date, 'd')}</span>
                        {day.hasTraded && (
                            <span className={cn(
                                "text-[8px] font-bold font-numbers",
                                day.pnl > 0 && "text-profit",
                                day.pnl < 0 && "text-loss"
                            )}>
                                {day.pnl > 0 ? '+' : ''}{day.pnl}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
