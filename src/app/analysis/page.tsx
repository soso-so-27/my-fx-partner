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
import { BarChart3 } from "lucide-react"

export default function AnalysisPage() {
    const { user } = useAuth()
    const [stats, setStats] = useState<AnalysisStats | null>(null)
    const [filteredTrades, setFilteredTrades] = useState<Trade[]>([])
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState<Period>('all')
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [bestTrade, setBestTrade] = useState<Trade | null>(null)

    useEffect(() => {
        const loadStats = async () => {
            if (!user) return
            try {
                const trades = await tradeService.getTrades(user.id)
                let filtered = filterByPeriod(trades, period)
                // Filter by tags
                if (selectedTags.length > 0) {
                    filtered = filtered.filter(trade =>
                        trade.tags && trade.tags.some(tag => selectedTags.includes(tag))
                    )
                }

                const computedStats = analysisEngine.calculateStats(filtered)
                setStats(computedStats)
                setFilteredTrades(filtered)

                // Find best trade (highest PnL)
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
                <header className="sticky top-0 z-50 -mx-4 px-4 pt-[env(safe-area-inset-top)] pb-2 bg-background border-b border-border flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-solo-navy dark:text-solo-gold" />
                    </div>
                    <h1 className="text-base font-bold">分析</h1>
                </header>

                <Tabs defaultValue="stats" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="stats">統計レポート</TabsTrigger>
                        <TabsTrigger value="history">トレード記録</TabsTrigger>
                    </TabsList>

                    <TabsContent value="stats">
                        <div className="mb-6 space-y-4">
                            <PeriodFilter value={period} onChange={setPeriod} />
                            <TagFilter selectedTags={selectedTags} onChange={setSelectedTags} />
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">勝率</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-3xl font-bold font-numbers ${stats.winRate === 0 ? '' : stats.winRate >= 50 ? 'text-profit' : 'text-loss'
                                        }`}>{stats.winRate}%</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">PF</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-3xl font-bold font-numbers ${stats.profitFactor === 0 ? '' : stats.profitFactor >= 1 ? 'text-profit' : 'text-loss'
                                        }`}>{stats.profitFactor}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">合計損益</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-xl lg:text-2xl font-bold font-numbers truncate ${stats.totalPnl === 0 ? '' : stats.totalPnl > 0 ? 'text-profit' : 'text-loss'
                                        }`}>
                                        {stats.totalPnl > 0 ? '+' : ''}¥{stats.totalPnl.toLocaleString()}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">トレード数</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold font-numbers">{stats.totalTrades}</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Core Value Cards: SNS Card + Rule Compliance */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            <SocialCard stats={stats} theme="minimal" />
                            <RuleComplianceCard />
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>損益推移</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <PnLChart trades={filteredTrades} />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>通貨ペア別パフォーマンス</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <PairPerformanceChart trades={filteredTrades} />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>詳細統計</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground whitespace-nowrap">平均利益</span>
                                        <span className="font-numbers font-medium text-profit whitespace-nowrap">+¥{stats.averageWin.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground whitespace-nowrap">平均損失</span>
                                        <span className="font-numbers font-medium text-loss whitespace-nowrap">-¥{Math.abs(stats.averageLoss).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground whitespace-nowrap">ベスト通貨ペア</span>
                                        <span className="font-medium whitespace-nowrap">{stats.bestPair}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Best Trade Showcase */}
                        {bestTrade && (
                            <div className="mt-8">
                                <h2 className="text-xl font-bold mb-4">ベストトレード</h2>
                                <BestTradeCard trade={bestTrade} theme="minimal" />
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="history">
                        <TradeHistoryList />
                    </TabsContent>
                </Tabs>
            </div>
        </ProtectedRoute>
    )
}
