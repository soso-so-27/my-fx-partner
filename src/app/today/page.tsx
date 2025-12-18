"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Target, ChevronRight } from "lucide-react"
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns"
import { ja } from "date-fns/locale"

// New Components
import { StrategyDashboard } from "@/components/strategy/strategy-dashboard"
import { StrategyWizard } from "@/components/strategy/strategy-wizard"
import { StrategyReview } from "@/components/strategy/strategy-review"
import { WeeklyPlan } from "@/components/strategy/types"

export default function StrategyPage() {
    const { status } = useSession()
    const [viewMode, setViewMode] = useState<'dashboard' | 'wizard'>('dashboard')
    const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null)
    const [economicEvents, setEconomicEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Initial Fetch
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                // 1. Fetch Events
                const eventsRes = await fetch('/api/events')
                if (eventsRes.ok) {
                    const data = await eventsRes.json()
                    setEconomicEvents(data.events || [])
                }

                // 2. Fetch Strategy
                const todayStr = format(new Date(), 'yyyy-MM-dd')
                const stratRes = await fetch(`/api/strategy?date=${todayStr}`)
                if (stratRes.ok) {
                    const data = await stratRes.json()
                    if (data.strategy && data.strategy.plan) {
                        // DB has plain JSON, ensuring it matches WeeklyPlan type
                        // In real app, consider Zod validation
                        setWeeklyPlan(data.strategy.plan as WeeklyPlan)
                    }
                }
            } catch (error) {
                console.error("Failed to load data:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const handleSavePlan = async (newPlan: WeeklyPlan) => {
        // Optimistic update
        setWeeklyPlan(newPlan)
        setViewMode('dashboard')

        try {
            await fetch('/api/strategy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: format(new Date(), 'yyyy-MM-dd'),
                    plan: newPlan
                })
            })
        } catch (error) {
            console.error("Failed to save plan:", error)
        }
    }

    const handleReviewComplete = async (reviewData: any) => {
        // TODO: Save review to DB via API (not implemented fully in Phase 1 but placeholder called)
        console.log("Review completed:", reviewData)
        // Transition to Plan tab or show success?
        // For now just log
    }

    // Date calculations
    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 })

    // Previous week logic for Review tab (optional)
    const prevStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 })
    const prevEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 })

    if (status === "loading" || loading) {
        return (
            <ProtectedRoute>
                <div className="container mx-auto p-4 pb-20 flex justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute>
            <div className="container mx-auto p-4 pb-24 space-y-4">

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

                <Tabs defaultValue="plan" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="plan">今週の作戦 (Plan)</TabsTrigger>
                        <TabsTrigger value="review">先週の振り返り (Review)</TabsTrigger>
                    </TabsList>

                    {/* PLAN TAB */}
                    <TabsContent value="plan" className="space-y-4">
                        {viewMode === 'wizard' ? (
                            <StrategyWizard
                                onSave={handleSavePlan}
                                onCancel={() => setViewMode('dashboard')}
                            />
                        ) : (
                            <>
                                {weeklyPlan ? (
                                    <StrategyDashboard
                                        plan={weeklyPlan}
                                        economicEvents={economicEvents}
                                        onEdit={() => setViewMode('wizard')}
                                    />
                                ) : (
                                    // Empty State (No plan yet)
                                    <Card className="border-dashed border-2">
                                        <CardContent className="p-6 text-center space-y-4">
                                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                                <Target className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold">今週の作戦を立てる</h3>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    質問に答えるだけで、<br />あなただけの「行動ルール」を作成します。
                                                </p>
                                            </div>
                                            <Button onClick={() => setViewMode('wizard')} className="w-full">
                                                作戦を立てる (30秒)
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        )}
                    </TabsContent>

                    {/* REVIEW TAB */}
                    <TabsContent value="review">
                        <div className="mb-4 text-center">
                            <h3 className="text-sm font-bold text-muted-foreground">
                                {format(prevStart, 'M/d')} - {format(prevEnd, 'M/d')} の振り返り
                            </h3>
                        </div>
                        <StrategyReview onComplete={handleReviewComplete} />
                    </TabsContent>
                </Tabs>

            </div>
        </ProtectedRoute>
    )
}
