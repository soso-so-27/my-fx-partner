"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { JournalNotes } from "@/components/journal/journal-notes"
import { PatternList } from "@/components/patterns/pattern-list"
import { ClipList } from "@/components/clips/clip-list"
import { BookOpen, Target, Bookmark, FileText } from "lucide-react"
import { useSession } from "next-auth/react"
import { tradeService } from "@/lib/trade-service"
import { Trade } from "@/types/trade"
import { useToast } from "@/components/ui/use-toast"

// Type for shared data from Web Share Target
interface SharedData {
    title?: string
    text?: string
    url?: string
}

export default function JournalPage() {
    const searchParams = useSearchParams()
    const { toast } = useToast()

    // Parse shared data from URL params (Web Share Target)
    const sharedData: SharedData | null = (() => {
        const title = searchParams.get('share_title')
        const text = searchParams.get('share_text')
        const url = searchParams.get('share_url')
        if (title || text || url) {
            return { title: title || undefined, text: text || undefined, url: url || undefined }
        }
        return null
    })()

    const { data: session, status } = useSession()
    const [trades, setTrades] = useState<Trade[]>([])
    const [activeTab, setActiveTab] = useState(sharedData ? "clips" : "records")
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const [isLoading, setIsLoading] = useState(true)

    // Handle shared data - switch to clips tab and show toast
    useEffect(() => {
        if (sharedData && sharedData.url) {
            setActiveTab("clips")
            toast({
                title: "共有を受け取りました",
                description: "クリップとして保存できます",
            })
        }
    }, [])

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
                    <TabsContent value="patterns" className="mt-0 pb-4" forceMount>
                        <div className="data-[state=inactive]:hidden" data-state={activeTab === 'patterns' ? 'active' : 'inactive'}>
                            <PatternList userId={session?.user?.email || ""} />
                        </div>
                    </TabsContent>

                    {/* Clips Tab - Knowledge Clip library */}
                    <TabsContent value="clips" className="mt-0 overflow-auto data-[state=inactive]:hidden">
                        <ClipList userId={session?.user?.email || ""} sharedData={sharedData} />
                    </TabsContent>
                </Tabs>
            </div>
        </ProtectedRoute>
    )
}
