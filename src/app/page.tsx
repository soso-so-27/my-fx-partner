"use client"

import Link from 'next/link'
import { useEffect, useState } from "react"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { tradeService } from "@/lib/trade-service"
import { analysisEngine, AnalysisStats } from "@/lib/analysis-engine"
import { BarChart2, Activity, TrendingUp, Plus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function Home() {
  const { user } = useAuth()
  const [stats, setStats] = useState<AnalysisStats | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return
      const trades = await tradeService.getTrades(user.id)
      const computedStats = analysisEngine.calculateStats(trades)
      setStats(computedStats)
    }
    loadStats()
  }, [user])

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-8 text-solo-black dark:text-solo-white">SOLO ダッシュボード</h1>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  勝率
                </CardTitle>
                <BarChart2 className="h-4 w-4 text-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-numbers text-gold">{stats.winRate}%</div>
                <p className="text-xs text-muted-foreground">
                  過去30トレード
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  プロフィットファクター
                </CardTitle>
                <Activity className="h-4 w-4 text-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-numbers text-gold">{stats.profitFactor}</div>
                <p className="text-xs text-muted-foreground">
                  利益率指標
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  トレード数
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-numbers">{stats.totalTrades}</div>
                <p className="text-xs text-muted-foreground">
                  総取引回数
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/chat">
            <Button size="lg" className="bg-gold hover:bg-gold/80 text-black w-full">
              <Plus className="mr-2 h-5 w-5" />
              トレード記録
            </Button>
          </Link>
          <Link href="/history">
            <Button size="lg" variant="outline" className="w-full">
              履歴を見る
            </Button>
          </Link>
          <Link href="/analysis">
            <Button size="lg" variant="outline" className="w-full">
              分析を見る
            </Button>
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  )
}
