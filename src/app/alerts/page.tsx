"use client"

import { Bell, ChevronRight, Clock, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Badge } from "@/components/ui/badge"

// Placeholder data for MVP - will be replaced with real data from DB
const mockAlerts = [
    {
        id: "1",
        patternName: "5分押し目ロング",
        currencyPair: "USDJPY",
        timeframe: "5分",
        similarity: 92,
        createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
        status: "unread"
    },
    {
        id: "2",
        patternName: "レンジブレイク",
        currencyPair: "EURUSD",
        timeframe: "1時間",
        similarity: 87,
        createdAt: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
        status: "read"
    },
]

export default function AlertsPage() {
    return (
        <ProtectedRoute>
            <div className="container mx-auto p-4 max-w-4xl pb-20">
                <header className="sticky top-0 z-50 -mx-4 px-4 pt-[env(safe-area-inset-top)] pb-2 bg-background border-b border-border flex items-center gap-2 mb-4">
                    <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center">
                        <Bell className="h-4 w-4 text-primary" />
                    </div>
                    <h1 className="text-base font-bold">通知</h1>
                    <Badge variant="secondary" className="ml-auto">
                        Pattern Alert
                    </Badge>
                </header>

                <div className="space-y-4">
                    {/* Empty State */}
                    {mockAlerts.length === 0 ? (
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
                            {/* Alert Cards */}
                            {mockAlerts.map((alert) => (
                                <Card
                                    key={alert.id}
                                    className={`hover:bg-muted/50 transition-colors cursor-pointer ${alert.status === "unread" ? "border-primary/50" : ""
                                        }`}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold">{alert.patternName}</span>
                                                    {alert.status === "unread" && (
                                                        <Badge className="bg-primary text-primary-foreground text-xs">
                                                            NEW
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <TrendingUp className="h-3 w-3" />
                                                        {alert.currencyPair}
                                                    </span>
                                                    <span>|</span>
                                                    <span>{alert.timeframe}</span>
                                                    <span>|</span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatTimeAgo(alert.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-primary">
                                                        {alert.similarity}%
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">一致度</div>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
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
