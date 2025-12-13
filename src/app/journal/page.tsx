"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { JournalNotes } from "@/components/journal/journal-notes"
import { ChartGallery } from "@/components/analysis/chart-gallery"
import { BookOpen, Target, Bookmark, FileText } from "lucide-react"
import { useSession } from "next-auth/react"
import { tradeService } from "@/lib/trade-service"
import { Trade } from "@/types/trade"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function JournalPage() {
    const { data: session, status } = useSession()
    const [trades, setTrades] = useState<Trade[]>([])
    const [activeTab, setActiveTab] = useState("records")
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadTrades = async () => {
            if (status !== "authenticated" || !session?.user?.email) {
                setIsLoading(false)
                return
            }
            try {
                const userTrades = await tradeService.getTrades(session.user.email)
                setTrades(userTrades)
            } catch (error) {
                console.error('Failed to load trades:', error)
            } finally {
                setIsLoading(false)
            }
        }
        loadTrades()
    }, [session, status, refreshTrigger])

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1)
    }

    return (
        <ProtectedRoute>
            <div className="container mx-auto p-4 h-[100dvh] pb-20 flex flex-col">
                <header className="sticky top-0 z-50 -mx-4 px-4 pt-[env(safe-area-inset-top)] pb-2 bg-background border-b border-border flex items-center gap-2 shrink-0">
                    <div className="h-7 w-7 rounded-lg bg-muted/50 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <h1 className="text-base font-bold">ジャーナル</h1>
                </header>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 mt-4">
                    <TabsList className="grid w-full grid-cols-3 mb-4 shrink-0">
                        <TabsTrigger value="records" className="flex items-center gap-1.5">
                            <FileText className="h-4 w-4" />
                            <span>記録</span>
                        </TabsTrigger>
                        <TabsTrigger value="patterns" className="flex items-center gap-1.5">
                            <Target className="h-4 w-4" />
                            <span>パターン</span>
                        </TabsTrigger>
                        <TabsTrigger value="clips" className="flex items-center gap-1.5">
                            <Bookmark className="h-4 w-4" />
                            <span>クリップ</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Records Tab - Trade journal entries */}
                    <TabsContent value="records" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
                        <JournalNotes />
                    </TabsContent>

                    {/* Patterns Tab - Pattern Alert library */}
                    <TabsContent value="patterns" className="flex-1 min-h-0 mt-0 overflow-auto data-[state=inactive]:hidden">
                        <PatternsPlaceholder />
                    </TabsContent>

                    {/* Clips Tab - Knowledge Clip library */}
                    <TabsContent value="clips" className="flex-1 min-h-0 mt-0 overflow-auto data-[state=inactive]:hidden">
                        <ClipsPlaceholder />
                    </TabsContent>
                </Tabs>
            </div>
        </ProtectedRoute>
    )
}

// Placeholder for Patterns tab - will be implemented with Pattern Alert
function PatternsPlaceholder() {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Target className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">パターンライブラリ</h3>
                <p className="text-sm text-muted-foreground text-center max-w-xs mb-4">
                    得意なチャートパターンを登録すると、類似パターン出現時に通知を受け取れます。
                </p>
                <Button disabled>
                    <Target className="h-4 w-4 mr-2" />
                    パターンを登録（Coming Soon）
                </Button>
            </CardContent>
        </Card>
    )
}

// Placeholder for Clips tab - will be implemented with Knowledge Clip
function ClipsPlaceholder() {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                    <Bookmark className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="font-semibold mb-2">クリップボックス</h3>
                <p className="text-sm text-muted-foreground text-center max-w-xs mb-4">
                    X（Twitter）やブログ、YouTubeの有用なコンテンツを保存し、トレードに紐づけて管理できます。
                </p>
                <Button disabled variant="secondary">
                    <Bookmark className="h-4 w-4 mr-2" />
                    クリップを追加（Coming Soon）
                </Button>
            </CardContent>
        </Card>
    )
}

