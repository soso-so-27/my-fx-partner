"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    TrendingUp,
    TrendingDown,
    Trophy,
    Library,
    ChevronLeft,
    ChevronRight,
    Check,
    Loader2
} from "lucide-react"
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns"
import { ja } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Trade } from "@/types/trade"
import { Knowledge } from "@/types/knowledge"

interface WeeklyReportProps {
    trades: Trade[]
    userId: string
}

export function WeeklyReport({ trades, userId }: WeeklyReportProps) {
    const [weekOffset, setWeekOffset] = useState(0)
    const [linkedKnowledge, setLinkedKnowledge] = useState<Record<string, Knowledge[]>>({})
    const [selectedFocus, setSelectedFocus] = useState<string | null>(null)
    const [savingFocus, setSavingFocus] = useState(false)
    const [focusSaved, setFocusSaved] = useState(false)

    // Calculate week boundaries
    const currentDate = addWeeks(new Date(), weekOffset)
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday start
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })

    // Filter trades for this week
    const weekTrades = trades.filter(trade => {
        const tradeDate = new Date(trade.exitTime || trade.entryTime)
        return tradeDate >= weekStart && tradeDate <= weekEnd
    })

    // Sort trades by P&L
    const sortedByPnl = [...weekTrades].sort((a, b) =>
        (b.pnl?.amount || 0) - (a.pnl?.amount || 0)
    )

    const bestTrades = sortedByPnl.slice(0, 3).filter(t => (t.pnl?.amount || 0) > 0)
    const worstTrades = sortedByPnl.slice(-3).reverse().filter(t => (t.pnl?.amount || 0) < 0)

    // Calculate week stats
    const totalPnl = weekTrades.reduce((sum, t) => sum + (t.pnl?.amount || 0), 0)
    const wins = weekTrades.filter(t => (t.pnl?.amount || 0) > 0).length
    const winRate = weekTrades.length > 0 ? Math.round((wins / weekTrades.length) * 100) : 0

    // Load knowledge linked to this week's trades
    const loadLinkedKnowledge = useCallback(async () => {
        if (weekTrades.length === 0) return

        try {
            const tradeIds = weekTrades.map(t => t.id)
            const knowledgeByTrade: Record<string, Knowledge[]> = {}

            for (const trade of weekTrades) {
                const response = await fetch(`/api/knowledge?tradeId=${trade.id}`)
                if (response.ok) {
                    const knowledge = await response.json()
                    if (knowledge.length > 0) {
                        knowledgeByTrade[trade.id] = knowledge
                    }
                }
            }
            setLinkedKnowledge(knowledgeByTrade)
        } catch (error) {
            console.error('Failed to load knowledge:', error)
        }
    }, [weekTrades])

    useEffect(() => {
        loadLinkedKnowledge()
    }, [weekOffset])

    // Count knowledge effectiveness
    const knowledgeStats = Object.values(linkedKnowledge).flat().reduce((acc, k) => {
        if (!acc[k.id]) {
            acc[k.id] = { knowledge: k, count: 0 }
        }
        acc[k.id].count++
        return acc
    }, {} as Record<string, { knowledge: Knowledge, count: number }>)

    const topKnowledge = Object.values(knowledgeStats)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)

    // Handle focus selection for next week
    const handleSaveFocus = async () => {
        if (!selectedFocus) return

        try {
            setSavingFocus(true)
            // Save as a reflection note for next week
            const nextWeekStart = addWeeks(weekStart, 1)
            await fetch('/api/reflections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: format(nextWeekStart, 'yyyy-MM-dd'),
                    note: `週次フォーカス: ${selectedFocus}`,
                    tomorrowFocus: 'weekly_focus'
                })
            })
            setFocusSaved(true)
        } catch (error) {
            console.error('Failed to save focus:', error)
        } finally {
            setSavingFocus(false)
        }
    }

    const isCurrentWeek = weekOffset === 0

    return (
        <div className="space-y-4">
            {/* Week Navigation */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setWeekOffset(prev => prev - 1)}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="text-center">
                            <p className="font-bold">
                                {format(weekStart, 'M/d', { locale: ja })} - {format(weekEnd, 'M/d', { locale: ja })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {isCurrentWeek ? '今週' : weekOffset === -1 ? '先週' : `${Math.abs(weekOffset)}週前`}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setWeekOffset(prev => prev + 1)}
                            disabled={weekOffset >= 0}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Week Summary */}
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t text-center">
                        <div>
                            <p className="text-xs text-muted-foreground">損益</p>
                            <p className={cn(
                                "font-bold font-numbers",
                                totalPnl >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                                {totalPnl >= 0 ? '+' : ''}¥{totalPnl.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">取引</p>
                            <p className="font-bold font-numbers">{weekTrades.length}件</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">勝率</p>
                            <p className="font-bold font-numbers">{winRate}%</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {weekTrades.length === 0 ? (
                <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                        <p>この週のトレードはありません</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Best/Worst Trades */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Best Trades */}
                        <Card className="border-green-200 dark:border-green-900/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-1.5">
                                    <Trophy className="h-4 w-4 text-green-600" />
                                    ベスト3
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {bestTrades.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">勝ちトレードなし</p>
                                ) : (
                                    bestTrades.map((trade, i) => (
                                        <div key={trade.id} className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">{i + 1}. {trade.pair}</span>
                                            <span className="font-numbers font-medium text-green-600">
                                                +¥{(trade.pnl?.amount || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        {/* Worst Trades */}
                        <Card className="border-red-200 dark:border-red-900/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-1.5">
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                    ワースト3
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {worstTrades.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">負けトレードなし</p>
                                ) : (
                                    worstTrades.map((trade, i) => (
                                        <div key={trade.id} className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">{i + 1}. {trade.pair}</span>
                                            <span className="font-numbers font-medium text-red-600">
                                                ¥{(trade.pnl?.amount || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Effective Knowledge TOP3 */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-1.5">
                                <Library className="h-4 w-4 text-primary" />
                                今週効いたナレッジ TOP3
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {topKnowledge.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-2">
                                    紐付けられたナレッジなし
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {topKnowledge.map(({ knowledge, count }, i) => (
                                        <div
                                            key={knowledge.id}
                                            className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="text-sm font-medium text-muted-foreground">
                                                    {i + 1}.
                                                </span>
                                                <span className="text-sm truncate">{knowledge.title}</span>
                                            </div>
                                            <Badge variant="secondary" className="text-xs shrink-0">
                                                {count}件
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Next Week Focus (only for current week) */}
                    {isCurrentWeek && topKnowledge.length > 0 && (
                        <Card className="border-primary/30">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">
                                    📌 来週もこれを意識する
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {focusSaved ? (
                                    <div className="flex items-center gap-2 text-green-600">
                                        <Check className="h-4 w-4" />
                                        <span className="text-sm">来週のフォーカスを設定しました</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex flex-wrap gap-2">
                                            {topKnowledge.map(({ knowledge }) => (
                                                <Button
                                                    key={knowledge.id}
                                                    variant={selectedFocus === knowledge.title ? "default" : "outline"}
                                                    size="sm"
                                                    className="text-xs"
                                                    onClick={() => setSelectedFocus(knowledge.title)}
                                                >
                                                    {knowledge.title}
                                                </Button>
                                            ))}
                                        </div>
                                        {selectedFocus && (
                                            <Button
                                                className="w-full"
                                                size="sm"
                                                onClick={handleSaveFocus}
                                                disabled={savingFocus}
                                            >
                                                {savingFocus ? (
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                ) : null}
                                                「{selectedFocus}」を来週の意識項目に
                                            </Button>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    )
}
