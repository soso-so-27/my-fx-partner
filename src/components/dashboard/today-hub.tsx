"use client"

import { useMemo, useState, useEffect } from "react"
import { format, differenceInMinutes, differenceInHours, nextMonday } from "date-fns"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, AlertTriangle, Clock, RotateCcw, ChevronDown, ChevronUp } from "lucide-react"
import { WeeklyPlan } from "@/components/strategy/types"

interface TodayHubProps {
    weeklyPlan: WeeklyPlan
    economicEvents?: any[]
    tradesThisWeek?: number
    lossThisWeek?: number
    consecutiveLosses?: number
    className?: string
}

type SignalStatus = 'ok' | 'caution' | 'ng'
type StopReason = 'trade_limit' | 'loss_limit' | 'consecutive_loss' | 'event' | 'no_look' | null

export function TodayHub({
    weeklyPlan,
    economicEvents = [],
    tradesThisWeek = 0,
    lossThisWeek = 0,
    consecutiveLosses = 0,
    className
}: TodayHubProps) {
    const [currentTime, setCurrentTime] = useState(new Date())
    const [isExpanded, setIsExpanded] = useState(false)

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000)
        return () => clearInterval(interval)
    }, [])

    // 週次リセットまでの時間
    const timeToReset = useMemo(() => {
        const monday = nextMonday(currentTime)
        monday.setHours(0, 0, 0, 0)
        const hoursLeft = differenceInHours(monday, currentTime)
        const daysLeft = Math.floor(hoursLeft / 24)
        const remainingHours = hoursLeft % 24
        return daysLeft > 0 ? `${daysLeft}d${remainingHours}h` : `${remainingHours}h`
    }, [currentTime])

    // 判定ロジック
    const signal = useMemo(() => {
        const now = currentTime
        const currentTimeStr = format(now, 'HH:mm')

        if (weeklyPlan.limits.no_look.enabled) {
            const { start, end } = weeklyPlan.limits.no_look
            let isNoLook = start > end
                ? currentTimeStr >= start || currentTimeStr <= end
                : currentTimeStr >= start && currentTimeStr <= end
            if (isNoLook) {
                return { status: 'ng' as SignalStatus, reason: '見ない時間', stopReason: 'no_look' as StopReason, nextOkTime: end }
            }
        }

        if (tradesThisWeek >= weeklyPlan.limits.trade_count) {
            const exceeded = tradesThisWeek - weeklyPlan.limits.trade_count
            return { status: 'ng' as SignalStatus, reason: `回数超過`, exceeded, stopReason: 'trade_limit' as StopReason }
        }

        if (lossThisWeek >= weeklyPlan.limits.loss_amount) {
            return { status: 'ng' as SignalStatus, reason: '損失超過', stopReason: 'loss_limit' as StopReason }
        }

        if (weeklyPlan.limits.consecutive_loss_stop !== 'none') {
            const stopCount = parseInt(weeklyPlan.limits.consecutive_loss_stop)
            if (consecutiveLosses >= stopCount) {
                return { status: 'ng' as SignalStatus, reason: '連敗停止', stopReason: 'consecutive_loss' as StopReason }
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
                    return { status: 'caution' as SignalStatus, reason: `指標${Math.round(Math.abs(diffMinutes))}分`, stopReason: 'event' as StopReason }
                }
            }
        }

        return { status: 'ok' as SignalStatus, reason: 'クリア', stopReason: null }
    }, [weeklyPlan, economicEvents, tradesThisWeek, lossThisWeek, consecutiveLosses, currentTime])

    // 次の指標
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
                return { name: event.name, countdown: hours > 0 ? `${hours}h${mins}m` : `${mins}m` }
            }
        }
        return null
    }, [economicEvents, currentTime])

    // ステータス設定 - 背景帯で領域を分ける
    const statusConfig = {
        ok: { bg: 'bg-success', text: 'text-white', icon: CheckCircle2, label: 'GO', cardBg: 'bg-success-weak', cardBorder: 'border-success-border' },
        caution: { bg: 'bg-warning', text: 'text-white', icon: AlertTriangle, label: '注意', cardBg: 'bg-warning-weak', cardBorder: 'border-warning-border' },
        ng: { bg: 'bg-danger', text: 'text-white', icon: XCircle, label: 'STOP', cardBg: 'bg-danger-weak', cardBorder: 'border-danger' }
    }
    const config = statusConfig[signal.status]
    const Icon = config.icon

    const tradeExceeded = tradesThisWeek > weeklyPlan.limits.trade_count ? tradesThisWeek - weeklyPlan.limits.trade_count : 0
    const showWeeklyReset = signal.status === 'ng' && ['trade_limit', 'loss_limit', 'consecutive_loss'].includes(signal.stopReason || '')

    return (
        <div className={cn(className)}>
            {/* === Level A: ステータス帯（主役・背景で領域を分ける） === */}
            <div
                className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all",
                    config.cardBg,
                    config.cardBorder
                )}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {/* メイン行：状態 + 原因 + リセット */}
                <div className="flex items-center gap-3">
                    {/* 状態バッジ */}
                    <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full", config.bg)}>
                        <Icon className={cn("h-4 w-4", config.text)} />
                        <span className={cn("text-sm font-bold", config.text)}>{config.label}</span>
                    </div>

                    {/* 原因 + 詳細 */}
                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{signal.reason}</span>
                        {signal.stopReason === 'trade_limit' && (
                            <span className="font-bold">{tradesThisWeek}/{weeklyPlan.limits.trade_count}
                                {tradeExceeded > 0 && <span className="text-danger ml-0.5">(+{tradeExceeded})</span>}
                            </span>
                        )}
                        {signal.stopReason === 'loss_limit' && (
                            <span className="font-bold text-danger">¥{(lossThisWeek / 1000).toFixed(0)}k</span>
                        )}
                        {signal.stopReason === 'consecutive_loss' && (
                            <span className="font-bold">{consecutiveLosses}/{weeklyPlan.limits.consecutive_loss_stop}</span>
                        )}
                        {signal.nextOkTime && (
                            <span className="flex items-center gap-0.5 text-muted-foreground"><Clock className="h-3.5 w-3.5" />{signal.nextOkTime}〜</span>
                        )}
                    </div>

                    {/* 右端：リセット + 展開 */}
                    <div className="ml-auto flex items-center gap-2">
                        {showWeeklyReset && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <RotateCcw className="h-3.5 w-3.5" />{timeToReset}
                            </span>
                        )}
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                </div>

                {/* 展開時：KPI詳細（Level C: サブ面） */}
                {isExpanded && (
                    <div className="grid grid-cols-4 gap-2 mt-3 text-xs animate-in slide-in-from-top-1 duration-150">
                        <div className={cn("p-2 rounded bg-surface-2", signal.stopReason === 'trade_limit' && "ring-1 ring-danger")}>
                            <div className="text-muted-foreground text-[10px]">回数</div>
                            <div className="font-bold">{tradesThisWeek}/{weeklyPlan.limits.trade_count}</div>
                        </div>
                        <div className={cn("p-2 rounded bg-surface-2", signal.stopReason === 'loss_limit' && "ring-1 ring-danger")}>
                            <div className="text-muted-foreground text-[10px]">損失</div>
                            <div className="font-bold">¥{(lossThisWeek / 1000).toFixed(0)}k</div>
                        </div>
                        <div className="p-2 rounded bg-surface-2">
                            <div className="text-muted-foreground text-[10px]">連敗</div>
                            <div className="font-bold">{consecutiveLosses}/{weeklyPlan.limits.consecutive_loss_stop === 'none' ? '-' : weeklyPlan.limits.consecutive_loss_stop}</div>
                        </div>
                        <div className={cn("p-2 rounded bg-surface-2", signal.stopReason === 'event' && "ring-1 ring-warning")}>
                            <div className="text-muted-foreground text-[10px]">リスク</div>
                            <div className="font-medium text-muted-foreground">{nextEvent ? nextEvent.countdown : 'なし'}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
