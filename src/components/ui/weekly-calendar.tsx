"use client"

import { useMemo } from "react"
import { Trade } from "@/types/trade"
import { cn } from "@/lib/utils"
import { startOfWeek, addDays, format, isSameDay } from "date-fns"
import { ja } from "date-fns/locale"

interface WeeklyCalendarProps {
    trades: Trade[]
}

interface DayData {
    date: Date
    dayName: string
    pnl: number
    hasTraded: boolean
    winRate: number
}

export function WeeklyCalendar({ trades }: WeeklyCalendarProps) {
    const weekData = useMemo(() => {
        const today = new Date()
        const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Monday

        const days: DayData[] = []

        for (let i = 0; i < 5; i++) { // Mon-Fri
            const date = addDays(weekStart, i)
            const dayTrades = trades.filter(t => isSameDay(new Date(t.entryTime), date))

            const pnl = dayTrades.reduce((sum, t) => sum + (t.pnl?.pips ?? 0), 0)
            const wins = dayTrades.filter(t => (t.pnl?.pips ?? 0) > 0).length
            const winRate = dayTrades.length > 0 ? Math.round((wins / dayTrades.length) * 100) : 0

            days.push({
                date,
                dayName: format(date, 'E', { locale: ja }),
                pnl,
                hasTraded: dayTrades.length > 0,
                winRate
            })
        }

        return days
    }, [trades])

    const isToday = (date: Date) => isSameDay(date, new Date())
    const isFuture = (date: Date) => date > new Date()

    return (
        <div className="grid grid-cols-5 gap-2">
            {weekData.map((day) => (
                <div
                    key={day.date.toISOString()}
                    className={cn(
                        "flex flex-col items-center p-2 rounded-lg transition-colors",
                        isToday(day.date) && "ring-2 ring-solo-gold ring-offset-2 ring-offset-background",
                        isFuture(day.date) && "opacity-40",
                        !day.hasTraded && !isFuture(day.date) && "bg-muted/30",
                        day.hasTraded && day.pnl > 0 && "bg-green-500/10",
                        day.hasTraded && day.pnl < 0 && "bg-red-500/10",
                        day.hasTraded && day.pnl === 0 && "bg-muted/50"
                    )}
                >
                    <span className="text-[10px] text-muted-foreground uppercase">{day.dayName}</span>

                    {day.hasTraded ? (
                        <>
                            <span className={cn(
                                "text-lg font-bold font-numbers",
                                day.pnl > 0 && "text-profit",
                                day.pnl < 0 && "text-loss",
                                day.pnl === 0 && "text-muted-foreground"
                            )}>
                                {day.pnl > 0 ? '+' : ''}{day.pnl}
                            </span>
                        </>
                    ) : isFuture(day.date) ? (
                        <span className="text-lg text-muted-foreground">-</span>
                    ) : (
                        <span className="text-lg text-muted-foreground">-</span>
                    )}
                </div>
            ))}
        </div>
    )
}
