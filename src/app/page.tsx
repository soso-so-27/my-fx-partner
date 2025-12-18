"use client"

import Link from 'next/link'
import { useEffect, useState, useRef } from "react"
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { tradeService } from "@/lib/trade-service"
import { analysisEngine } from "@/lib/analysis-engine"
import { Loader2, Settings, Share2, TrendingUp, TrendingDown, Target, PlusCircle, Trash2, Plus, X, FileText, Link2, Camera, Edit3, Image, Clock, CheckCircle2, Calendar, Shield, AlertTriangle } from "lucide-react"
import { useSession } from "next-auth/react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { demoDataService } from "@/lib/demo-data-service"
import { tradeRuleService } from "@/lib/trade-rule-service"
import { useToast } from "@/components/ui/use-toast"
import { SyncButton } from "@/components/ui/sync-button"
import { MonthlyCalendar } from "@/components/ui/monthly-calendar"
import { WeeklyCalendar } from "@/components/ui/weekly-calendar"
import { QuickRecordDialog } from "@/components/trade/quick-record-dialog"
import { Trade } from "@/types/trade"
import { startOfMonth, startOfWeek, endOfWeek, format, isSameDay } from "date-fns"
import { ja } from "date-fns/locale"
import html2canvas from "html2canvas"
import { insightService } from "@/lib/insight-service"
import { RelatedKnowledge } from "@/components/trade/related-knowledge"
import { Badge } from "@/components/ui/badge"

// 30秒振り返りの質問選択肢
const MISTAKE_OPTIONS = [
  { id: 'late_stoploss', label: '損切り遅れ' },
  { id: 'chasing', label: '追いかけエントリー' },
  { id: 'overtrading', label: '無駄なエントリー' },
  { id: 'ignored_rule', label: 'ルール無視' },
  { id: 'none', label: 'なし' },
]

const TOMORROW_OPTIONS = [
  { id: 'no_chasing', label: '追いかけない' },
  { id: 'follow_stoploss', label: '損切りを守る' },
  { id: 'check_calendar', label: '指標を確認' },
  { id: 'less_trades', label: 'トレード数を減らす' },
  { id: 'keep_going', label: 'このまま継続' },
]

// Economic event type
interface EconomicEvent {
  id: string
  date: string
  time: string
  currency: string
  name: string
  importance: number
  actual?: string
  forecast?: string
  previous?: string
}

export default function Home() {
  const router = useRouter()
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
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [calendarView, setCalendarView] = useState<'week' | 'month'>('week')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDayTrades, setSelectedDayTrades] = useState<Trade[]>([])
  const [dayDetailTab, setDayDetailTab] = useState<'market' | 'plan' | 'review'>('plan')
  const [isCapturing, setIsCapturing] = useState(false)
  const [isRecordDialogOpen, setIsRecordDialogOpen] = useState(false)
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
  const [isFabOpen, setIsFabOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quickAddData, setQuickAddData] = useState({
    memo: '',
    url: '',
    imageUrl: '',
    linkedTradeId: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [todayTrades, setTodayTrades] = useState<Trade[]>([])
  const [selectedMistake, setSelectedMistake] = useState<string | null>(null)
  const [selectedTomorrow, setSelectedTomorrow] = useState<string | null>(null)
  const [reflectionSaved, setReflectionSaved] = useState(false)
  const [economicEvents, setEconomicEvents] = useState<EconomicEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)

  const loadData = async () => {
    if (!session?.user?.email) return
    const allTrades = await tradeService.getTrades(session.user.email)
    setTrades(allTrades)

    // Calculate Stats based on calendarView
    let periodTrades: Trade[] = []

    if (calendarView === 'week') {
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })
      periodTrades = allTrades.filter(t => {
        const tradeDate = new Date(t.entryTime)
        return tradeDate >= weekStart && tradeDate <= weekEnd
      })
    } else {
      const monthStart = startOfMonth(currentMonth)
      periodTrades = allTrades.filter(t => {
        const tradeDate = new Date(t.entryTime)
        return tradeDate >= monthStart &&
          tradeDate.getMonth() === currentMonth.getMonth() &&
          tradeDate.getFullYear() === currentMonth.getFullYear()
      })
    }

    const stats = analysisEngine.calculateStats(periodTrades)
    const wins = periodTrades.filter(t => (t.pnl?.pips ?? 0) > 0).length
    const losses = periodTrades.filter(t => (t.pnl?.pips ?? 0) < 0).length

    setMonthlyStats({
      winRate: stats.winRate,
      totalTrades: periodTrades.length,
      totalPnlPips: stats.totalPnlPips,
      totalPnl: stats.totalPnl,
      wins,
      losses
    })

    // Get today's trades for quick add linking
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
    const todayTradesFiltered = allTrades.filter(t => {
      const tradeDate = new Date(t.entryTime)
      return tradeDate >= todayStart && tradeDate < todayEnd
    })
    setTodayTrades(todayTradesFiltered)

    // Fetch economic events
    setEventsLoading(true)
    try {
      const eventsRes = await fetch('/api/events')
      if (eventsRes.ok) {
        const data = await eventsRes.json()
        setEconomicEvents(data.events || [])
      }
    } catch (error) {
      console.error('Failed to fetch economic events:', error)
    } finally {
      setEventsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [session, currentMonth, currentWeek, calendarView])

  const handleDayClick = (date: Date, dayTrades: Trade[]) => {
    // Update inline content instead of navigating
    setSelectedDate(date)
    setSelectedDayTrades(dayTrades)
    // Reset reflection state for new day
    setSelectedMistake(null)
    setSelectedTomorrow(null)
    setReflectionSaved(false)
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

      // Note: Insights and Rules creation skipped for now
      // (requires API route updates to bypass RLS)

      toast({
        title: "デモデータを読み込みました",
        description: "サンプルトレードがカレンダーに表示されます。",
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

      // Clear trades state immediately
      setTrades([])
      setMonthlyStats(null)
      setSelectedDate(null)
      setSelectedDayTrades([])

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
      <div className="container mx-auto px-3 pb-20 space-y-2">
        {/* Header */}
        <header className="sticky top-0 z-50 -mx-3 px-3 pt-[env(safe-area-inset-top)] pb-1.5 bg-background border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-solo-navy flex items-center justify-center">
              <span className="text-solo-gold font-bold text-[10px]">S</span>
            </div>
            <h1 className="text-base font-bold text-solo-navy dark:text-solo-gold">
              SOLO
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground rounded-lg">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Main Calendar Section */}
        <section ref={calendarRef} className="space-y-2">
          {/* Compact Stats Bar */}
          {monthlyStats && (
            <div className="flex items-center justify-between px-1">
              {/* Main P&L */}
              <div
                className="flex items-center gap-1.5 cursor-pointer"
                onClick={() => setPnlUnit(pnlUnit === 'pips' ? 'amount' : 'pips')}
              >
                <div className={cn(
                  "h-5 w-5 rounded-full flex items-center justify-center",
                  (pnlUnit === 'pips' ? monthlyStats.totalPnlPips : monthlyStats.totalPnl) >= 0
                    ? "bg-green-500/20"
                    : "bg-red-500/20"
                )}>
                  {(pnlUnit === 'pips' ? monthlyStats.totalPnlPips : monthlyStats.totalPnl) >= 0
                    ? <TrendingUp className="h-2.5 w-2.5 text-green-600" />
                    : <TrendingDown className="h-2.5 w-2.5 text-red-600" />
                  }
                </div>
                <span className={cn(
                  "text-sm font-bold font-numbers",
                  (pnlUnit === 'pips' ? monthlyStats.totalPnlPips : monthlyStats.totalPnl) >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                )}>
                  {(pnlUnit === 'pips' ? monthlyStats.totalPnlPips : monthlyStats.totalPnl) >= 0 ? '+' : ''}
                  {pnlUnit === 'amount' ? '¥' : ''}
                  {(pnlUnit === 'pips' ? monthlyStats.totalPnlPips : monthlyStats.totalPnl).toLocaleString()}
                  <span className="text-[10px] ml-0.5">{pnlUnit === 'pips' ? 'pips' : ''}</span>
                </span>
              </div>

              {/* Win/Loss Count */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-600 dark:text-green-400 font-bold font-numbers">{monthlyStats.wins}W</span>
                <span className="text-red-600 dark:text-red-400 font-bold font-numbers">{monthlyStats.losses}L</span>
                <span className="font-bold font-numbers">{monthlyStats.winRate}%</span>
              </div>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex rounded-lg bg-muted p-0.5">
              <Button
                variant={calendarView === 'week' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setCalendarView('week')}
              >
                週
              </Button>
              <Button
                variant={calendarView === 'month' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setCalendarView('month')}
              >
                月
              </Button>
            </div>
          </div>

          {/* Calendar */}
          <Card>
            <CardContent className="p-2">
              {calendarView === 'week' ? (
                <WeeklyCalendar
                  trades={trades}
                  unit={pnlUnit}
                  showNavigation={true}
                  currentWeek={currentWeek}
                  onWeekChange={setCurrentWeek}
                  selectedDate={selectedDate}
                  onDayClick={handleDayClick}
                />
              ) : (
                <MonthlyCalendar
                  trades={trades}
                  unit={pnlUnit}
                  showNavigation={true}
                  currentMonth={currentMonth}
                  onMonthChange={setCurrentMonth}
                  selectedDate={selectedDate}
                  onDayClick={handleDayClick}
                />
              )}
            </CardContent>
          </Card>
        </section>

        {/* Day Detail Section */}
        <section className="space-y-3">
          {/* Day Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">
              {selectedDate
                ? format(selectedDate, 'M月d日 (E)', { locale: ja })
                : format(new Date(), 'M月d日 (E)', { locale: ja }) + ' - 今日'
              }
            </h3>
            {selectedDate && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground"
                onClick={() => {
                  setSelectedDate(null)
                  setSelectedDayTrades([])
                }}
              >
                今日に戻る
              </Button>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={dayDetailTab} onValueChange={(v) => setDayDetailTab(v as 'market' | 'plan' | 'review')}>
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="market" className="text-xs">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                相場環境
              </TabsTrigger>
              <TabsTrigger value="plan" className="text-xs">
                <Target className="h-3.5 w-3.5 mr-1" />
                プラン
              </TabsTrigger>
              <TabsTrigger value="review" className="text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                振り返り
              </TabsTrigger>
            </TabsList>

            {/* Market Tab - Economic Events Only */}
            <TabsContent value="market" className="space-y-3 mt-3">
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs font-medium mb-2 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    今週の重要指標（★4以上）
                  </p>
                  {(() => {
                    const targetDateStr = selectedDate ? format(selectedDate, 'M/d') : ''
                    const filteredEvents = economicEvents.filter(e => e.date === targetDateStr)

                    if (eventsLoading) {
                      return (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          経済指標を読み込み中...
                        </p>
                      )
                    }

                    if (filteredEvents.length === 0) {
                      return (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          この日の重要指標はありません
                        </p>
                      )
                    }

                    return (
                      <div className="space-y-1.5">
                        {filteredEvents.map((event: EconomicEvent, i: number) => (
                          <div
                            key={event.id || i}
                            className="flex items-center justify-between text-xs py-1.5 border-t border-border/50 first:border-0"
                          >
                            <div className="flex items-center gap-2">
                              <div className="text-center min-w-[40px]">
                                <span className="text-muted-foreground">{event.time}</span>
                              </div>
                              <Badge variant="outline" className="text-[9px] px-1">
                                {event.currency}
                              </Badge>
                              <span className="truncate max-w-[150px]">{event.name}</span>
                            </div>
                            <span className="text-yellow-500 text-[10px]">
                              {'★'.repeat(Math.min(event.importance, 5))}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Plan Tab */}
            <TabsContent value="plan" className="space-y-3 mt-3">
              {/* Weekly Strategy Summary */}
              <Card className="border-primary/20">
                <CardContent className="p-3 space-y-3">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Target className="h-3.5 w-3.5" />
                    今週の作戦
                  </div>

                  <div className="p-2 bg-primary/5 rounded text-xs">
                    今週は「守る週」：待つ練習
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs p-1.5 bg-muted/50 rounded">
                      <Target className="h-3 w-3 text-muted-foreground" />
                      新規上限：5回
                    </div>
                    <div className="flex items-center gap-2 text-xs p-1.5 bg-muted/50 rounded">
                      <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                      損失上限：-5,000円
                    </div>
                    <div className="flex items-center gap-2 text-xs p-1.5 bg-red-500/10 rounded text-red-600 dark:text-red-400">
                      <Shield className="h-3 w-3" />
                      2連敗で停止
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => window.location.href = '/today'}
                  >
                    戦略を編集
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Review Tab - Trades and Reflection */}
            <TabsContent value="review" className="space-y-3 mt-3">
              {/* Day Summary */}
              {(() => {
                const displayTrades = selectedDate ? selectedDayTrades : todayTrades
                const totalPips = displayTrades.reduce((sum, t) => sum + (t.pnl?.pips ?? 0), 0)

                return displayTrades.length > 0 ? (
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          totalPips >= 0 ? "bg-green-500/10" : "bg-red-500/10"
                        )}>
                          {totalPips >= 0
                            ? <TrendingUp className="h-4 w-4 text-green-600" />
                            : <TrendingDown className="h-4 w-4 text-red-600" />
                          }
                        </div>
                        <div>
                          <p className={cn(
                            "text-lg font-bold font-numbers",
                            totalPips >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {totalPips >= 0 ? '+' : ''}{totalPips} pips
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {displayTrades.length}件のトレード
                          </p>
                        </div>
                      </div>

                      {/* Trade List */}
                      <div className="space-y-1">
                        {displayTrades.map((trade, i) => (
                          <div
                            key={trade.id || i}
                            className="flex items-center justify-between py-1 border-t border-border/50"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">{trade.pair}</span>
                              <span className={cn(
                                "text-[10px] px-1 py-0.5 rounded",
                                trade.direction === 'BUY'
                                  ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                  : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                              )}>
                                {trade.direction}
                              </span>
                            </div>
                            <span className={cn(
                              "text-xs font-bold font-numbers",
                              (trade.pnl?.pips ?? 0) >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {(trade.pnl?.pips ?? 0) >= 0 ? '+' : ''}{trade.pnl?.pips ?? 0} pips
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">
                        この日のトレードはありません
                      </p>
                    </CardContent>
                  </Card>
                )
              })()}

              {/* 30-Second Reflection */}
              <Card className="border-primary/20">
                <CardContent className="p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      30秒振り返り
                    </div>
                    {reflectionSaved && (
                      <Badge variant="secondary" className="text-[10px]">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                        保存済み
                      </Badge>
                    )}
                  </div>

                  {/* Q1 */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">一番のミスは？</p>
                    <div className="flex flex-wrap gap-1.5">
                      {MISTAKE_OPTIONS.map(opt => (
                        <Button
                          key={opt.id}
                          variant={selectedMistake === opt.id ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-[11px] px-2"
                          onClick={() => setSelectedMistake(opt.id)}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Q2 */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">明日の意識は？</p>
                    <div className="flex flex-wrap gap-1.5">
                      {TOMORROW_OPTIONS.map(opt => (
                        <Button
                          key={opt.id}
                          variant={selectedTomorrow === opt.id ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-[11px] px-2"
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
                      className="w-full h-8 text-xs"
                      size="sm"
                      onClick={() => setReflectionSaved(true)}
                    >
                      振り返りを保存
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

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

      {/* Trade Detail Dialog */}
      <Dialog open={!!selectedTrade} onOpenChange={(open) => !open && setSelectedTrade(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              トレード詳細
              {/* Email Badge */}
              {(selectedTrade?.verificationSource === 'email_forward' ||
                selectedTrade?.verificationSource === 'gmail_import' ||
                selectedTrade?.verificationSource === 'gmail_import_ai' ||
                selectedTrade?.tags?.includes('Forwarded')) && (
                  <span className="text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                    📧 Email
                  </span>
                )}
              {/* Real Badge */}
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
                    (selectedTrade.pnl?.pips ?? 0) > 0 ? "text-green-600" : (selectedTrade.pnl?.pips ?? 0) < 0 ? "text-red-600" : "text-muted-foreground"
                  )}>
                    {(selectedTrade.pnl?.pips ?? 0) > 0 ? '+' : ''}{selectedTrade.pnl?.pips ?? 0} pips
                    {selectedTrade.pnl?.amount && (
                      <span className="text-sm font-normal ml-1 text-muted-foreground">
                        (¥{selectedTrade.pnl.amount.toLocaleString()})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-bold">日時</label>
                  <p className="font-medium">
                    {format(new Date(selectedTrade.entryTime), 'yyyy/MM/dd HH:mm', { locale: ja })}
                  </p>
                </div>
                {selectedTrade.lotSize && (
                  <div>
                    <label className="text-xs text-muted-foreground font-bold">ロット</label>
                    <p className="font-medium font-numbers">{selectedTrade.lotSize}</p>
                  </div>
                )}
                {selectedTrade.broker && (
                  <div>
                    <label className="text-xs text-muted-foreground font-bold">ブローカー</label>
                    <p className="font-medium">{selectedTrade.broker}</p>
                  </div>
                )}
              </div>

              {/* Tags */}
              {selectedTrade.tags && selectedTrade.tags.filter(t => !t.startsWith('#') && t !== 'Forwarded' && t !== 'AutoImport').length > 0 && (
                <div>
                  <label className="text-xs text-muted-foreground font-bold mb-1 block">タグ</label>
                  <div className="flex flex-wrap gap-1">
                    {selectedTrade.tags.filter(t => !t.startsWith('#') && t !== 'Forwarded' && t !== 'AutoImport').map((tag) => (
                      <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes - only show if there's actual user content (not raw email) */}
              {selectedTrade.notes && !selectedTrade.notes.includes('Subject:') && !selectedTrade.notes.includes('Received:') && selectedTrade.notes.trim() !== '' && (
                <div>
                  <label className="text-xs text-muted-foreground font-bold mb-1 block">メモ</label>
                  <div className="bg-muted p-3 rounded-md text-sm">
                    {selectedTrade.notes}
                  </div>
                </div>
              )}

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

      {/* Unified Quick Add Dialog */}
      <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
        <DialogContent className="max-w-md max-h-[70vh] sm:max-h-[80vh] flex flex-col my-auto">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>メモ・リンク保存</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-16 sm:pb-4">
            {/* Memo */}
            <div className="space-y-2">
              <Label htmlFor="quick-memo" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                メモ
              </Label>
              <Textarea
                id="quick-memo"
                placeholder="学んだこと、気づきなど"
                rows={3}
                value={quickAddData.memo}
                onChange={(e) => setQuickAddData(prev => ({ ...prev, memo: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">→ 今日の振り返りに保存</p>
            </div>

            {/* URL */}
            <div className="space-y-2">
              <Label htmlFor="quick-url" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                URL（任意）
              </Label>
              <Input
                id="quick-url"
                type="url"
                placeholder="https://x.com/..."
                value={quickAddData.url}
                onChange={(e) => setQuickAddData(prev => ({ ...prev, url: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">→ クリップに保存</p>
            </div>

            {/* Image */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                画像（任意）
              </Label>
              {quickAddData.imageUrl ? (
                <div className="relative">
                  <img src={quickAddData.imageUrl} alt="Uploaded" className="w-full h-32 object-cover rounded" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1"
                    onClick={() => setQuickAddData(prev => ({ ...prev, imageUrl: '' }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setIsSaving(true)
                    try {
                      const formData = new FormData()
                      formData.append('file', file)
                      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
                      if (uploadRes.ok) {
                        const { url } = await uploadRes.json()
                        setQuickAddData(prev => ({ ...prev, imageUrl: url }))
                      }
                    } catch (error) {
                      toast({ title: "アップロード失敗", variant: "destructive" })
                    } finally {
                      setIsSaving(false)
                    }
                  }}
                />
              )}
            </div>

            {/* Trade Link */}
            {todayTrades.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="quick-trade" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  トレード紐付け（任意）
                </Label>
                <select
                  id="quick-trade"
                  className="w-full p-2 border rounded-md bg-background"
                  value={quickAddData.linkedTradeId}
                  onChange={(e) => setQuickAddData(prev => ({ ...prev, linkedTradeId: e.target.value }))}
                >
                  <option value="">紐付けなし</option>
                  {todayTrades.map(trade => (
                    <option key={trade.id} value={trade.id}>
                      {trade.pair} {trade.pnl?.amount && trade.pnl.amount > 0 ? '+' : ''}
                      {trade.pnl?.amount ? `¥${trade.pnl.amount.toLocaleString()}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <DialogFooter className="flex-shrink-0 pt-4">
            <Button type="button" variant="outline" onClick={() => {
              setQuickAddOpen(false)
              setQuickAddData({ memo: '', url: '', imageUrl: '', linkedTradeId: '' })
            }}>
              キャンセル
            </Button>
            <Button
              type="button"
              disabled={(!quickAddData.memo && !quickAddData.url && !quickAddData.imageUrl) || isSaving}
              onClick={async () => {
                setIsSaving(true)
                try {
                  const results: string[] = []

                  // 1. Save memo to daily_reflections
                  if (quickAddData.memo.trim()) {
                    const today = format(new Date(), 'yyyy-MM-dd')
                    const res = await fetch('/api/reflections', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        date: today,
                        note: quickAddData.memo
                      })
                    })
                    if (res.ok) results.push('メモ')
                  }

                  // 2. Save URL to clips
                  if (quickAddData.url.trim()) {
                    const res = await fetch('/api/clips', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        url: quickAddData.url,
                        title: quickAddData.url
                      })
                    })
                    if (res.ok) results.push('リンク')
                  }

                  // 3. Save image
                  if (quickAddData.imageUrl) {
                    if (quickAddData.linkedTradeId) {
                      const res = await fetch('/api/trades', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          id: quickAddData.linkedTradeId,
                          chartImages: [{ url: quickAddData.imageUrl, caption: '' }]
                        })
                      })
                      if (res.ok) results.push('画像(トレード)')
                    } else {
                      const res = await fetch('/api/knowledge', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          title: `スクリーンショット ${format(new Date(), 'M/d HH:mm')}`,
                          url: quickAddData.imageUrl,
                          contentType: 'other'
                        })
                      })
                      if (res.ok) results.push('画像')
                    }
                  }

                  if (results.length > 0) {
                    toast({ title: `${results.join('・')}を保存しました` })
                    setQuickAddOpen(false)
                    setQuickAddData({ memo: '', url: '', imageUrl: '', linkedTradeId: '' })
                    loadData()
                  }
                } catch (error) {
                  toast({ title: "エラーが発生しました", variant: "destructive" })
                } finally {
                  setIsSaving(false)
                }
              }}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-40">
        {/* FAB Menu */}
        {isFabOpen && (
          <div className="absolute bottom-16 right-0 flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-200">
            <Button
              variant="outline"
              size="sm"
              className="bg-background shadow-lg whitespace-nowrap"
              onClick={() => {
                setIsFabOpen(false)
                setQuickAddOpen(true)
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              メモ・リンク
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-background shadow-lg whitespace-nowrap"
              onClick={() => {
                setIsFabOpen(false)
                setIsRecordDialogOpen(true)
              }}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              手動で記録
            </Button>
          </div>
        )}

        {/* FAB Button */}
        <Button
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-transform",
            isFabOpen ? "rotate-45 bg-muted" : "bg-primary"
          )}
          onClick={() => setIsFabOpen(!isFabOpen)}
        >
          {isFabOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </Button>
      </div>
    </ProtectedRoute>
  )
}

