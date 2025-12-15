"use client"

import { useState, useEffect, useMemo } from "react"
import { Bell, ChevronRight, Clock, TrendingUp, Target, Loader2, ThumbsUp, ThumbsDown, ExternalLink, Filter, CheckCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { format, isToday, isYesterday, isThisWeek, isThisMonth, startOfDay } from "date-fns"
import { ja } from "date-fns/locale"

interface Alert {
    id: string
    patternId: string
    patternName: string
    currencyPair: string
    timeframe: string
    similarity: number
    chartSnapshotUrl: string | null
    createdAt: string
    status: 'unread' | 'read' | 'acted' | 'dismissed'
    userFeedback: 'thumbs_up' | 'thumbs_down' | null
    patternImageUrl?: string
}

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [patternFilter, setPatternFilter] = useState<string>('all')
    const [periodFilter, setPeriodFilter] = useState<string>('all')
    const { toast } = useToast()

    const fetchAlerts = async () => {
        try {
            const res = await fetch('/api/alerts')
            if (res.ok) {
                const data = await res.json()
                setAlerts(data.alerts || [])
            }
        } catch (error) {
            console.error('Error fetching alerts:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchAlerts()
    }, [])

    // Get unique patterns for filter
    const uniquePatterns = useMemo(() => {
        const patterns = [...new Set(alerts.map(a => a.patternName))]
        return patterns.sort()
    }, [alerts])

    // Filter alerts
    const filteredAlerts = useMemo(() => {
        return alerts.filter(alert => {
            // Pattern filter
            if (patternFilter !== 'all' && alert.patternName !== patternFilter) {
                return false
            }
            // Period filter
            if (periodFilter !== 'all') {
                const alertDate = new Date(alert.createdAt)
                if (periodFilter === 'today' && !isToday(alertDate)) return false
                if (periodFilter === 'week' && !isThisWeek(alertDate, { weekStartsOn: 1 })) return false
                if (periodFilter === 'month' && !isThisMonth(alertDate)) return false
            }
            return true
        })
    }, [alerts, patternFilter, periodFilter])

    // Group alerts by date
    const groupedAlerts = useMemo(() => {
        const groups: { label: string; alerts: Alert[] }[] = []
        const dateMap = new Map<string, Alert[]>()

        filteredAlerts.forEach(alert => {
            const date = startOfDay(new Date(alert.createdAt))
            let label: string
            if (isToday(date)) {
                label = '今日'
            } else if (isYesterday(date)) {
                label = '昨日'
            } else if (isThisWeek(date, { weekStartsOn: 1 })) {
                label = format(date, 'E曜日', { locale: ja })
            } else {
                label = format(date, 'M月d日', { locale: ja })
            }

            if (!dateMap.has(label)) {
                dateMap.set(label, [])
            }
            dateMap.get(label)!.push(alert)
        })

        dateMap.forEach((alerts, label) => {
            groups.push({ label, alerts })
        })

        return groups
    }, [filteredAlerts])

    // Mark all as read
    const handleMarkAllRead = async () => {
        const unreadAlerts = alerts.filter(a => a.status === 'unread')
        if (unreadAlerts.length === 0) return

        try {
            await Promise.all(
                unreadAlerts.map(alert =>
                    fetch(`/api/alerts/${alert.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'read' })
                    })
                )
            )
            setAlerts(alerts.map(a => ({ ...a, status: 'read' as const })))
            toast({
                title: 'すべて既読にしました',
                description: `${unreadAlerts.length}件の通知を既読にしました`
            })
        } catch (error) {
            console.error('Error marking all as read:', error)
            toast({ title: 'エラーが発生しました', variant: 'destructive' })
        }
    }

    const handleAlertClick = async (alert: Alert) => {
        setSelectedAlert(alert)
        setIsDetailOpen(true)

        // Mark as read
        if (alert.status === 'unread') {
            try {
                await fetch(`/api/alerts/${alert.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'read' })
                })
                setAlerts(alerts.map(a =>
                    a.id === alert.id ? { ...a, status: 'read' as const } : a
                ))
            } catch (error) {
                console.error('Error marking alert as read:', error)
            }
        }
    }

    const handleFeedback = async (alertId: string, feedback: 'positive' | 'negative') => {
        try {
            const res = await fetch(`/api/alerts/${alertId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userFeedback: feedback === 'positive' ? 'thumbs_up' : 'thumbs_down' })
            })

            if (res.ok) {
                const dbFeedback = feedback === 'positive' ? 'thumbs_up' : 'thumbs_down'
                setAlerts(alerts.map(a =>
                    a.id === alertId ? { ...a, userFeedback: dbFeedback } : a
                ))
                if (selectedAlert?.id === alertId) {
                    setSelectedAlert({ ...selectedAlert, userFeedback: dbFeedback })
                }
                toast({
                    title: feedback === 'positive' ? 'ありがとうございます！' : 'フィードバックを記録しました',
                    description: '今後の通知精度向上に活用します'
                })
            }
        } catch (error) {
            console.error('Error submitting feedback:', error)
        }
    }

    const unreadCount = alerts.filter(a => a.status === 'unread').length

    return (
        <ProtectedRoute>
            <div className="container mx-auto p-4 max-w-4xl pb-20">
                <header className="sticky top-0 z-50 -mx-4 px-4 pt-[env(safe-area-inset-top)] pb-2 bg-background border-b border-border flex items-center gap-2 mb-4">
                    <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center relative">
                        <Bell className="h-4 w-4 text-primary" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <h1 className="text-base font-bold">通知</h1>
                    <Badge variant="secondary" className="ml-auto">
                        Pattern Alert
                    </Badge>
                </header>

                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : alerts.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <Bell className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="font-semibold mb-2">まだ通知がありません</h3>
                                <p className="text-sm text-muted-foreground text-center max-w-xs">
                                    パターンを登録すると、類似したチャートが出現した時に通知が届きます。
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Filter Controls */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <Select value={patternFilter} onValueChange={setPatternFilter}>
                                    <SelectTrigger className="w-[130px] h-8 text-xs">
                                        <Filter className="h-3 w-3 mr-1" />
                                        <SelectValue placeholder="パターン" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">すべて</SelectItem>
                                        {uniquePatterns.map(pattern => (
                                            <SelectItem key={pattern} value={pattern}>{pattern}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                                    <SelectTrigger className="w-[100px] h-8 text-xs">
                                        <Clock className="h-3 w-3 mr-1" />
                                        <SelectValue placeholder="期間" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">すべて</SelectItem>
                                        <SelectItem value="today">今日</SelectItem>
                                        <SelectItem value="week">今週</SelectItem>
                                        <SelectItem value="month">今月</SelectItem>
                                    </SelectContent>
                                </Select>

                                <div className="flex-1" />

                                {unreadCount > 0 && (
                                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleMarkAllRead}>
                                        <CheckCheck className="h-3 w-3" />
                                        すべて既読
                                    </Button>
                                )}
                            </div>

                            <div className="text-xs text-muted-foreground">
                                {filteredAlerts.length === alerts.length ? `${alerts.length}件` : `${filteredAlerts.length} / ${alerts.length}件`}
                            </div>

                            {groupedAlerts.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">フィルター条件に一致する通知がありません</div>
                            ) : (
                                groupedAlerts.map((group) => (
                                    <div key={group.label} className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="text-xs font-medium text-muted-foreground">{group.label}</div>
                                            <div className="flex-1 h-px bg-border" />
                                            <div className="text-xs text-muted-foreground">{group.alerts.length}件</div>
                                        </div>
                                        {group.alerts.map((alert) => (
                                            <Card key={alert.id} className={`hover:bg-muted/50 transition-colors cursor-pointer ${alert.status === 'unread' ? "border-primary/50 bg-primary/5" : ""}`} onClick={() => handleAlertClick(alert)}>
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-semibold">{alert.patternName}</span>
                                                                {alert.status === 'unread' && <Badge className="bg-primary text-primary-foreground text-xs">NEW</Badge>}
                                                            </div>
                                                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                                <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{alert.currencyPair}</span>
                                                                <span>|</span><span>{alert.timeframe}</span><span>|</span>
                                                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTimeAgo(new Date(alert.createdAt))}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="text-right">
                                                                <div className={`text-lg font-bold ${Math.round(alert.similarity * 100) >= 80 ? 'text-green-600' : Math.round(alert.similarity * 100) >= 60 ? 'text-yellow-600' : 'text-muted-foreground'}`}>{Math.round(alert.similarity * 100)}%</div>
                                                                <div className="text-xs text-muted-foreground">一致度</div>
                                                            </div>
                                                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ))
                            )}
                        </>
                    )}

                    {/* Info Card */}
                    <Card className="border-dashed">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Pattern Alert とは？</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                あなたが登録した「得意パターン」に類似したチャートが出現した時に、自動で通知します。
                                ジャーナル &gt; パターン からパターンを登録してください。
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Alert Detail Dialog */}
                <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-primary" />
                                {selectedAlert?.patternName}
                            </DialogTitle>
                        </DialogHeader>

                        {selectedAlert && (
                            <div className="space-y-4">
                                {/* Similarity Score - Prominent display */}
                                <div className="text-center p-4 bg-muted/30 rounded-lg">
                                    <div className={`text-4xl font-bold ${Math.round(selectedAlert.similarity * 100) >= 80 ? 'text-green-600' :
                                        Math.round(selectedAlert.similarity * 100) >= 60 ? 'text-yellow-600' : 'text-muted-foreground'
                                        }`}>
                                        {Math.round(selectedAlert.similarity * 100)}%
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">類似度スコア</p>
                                </div>

                                {/* Pattern Image Comparison */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground text-center">登録パターン</p>
                                        <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                                            {selectedAlert.patternImageUrl ? (
                                                <img
                                                    src={selectedAlert.patternImageUrl}
                                                    alt="Registered Pattern"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Target className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground text-center">検出パターン</p>
                                        <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                                            {selectedAlert.chartSnapshotUrl ? (
                                                <img
                                                    src={selectedAlert.chartSnapshotUrl}
                                                    alt="Matched Pattern"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                                    プレビューなし
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Metadata */}
                                <div className="flex items-center justify-center gap-4 text-sm">
                                    <Badge variant="secondary">{selectedAlert.currencyPair}</Badge>
                                    <span className="text-muted-foreground">{selectedAlert.timeframe}</span>
                                    <span className="text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatTimeAgo(new Date(selectedAlert.createdAt))}
                                    </span>
                                </div>

                                {/* Feedback Section */}
                                <div className="border-t pt-4">
                                    <p className="text-sm text-center mb-3">この通知は役に立ちましたか？</p>
                                    <div className="flex justify-center gap-3">
                                        <Button
                                            variant={selectedAlert.userFeedback === 'thumbs_up' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handleFeedback(selectedAlert.id, 'positive')}
                                            className={selectedAlert.userFeedback === 'thumbs_up' ? 'bg-green-600 hover:bg-green-700' : ''}
                                        >
                                            <ThumbsUp className="h-4 w-4 mr-1" />
                                            役立った
                                        </Button>
                                        <Button
                                            variant={selectedAlert.userFeedback === 'thumbs_down' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handleFeedback(selectedAlert.id, 'negative')}
                                            className={selectedAlert.userFeedback === 'thumbs_down' ? 'bg-red-600 hover:bg-red-700' : ''}
                                        >
                                            <ThumbsDown className="h-4 w-4 mr-1" />
                                            役立たなかった
                                        </Button>
                                    </div>
                                </div>

                                {/* Open Chart (Placeholder) */}
                                <Button variant="outline" className="w-full" disabled>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    チャートを開く（準備中）
                                </Button>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </ProtectedRoute>
    )
}

function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

    if (seconds < 60) return "たった今"
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分前`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}時間前`
    return `${Math.floor(seconds / 86400)}日前`
}
