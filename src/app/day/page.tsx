"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    ArrowLeft,
    Clock,
    CheckCircle2,
    ChevronRight,
    Loader2
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { ja } from "date-fns/locale"
import { tradeService } from "@/lib/trade-service"
import { Trade } from "@/types/trade"
import { cn } from "@/lib/utils"
import { RelatedKnowledge } from "@/components/trade/related-knowledge"

// 30秒振り返りの質問選択肢
const MISTAKE_OPTIONS = [
    { id: 'late_stoploss', label: '損切り遅れ' },
    { id: 'chasing', label: '追いかけ' },
    { id: 'overtrading', label: '無駄トレ' },
    { id: 'ignored_rule', label: 'ルール無視' },
    { id: 'none', label: 'なし' },
]

const TOMORROW_OPTIONS = [
    { id: 'no_chasing', label: '追いかけない' },
    { id: 'follow_stoploss', label: '損切り守る' },
    { id: 'check_calendar', label: '指標確認' },
    { id: 'less_trades', label: '回数減らす' },
    { id: 'keep_going', label: 'このまま' },
]

// Inner component that uses useSearchParams
function DayDetailContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const dateParam = searchParams.get('date')
    const { data: session, status } = useSession()

    const [trades, setTrades] = useState<Trade[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedMistake, setSelectedMistake] = useState<string | null>(null)
    const [selectedTomorrow, setSelectedTomorrow] = useState<string | null>(null)
    const [reflectionSaved, setReflectionSaved] = useState(false)
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)

    // Parse date from URL
    const date = dateParam ? parseISO(dateParam) : new Date()

    useEffect(() => {
        const loadTrades = async () => {
            if (status !== "authenticated" || !session?.user?.email) {
                setLoading(false)
                return
            }
            try {
                const allTrades = await tradeService.getTrades(session.user.email)
                // Filter to this day's trades
                const dayTrades = allTrades.filter(trade => {
                    const tradeDate = new Date(trade.exitTime || trade.entryTime)
                    return tradeDate.toDateString() === date.toDateString()
                })
                setTrades(dayTrades)
            } catch (error) {
                console.error('Failed to load trades:', error)
            } finally {
                setLoading(false)
            }
        }
        loadTrades()
    }, [session, status, dateParam, date])

    // Calculate day's stats
    const totalPnl = trades.reduce((sum, t) => sum + (t.pnl?.amount || 0), 0)
    const wins = trades.filter(t => (t.pnl?.amount || 0) > 0).length
    const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0
    const bestTrade = trades.length > 0 ? trades.reduce((best, t) => (t.pnl?.amount || 0) > (best?.pnl?.amount || 0) ? t : best, trades[0]) : null
    const worstTrade = trades.length > 0 ? trades.reduce((worst, t) => (t.pnl?.amount || 0) < (worst?.pnl?.amount || 0) ? t : worst, trades[0]) : null

    const handleSaveReflection = async () => {
        try {
            const response = await fetch('/api/reflections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: format(date, 'yyyy-MM-dd'),
                    biggestMistake: selectedMistake,
                    tomorrowFocus: selectedTomorrow
                })
            })
            if (response.ok) {
                setReflectionSaved(true)
            }
        } catch (error) {
            console.error('Failed to save reflection:', error)
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto p-4 pb-20">
                <div className="animate-pulse text-muted-foreground text-center py-12">
                    読み込み中...
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-4 pb-20 space-y-4">
            {/* Header */}
            <header className="flex items-center gap-2 pt-[env(safe-area-inset-top)]">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-bold">
                    {format(date, 'M月d日（E）', { locale: ja })}
                </h1>
            </header>

            {/* Today's Summary */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">決済損益</p>
                            <p className={cn(
                                "text-xl font-bold font-numbers",
                                totalPnl >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                                {totalPnl >= 0 ? '+' : ''}¥{totalPnl.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">トレード</p>
                            <p className="text-xl font-bold font-numbers">
                                {trades.length}件
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">勝率</p>
                            <p className="text-xl font-bold font-numbers">
                                {winRate}%
                            </p>
                        </div>
                    </div>

                    {/* Best/Worst */}
                    {trades.length > 0 && (
                        <div className="flex gap-4 mt-4 pt-4 border-t">
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground mb-1">ベスト</p>
                                <p className="text-sm font-medium">
                                    {bestTrade?.pair}{' '}
                                    <span className="text-green-600 font-numbers">
                                        +¥{(bestTrade?.pnl?.amount || 0).toLocaleString()}
                                    </span>
                                </p>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground mb-1">ワースト</p>
                                <p className="text-sm font-medium">
                                    {worstTrade?.pair}{' '}
                                    <span className="text-red-600 font-numbers">
                                        ¥{(worstTrade?.pnl?.amount || 0).toLocaleString()}
                                    </span>
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 30-Second Reflection */}
            <Card className="border-primary/20">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            30秒振り返り
                        </CardTitle>
                        {reflectionSaved && (
                            <Badge variant="secondary" className="text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                保存済み
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Q1 */}
                    <div>
                        <p className="text-sm font-medium mb-2">Q1: 一番のミスは？</p>
                        <div className="flex flex-wrap gap-1.5">
                            {MISTAKE_OPTIONS.map(opt => (
                                <Button
                                    key={opt.id}
                                    variant={selectedMistake === opt.id ? "default" : "outline"}
                                    size="sm"
                                    className="text-xs h-7"
                                    onClick={() => setSelectedMistake(opt.id)}
                                >
                                    {opt.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Q2 */}
                    <div>
                        <p className="text-sm font-medium mb-2">Q2: 明日やめることは？</p>
                        <div className="flex flex-wrap gap-1.5">
                            {TOMORROW_OPTIONS.map(opt => (
                                <Button
                                    key={opt.id}
                                    variant={selectedTomorrow === opt.id ? "default" : "outline"}
                                    size="sm"
                                    className="text-xs h-7"
                                    onClick={() => setSelectedTomorrow(opt.id)}
                                >
                                    {opt.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Save Button */}
                    {!reflectionSaved && (selectedMistake || selectedTomorrow) && (
                        <Button
                            className="w-full"
                            size="sm"
                            onClick={handleSaveReflection}
                        >
                            振り返りを保存
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Trade List */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">トレード一覧</CardTitle>
                </CardHeader>
                <CardContent>
                    {trades.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            この日のトレードはありません
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {trades.map(trade => (
                                <div
                                    key={trade.id}
                                    className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 cursor-pointer"
                                    onClick={() => setSelectedTrade(trade)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold",
                                            (trade.pnl?.amount || 0) >= 0
                                                ? "bg-green-500/10 text-green-600"
                                                : "bg-red-500/10 text-red-600"
                                        )}>
                                            {(trade.pnl?.amount || 0) >= 0 ? 'W' : 'L'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{trade.pair}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {trade.exitTime
                                                    ? format(new Date(trade.exitTime), 'HH:mm')
                                                    : format(new Date(trade.entryTime), 'HH:mm')
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "font-bold font-numbers text-sm",
                                            (trade.pnl?.amount || 0) >= 0 ? "text-green-600" : "text-red-600"
                                        )}>
                                            {(trade.pnl?.amount || 0) >= 0 ? '+' : ''}
                                            ¥{(trade.pnl?.amount || 0).toLocaleString()}
                                        </span>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Trade Detail Dialog */}
            <Dialog open={!!selectedTrade} onOpenChange={(open) => !open && setSelectedTrade(null)}>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            トレード詳細
                            {selectedTrade?.isVerified && (
                                <span className="text-xs bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                    Real
                                </span>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedTrade && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-muted-foreground font-bold">通貨ペア</label>
                                    <p className="font-medium text-lg">{selectedTrade.pair}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground font-bold">売買</label>
                                    <p className={cn(
                                        "font-medium",
                                        selectedTrade.direction === 'BUY' ? "text-red-600" : "text-blue-600"
                                    )}>
                                        {selectedTrade.direction === 'BUY' ? '買い (Long)' : '売り (Short)'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground font-bold">決済損益</label>
                                    <p className={cn(
                                        "font-bold font-numbers text-lg",
                                        (selectedTrade.pnl?.amount ?? 0) > 0 ? "text-green-600" : (selectedTrade.pnl?.amount ?? 0) < 0 ? "text-red-600" : "text-muted-foreground"
                                    )}>
                                        {(selectedTrade.pnl?.amount ?? 0) > 0 ? '+' : ''}¥{(selectedTrade.pnl?.amount ?? 0).toLocaleString()}
                                        {selectedTrade.pnl?.pips !== undefined && (
                                            <span className="text-sm font-normal ml-1 text-muted-foreground">
                                                ({selectedTrade.pnl.pips > 0 ? '+' : ''}{selectedTrade.pnl.pips} pips)
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground font-bold">日時</label>
                                    <p className="font-medium">
                                        {format(new Date(selectedTrade.entryTime), 'HH:mm', { locale: ja })}
                                    </p>
                                </div>
                            </div>

                            {/* Related Knowledge */}
                            <RelatedKnowledge
                                tradeId={selectedTrade.id}
                                tradePair={selectedTrade.pair}
                                userId={session?.user?.email || ''}
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Loading fallback
function DayDetailLoading() {
    return (
        <div className="container mx-auto p-4 pb-20 flex items-center justify-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    )
}

// Main page component with Suspense
export default function DayDetailPage() {
    return (
        <ProtectedRoute>
            <Suspense fallback={<DayDetailLoading />}>
                <DayDetailContent />
            </Suspense>
        </ProtectedRoute>
    )
}
