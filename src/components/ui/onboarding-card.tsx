"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Circle, Mail, BookOpen, Settings, ArrowRight, X } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useAuth } from "@/contexts/auth-context"
import { tradeRuleService } from "@/lib/trade-rule-service"

interface OnboardingStep {
    id: string
    title: string
    description: string
    icon: React.ReactNode
    href: string
    completed: boolean
}

export function OnboardingCard() {
    const { data: session } = useSession()
    const { user } = useAuth()
    const [steps, setSteps] = useState<OnboardingStep[]>([])
    const [dismissed, setDismissed] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkOnboardingStatus()
    }, [session, user])

    const checkOnboardingStatus = async () => {
        if (!user) {
            setLoading(false)
            return
        }

        // Check Gmail connection
        const gmailConnected = !!session?.accessToken

        // Check if user has trade rules
        const rules = await tradeRuleService.getRules(user.id)
        const hasRules = rules.length > 0

        // Check if dismissed from localStorage
        const isDismissed = localStorage.getItem('onboarding_dismissed') === 'true'
        setDismissed(isDismissed)

        const onboardingSteps: OnboardingStep[] = [
            {
                id: 'gmail',
                title: 'メールで自動記録 📧',
                description: '手入力ゼロ！約定通知から自動でトレードを記録',
                icon: <Mail className="h-5 w-5" />,
                href: '/settings',
                completed: gmailConnected
            },
            {
                id: 'rules',
                title: '自分ルールで勝率UP 📈',
                description: 'ルールを決めて、感情トレードを減らそう',
                icon: <BookOpen className="h-5 w-5" />,
                href: '/settings',
                completed: hasRules
            },
            {
                id: 'sync',
                title: '過去のトレードを振り返る 🔄',
                description: 'メールを同期して、今までの成績を分析',
                icon: <Settings className="h-5 w-5" />,
                href: '/settings',
                completed: gmailConnected // If connected, likely synced
            }
        ]

        setSteps(onboardingSteps)
        setLoading(false)
    }

    const handleDismiss = () => {
        localStorage.setItem('onboarding_dismissed', 'true')
        setDismissed(true)
    }

    // Don't show if loading, dismissed, or all steps complete
    if (loading || dismissed) return null
    if (steps.length > 0 && steps.every(s => s.completed)) return null

    const completedCount = steps.filter(s => s.completed).length
    const progress = steps.length > 0 ? (completedCount / steps.length) * 100 : 0

    return (
        <Card className="border-solo-gold/30 bg-gradient-to-br from-solo-navy/50 to-background">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        🚀 はじめに
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleDismiss}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{completedCount}/{steps.length} 完了</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-solo-gold transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {steps.map((step) => (
                    <Link key={step.id} href={step.href}>
                        <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${step.completed
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-muted/50 hover:bg-muted'
                            }`}>
                            <div className="flex-shrink-0">
                                {step.completed ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`font-medium text-sm ${step.completed ? 'line-through opacity-70' : ''}`}>
                                    {step.title}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {step.description}
                                </p>
                            </div>
                            {!step.completed && (
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            )}
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
    )
}
