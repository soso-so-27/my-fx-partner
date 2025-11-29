"use client"

import Link from 'next/link'
import { useEffect, useState } from "react"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from "@/lib/utils"
import { tradeService } from "@/lib/trade-service"
import { analysisEngine, AnalysisStats } from "@/lib/analysis-engine"
import { BarChart2, Activity, TrendingUp, Plus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function Home() {
  const { user } = useAuth()
  const [stats, setStats] = useState<AnalysisStats | null>(null)
  const [recentTrade, setRecentTrade] = useState<any>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!user) return
      const trades = await tradeService.getTrades(user.id)
      const computedStats = analysisEngine.calculateStats(trades)
      setStats(computedStats)

      // Get most recent trade
      if (trades.length > 0) {
        setRecentTrade(trades[0])
      }
    }
    loadData()
  }, [user])

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4 pb-24 space-y-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-solo-black dark:text-solo-white">
            Hello, {user?.email?.split('@')[0]}
          </h1>
          <p className="text-muted-foreground text-sm">
            今日の成長を積み上げましょう
          </p>
        </header>

        {/* Key Metrics Section */}
        {stats && (
          <section className="grid grid-cols-3 gap-3">
            <Card className="bg-card border-none shadow-sm">
              <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground mb-1">勝率 (30日)</p>
                <div className="text-xl font-bold font-numbers text-solo-navy dark:text-solo-white">
                  {stats.winRate}<span className="text-xs text-solo-gold">%</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-none shadow-sm">
              <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground mb-1">PF</p>
                <div className="text-xl font-bold font-numbers text-solo-navy dark:text-solo-white">
                  {stats.profitFactor}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-none shadow-sm">
              <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground mb-1">継続日数</p>
                <div className="text-xl font-bold font-numbers text-solo-navy dark:text-solo-white">
                  {stats.totalTrades > 0 ? Math.min(stats.totalTrades, 5) : 0}<span className="text-xs text-muted-foreground">日</span>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Recent Trade Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">直近のトレード</h2>
            <Link href="/history" className="text-xs text-solo-gold hover:underline">
              すべて見る
            </Link>
          </div>

          {recentTrade ? (
            <Card className="border-l-4 border-l-solo-gold">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-sm font-bold text-solo-navy dark:text-solo-white">
                      {recentTrade.pair}
                    </span>
                    <span className={cn(
                      "ml-2 text-xs px-2 py-0.5 rounded-full",
                      recentTrade.direction === 'BUY'
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    )}>
                      {recentTrade.direction}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-numbers">
                    {new Date(recentTrade.entryTime).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <div className="text-sm text-muted-foreground">
                    {recentTrade.pnl ? (
                      <span className={cn(
                        "font-bold font-numbers text-lg",
                        recentTrade.pnl > 0 ? "text-profit" : "text-loss"
                      )}>
                        {recentTrade.pnl > 0 ? "+" : ""}{recentTrade.pnl} pips
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        保有中
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                まだトレード記録がありません
              </CardContent>
            </Card>
          )}
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold mb-3">クイックアクション</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/analysis">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <TrendingUp className="h-5 w-5 text-solo-gold" />
                <span className="text-xs">分析レポート</span>
              </Button>
            </Link>
            <Link href="/settings/rules">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <Activity className="h-5 w-5 text-solo-gold" />
                <span className="text-xs">ルール確認</span>
              </Button>
            </Link>
            <Link href="/chat">
              <Button size="lg" className="bg-solo-gold hover:bg-solo-gold/80 text-solo-black w-full font-medium">
                <Plus className="mr-2 h-5 w-5" />
                AIパートナー
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </ProtectedRoute>
  )
}
