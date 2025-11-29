"use client"

import { useEffect, useState } from "react"
import { Trade } from "@/types/trade"
import { tradeService } from "@/lib/trade-service"
import { analysisEngine, AnalysisStats } from "@/lib/analysis-engine"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SocialCard } from "@/components/analysis/social-card"
import { PeriodFilter } from "@/components/ui/period-filter"
import { Period, filterByPeriod } from "@/lib/date-utils"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { TagFilter } from "@/components/ui/tag-filter"
import { PnLChart } from "@/components/charts/pnl-chart"
import { PairPerformanceChart } from "@/components/charts/pair-performance-chart"

export default function AnalysisPage() {
    const [stats, setStats] = useState<AnalysisStats | null>(null)
    const [filteredTrades, setFilteredTrades] = useState<Trade[]>([])
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState<Period>('all')
    const [selectedTags, setSelectedTags] = useState<string[]>([])

    useEffect(() => {
        const loadStats = async () => {
            try {
                const trades = await tradeService.getTrades()
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
            } catch (error) {
                console.error("Failed to load stats", error)
            } finally {
                setLoading(false)
            }
        }
        loadStats()
    }, [period, selectedTags])

    if (loading || !stats) {
        return <div className="p-4">Loading analysis...</div>
    }

    return (
        <ProtectedRoute>
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-6">分析レポート</h1>

                <div className="mb-6 space-y-4">
                    <PeriodFilter value={period} onChange={setPeriod} />
                    <TagFilter selectedTags={selectedTags} onChange={setSelectedTags} />
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">勝率</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-3xl font-bold font-numbers ${stats.winRate >= 50 ? 'text-profit' : 'text-loss'}`}>{stats.winRate}%</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">PF</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-3xl font-bold font-numbers ${stats.profitFactor >= 1 ? 'text-profit' : 'text-loss'}`}>{stats.profitFactor}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">合計損益</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-3xl font-bold font-numbers ${stats.totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                                {stats.totalPnl > 0 ? '+' : ''}{stats.totalPnl}
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
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">平均利益</span>
                                <span className="font-numbers font-medium text-profit">+{stats.averageWin}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">平均損失</span>
                                <span className="font-numbers font-medium text-loss">-{stats.averageLoss}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">ベスト通貨ペア</span>
                                <span className="font-medium">{stats.bestPair}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div>
                        <SocialCard stats={stats} />
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
