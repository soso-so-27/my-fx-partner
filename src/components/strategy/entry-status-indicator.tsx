"use client"

import { useState, useEffect, useMemo } from "react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react"
import { WeeklyPlan } from "./types"

interface EntryStatusIndicatorProps {
    weeklyPlan: WeeklyPlan | null
    economicEvents?: any[]
    tradesThisWeek?: number
    lossThisWeek?: number
    consecutiveLosses?: number
    className?: string
}

type SignalStatus = 'ok' | 'caution' | 'ng'

interface SignalResult {
    status: SignalStatus
    reason: string
    nextOkTime?: string
}

export function EntryStatusIndicator({
    weeklyPlan,
    economicEvents = [],
    tradesThisWeek = 0,
    lossThisWeek = 0,
    consecutiveLosses = 0,
    className
}: EntryStatusIndicatorProps) {
    const [currentTime, setCurrentTime] = useState(new Date())

    // Update every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date())
        }, 60000) // 1 minute
        return () => clearInterval(interval)
    }, [])

    const signal = useMemo((): SignalResult => {
        // No plan = default OK (no restrictions)
        if (!weeklyPlan) {
            return { status: 'ok', reason: '作戦未設定' }
        }

        const now = currentTime
        const currentTimeStr = format(now, 'HH:mm')

        // 1. Check "No Look" time
        if (weeklyPlan.limits.no_look.enabled) {
            const { start, end } = weeklyPlan.limits.no_look
            let isNoLook = false

            // Handle overnight (e.g., 23:30 to 07:30)
            if (start > end) {
                isNoLook = currentTimeStr >= start || currentTimeStr <= end
            } else {
                isNoLook = currentTimeStr >= start && currentTimeStr <= end
            }

            if (isNoLook) {
                return {
                    status: 'ng',
                    reason: '見ない時間帯',
                    nextOkTime: end
                }
            }
        }

        // 2. Check trade count limit
        if (tradesThisWeek >= weeklyPlan.limits.trade_count) {
            return {
                status: 'ng',
                reason: `週間上限到達 (${tradesThisWeek}/${weeklyPlan.limits.trade_count}回)`
            }
        }

        // 3. Check loss limit
        if (lossThisWeek >= weeklyPlan.limits.loss_amount) {
            return {
                status: 'ng',
                reason: `損失上限到達 (${lossThisWeek.toLocaleString()}円)`
            }
        }

        // 4. Check consecutive loss stop
        if (weeklyPlan.limits.consecutive_loss_stop !== 'none') {
            const stopCount = parseInt(weeklyPlan.limits.consecutive_loss_stop)
            if (consecutiveLosses >= stopCount) {
                return {
                    status: 'ng',
                    reason: `${stopCount}連敗停止ルール発動`
                }
            }
        }

        // 5. Check economic event stop window
        if (weeklyPlan.eventSettings.use_stop_window && economicEvents.length > 0) {
            const windowMinutes = weeklyPlan.eventSettings.stop_window
            const nowMs = now.getTime()

            for (const event of economicEvents) {
                if (event.importance < 3) continue // Only high importance events

                // Parse event time (assuming format like "22:30" and same day)
                const eventDate = new Date(event.date)
                const [eventHour, eventMin] = (event.time || '00:00').split(':').map(Number)
                eventDate.setHours(eventHour, eventMin, 0, 0)

                const eventMs = eventDate.getTime()
                const diffMinutes = (eventMs - nowMs) / (1000 * 60)

                // Within stop window (before or after event)
                if (Math.abs(diffMinutes) <= windowMinutes) {
                    if (diffMinutes > 0) {
                        return {
                            status: 'caution',
                            reason: `${event.name} まで${Math.round(diffMinutes)}分`
                        }
                    } else {
                        return {
                            status: 'caution',
                            reason: `${event.name} 発表直後`
                        }
                    }
                }
            }
        }

        // All checks passed
        return { status: 'ok', reason: '全条件クリア' }
    }, [weeklyPlan, economicEvents, tradesThisWeek, lossThisWeek, consecutiveLosses, currentTime])

    // Don't show anything if no plan
    if (!weeklyPlan) {
        return null
    }

    const statusConfig = {
        ok: {
            bg: 'bg-green-500/10 border-green-500/20',
            text: 'text-green-600 dark:text-green-400',
            icon: CheckCircle2,
            label: 'エントリーOK'
        },
        caution: {
            bg: 'bg-yellow-500/10 border-yellow-500/20',
            text: 'text-yellow-600 dark:text-yellow-400',
            icon: AlertTriangle,
            label: '注意'
        },
        ng: {
            bg: 'bg-red-500/10 border-red-500/20',
            text: 'text-red-600 dark:text-red-400',
            icon: XCircle,
            label: 'エントリー禁止'
        }
    }

    const config = statusConfig[signal.status]
    const Icon = config.icon

    return (
        <div className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 rounded-md",
            config.bg,
            className
        )}>
            <Icon className={cn("h-3.5 w-3.5 shrink-0", config.text)} />
            <span className={cn("text-xs font-medium", config.text)}>
                {config.label}
            </span>
            <span className="text-[10px] text-muted-foreground">
                {signal.reason}
            </span>
            {signal.nextOkTime && (
                <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {signal.nextOkTime}〜
                </span>
            )}
        </div>
    )
}
