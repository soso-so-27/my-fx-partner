"use client"

import { useEffect, useState } from "react"
import { Trade } from "@/types/trade"
import { tradeService } from "@/lib/trade-service"
import { analysisEngine, AnalysisStats } from "@/lib/analysis-engine"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SocialCard } from "@/components/analysis/social-card"
import { RuleComplianceCard } from "@/components/analysis/rule-compliance-card"
import { BestTradeCard } from "@/components/analysis/best-trade-card"
import { PeriodFilter } from "@/components/ui/period-filter"
import { Period, filterByPeriod } from "@/lib/date-utils"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { TagFilter } from "@/components/ui/tag-filter"
import { PnLChart } from "@/components/charts/pnl-chart"
import { PairPerformanceChart } from "@/components/charts/pair-performance-chart"
import { useAuth } from "@/contexts/auth-context"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TradeHistoryList } from "@/components/history/trade-history-list"
import { BarChart3, ChevronDown, ChevronUp } from "lucide-react"

export default function AnalysisPage() {
    const { user } = useAuth()
    const [stats, setStats] = useState<AnalysisStats | null>(null)
    const [filteredTrades, setFilteredTrades] = useState<Trade[]>([])
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState<Period>('all')
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [bestTrade, setBestTrade] = useState<Trade | null>(null)
    const [showPairChart, setShowPairChart] = useState(false)

    useEffect(() => {
        const loadStats = async () => {
            if (!user) return
            try {
                const trades = await tradeService.getTrades(user.id)
                let filtered = filterByPeriod(trades, period)
                if (selectedTags.length > 0) {
                    filtered = filtered.filter(trade =>
                        trade.tags && trade.tags.some(tag => selectedTags.includes(tag))
                    )
                }

                const computedStats = analysisEngine.calculateStats(filtered)
                setStats(computedStats)
                setFilteredTrades(filtered)

                if (filtered.length > 0) {
                    const best = filtered.reduce((prev, current) => {
                        const prevPnl = prev.pnl?.pips ?? 0
                        const currentPnl = current.pnl?.pips ?? 0
                        return currentPnl > prevPnl ? current : prev
                    })
                    setBestTrade(best)
                }
            } catch (error) {
                console.error("Failed to load stats", error)
            } finally {
                setLoading(false)
            }
        }
        loadStats()
    }, [user, period, selectedTags])

    if (loading || !stats) {
        return <div className="p-4">Loading analysis...</div>
    }

    return (
        <ProtectedRoute>
            <div className="container mx-auto p-4 pb-24">
                {/* Header with consistent rounded-lg icon */}
                <header className="sticky top-0 z-50 -mx-4 px-4 pt-[env(safe-area-inset-top)] pb-2 bg-background border-b border-border flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-muted/50 flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-solo-navy dark:text-solo-gold" />
                    </div>
                    <h1 className="text-base font-bold">分析</h1>
                </header>

                <Tabs defaultValue="stats" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 my-4">
                        <TabsTrigger value="stats">統計レポート</TabsTrigger>
                        <TabsTrigger value="history">トレード記録</TabsTrigger>
                    </TabsList>

                    <TabsContent value="stats">
                        {/* Filters */}
                        <div className="mb-6 space-y-3">
                            <PeriodFilter value={period} onChange={setPeriod} />
                            <TagFilter selectedTags={selectedTags} onChange={setSelectedTags} />
                        </div>

                        {/* Best Trade Showcase - Moved to Top */}
                        {bestTrade && (
                            <div className="mb-6">
                                <h2 className="text-sm font-bold text-muted-foreground mb-2">ベストトレード</h2>
                                <BestTradeCard trade={bestTrade} theme="minimal" />
                            </div>
                        )}

                        {/* Simplified Stats - 2x2 Grid with Compact Cards */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <Card className="p-3">
                                <div className="text-xs text-muted-foreground mb-1">勝率</div>
                                <div className={`text-2xl font-bold font-numbers ${stats.winRate === 0 ? '' : stats.winRate >= 50 ? 'text-profit' : 'text-loss'}`}>
                                    {stats.winRate}%
                                </div>
                            </Card>
                            <Card className="p-3">
                                <div className="text-xs text-muted-foreground mb-1">PF</div>
                                <div className={`text-2xl font-bold font-numbers ${stats.profitFactor === 0 ? '' : stats.profitFactor >= 1 ? 'text-profit' : 'text-loss'}`}>
                                    {stats.profitFactor}
                                </div>
                            </Card>
                            <Card className="p-3">
                                <div className="text-xs text-muted-foreground mb-1">トレード数</div>
                                <div className="text-2xl font-bold font-numbers">{stats.totalTrades}</div>
                            </Card>
                            <Card className="p-3">
                                <div className="text-xs text-muted-foreground mb-1">合計損益</div>
                                <div className={`text-lg font-bold font-numbers truncate ${stats.totalPnl === 0 ? '' : stats.totalPnl > 0 ? 'text-profit' : 'text-loss'}`}>
                                    {stats.totalPnl > 0 ? '+' : ''}¥{stats.totalPnl.toLocaleString()}
                                </div>
                            </Card>
                        </div>

                        {/* Core Value Cards */}
                        <div className="space-y-4 mb-6">
                            <SocialCard stats={stats} theme="minimal" />
                            <RuleComplianceCard />
                        </div>

                        {/* PnL Chart - Always Visible */}
                        <Card className="mb-6">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">損益推移</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <PnLChart trades={filteredTrades} />
                            </CardContent>
                        </Card>

                        {/* Pair Performance - Collapsible on Mobile */}
                        <div className="mb-6">
                            <button
                                onClick={() => setShowPairChart(!showPairChart)}
                                className="w-full flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                            >
                                <span>通貨ペア別パフォーマンス</span>
                                {showPairChart ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                            {showPairChart && (
                                <Card className="mt-2">
                                    <CardContent className="pt-4">
                                        <PairPerformanceChart trades={filteredTrades} />
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Detail Stats - Compact */}
                        <Card className="mb-6">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">詳細統計</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">平均利益</span>
                                    <span className="font-numbers font-medium text-profit">+¥{stats.averageWin.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">平均損失</span>
                                    <span className="font-numbers font-medium text-loss">-¥{Math.abs(stats.averageLoss).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">ベストペア</span>
                                    <span className="font-medium">{stats.bestPair}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history">
                        <TradeHistoryList />
                    </TabsContent>
                </Tabs>
            </div>
        </ProtectedRoute>
    )
}
