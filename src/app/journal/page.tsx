"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { JournalNotes } from "@/components/journal/journal-notes"
import { TradeRuleManager } from "@/components/journal/trade-rule-manager"
import { ChartGallery } from "@/components/analysis/chart-gallery"
import { BookOpen, ImageIcon, ListChecks } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { tradeService } from "@/lib/trade-service"
import { Trade } from "@/types/trade"

export default function JournalPage() {
    const { user } = useAuth()
    const [trades, setTrades] = useState<Trade[]>([])
    const [activeTab, setActiveTab] = useState("notes")
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    useEffect(() => {
        const loadTrades = async () => {
            // ... (keep existing load logic)
        }
        loadTrades()
    }, [user, refreshTrigger])

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1)
    }

    return (
        <ProtectedRoute>
            <div className="container mx-auto p-4 h-[100dvh] pb-20 flex flex-col">
                <header className="sticky top-0 z-50 -mx-4 px-4 h-11 pt-[env(safe-area-inset-top)] bg-background border-b border-border/20 flex items-center gap-2 shrink-0">
                    <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-solo-navy dark:text-solo-gold" />
                    </div>
                    <h1 className="text-base font-bold">ジャーナル</h1>
                </header>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    <TabsList className="grid w-full grid-cols-3 mb-4 shrink-0">
                        <TabsTrigger value="notes">ノート</TabsTrigger>
                        <TabsTrigger value="gallery">ギャラリー</TabsTrigger>
                        <TabsTrigger value="rules">ルール</TabsTrigger>
                    </TabsList>

                    <TabsContent value="notes" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
                        <JournalNotes />
                    </TabsContent>

                    <TabsContent value="gallery" className="flex-1 min-h-0 mt-0 overflow-auto data-[state=inactive]:hidden">
                        <div className="h-full pr-4">
                            <ChartGallery trades={trades} onTradeCreated={handleRefresh} />
                        </div>
                    </TabsContent>

                    <TabsContent value="rules" className="flex-1 min-h-0 mt-0 overflow-auto data-[state=inactive]:hidden">
                        <TradeRuleManager />
                    </TabsContent>
                </Tabs>
            </div>
        </ProtectedRoute>
    )
}
