"use client"

import { useMemo, useState, useEffect } from "react"
import { format, differenceInMinutes } from "date-fns"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react"
import { WeeklyPlan } from "@/components/strategy/types"
import { Badge } from "@/components/ui/badge"

interface TodayHubProps {
    weeklyPlan: WeeklyPlan
    economicEvents?: any[]
    tradesThisWeek?: number
    lossThisWeek?: number
    consecutiveLosses?: number
    className?: string
}

type SignalStatus = 'ok' | 'caution' | 'ng'

export function TodayHub({
    weeklyPlan,
    economicEvents = [],
    tradesThisWeek = 0,
    lossThisWeek = 0,
    consecutiveLosses = 0,
    className
}: TodayHubProps) {
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000)
        return () => clearInterval(interval)
    }, [])

    const signal = useMemo(() => {
        const now = currentTime
        const currentTimeStr = format(now, 'HH:mm')

        if (weeklyPlan.limits.no_look.enabled) {
            const { start, end } = weeklyPlan.limits.no_look
            let isNoLook = start > end
                ? currentTimeStr >= start || currentTimeStr <= end
                : currentTimeStr >= start && currentTimeStr <= end
            if (isNoLook) return { status: 'ng' as SignalStatus, reason: '見ない時間', nextOkTime: end }
        }

        if (tradesThisWeek >= weeklyPlan.limits.trade_count) {
            return { status: 'ng' as SignalStatus, reason: '上限到達' }
        }

        if (lossThisWeek >= weeklyPlan.limits.loss_amount) {
            return { status: 'ng' as SignalStatus, reason: '損失上限' }
        }

        if (weeklyPlan.limits.consecutive_loss_stop !== 'none') {
            const stopCount = parseInt(weeklyPlan.limits.consecutive_loss_stop)
            if (consecutiveLosses >= stopCount) {
                return { status: 'ng' as SignalStatus, reason: '連敗停止' }
            }
        }

        if (weeklyPlan.eventSettings.use_stop_window) {
            const windowMinutes = weeklyPlan.eventSettings.stop_window
            const nowMs = now.getTime()
            for (const event of economicEvents) {
                if (event.importance < 4) continue
                const eventDate = new Date(event.date)
                const [h, m] = (event.time || '00:00').split(':').map(Number)
                eventDate.setHours(h, m, 0, 0)
                const diffMinutes = (eventDate.getTime() - nowMs) / (1000 * 60)
                if (Math.abs(diffMinutes) <= windowMinutes) {
                    return {
                        status: 'caution' as SignalStatus,
                        reason: `指標${Math.round(Math.abs(diffMinutes))}分`
                    }
                }
            }
        }

        return { status: 'ok' as SignalStatus, reason: 'クリア' }
    }, [weeklyPlan, economicEvents, tradesThisWeek, lossThisWeek, consecutiveLosses, currentTime])

    const nextEvent = useMemo(() => {
        const now = currentTime.getTime()
        for (const event of economicEvents) {
            if (event.importance < 4) continue
            const eventDate = new Date(event.date)
            const [h, m] = (event.time || '00:00').split(':').map(Number)
            eventDate.setHours(h, m, 0, 0)
            if (eventDate.getTime() > now) {
                const diffMins = differenceInMinutes(eventDate, currentTime)
                const hours = Math.floor(diffMins / 60)
                const mins = diffMins % 60
                return {
                    name: event.name,
                    time: event.time,
                    countdown: hours > 0 ? `${hours}h${mins}m` : `${mins}m`
                }
            }
        }
        return null
    }, [economicEvents, currentTime])

    const statusConfig = {
        ok: { bg: 'bg-green-500', text: 'text-white', icon: CheckCircle2 },
        caution: { bg: 'bg-yellow-500', text: 'text-white', icon: AlertTriangle },
        ng: { bg: 'bg-red-500', text: 'text-white', icon: XCircle }
    }
    const config = statusConfig[signal.status]
    const Icon = config.icon

    const tradeProgress = Math.min(100, (tradesThisWeek / weeklyPlan.limits.trade_count) * 100)
    const lossProgress = Math.min(100, (lossThisWeek / weeklyPlan.limits.loss_amount) * 100)
    const getBarColor = (p: number) => p >= 100 ? 'bg-red-500' : p >= 80 ? 'bg-yellow-500' : 'bg-blue-500'

    return (
        <div className={cn("space-y-2", className)}>
            {/* 判定 - コンパクト横並び */}
            <div className="flex items-center gap-2">
                <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full", config.bg)}>
                    <Icon className={cn("h-4 w-4", config.text)} />
                    <span className={cn("text-sm font-bold", config.text)}>
                        {signal.status === 'ok' ? 'GO' : signal.status === 'caution' ? '注意' : 'STOP'}
                    </span>
                </div>
                <span className="text-xs text-muted-foreground">{signal.reason}</span>
                {signal.nextOkTime && (
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5 ml-auto">
                        <Clock className="h-3 w-3" />{signal.nextOkTime}〜
                    </span>
                )}
            </div>

            {/* リミット + リスク - 4列グリッド */}
            <div className="grid grid-cols-4 gap-2 text-[11px]">
                {/* 回数 */}
                <div className="p-2 rounded-md bg-muted/40">
                    <div className="flex justify-between mb-1">
                        <span className="text-muted-foreground">回数</span>
                        <span className="font-bold">{tradesThisWeek}/{weeklyPlan.limits.trade_count}</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", getBarColor(tradeProgress))} style={{ width: `${tradeProgress}%` }} />
                    </div>
                </div>

                {/* 損失 */}
                <div className="p-2 rounded-md bg-muted/40">
                    <div className="flex justify-between mb-1">
                        <span className="text-muted-foreground">損失</span>
                        <span className="font-bold">¥{(lossThisWeek / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", getBarColor(lossProgress))} style={{ width: `${lossProgress}%` }} />
                    </div>
                </div>

                {/* 連敗 */}
                <div className="p-2 rounded-md bg-muted/40">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">連敗</span>
                        <span className="font-bold">{consecutiveLosses}/{weeklyPlan.limits.consecutive_loss_stop === 'none' ? '-' : weeklyPlan.limits.consecutive_loss_stop}</span>
                    </div>
                </div>

                {/* リスク */}
                <div className="p-2 rounded-md bg-muted/40">
                    <div className="flex justify-between mb-0.5">
                        <span className="text-muted-foreground">リスク</span>
                    </div>
                    {nextEvent ? (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0">{nextEvent.countdown}</Badge>
                    ) : (
                        <span className="text-green-600 dark:text-green-400 font-medium">なし</span>
                    )}
                </div>
            </div>
        </div>
    )
}
