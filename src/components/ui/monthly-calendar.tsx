"use client"

import { useMemo, useState } from "react"
import { Trade } from "@/types/trade"
import { cn } from "@/lib/utils"
import { startOfMonth, endOfMonth, startOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, format } from "date-fns"
import { ja } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./button"

interface MonthlyCalendarProps {
    trades: Trade[]
    unit?: 'pips' | 'amount'
    selectedDate?: Date | null
    onDayClick?: (date: Date, dayTrades: Trade[]) => void
    currentMonth?: Date
    onMonthChange?: (date: Date) => void
    showNavigation?: boolean
}

interface DayData {
    date: Date
    pnl: number
    trades: Trade[]
    hasTraded: boolean
    isCurrentMonth: boolean
}

export function MonthlyCalendar({
    trades,
    unit = 'pips',
    selectedDate,
    onDayClick,
    currentMonth: externalMonth,
    onMonthChange,
    showNavigation = false
}: MonthlyCalendarProps) {
    const [internalMonth, setInternalMonth] = useState(new Date())
    const currentMonth = externalMonth ?? internalMonth

    const handlePrevMonth = () => {
        const newMonth = subMonths(currentMonth, 1)
        if (onMonthChange) {
            onMonthChange(newMonth)
        } else {
            setInternalMonth(newMonth)
        }
    }

    const handleNextMonth = () => {
        const newMonth = addMonths(currentMonth, 1)
        if (onMonthChange) {
            onMonthChange(newMonth)
        } else {
            setInternalMonth(newMonth)
        }
    }

    const { weeks, monthYear } = useMemo(() => {
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(currentMonth)
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })

        const weeks: DayData[][] = []
        let currentWeek: DayData[] = []
        let day = calendarStart

        for (let i = 0; i < 42; i++) {
            const dayTrades = trades.filter(t => isSameDay(new Date(t.entryTime), day))
            const pnl = dayTrades.reduce((sum, t) => {
                const val = unit === 'pips' ? (t.pnl?.pips ?? 0) : (t.pnl?.amount ?? 0)
                return sum + val
            }, 0)

            currentWeek.push({
                date: day,
                pnl,
                trades: dayTrades,
                hasTraded: dayTrades.length > 0,
                isCurrentMonth: isSameMonth(day, currentMonth)
            })

            if (currentWeek.length === 7) {
                weeks.push(currentWeek)
                currentWeek = []
                if (day > monthEnd && weeks.length >= 5) break
            }
            day = addDays(day, 1)
        }

        return {
            weeks,
            monthYear: format(currentMonth, 'yyyy年M月', { locale: ja })
        }
    }, [trades, unit, currentMonth])

    const weekDays = ['月', '火', '水', '木', '金', '土', '日']
    const today = new Date()
    const isToday = (date: Date) => isSameDay(date, today)
    const isSelected = (date: Date) => selectedDate && isSameDay(date, selectedDate)

    return (
        <div className="space-y-3">
            {/* Month Navigation */}
            {showNavigation && (
                <div className="flex items-center justify-between px-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handlePrevMonth}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <span className="text-base font-bold">{monthYear}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleNextMonth}
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            )}

            {!showNavigation && (
                <div className="text-center text-sm font-medium text-muted-foreground">{monthYear}</div>
            )}

            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day, i) => (
                    <div key={day} className={cn(
                        "text-[10px] text-center font-medium py-1",
                        i === 5 && "text-blue-500",
                        i === 6 && "text-red-500",
                        i < 5 && "text-muted-foreground"
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
                        onClick={() => onDayClick?.(day.date, day.trades)}
                        className={cn(
                            "aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all cursor-pointer",
                            !day.isCurrentMonth && "opacity-30",
                            isToday(day.date) && "ring-2 ring-solo-gold ring-offset-1 ring-offset-background",
                            isSelected(day.date) && "bg-solo-gold/20 ring-2 ring-solo-gold",
                            day.hasTraded && day.pnl > 0 && !isSelected(day.date) && "bg-green-500/15",
                            day.hasTraded && day.pnl < 0 && !isSelected(day.date) && "bg-red-500/15",
                            day.hasTraded && day.pnl === 0 && !isSelected(day.date) && "bg-muted/50",
                            !day.hasTraded && day.isCurrentMonth && "hover:bg-muted/50",
                            onDayClick && "active:scale-95"
                        )}
                    >
                        <span className={cn(
                            "text-[11px] font-medium",
                            isToday(day.date) && "text-solo-gold font-bold",
                            !day.isCurrentMonth && "text-muted-foreground"
                        )}>
                            {format(day.date, 'd')}
                        </span>
                        {day.hasTraded && (
                            <span className={cn(
                                "font-bold font-numbers leading-tight mt-0.5",
                                unit === 'amount' && Math.abs(day.pnl) > 9999 ? "text-[7px]" : "text-[9px]",
                                day.pnl > 0 && "text-green-600 dark:text-green-400",
                                day.pnl < 0 && "text-red-600 dark:text-red-400"
                            )}>
                                {day.pnl > 0 ? '+' : ''}{unit === 'amount' ? '¥' : ''}{Math.abs(day.pnl) >= 1000 ? `${(day.pnl / 1000).toFixed(1)}k` : day.pnl}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

