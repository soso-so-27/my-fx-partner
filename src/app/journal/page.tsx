"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { insightService } from "@/lib/insight-service"
import { Insight } from "@/types/insight"
import { Card, CardContent } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { ShieldCheck, PenTool, BookOpen, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export default function JournalPage() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [insights, setInsights] = useState<Insight[]>([])
    const [loading, setLoading] = useState(true)
    const [filterMode, setFilterMode] = useState<string>('all')

    useEffect(() => {
        const loadInsights = async () => {
            if (!user) return
            try {
                const data = await insightService.getAllInsights(user.id)
                setInsights(data)
            } catch (error) {
                console.error("Failed to load insights", error)
            } finally {
                setLoading(false)
            }
        }
        loadInsights()
    }, [user])

    const handleDelete = async (id: string) => {
        try {
            await insightService.deleteInsight(id)
            setInsights(prev => prev.filter(i => i.id !== id))
            toast({
                title: "削除しました",
                description: "気づきを削除しました。",
            })
        } catch (error) {
            toast({
                title: "削除に失敗しました",
                description: "もう一度お試しください。",
                variant: "destructive"
            })
        }
    }

    const getModeIcon = (mode: string) => {
        switch (mode) {
            case 'pre-trade':
                return <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            case 'post-trade':
                return <PenTool className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            case 'review':
                return <BookOpen className="h-4 w-4 text-green-600 dark:text-green-400" />
            default:
                return null
        }
    }

    const getModeLabel = (mode: string) => {
        switch (mode) {
            case 'pre-trade':
                return 'エントリー前'
            case 'post-trade':
                return 'トレード記録'
            case 'review':
                return '振り返り'
            default:
                return mode
        }
    }

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="container mx-auto p-4">
                    <p>読み込み中...</p>
                </div>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute>
            <div className="container mx-auto p-4 max-w-3xl">
                <h1 className="text-2xl font-bold mb-6">ジャーナル</h1>
                <p className="text-sm text-muted-foreground mb-4">
                    AIパートナーとの会話で保存した気づきを振り返りましょう。
                </p>

                {/* Mode Filter */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    <Button
                        variant={filterMode === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterMode('all')}
                        className="flex-shrink-0"
                    >
                        すべて
                    </Button>
                    <Button
                        variant={filterMode === 'pre-trade' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterMode('pre-trade')}
                        className="flex-shrink-0"
                    >
                        エントリー前
                    </Button>
                    <Button
                        variant={filterMode === 'post-trade' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterMode('post-trade')}
                        className="flex-shrink-0"
                    >
                        トレード記録
                    </Button>
                    <Button
                        variant={filterMode === 'review' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterMode('review')}
                        className="flex-shrink-0"
                    >
                        振り返り
                    </Button>
                </div>

                {insights.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <p className="text-muted-foreground">
                                まだ気づきが保存されていません。<br />
                                AIパートナーとの会話で「気づきを保存」を押してみましょう。
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {insights
                            .filter(i => filterMode === 'all' || i.mode === filterMode)
                            .map((insight) => (
                                <Card key={insight.id} className="relative">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    {getModeIcon(insight.mode)}
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                        {getModeLabel(insight.mode)}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(insight.createdAt).toLocaleDateString('ja-JP')}
                                                    </span>
                                                </div>
                                                <p className="text-sm whitespace-pre-wrap">
                                                    {insight.content}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(insight.id)}
                                                className="text-muted-foreground hover:text-destructive flex-shrink-0"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                    </div>
                )}
            </div>
        </ProtectedRoute>
    )
}
