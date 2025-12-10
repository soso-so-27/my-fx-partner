"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Check, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"

const COOLDOWN_SECONDS = 30

export function SyncFAB() {
    const { data: session } = useSession()
    const [syncing, setSyncing] = useState(false)
    const [cooldown, setCooldown] = useState(0)
    const [lastResult, setLastResult] = useState<'success' | 'error' | null>(null)
    const { toast } = useToast()

    // Cooldown timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [cooldown])

    // Clear result after 3 seconds
    useEffect(() => {
        if (lastResult) {
            const timer = setTimeout(() => setLastResult(null), 3000)
            return () => clearTimeout(timer)
        }
    }, [lastResult])

    const handleSync = async () => {
        if (syncing || cooldown > 0) return

        setSyncing(true)
        setLastResult(null)

        try {
            const res = await fetch('/api/sync-trades', { method: 'POST' })
            const data = await res.json()

            if (data.success) {
                setLastResult('success')
                setCooldown(COOLDOWN_SECONDS)
                toast({
                    title: "同期完了",
                    description: `${data.count}件のトレードを取り込みました。`,
                })
            } else {
                setLastResult('error')
                if (data.error?.includes('401') || data.error?.includes('Unauthorized')) {
                    toast({
                        title: "Gmail連携が必要",
                        description: "設定からGmailを連携してください。",
                        variant: "destructive"
                    })
                } else {
                    toast({
                        title: "同期エラー",
                        description: data.error || "しばらく待ってから再試行してください。",
                        variant: "destructive"
                    })
                }
            }
        } catch (error: any) {
            setLastResult('error')
            toast({
                title: "同期エラー",
                description: "ネットワークエラーが発生しました。",
                variant: "destructive"
            })
        } finally {
            setSyncing(false)
        }
    }

    const isDisabled = syncing || cooldown > 0 || !session

    return (
        <button
            onClick={handleSync}
            disabled={isDisabled}
            className={`absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 rounded-full shadow-lg transition-all flex items-center justify-center z-50 border-4 border-background ${syncing
                    ? 'bg-solo-gold/80 text-solo-black'
                    : lastResult === 'success'
                        ? 'bg-green-500 text-white'
                        : lastResult === 'error'
                            ? 'bg-destructive text-white'
                            : isDisabled
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-solo-gold text-solo-black hover:bg-solo-gold/90 hover:scale-105'
                }`}
            aria-label="メールからトレードを同期"
        >
            {syncing ? (
                <RefreshCw className="h-6 w-6 animate-spin" />
            ) : lastResult === 'success' ? (
                <Check className="h-6 w-6" />
            ) : lastResult === 'error' ? (
                <AlertCircle className="h-6 w-6" />
            ) : cooldown > 0 ? (
                <span className="text-sm font-bold">{cooldown}</span>
            ) : (
                <RefreshCw className="h-6 w-6" />
            )}
        </button>
    )
}
