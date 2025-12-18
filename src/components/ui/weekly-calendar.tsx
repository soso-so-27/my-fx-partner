"use client"

import { useMemo, useState } from "react"
import { Trade } from "@/types/trade"
import { cn } from "@/lib/utils"
import { startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, isSameDay, format } from "date-fns"
import { ja } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Mail, Edit3 } from "lucide-react"
import { Button } from "./button"

interface WeeklyCalendarProps {
    trades: Trade[]
    unit?: 'pips' | 'amount'
    selectedDate?: Date | null
    onDayClick?: (date: Date, dayTrades: Trade[]) => void
    currentWeek?: Date
    onWeekChange?: (date: Date) => void
    showNavigation?: boolean
}

interface DayData {
    date: Date
    dayName: string
    dayNumber: number
    pnl: number
    trades: Trade[]
    hasTraded: boolean
    hasEmailTrade: boolean
    hasManualTrade: boolean
}

export function WeeklyCalendar({
    trades,
    unit = 'pips',
    selectedDate,
    onDayClick,
    currentWeek: externalWeek,
    onWeekChange,
    showNavigation = false
}: WeeklyCalendarProps) {
    const [internalWeek, setInternalWeek] = useState(new Date())
    const currentWeek = externalWeek ?? internalWeek

    const handlePrevWeek = () => {
        const newWeek = subWeeks(currentWeek, 1)
        if (onWeekChange) {
            onWeekChange(newWeek)
        } else {
            setInternalWeek(newWeek)
        }
    }

    const handleNextWeek = () => {
        const newWeek = addWeeks(currentWeek, 1)
        if (onWeekChange) {
            onWeekChange(newWeek)
        } else {
            setInternalWeek(newWeek)
        }
    }

    const weekData = useMemo(() => {
        const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }) // Monday
        const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })

        const days: DayData[] = []

        for (let i = 0; i < 7; i++) {
            const date = addDays(weekStart, i)
            const dayTrades = trades.filter(t => isSameDay(new Date(t.entryTime), date))

            const pnl = dayTrades.reduce((sum, t) => {
                const val = unit === 'pips' ? (t.pnl?.pips ?? 0) : (t.pnl?.amount ?? 0)
                return sum + val
            }, 0)

            days.push({
                date,
                dayName: format(date, 'E', { locale: ja }),
                dayNumber: date.getDate(),
                pnl,
                trades: dayTrades,
                hasTraded: dayTrades.length > 0,
                hasEmailTrade: dayTrades.some(t => t.dataSource === 'gmail_sync'),
                hasManualTrade: dayTrades.some(t => t.dataSource === 'manual')
            })
        }

        return {
            days,
            weekLabel: `${format(weekStart, 'M/d', { locale: ja })} - ${format(weekEnd, 'M/d', { locale: ja })}`
        }
    }, [trades, currentWeek, unit])

    const isToday = (date: Date) => isSameDay(date, new Date())
    const isFuture = (date: Date) => date > new Date()
    const isSelected = (date: Date) => selectedDate && isSameDay(date, selectedDate)

    return (
        <div className="space-y-2">
            {/* Navigation */}
            {showNavigation && (
                <div className="flex items-center justify-between px-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handlePrevWeek}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">{weekData.weekLabel}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleNextWeek}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Week Grid */}
            <div className="grid grid-cols-7 gap-1">
                {weekData.days.map((day) => (
                    <div
                        key={day.date.toISOString()}
                        className={cn(
                            "flex flex-col items-center p-1.5 rounded-lg transition-colors cursor-pointer min-h-[60px]",
                            isToday(day.date) && "ring-2 ring-solo-gold ring-offset-1 ring-offset-background",
                            isSelected(day.date) && "bg-primary text-primary-foreground font-medium",
                            isFuture(day.date) && "opacity-40",
                            !day.hasTraded && !isFuture(day.date) && "bg-muted/30",
                            day.hasTraded && day.pnl > 0 && "bg-green-500/10",
                            day.hasTraded && day.pnl < 0 && "bg-red-500/10",
                            day.hasTraded && day.pnl === 0 && "bg-muted/50"
                        )}
                        onClick={() => onDayClick?.(day.date, day.trades)}
                    >
                        <span className="text-[9px] text-muted-foreground uppercase">{day.dayName}</span>
                        <span className="text-[10px] text-muted-foreground">{day.dayNumber}</span>

                        {day.hasTraded ? (
                            <>
                                <span className={cn(
                                    "text-sm font-bold font-numbers",
                                    !isSelected(day.date) && day.pnl > 0 && "text-green-600 dark:text-green-400",
                                    !isSelected(day.date) && day.pnl < 0 && "text-red-600 dark:text-red-400",
                                    !isSelected(day.date) && day.pnl === 0 && "text-muted-foreground",
                                    isSelected(day.date) && "text-primary-foreground" // Ensure text is visible on primary bg
                                )}>
                                    {day.pnl > 0 ? '+' : ''}{Math.round(day.pnl)}
                                </span>
                                {/* Trade source icons */}
                                <div className="flex gap-0.5 mt-0.5">
                                    {day.hasEmailTrade && <Mail className="h-2 w-2 text-blue-500" />}
                                    {day.hasManualTrade && <Edit3 className="h-2 w-2 text-orange-500" />}
                                </div>
                            </>
                        ) : isFuture(day.date) ? (
                            <span className="text-sm text-muted-foreground">-</span>
                        ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
