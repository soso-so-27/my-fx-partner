"use client"

import Link from 'next/link'
import { useEffect, useState, useRef } from "react"
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from "@/lib/utils"
import { tradeService } from "@/lib/trade-service"
import { analysisEngine } from "@/lib/analysis-engine"
import { Loader2, Settings, Share2, TrendingUp, TrendingDown, Target, PlusCircle, Trash2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { demoDataService } from "@/lib/demo-data-service"
import { tradeRuleService } from "@/lib/trade-rule-service"
import { useToast } from "@/components/ui/use-toast"
import { SyncButton } from "@/components/ui/sync-button"
import { MonthlyCalendar } from "@/components/ui/monthly-calendar"
import { GoalCard } from "@/components/home/goal-card"
import { QuickRecordDialog } from "@/components/trade/quick-record-dialog"
import { Trade } from "@/types/trade"
import { startOfMonth, format, isSameDay } from "date-fns"
import { ja } from "date-fns/locale"
import html2canvas from "html2canvas"
import { insightService } from "@/lib/insight-service"

export default function Home() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [trades, setTrades] = useState<Trade[]>([])
  const [monthlyStats, setMonthlyStats] = useState<{
    winRate: number;
    totalTrades: number;
    totalPnlPips: number;
    totalPnl: number;
    wins: number;
    losses: number;
  } | null>(null)
  const [isLoadingDemo, setIsLoadingDemo] = useState(false)
  const [pnlUnit, setPnlUnit] = useState<'pips' | 'amount'>('pips')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDayTrades, setSelectedDayTrades] = useState<Trade[]>([])
  const [isCapturing, setIsCapturing] = useState(false)
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  const loadData = async () => {
    if (!session?.user?.email) return
    const allTrades = await tradeService.getTrades(session.user.email)
    setTrades(allTrades)

    // Calculate Monthly Stats
    const monthStart = startOfMonth(currentMonth)
    const monthlyTrades = allTrades.filter(t => {
      const tradeDate = new Date(t.entryTime)
      return tradeDate >= monthStart &&
        tradeDate.getMonth() === currentMonth.getMonth() &&
        tradeDate.getFullYear() === currentMonth.getFullYear()
    })

    const stats = analysisEngine.calculateStats(monthlyTrades)
    const wins = monthlyTrades.filter(t => (t.pnl?.pips ?? 0) > 0).length
    const losses = monthlyTrades.filter(t => (t.pnl?.pips ?? 0) < 0).length

    setMonthlyStats({
      winRate: stats.winRate,
      totalTrades: monthlyTrades.length,
      totalPnlPips: stats.totalPnlPips,
      totalPnl: stats.totalPnl,
      wins,
      losses
    })
  }

  useEffect(() => {
    loadData()
  }, [session, currentMonth])

  const handleDayClick = (date: Date, dayTrades: Trade[]) => {
    setSelectedDate(date)
    setSelectedDayTrades(dayTrades)
  }

  const handleCapture = async () => {
    if (!calendarRef.current) return
    setIsCapturing(true)
    try {
      const canvas = await html2canvas(calendarRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
      })
      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `SOLO_${format(currentMonth, 'yyyyMM')}.png`
        link.click()
        URL.revokeObjectURL(url)
        toast({
          title: "画像を保存しました！",
          description: "SNSでシェアしてみましょう 📲",
        })
      }, 'image/png')
    } catch {
      toast({ title: "キャプチャに失敗しました", variant: "destructive" })
    } finally {
      setIsCapturing(false)
    }
  }

  const handleLoadDemoData = async () => {
    const userId = session?.user?.email
    console.log('handleLoadDemoData called, userId:', userId)
    if (!userId) {
      console.log('No user, returning early')
      toast({
        title: "ログインが必要です",
        description: "デモデータを読み込むにはログインしてください。",
        variant: "destructive"
      })
      return
    }
    setIsLoadingDemo(true)
    console.log('Loading demo data for user:', userId)
    try {
      const demoTrades = demoDataService.getDemoTrades(userId)
      console.log('Generated demo trades:', demoTrades.length)
      const demoInsights = demoDataService.getDemoInsights(userId)
      const demoRules = demoDataService.getDemoRules(userId)

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
        }, userId)
      }

      for (const insight of demoInsights) {
        await insightService.createInsight({
          content: insight.content,
          mode: insight.mode,
          userNote: insight.userNote,
          tags: insight.tags
        }, userId)
      }

      for (const rule of demoRules) {
        await tradeRuleService.createRule({
          title: rule.title,
          category: rule.category,
          description: rule.description,
          isActive: rule.isActive
        }, userId)
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

  // Clear demo data (delete all trades for the user)
  const handleClearDemoData = async () => {
    if (!session?.user?.email) return
    if (!confirm("すべてのトレードデータを削除しますか？この操作は取り消せません。")) return

    setIsLoadingDemo(true)
    try {
      // Delete all trades
      for (const trade of trades) {
        await tradeService.deleteTrade(trade.id)
      }

      toast({
        title: "データを削除しました",
        description: "すべてのトレードが削除されました。",
      })
      await loadData()
    } catch (error) {
      console.error("Failed to clear demo data", error)
      toast({
        title: "エラー",
        description: "データの削除に失敗しました。",
        variant: "destructive"
      })
    } finally {
      setIsLoadingDemo(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4 pb-24 space-y-4">
        {/* Header */}
        <header className="sticky top-0 z-50 -mx-4 px-4 pt-[env(safe-area-inset-top)] pb-2 bg-background border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-solo-navy flex items-center justify-center">
              <span className="text-solo-gold font-bold text-[10px]">S</span>
            </div>
            <h1 className="text-base font-bold text-solo-navy dark:text-solo-gold">
              SOLO
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <SyncButton variant="compact" onSyncComplete={loadData} />
            {trades.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-destructive rounded-lg"
                onClick={handleClearDemoData}
                disabled={isLoadingDemo}
                title="データを削除"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground rounded-lg">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Main Calendar Section */}
        <section ref={calendarRef} className="space-y-4">
          {/* Compact Stats Bar */}
          {monthlyStats && (
            <Card className="bg-card/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  {/* Main P&L */}
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setPnlUnit(pnlUnit === 'pips' ? 'amount' : 'pips')}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center",
                      (pnlUnit === 'pips' ? monthlyStats.totalPnlPips : monthlyStats.totalPnl) >= 0
                        ? "bg-green-500/20"
                        : "bg-red-500/20"
                    )}>
                      {(pnlUnit === 'pips' ? monthlyStats.totalPnlPips : monthlyStats.totalPnl) >= 0
                        ? <TrendingUp className="h-4 w-4 text-green-600" />
                        : <TrendingDown className="h-4 w-4 text-red-600" />
                      }
                    </div>
                    <div>
                      <p className={cn(
                        "text-lg font-bold font-numbers leading-none",
                        (pnlUnit === 'pips' ? monthlyStats.totalPnlPips : monthlyStats.totalPnl) >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      )}>
                        {(pnlUnit === 'pips' ? monthlyStats.totalPnlPips : monthlyStats.totalPnl) >= 0 ? '+' : ''}
                        {pnlUnit === 'amount' ? '¥' : ''}
                        {(pnlUnit === 'pips' ? monthlyStats.totalPnlPips : monthlyStats.totalPnl).toLocaleString()}
                        <span className="text-xs ml-0.5">{pnlUnit === 'pips' ? 'pips' : ''}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">タップで切替</p>
                    </div>
                  </div>

                  {/* Win/Loss Count */}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="text-center">
                      <p className="text-green-600 dark:text-green-400 font-bold font-numbers">{monthlyStats.wins}</p>
                      <p className="text-[9px] text-muted-foreground">勝</p>
                    </div>
                    <div className="text-center">
                      <p className="text-red-600 dark:text-red-400 font-bold font-numbers">{monthlyStats.losses}</p>
                      <p className="text-[9px] text-muted-foreground">敗</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold font-numbers">{monthlyStats.winRate}%</p>
                      <p className="text-[9px] text-muted-foreground">勝率</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Calendar */}
          <Card>
            <CardContent className="p-4">
              <MonthlyCalendar
                trades={trades}
                unit={pnlUnit}
                showNavigation={true}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                selectedDate={selectedDate}
                onDayClick={handleDayClick}
              />
            </CardContent>
          </Card>

          {/* Selected Day Detail */}
          {selectedDate && (
            <Card className="border-l-4 border-l-solo-gold">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">
                    {format(selectedDate, 'M月d日 (E)', { locale: ja })}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => setSelectedDate(null)}
                  >
                    閉じる
                  </Button>
                </div>

                {selectedDayTrades.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDayTrades.map((trade, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{trade.pair}</span>
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded",
                            trade.direction === 'BUY'
                              ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                          )}>
                            {trade.direction}
                          </span>
                        </div>
                        <span className={cn(
                          "font-bold font-numbers",
                          (trade.pnl?.pips ?? 0) > 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {(trade.pnl?.pips ?? 0) > 0 ? '+' : ''}{trade.pnl?.pips ?? 0} pips
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4 gap-3">
                    <p className="text-sm text-muted-foreground text-center">
                      この日のトレードはありません
                    </p>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setIsRecordDialogOpen(true)}>
                      <PlusCircle className="h-4 w-4" />
                      トレードを登録
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Share Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="text-muted-foreground"
              onClick={handleCapture}
              disabled={isCapturing}
            >
              {isCapturing ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Share2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              {isCapturing ? '保存中' : 'シェア'}
            </Button>
          </div>
        </section>

        {/* Goal Card - At Bottom */}
        {monthlyStats && (
          <section>
            <GoalCard currentProfit={monthlyStats.totalPnl} />
          </section>
        )}

        {/* Empty State - Demo Data */}
        {trades.length === 0 && (
          <Card className="border-dashed border-2 bg-muted/30">
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="h-12 w-12 rounded-full bg-solo-gold/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-solo-gold" />
              </div>
              <div>
                <h3 className="font-bold text-solo-navy dark:text-solo-white mb-1">
                  まずは使ってみましょう
                </h3>
                <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                  デモデータを読み込んで、SOLOの分析機能を体験できます。
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleLoadDemoData}
                disabled={isLoadingDemo}
                className="bg-solo-gold hover:bg-solo-gold/90 text-white"
              >
                {isLoadingDemo ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    読み込み中
                  </>
                ) : (
                  "デモを試す"
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Record Dialog */}
      <QuickRecordDialog
        open={isRecordDialogOpen}
        onOpenChange={setIsRecordDialogOpen}
        onSuccess={() => {
          loadData()
          toast({
            title: "トレードを記録しました",
            description: "カレンダーに反映されました。"
          })
        }}
      />
    </ProtectedRoute>
  )
}
