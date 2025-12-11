"use client"

import Link from 'next/link'
import { useEffect, useState, useRef } from "react"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from "@/lib/utils"
import { tradeService } from "@/lib/trade-service"
import { analysisEngine } from "@/lib/analysis-engine"
import { Activity, TrendingUp, Plus, Loader2, Sparkles, AlertTriangle, RefreshCw, Settings } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { insightService } from "@/lib/insight-service"
import { Insight } from "@/types/insight"
import { demoDataService } from "@/lib/demo-data-service"
import { tradeRuleService } from "@/lib/trade-rule-service"
import { useToast } from "@/components/ui/use-toast"
import { SyncButton } from "@/components/ui/sync-button"
import { OnboardingCard } from "@/components/ui/onboarding-card"
import { WeeklyCalendar } from "@/components/ui/weekly-calendar"
import { MonthlyCalendar } from "@/components/ui/monthly-calendar"
import { AIPartnerWidget } from "@/components/dashboard/ai-partner-widget"
import { GoalCard } from "@/components/home/goal-card"
import { Trade } from "@/types/trade"
import { Lightbulb, PenSquare, Share2 } from "lucide-react"
import { startOfDay, startOfWeek, startOfMonth, format } from "date-fns"
import { ja } from "date-fns/locale"
import html2canvas from "html2canvas"

export default function Home() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [stats, setStats] = useState<{ winRate: number; profitFactor: number; totalTrades: number; verifiedRate: number; totalPnl: number; totalPnlPips: number; monthlyPnl: number } | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const [recentTrade, setRecentTrade] = useState<any>(null)
  const [insights, setInsights] = useState<Insight[]>([])
  const [gmailConnected, setGmailConnected] = useState(false)
  const [isLoadingDemo, setIsLoadingDemo] = useState(false)
  const [hasRules, setHasRules] = useState<boolean | null>(null)
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month')
  const [pnlUnit, setPnlUnit] = useState<'pips' | 'amount'>('pips')
  const [isCapturing, setIsCapturing] = useState(false)
  const dashboardRef = useRef<HTMLDivElement>(null)

  const handleCaptureDashboard = async () => {
    if (!dashboardRef.current) return

    setIsCapturing(true)
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        backgroundColor: null,
        scale: 2, // Higher resolution
        logging: false,
      })

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        const periodLabel = period === 'today' ? '今日' : period === 'week' ? '今週' : '今月'
        link.download = `SOLO_${periodLabel}_${format(new Date(), 'yyyyMMdd')}.png`
        link.click()
        URL.revokeObjectURL(url)

        toast({
          title: "画像を保存しました！",
          description: "SNSでシェアしてみましょう 📲",
        })
      }, 'image/png')
    } catch (error) {
      console.error('Capture failed:', error)
      toast({
        title: "キャプチャに失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsCapturing(false)
    }
  }

  const loadData = async () => {
    if (!user) return
    const allTrades = await tradeService.getTrades(user.id)

    // Filter by period
    const now = new Date()
    let periodStart: Date
    if (period === 'today') {
      periodStart = startOfDay(now)
    } else if (period === 'week') {
      periodStart = startOfWeek(now, { weekStartsOn: 1 })
    } else {
      periodStart = startOfMonth(now)
    }

    const periodTrades = allTrades.filter(t => new Date(t.entryTime) >= periodStart)

    // Calculate Monthly PnL for Goal Tracking
    const monthStart = startOfMonth(now)
    const monthlyTrades = allTrades.filter(t => new Date(t.entryTime) >= monthStart)
    const monthlyStats = analysisEngine.calculateStats(monthlyTrades)

    const computedStats = analysisEngine.calculateStats(periodTrades)
    setStats({
      winRate: computedStats.winRate,
      profitFactor: computedStats.profitFactor,
      totalTrades: periodTrades.length,
      verifiedRate: computedStats.verifiedRate,
      totalPnl: computedStats.totalPnl,
      totalPnlPips: computedStats.totalPnlPips,
      monthlyPnl: monthlyStats.totalPnl
    })
    setTrades(allTrades)

    // Get most recent trade
    if (allTrades.length > 0) {
      setRecentTrade(allTrades[0])
    }

    // Load recent insights
    const userInsights = await insightService.getInsightsByUser(user.id, 2)
    setInsights(userInsights)

    // Check Gmail connection
    const session = await fetch('/api/auth/session').then(r => r.json())
    setGmailConnected(!!session?.provider)

    // Check rules
    const rules = await tradeRuleService.getRules(user.id)
    setHasRules(rules.length > 0)
  }

  useEffect(() => {
    loadData()
  }, [user, period])

  const handleLoadDemoData = async () => {
    if (!user) return
    setIsLoadingDemo(true)
    try {
      const demoTrades = demoDataService.getDemoTrades(user.id)
      const demoInsights = demoDataService.getDemoInsights(user.id)
      const demoRules = demoDataService.getDemoRules(user.id)

      // Insert trades
      for (const trade of demoTrades) {
        await tradeService.createTrade({
          pair: trade.pair,
          direction: trade.direction,
          entryPrice: trade.entryPrice,
          exitPrice: trade.exitPrice,
          stopLoss: trade.stopLoss,
          takeProfit: trade.takeProfit,
          entryTime: trade.entryTime,
          exitTime: trade.exitTime,
          timezone: trade.timezone,
          lotSize: trade.lotSize,
          pnl: trade.pnl,
          pnlSource: trade.pnlSource,
          notes: trade.notes,
          tags: trade.tags,
          isVerified: trade.isVerified
        }, user.id)
      }

      // Insert insights
      for (const insight of demoInsights) {
        await insightService.createInsight({
          content: insight.content,
          mode: insight.mode,
          userNote: insight.userNote,
          tags: insight.tags
        }, user.id)
      }

      // Insert rules
      for (const rule of demoRules) {
        await tradeRuleService.createRule({
          title: rule.title,
          category: rule.category,
          description: rule.description,
          isActive: rule.isActive
        }, user.id)
      }

      toast({
        title: "デモデータを読み込みました",
        description: "アプリの使用感を体験してください。",
      })

      await loadData()
    } catch (error) {
      console.error("Failed to load demo data", error)
      toast({
        title: "エラーが発生しました",
        description: "デモデータの読み込みに失敗しました。",
        variant: "destructive"
      })
    } finally {
      setIsLoadingDemo(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4 pb-24 space-y-6">
        {/* iOS Navigation Bar: 44pt height + safe area */}
        <header className="sticky top-0 z-50 -mx-4 px-4 h-11 pt-[env(safe-area-inset-top)] bg-background border-b border-border/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-solo-navy flex items-center justify-center">
              <span className="text-solo-gold font-bold text-[10px]">S</span>
            </div>
            <h1 className="text-base font-bold text-solo-navy dark:text-solo-gold">
              SOLO
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <SyncButton variant="compact" onSyncComplete={loadData} />
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground rounded-full">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Mental Axis: AI Partner - Driver Focus */}
        <section>
          <AIPartnerWidget
            userName={user?.user_metadata?.name || user?.email?.split('@')[0]}
            winRate={stats?.winRate}
            verifiedRate={stats?.verifiedRate}
          />
        </section>

        {/* Onboarding for new users */}
        <OnboardingCard />

        {/* Performance Axis: Stats & Trades - Vehicle Focus */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Performance Board
            </h2>
            <div className="h-[1px] bg-border flex-1"></div>
          </div>

          {/* Goal Tracking */}
          {stats && (
            <GoalCard currentProfit={stats.monthlyPnl} />
          )}

          {/* Main Dashboard - P&L Focus */}
          {stats && (
            <div className="space-y-4">
              {/* Capture target area */}
              <div ref={dashboardRef} className="space-y-4 bg-background p-4 -m-4 rounded-lg">
                {/* Unified Dashboard Card - Clean Minimal Design */}
                <Card className="bg-card shadow-md rounded-xl overflow-hidden">
                  <CardContent className="p-0">
                    {/* Period selector header */}
                    <div className="flex justify-center gap-1 p-4 pb-3">
                      <Button
                        variant={period === 'today' ? 'default' : 'ghost'}
                        size="sm"
                        className="h-7 text-xs px-3"
                        onClick={() => setPeriod('today')}
                      >
                        今日
                      </Button>
                      <Button
                        variant={period === 'week' ? 'default' : 'ghost'}
                        size="sm"
                        className="h-7 text-xs px-3"
                        onClick={() => setPeriod('week')}
                      >
                        今週
                      </Button>
                      <Button
                        variant={period === 'month' ? 'default' : 'ghost'}
                        size="sm"
                        className="h-7 text-xs px-3"
                        onClick={() => setPeriod('month')}
                      >
                        今月
                      </Button>
                    </div>

                    {/* Main P&L - tap to toggle pips/amount */}
                    <div
                      className="text-center px-4 cursor-pointer"
                      onClick={() => setPnlUnit(pnlUnit === 'pips' ? 'amount' : 'pips')}
                    >
                      <p className="text-sm text-muted-foreground mb-1">
                        {period === 'today' ? '今日' : period === 'week' ? '今週' : '今月'}の損益
                      </p>
                      <p className={cn(
                        "text-4xl font-bold font-numbers",
                        (pnlUnit === 'pips' ? stats.totalPnlPips : stats.totalPnl) >= 0 ? "text-profit" : "text-loss"
                      )}>
                        {(pnlUnit === 'pips' ? stats.totalPnlPips : stats.totalPnl) >= 0 ? '+' : ''}
                        {(pnlUnit === 'pips' ? stats.totalPnlPips : stats.totalPnl).toLocaleString()}
                        <span className="text-lg ml-1">{pnlUnit === 'pips' ? 'pips' : '円'}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        タップで {pnlUnit === 'pips' ? '金額' : 'pips'}表示
                      </p>
                    </div>

                    {/* Sub stats */}
                    <div className="grid grid-cols-3 gap-2 mt-4 mx-4 pt-3 border-t border-border/30">
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground uppercase">勝率</p>
                        <p className={cn(
                          "text-lg font-bold font-numbers",
                          stats.winRate >= 50 ? "text-profit" : "text-loss"
                        )}>{stats.winRate}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground uppercase">PF</p>
                        <p className={cn(
                          "text-lg font-bold font-numbers",
                          stats.profitFactor >= 1 ? "text-profit" : "text-loss"
                        )}>{stats.profitFactor}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-green-600 dark:text-green-400 uppercase flex items-center justify-center gap-1">
                          Real
                        </p>
                        <p className="text-lg font-bold font-numbers text-green-600 dark:text-green-400">{stats.verifiedRate}%</p>
                      </div>
                    </div>

                    {/* Weekly Calendar - Always Visible for Context */}
                    <div className="mt-4 px-4 pt-4 border-t border-border/30">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Weekly Flow</h3>
                        {period !== 'week' && (
                          <span className="text-[10px] text-muted-foreground">
                            {/* Optional: Show week total PnL here if logic permits, but keep simple for now */}
                          </span>
                        )}
                      </div>
                      <WeeklyCalendar trades={trades} />
                    </div>

                    {/* Monthly Calendar - Only for Month View */}
                    {period === 'month' && (
                      <div className="mt-4 pt-4 px-4 pb-4 border-t border-border bg-muted/30">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Calendar</h3>
                          <div className="flex bg-background/50 rounded-lg p-0.5 border border-border/50">
                            <button
                              onClick={() => setPnlUnit('pips')}
                              className={cn(
                                "px-2 py-0.5 text-[10px] rounded-md transition-all",
                                pnlUnit === 'pips' ? "bg-background shadow-sm text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              pips
                            </button>
                            <button
                              onClick={() => setPnlUnit('amount')}
                              className={cn(
                                "px-2 py-0.5 text-[10px] rounded-md transition-all",
                                pnlUnit === 'amount' ? "bg-background shadow-sm text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <span>¥</span>
                            </button>
                          </div>
                        </div>
                        <MonthlyCalendar trades={trades} unit={pnlUnit} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Share button - outside capture area */}
              <Button
                className="w-full bg-solo-gold hover:bg-solo-gold/90 text-white"
                onClick={handleCaptureDashboard}
                disabled={isCapturing}
              >
                {isCapturing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="mr-2 h-4 w-4" />
                )}
                {isCapturing ? '保存中...' : '保存してシェア'}
              </Button>
            </div>
          )}
        </section>

        {/* Recent Trade Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">直近のトレード</h2>
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
                    {recentTrade.pnl?.pips != null ? (
                      <span className={cn(
                        "font-bold font-numbers text-lg",
                        recentTrade.pnl.pips > 0 ? "text-profit" : "text-loss"
                      )}>
                        {recentTrade.pnl.pips > 0 ? "+" : ""}{recentTrade.pnl.pips} pips
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
            <Card className="border-dashed border-2 bg-muted/30">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="h-12 w-12 rounded-full bg-solo-gold/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-solo-gold" />
                </div>
                <div>
                  <h3 className="font-bold text-solo-navy dark:text-solo-white mb-1">
                    まずは使ってみましょう
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                    デモデータを読み込んで、SOLOの分析機能やAIパートナーを体験できます。
                  </p>
                </div>
                <Button
                  onClick={handleLoadDemoData}
                  disabled={isLoadingDemo}
                  className="bg-solo-gold hover:bg-solo-gold/90 text-white"
                >
                  {isLoadingDemo ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      読み込み中...
                    </>
                  ) : (
                    "デモデータを読み込む"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Recent Insights Section */}
        {insights.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">最近の気づき</h2>
              <Link href="/journal">
                <Button variant="ghost" size="sm" className="text-sm h-9">
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


      </div>
    </ProtectedRoute>
  )
}
