"use client"

import { useMemo, useState, useEffect } from "react"
import { format, differenceInMinutes } from "date-fns"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, AlertTriangle, Clock, Shield } from "lucide-react"
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

    // 判定ロジック
    const signal = useMemo(() => {
        const now = currentTime
        const currentTimeStr = format(now, 'HH:mm')

        if (weeklyPlan.limits.no_look.enabled) {
            const { start, end } = weeklyPlan.limits.no_look
            let isNoLook = start > end
                ? currentTimeStr >= start || currentTimeStr <= end
                : currentTimeStr >= start && currentTimeStr <= end
            if (isNoLook) return { status: 'ng' as SignalStatus, reason: '見ない時間帯', nextOkTime: end }
        }

        if (tradesThisWeek >= weeklyPlan.limits.trade_count) {
            return { status: 'ng' as SignalStatus, reason: '週間上限到達' }
        }

        if (lossThisWeek >= weeklyPlan.limits.loss_amount) {
            return { status: 'ng' as SignalStatus, reason: '損失上限到達' }
        }

        if (weeklyPlan.limits.consecutive_loss_stop !== 'none') {
            const stopCount = parseInt(weeklyPlan.limits.consecutive_loss_stop)
            if (consecutiveLosses >= stopCount) {
                return { status: 'ng' as SignalStatus, reason: '連敗停止発動' }
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
                        reason: diffMinutes > 0 ? `指標まで${Math.round(diffMinutes)}分` : '指標発表直後'
                    }
                }
            }
        }

        return { status: 'ok' as SignalStatus, reason: '全条件クリア' }
    }, [weeklyPlan, economicEvents, tradesThisWeek, lossThisWeek, consecutiveLosses, currentTime])

    // 次の重要指標
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
        ok: { bg: 'bg-green-500/15', border: 'border-green-500/30', text: 'text-green-600 dark:text-green-400', icon: CheckCircle2, label: 'エントリー可' },
        caution: { bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', text: 'text-yellow-600 dark:text-yellow-400', icon: AlertTriangle, label: '注意' },
        ng: { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-600 dark:text-red-400', icon: XCircle, label: 'エントリー禁止' }
    }
    const config = statusConfig[signal.status]
    const Icon = config.icon

    // Progress with cap at 100% and color gradient
    const tradeProgress = Math.min(100, (tradesThisWeek / weeklyPlan.limits.trade_count) * 100)
    const lossProgress = Math.min(100, (lossThisWeek / weeklyPlan.limits.loss_amount) * 100)
    const getProgressColor = (percent: number) => {
        if (percent >= 100) return 'bg-red-500'
        if (percent >= 80) return 'bg-yellow-500'
        return 'bg-blue-500'
    }

    return (
        <div className={cn("space-y-2", className)}>
            {/* 判定 - 大きく中央 */}
            <div className={cn(
                "p-4 rounded-xl border text-center",
                config.bg, config.border
            )}>
                <div className="flex items-center justify-center gap-2">
                    <Icon className={cn("h-6 w-6", config.text)} />
                    <span className={cn("text-xl font-bold", config.text)}>{config.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{signal.reason}</p>
                {signal.nextOkTime && (
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />{signal.nextOkTime}〜 解除
                    </p>
                )}
            </div>

            {/* リミット + リスク - 横2列 */}
            <div className="grid grid-cols-2 gap-2">
                {/* 左: リミット */}
                <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
                        <Shield className="h-3 w-3" />リミット
                    </p>
                    <div className="space-y-1.5">
                        <div>
                            <div className="flex justify-between text-[10px] mb-0.5">
                                <span>回数</span>
                                <span className="font-medium">{tradesThisWeek}/{weeklyPlan.limits.trade_count}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className={cn("h-full rounded-full transition-all", getProgressColor(tradeProgress))} style={{ width: `${tradeProgress}%` }} />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] mb-0.5">
                                <span>損失</span>
                                <span className="font-medium">¥{(lossThisWeek / 1000).toFixed(0)}k</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className={cn("h-full rounded-full transition-all", getProgressColor(lossProgress))} style={{ width: `${lossProgress}%` }} />
                            </div>
                        </div>
                        {weeklyPlan.limits.consecutive_loss_stop !== 'none' && (
                            <div className="flex justify-between text-[10px]">
                                <span>連敗</span>
                                <span className="font-medium">{consecutiveLosses}/{weeklyPlan.limits.consecutive_loss_stop}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 右: リスク */}
                <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />リスク
                    </p>
                    {nextEvent ? (
                        <div className="space-y-1">
                            <p className="text-xs font-medium truncate">{nextEvent.name}</p>
                            <div className="flex items-center gap-1 flex-wrap">
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{nextEvent.time}</Badge>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">残{nextEvent.countdown}</Badge>
                            </div>
                            {weeklyPlan.eventSettings.use_stop_window && (
                                <p className="text-[10px] text-muted-foreground">停止窓 ±{weeklyPlan.eventSettings.stop_window}分</p>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>指標なし</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
