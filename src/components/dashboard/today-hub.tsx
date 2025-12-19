"use client"

import { useMemo, useState, useEffect } from "react"
import { format, differenceInMinutes } from "date-fns"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react"
import { WeeklyPlan } from "@/components/strategy/types"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

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

    // Update every minute
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000)
        return () => clearInterval(interval)
    }, [])

    // 判定ロジック
    const signal = useMemo(() => {
        const now = currentTime
        const currentTimeStr = format(now, 'HH:mm')

        // 1. No Look Time check
        if (weeklyPlan.limits.no_look.enabled) {
            const { start, end } = weeklyPlan.limits.no_look
            let isNoLook = false
            if (start > end) {
                isNoLook = currentTimeStr >= start || currentTimeStr <= end
            } else {
                isNoLook = currentTimeStr >= start && currentTimeStr <= end
            }
            if (isNoLook) {
                return { status: 'ng' as SignalStatus, reason: '見ない時間帯', nextOkTime: end }
            }
        }

        // 2. Trade count limit
        if (tradesThisWeek >= weeklyPlan.limits.trade_count) {
            return { status: 'ng' as SignalStatus, reason: '週間上限到達' }
        }

        // 3. Loss limit
        if (lossThisWeek >= weeklyPlan.limits.loss_amount) {
            return { status: 'ng' as SignalStatus, reason: '損失上限到達' }
        }

        // 4. Consecutive loss stop
        if (weeklyPlan.limits.consecutive_loss_stop !== 'none') {
            const stopCount = parseInt(weeklyPlan.limits.consecutive_loss_stop)
            if (consecutiveLosses >= stopCount) {
                return { status: 'ng' as SignalStatus, reason: '連敗停止ルール発動' }
            }
        }

        // 5. Economic event stop window (★4以上)
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
                        reason: diffMinutes > 0 ? `${event.name}まで${Math.round(diffMinutes)}分` : `${event.name}発表直後`
                    }
                }
            }
        }

        return { status: 'ok' as SignalStatus, reason: '全条件クリア' }
    }, [weeklyPlan, economicEvents, tradesThisWeek, lossThisWeek, consecutiveLosses, currentTime])

    // 次の重要指標（★4以上）
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
                    countdown: hours > 0 ? `${hours}h${mins}m` : `${mins}m`,
                    importance: event.importance
                }
            }
        }
        return null
    }, [economicEvents, currentTime])

    const statusConfig = {
        ok: { bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', icon: CheckCircle2, label: 'エントリー可' },
        caution: { bg: 'bg-yellow-500/10', text: 'text-yellow-600 dark:text-yellow-400', icon: AlertTriangle, label: '注意' },
        ng: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', icon: XCircle, label: 'エントリー禁止' }
    }
    const config = statusConfig[signal.status]
    const Icon = config.icon

    const tradeProgress = (tradesThisWeek / weeklyPlan.limits.trade_count) * 100
    const lossProgress = (lossThisWeek / weeklyPlan.limits.loss_amount) * 100

    return (
        <div className={cn("space-y-3", className)}>
            {/* 判定 */}
            <div className={cn("p-3 rounded-lg", config.bg)}>
                <p className="text-[10px] text-muted-foreground mb-1">判定</p>
                <div className="flex items-center gap-2">
                    <Icon className={cn("h-5 w-5", config.text)} />
                    <span className={cn("text-lg font-bold", config.text)}>{config.label}</span>
                    <span className="text-xs text-muted-foreground">{signal.reason}</span>
                    {signal.nextOkTime && (
                        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                            <Clock className="h-3 w-3" />{signal.nextOkTime}〜
                        </span>
                    )}
                </div>
            </div>

            {/* リミット */}
            <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-[10px] text-muted-foreground mb-2">リミット</p>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs w-10">回数</span>
                        <Progress value={tradeProgress} className="flex-1 h-2" />
                        <span className="text-xs font-medium w-12 text-right">{tradesThisWeek}/{weeklyPlan.limits.trade_count}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs w-10">損失</span>
                        <Progress value={lossProgress} className="flex-1 h-2" />
                        <span className="text-xs font-medium w-12 text-right">¥{(lossThisWeek / 1000).toFixed(0)}k</span>
                    </div>
                    {weeklyPlan.limits.consecutive_loss_stop !== 'none' && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs w-10">連敗</span>
                            <span className="text-xs">{consecutiveLosses}/{weeklyPlan.limits.consecutive_loss_stop}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* リスク */}
            <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-[10px] text-muted-foreground mb-1">リスク</p>
                {nextEvent ? (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{nextEvent.name}</span>
                        <span className="text-xs text-muted-foreground">{nextEvent.time}</span>
                        <Badge variant="secondary" className="text-[10px]">残{nextEvent.countdown}</Badge>
                        {weeklyPlan.eventSettings.use_stop_window && (
                            <Badge variant="outline" className="text-[10px]">停止窓±{weeklyPlan.eventSettings.stop_window}分</Badge>
                        )}
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground">本日の重要指標なし</span>
                )}
            </div>
        </div>
    )
}
