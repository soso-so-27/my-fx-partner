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

    useEffect(() => {
        const loadTrades = async () => {
            // ... (keep existing load logic)
        }
        loadTrades()
    }, [user, refreshTrigger])

    // ...

    return (
        <ProtectedRoute>
            <div className="container mx-auto p-4 h-[calc(100vh-4rem)] flex flex-col">
                <header className="flex items-center gap-2 mb-6 shrink-0">
                    <BookOpen className="h-6 w-6 text-solo-navy dark:text-solo-gold" />
                    <h1 className="text-2xl font-bold">ジャーナル</h1>
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
