"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Target, CheckCircle2, ChevronRight, ChevronLeft,
    Shield, TrendingUp, TrendingDown, Zap, Clock,
    AlertTriangle, Calendar, Sparkles, Info
} from "lucide-react"
import { format, startOfWeek, endOfWeek, addDays } from "date-fns"
import { ja } from "date-fns/locale"
import { cn } from "@/lib/utils"

// ウィザードのステップ
type WizardStep = 0 | 1 | 2 | 3 | 4

// 状況選択肢
const BUSYNESS_OPTIONS = [
    { id: 'relaxed', label: '余裕あり', icon: Sparkles },
    { id: 'normal', label: '普通', icon: Clock },
    { id: 'busy', label: '忙しい', icon: Zap },
]

const MENTAL_OPTIONS = [
    { id: 'high', label: '好調', icon: TrendingUp },
    { id: 'medium', label: '普通', icon: Target },
    { id: 'low', label: '控えめ', icon: Shield },
]

const PURPOSE_OPTIONS = [
    { id: 'protect', label: '守る', desc: '安定重視', icon: Shield },
    { id: 'improve', label: '整える', desc: '改善重視', icon: Target },
    { id: 'grow', label: '増やす', desc: 'ルール内で', icon: TrendingUp },
]

// 上限選択肢
const TRADE_LIMIT_OPTIONS = [3, 5, 7, 10]
const LOSS_LIMIT_OPTIONS = [-3000, -5000, -8000, -10000]
const CONSECUTIVE_LOSS_OPTIONS = [
    { id: '2', label: '2連敗で停止' },
    { id: '3', label: '3連敗で停止' },
    { id: 'none', label: 'なし' },
]

// テーマ選択肢
const THEME_OPTIONS = [
    { id: 'wait', label: '待つ練習', desc: 'パターン厳選', icon: Clock },
    { id: 'stoploss', label: '損切り固定', desc: 'ルール厳守', icon: AlertTriangle },
    { id: 'no_chase', label: '飛び乗り禁止', desc: '追いかけない', icon: Shield },
    { id: 'exit_rule', label: '利確ルール', desc: '手仕舞い遵守', icon: Target },
    { id: 'less_trade', label: '回数を減らす', desc: '距離を取る', icon: TrendingDown },
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

interface WeeklyPack {
    busyness: string
    mental: string
    purpose: string
    tradeLimit: number
    lossLimit: number
    consecutiveLoss: string
    theme: string
    createdAt: string
}

export default function StrategyPage() {
    const { data: session, status } = useSession()
    const [wizardOpen, setWizardOpen] = useState(false)
    const [step, setStep] = useState<WizardStep>(0)
    const [weeklyPack, setWeeklyPack] = useState<WeeklyPack | null>(null)

    // ウィザード入力値
    const [busyness, setBusyness] = useState<string>('')
    const [mental, setMental] = useState<string>('')
    const [purpose, setPurpose] = useState<string>('')
    const [tradeLimit, setTradeLimit] = useState<number>(5)
    const [lossLimit, setLossLimit] = useState<number>(-5000)
    const [consecutiveLoss, setConsecutiveLoss] = useState<string>('2')
    const [theme, setTheme] = useState<string>('')
    const [economicEvents, setEconomicEvents] = useState<EconomicEvent[]>([])

    // Fetch economic events
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch('/api/events')
                if (res.ok) {
                    const data = await res.json()
                    setEconomicEvents(data.events || [])
                }
            } catch (error) {
                console.error('Failed to fetch economic events:', error)
            }
        }
        fetchEvents()
    }, [])

    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 })

    const canProceed = () => {
        switch (step) {
            case 1: return busyness && mental && purpose
            case 2: return tradeLimit && lossLimit && consecutiveLoss
            case 3: return theme
            default: return true
        }
    }

    const handleNext = () => {
        if (step < 4) setStep((step + 1) as WizardStep)
    }

    const handleBack = () => {
        if (step > 0) setStep((step - 1) as WizardStep)
    }

    const handleSave = () => {
        const pack: WeeklyPack = {
            busyness,
            mental,
            purpose,
            tradeLimit,
            lossLimit,
            consecutiveLoss,
            theme,
            createdAt: new Date().toISOString()
        }
        setWeeklyPack(pack)
        setWizardOpen(false)
        setStep(0)
        // TODO: Save to database
    }

    const resetWizard = () => {
        setBusyness('')
        setMental('')
        setPurpose('')
        setTradeLimit(5)
        setLossLimit(-5000)
        setConsecutiveLoss('2')
        setTheme('')
        setStep(0)
    }

    const startWizard = () => {
        resetWizard()
        setWizardOpen(true)
        setStep(0)
    }

    const getPurposeLabel = () => {
        const opt = PURPOSE_OPTIONS.find(o => o.id === weeklyPack?.purpose)
        return opt?.label || ''
    }

    const getThemeLabel = () => {
        const opt = THEME_OPTIONS.find(o => o.id === weeklyPack?.theme)
        return opt?.label || ''
    }

    if (status === "loading") {
        return (
            <ProtectedRoute>
                <div className="container mx-auto p-4 pb-20">
                    <div className="animate-pulse text-muted-foreground text-center py-12">
                        読み込み中...
                    </div>
                </div>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute>
            <div className="container mx-auto p-4 pb-20 space-y-4">
                {/* Header */}
                <header className="flex items-center justify-between pt-[env(safe-area-inset-top)]">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold">週間戦略</h1>
                            <p className="text-xs text-muted-foreground">
                                {format(weekStart, 'M/d', { locale: ja })} - {format(weekEnd, 'M/d', { locale: ja })}
                            </p>
                        </div>
                    </div>
                </header>

                {/* Wizard Mode */}
                {wizardOpen ? (
                    <Card className="border-primary/30">
                        <CardContent className="p-4 space-y-4">
                            {/* Progress */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>ステップ {step}/3</span>
                                    <span>{Math.round((step / 3) * 100)}%</span>
                                </div>
                                <Progress value={(step / 3) * 100} className="h-1.5" />
                            </div>

                            {/* Step 0: 前提 */}
                            {step === 0 && (
                                <div className="text-center space-y-4 py-4">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                        <Info className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">30秒で作戦を立てる</h3>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            これは売買の助言ではありません。<br />
                                            あなたの「自己ルール」を整理します。
                                        </p>
                                    </div>
                                    <Button onClick={handleNext} className="w-full">
                                        はじめる
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            )}

                            {/* Step 1: 状況選択 */}
                            {step === 1 && (
                                <div className="space-y-4">
                                    <h3 className="font-bold">今週の状況</h3>

                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-2">忙しさ</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {BUSYNESS_OPTIONS.map(opt => {
                                                    const Icon = opt.icon
                                                    return (
                                                        <Button
                                                            key={opt.id}
                                                            variant={busyness === opt.id ? "default" : "outline"}
                                                            size="sm"
                                                            className="h-12 flex-col gap-1"
                                                            onClick={() => setBusyness(opt.id)}
                                                        >
                                                            <Icon className="h-4 w-4" />
                                                            <span className="text-[11px]">{opt.label}</span>
                                                        </Button>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs text-muted-foreground mb-2">メンタル余裕</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {MENTAL_OPTIONS.map(opt => {
                                                    const Icon = opt.icon
                                                    return (
                                                        <Button
                                                            key={opt.id}
                                                            variant={mental === opt.id ? "default" : "outline"}
                                                            size="sm"
                                                            className="h-12 flex-col gap-1"
                                                            onClick={() => setMental(opt.id)}
                                                        >
                                                            <Icon className="h-4 w-4" />
                                                            <span className="text-[11px]">{opt.label}</span>
                                                        </Button>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs text-muted-foreground mb-2">今週の目的</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {PURPOSE_OPTIONS.map(opt => {
                                                    const Icon = opt.icon
                                                    return (
                                                        <Button
                                                            key={opt.id}
                                                            variant={purpose === opt.id ? "default" : "outline"}
                                                            size="sm"
                                                            className="h-14 flex-col gap-0.5"
                                                            onClick={() => setPurpose(opt.id)}
                                                        >
                                                            <Icon className="h-4 w-4" />
                                                            <span className="text-[11px] font-medium">{opt.label}</span>
                                                            <span className="text-[9px] text-muted-foreground">{opt.desc}</span>
                                                        </Button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: 上限設定 */}
                            {step === 2 && (
                                <div className="space-y-4">
                                    <h3 className="font-bold">リスク上限</h3>

                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-2">今週の新規回数上限</p>
                                            <div className="grid grid-cols-4 gap-2">
                                                {TRADE_LIMIT_OPTIONS.map(num => (
                                                    <Button
                                                        key={num}
                                                        variant={tradeLimit === num ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => setTradeLimit(num)}
                                                    >
                                                        {num}回
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs text-muted-foreground mb-2">週間最大損失</p>
                                            <div className="grid grid-cols-4 gap-2">
                                                {LOSS_LIMIT_OPTIONS.map(num => (
                                                    <Button
                                                        key={num}
                                                        variant={lossLimit === num ? "default" : "outline"}
                                                        size="sm"
                                                        className="text-xs"
                                                        onClick={() => setLossLimit(num)}
                                                    >
                                                        {num.toLocaleString()}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs text-muted-foreground mb-2">連敗ルール</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {CONSECUTIVE_LOSS_OPTIONS.map(opt => (
                                                    <Button
                                                        key={opt.id}
                                                        variant={consecutiveLoss === opt.id ? "default" : "outline"}
                                                        size="sm"
                                                        className="text-[11px]"
                                                        onClick={() => setConsecutiveLoss(opt.id)}
                                                    >
                                                        {opt.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: テーマ選択 */}
                            {step === 3 && (
                                <div className="space-y-4">
                                    <h3 className="font-bold">今週のテーマ（1つ選択）</h3>

                                    <div className="space-y-2">
                                        {THEME_OPTIONS.map(opt => {
                                            const Icon = opt.icon
                                            return (
                                                <Button
                                                    key={opt.id}
                                                    variant={theme === opt.id ? "default" : "outline"}
                                                    className="w-full justify-start h-14 gap-3"
                                                    onClick={() => setTheme(opt.id)}
                                                >
                                                    <Icon className="h-5 w-5" />
                                                    <div className="text-left">
                                                        <div className="text-sm font-medium">{opt.label}</div>
                                                        <div className="text-[11px] text-muted-foreground">{opt.desc}</div>
                                                    </div>
                                                </Button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Navigation */}
                            {step > 0 && (
                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline" onClick={handleBack} className="flex-1">
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        戻る
                                    </Button>
                                    {step < 3 ? (
                                        <Button onClick={handleNext} disabled={!canProceed()} className="flex-1">
                                            次へ
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    ) : (
                                        <Button onClick={handleSave} disabled={!canProceed()} className="flex-1">
                                            <CheckCircle2 className="h-4 w-4 mr-1" />
                                            この作戦でいく
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Start Wizard Button */}
                        {!weeklyPack ? (
                            <Card className="border-dashed border-2">
                                <CardContent className="p-6 text-center space-y-4">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                        <Target className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">今週の作戦を立てる</h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            30秒で週間ルールを設定
                                        </p>
                                    </div>
                                    <Button onClick={startWizard} className="w-full">
                                        作戦を立てる
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            /* Weekly Pack Display */
                            <Card className="border-primary/20">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            今週の作戦
                                        </CardTitle>
                                        <Button variant="ghost" size="sm" className="text-xs" onClick={startWizard}>
                                            編集
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {/* 方針サマリー */}
                                    <div className="p-3 bg-primary/5 rounded-lg">
                                        <p className="text-sm font-medium">
                                            今週は「{getPurposeLabel()}週」：{getThemeLabel()}
                                        </p>
                                    </div>

                                    {/* ルール一覧 */}
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-muted-foreground">上限ルール</p>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                                                <Target className="h-3.5 w-3.5 text-muted-foreground" />
                                                新規上限：{weeklyPack.tradeLimit}回
                                            </div>
                                            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                                                <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                                                損失上限：{weeklyPack.lossLimit.toLocaleString()}円
                                            </div>
                                        </div>
                                        {weeklyPack.consecutiveLoss !== 'none' && (
                                            <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded text-xs text-red-600 dark:text-red-400">
                                                <Shield className="h-3.5 w-3.5" />
                                                {weeklyPack.consecutiveLoss}連敗で停止
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Economic Events */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    今週の重要指標（★4以上）
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {economicEvents.length > 0 ? (
                                    <div className="space-y-2">
                                        {economicEvents.slice(0, 10).map((event, i) => (
                                            <div
                                                key={event.id || i}
                                                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="text-center min-w-[40px]">
                                                        <div className="text-xs font-medium">{event.date}</div>
                                                        <div className="text-[10px] text-muted-foreground">{event.time}</div>
                                                    </div>
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {event.currency}
                                                    </Badge>
                                                    <span className="text-xs truncate max-w-[150px]">{event.name}</span>
                                                </div>
                                                <div className="text-yellow-500 text-xs">
                                                    {'★'.repeat(Math.min(event.importance, 5))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        経済指標を読み込み中...
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </ProtectedRoute>
    )
}
