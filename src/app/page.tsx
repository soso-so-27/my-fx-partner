"use client"

import Link from 'next/link'
import { useEffect, useState } from "react"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from "@/lib/utils"
import { tradeService } from "@/lib/trade-service"
import { analysisEngine } from "@/lib/analysis-engine"
import { Activity, TrendingUp, Plus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { insightService } from "@/lib/insight-service"
import { Insight } from "@/types/insight"

export default function Home() {
  const { user } = useAuth()
  const [stats, setStats] = useState<{ winRate: number; profitFactor: number; totalTrades: number } | null>(null)
  const [recentTrade, setRecentTrade] = useState<any>(null)
  const [insights, setInsights] = useState<Insight[]>([])
  const [gmailConnected, setGmailConnected] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      if (!user) return
      const trades = await tradeService.getTrades()

      const last30Days = trades.filter(t => {
        const tradeDate = new Date(t.entryTime)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return tradeDate >= thirtyDaysAgo
      })

      const computedStats = analysisEngine.calculateStats(last30Days)
      setStats({
        winRate: computedStats.winRate,
        profitFactor: computedStats.profitFactor,
        totalTrades: trades.length
      })

      // Get most recent trade
      if (trades.length > 0) {
        setRecentTrade(trades[0])
      }

      // Load recent insights
      const userInsights = await insightService.getInsightsByUser(user.id, 2)
      setInsights(userInsights)

      // Check Gmail connection
      const session = await fetch('/api/auth/session').then(r => r.json())
      setGmailConnected(!!session?.provider)
    }
    loadData()
  }, [user])

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4 pb-24 space-y-4">
        {/* SOLO Branding */}
        <section className="mb-2">
          <h1 className="text-4xl font-bold text-solo-navy dark:text-solo-gold tracking-tight">
            SOLO
          </h1>
        </section>

        {/* Gmail Connection Banner */}
        {!gmailConnected && (
          <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm mb-1">Gmail連携で自動記録</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    約定メールを自動取り込み。手入力不要で記録が残ります。
                  </p>
                  <Link href="/settings">
                    <Button size="sm" variant="outline" className="text-xs h-7">
                      設定する
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics Section */}
        {stats && (
          <section className="grid grid-cols-3 gap-2">
            <Card className="bg-card border-none shadow-sm">
              <CardContent className="p-3">
                <p className="text-[11px] text-muted-foreground mb-1">勝率 (30日)</p>
                <div className="text-2xl font-bold font-numbers text-solo-navy dark:text-solo-white">
                  {stats.winRate}<span className="text-xs text-solo-gold">%</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-none shadow-sm">
              <CardContent className="p-3">
                <p className="text-[11px] text-muted-foreground mb-1">PF</p>
                <div className="text-2xl font-bold font-numbers text-solo-navy dark:text-solo-white">
                  {stats.profitFactor}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-none shadow-sm">
              <CardContent className="p-3">
                <p className="text-[11px] text-muted-foreground mb-1">継続日数</p>
                <div className="text-2xl font-bold font-numbers text-solo-navy dark:text-solo-white">
                  {stats.totalTrades > 0 ? Math.min(stats.totalTrades, 5) : 0}<span className="text-xs text-muted-foreground">日</span>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Recent Trade Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">直近のトレード</h2>
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

        {/* Recent Insights Section */}
        {insights.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">最近の気づき</h2>
              <Link href="/journal">
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  すべて表示
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {insights.slice(0, 2).map((insight) => (
                <Card key={insight.id} className="bg-card border-none shadow-sm">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      {new Date(insight.createdAt).toLocaleDateString('ja-JP')}
                    </p>
                    <p className="text-sm line-clamp-2">{insight.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section className="space-y-2">
          <h2 className="text-base font-bold">クイックアクション</h2>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/chat">
              <Card className="bg-gradient-to-br from-solo-gold/10 to-solo-gold/5 border-solo-gold/20 hover:border-solo-gold/40 transition-colors h-full">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-solo-gold/20 flex items-center justify-center">
                    <Plus className="h-6 w-6 text-solo-gold" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">AIパートナー</div>
                    <div className="text-[11px] text-muted-foreground">思考を整理</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/analysis">
              <Card className="bg-card hover:bg-accent/50 transition-colors h-full">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-solo-gold" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">分析レポート</div>
                    <div className="text-[11px] text-muted-foreground">パフォーマンス確認</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </section>
      </div>
    </ProtectedRoute>
  )
}
