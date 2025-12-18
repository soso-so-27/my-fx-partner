'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ui/use-toast'
import {
    Copy,
    Check,
    ExternalLink,
    Mail,
    ArrowRight,
    RefreshCw,
    CheckCircle2,
    Circle,
    Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SetupStep {
    id: number
    title: string
    description: string
    status: 'pending' | 'current' | 'complete'
}

export function EmailForwardingSetup() {
    const { data: session } = useSession()
    const { toast } = useToast()
    const [copied, setCopied] = useState(false)
    const [pendingVerification, setPendingVerification] = useState<{
        pending: boolean
        confirmationUrl?: string
        createdAt?: string
    } | null>(null)
    const [loading, setLoading] = useState(true)
    const [checking, setChecking] = useState(false)

    const forwardingAddress = session?.user?.email
        ? `import+${session.user.email.replace('@', '.')}@trade-solo.com`
        : null

    const fetchPendingVerification = useCallback(async () => {
        try {
            const res = await fetch('/api/verification/pending')
            if (res.ok) {
                const data = await res.json()
                setPendingVerification(data)
            }
        } catch (error) {
            console.error('Failed to fetch pending verification:', error)
        } finally {
            setLoading(false)
            setChecking(false)
        }
    }, [])

    useEffect(() => {
        fetchPendingVerification()
    }, [fetchPendingVerification])

    const handleCopy = async () => {
        if (!forwardingAddress) return
        await navigator.clipboard.writeText(forwardingAddress)
        setCopied(true)
        toast({ title: 'コピーしました' })
        setTimeout(() => setCopied(false), 2000)
    }

    const handleCheckVerification = () => {
        setChecking(true)
        fetchPendingVerification()
    }

    const handleOpenConfirmation = () => {
        if (pendingVerification?.confirmationUrl) {
            window.open(pendingVerification.confirmationUrl, '_blank')
        }
    }

    const handleMarkComplete = async () => {
        try {
            await fetch('/api/verification/pending', { method: 'DELETE' })
            setPendingVerification({ pending: false })
            toast({ title: '設定完了', description: 'メール転送の設定が完了しました！' })
        } catch (error) {
            console.error('Failed to mark complete:', error)
        }
    }

    // Determine current step
    const getCurrentStep = (): number => {
        if (pendingVerification?.pending && pendingVerification?.confirmationUrl) {
            return 3 // Ready to confirm
        }
        return 1 // Initial setup
    }

    const currentStep = getCurrentStep()

    const steps: SetupStep[] = [
        {
            id: 1,
            title: '転送アドレスをコピー',
            description: '下のアドレスをコピーしてください',
            status: currentStep > 1 ? 'complete' : currentStep === 1 ? 'current' : 'pending'
        },
        {
            id: 2,
            title: 'Gmailで転送先を登録',
            description: 'Gmailの設定 → メール転送とPOP/IMAP → 転送先アドレスを追加',
            status: currentStep > 2 ? 'complete' : currentStep === 2 ? 'current' : 'pending'
        },
        {
            id: 3,
            title: '確認メールを承認',
            description: pendingVerification?.pending
                ? '確認リンクが届きました！下のボタンをクリック'
                : '確認メールが届くまでお待ちください',
            status: currentStep >= 3 ? 'current' : 'pending'
        },
        {
            id: 4,
            title: 'Gmailフィルターを作成',
            description: 'FX業者からのメールを自動転送するフィルターを設定',
            status: 'pending'
        }
    ]

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        メール転送連携
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    メール転送連携
                    <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">
                        セットアップ
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Progress Steps */}
                <div className="space-y-4">
                    {steps.map((step, index) => (
                        <div key={step.id} className="flex gap-3">
                            {/* Step indicator */}
                            <div className="flex flex-col items-center">
                                <div className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                                    step.status === 'complete' && "bg-green-500 text-white",
                                    step.status === 'current' && "bg-blue-500 text-white",
                                    step.status === 'pending' && "bg-muted text-muted-foreground"
                                )}>
                                    {step.status === 'complete' ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        step.id
                                    )}
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={cn(
                                        "w-0.5 h-full min-h-[24px] my-1",
                                        step.status === 'complete' ? "bg-green-500" : "bg-muted"
                                    )} />
                                )}
                            </div>

                            {/* Step content */}
                            <div className="flex-1 pb-4">
                                <h4 className={cn(
                                    "font-medium",
                                    step.status === 'pending' && "text-muted-foreground"
                                )}>
                                    {step.title}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {step.description}
                                </p>

                                {/* Step 1: Copy Address */}
                                {step.id === 1 && step.status === 'current' && forwardingAddress && (
                                    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                        <div className="flex flex-col gap-2">
                                            <code className="text-xs bg-background px-2 py-1.5 rounded border break-all overflow-hidden">
                                                {forwardingAddress}
                                            </code>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCopy}
                                                className="w-fit"
                                            >
                                                {copied ? (
                                                    <Check className="h-3 w-3 mr-1" />
                                                ) : (
                                                    <Copy className="h-3 w-3 mr-1" />
                                                )}
                                                {copied ? 'コピー完了' : 'コピー'}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Gmail Link */}
                                {step.id === 2 && (step.status === 'current' || step.status === 'pending') && (
                                    <div className="mt-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open('https://mail.google.com/mail/u/0/#settings/fwdandpop', '_blank')}
                                        >
                                            <ExternalLink className="h-3 w-3 mr-1" />
                                            Gmail設定を開く
                                        </Button>
                                    </div>
                                )}

                                {/* Step 3: Confirmation */}
                                {step.id === 3 && step.status === 'current' && (
                                    <div className="mt-3 space-y-2">
                                        {pendingVerification?.pending && pendingVerification?.confirmationUrl ? (
                                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                                <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-2">
                                                    ✅ 確認メールを受信しました！
                                                </p>
                                                <div className="flex gap-2 flex-wrap">
                                                    <Button
                                                        size="sm"
                                                        onClick={handleOpenConfirmation}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        <ExternalLink className="h-3 w-3 mr-1" />
                                                        確認リンクを開く
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleMarkComplete}
                                                    >
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        設定完了
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleCheckVerification}
                                                    disabled={checking}
                                                    className="w-fit"
                                                >
                                                    {checking ? (
                                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                    ) : (
                                                        <RefreshCw className="h-3 w-3 mr-1" />
                                                    )}
                                                    確認メールをチェック
                                                </Button>
                                                <span className="text-xs text-muted-foreground">
                                                    Gmailで転送先を追加後、数秒お待ちください
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 4: Filter */}
                                {step.id === 4 && (
                                    <div className="mt-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open('https://mail.google.com/mail/u/0/#settings/filters', '_blank')}
                                            disabled={step.status === 'pending'}
                                        >
                                            <ExternalLink className="h-3 w-3 mr-1" />
                                            フィルター設定を開く
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Help text */}
                <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        💡 FX業者からの約定メールを上記アドレスに転送すると、自動でトレード履歴に取り込まれます。
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
