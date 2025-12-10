"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw, Check, AlertCircle } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface SyncButtonProps {
    onSyncComplete?: () => void
    variant?: "default" | "compact" | "icon"
}

export function SyncButton({ onSyncComplete, variant = "default" }: SyncButtonProps) {
    const { data: session } = useSession()
    const [syncing, setSyncing] = useState(false)
    const [lastResult, setLastResult] = useState<{ success: boolean; count: number } | null>(null)
    const { toast } = useToast()

    const handleSync = async () => {
        setSyncing(true)
        setLastResult(null)
        try {
            const res = await fetch('/api/sync-trades', { method: 'POST' })
            const data = await res.json()

            if (data.success) {
                setLastResult({ success: true, count: data.count })
                toast({
                    title: "同期完了",
                    description: `${data.count}件のトレードを取り込みました。`,
                })
                onSyncComplete?.()
            } else {
                if (data.error?.includes('401') || data.error?.includes('Unauthorized')) {
                    toast({
                        title: "認証エラー",
                        description: "Gmail連携が切れました。設定から再連携してください。",
                        variant: "destructive"
                    })
                } else {
                    throw new Error(data.error)
                }
            }
        } catch (error: any) {
            setLastResult({ success: false, count: 0 })
            toast({
                title: "同期エラー",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setSyncing(false)
        }
    }

    // ログインしていない場合は表示しない
    if (!session) {
        return (
            <Link href="/settings">
                <Button variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Gmail連携が必要
                </Button>
            </Link>
        )
    }

    if (variant === "icon") {
        return (
            <Button
                variant="ghost"
                size="icon"
                onClick={handleSync}
                disabled={syncing}
                title="メール同期"
            >
                <RefreshCw className={`h-5 w-5 ${syncing ? 'animate-spin' : ''}`} />
            </Button>
        )
    }

    if (variant === "compact") {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={syncing}
                className="gap-2"
            >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? "同期中" : "同期"}
            </Button>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <Button
                onClick={handleSync}
                disabled={syncing}
                className="gap-2 bg-solo-gold hover:bg-solo-gold/80 text-solo-black"
            >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? "同期中..." : "メール同期"}
            </Button>
            {lastResult && (
                <span className={`text-sm flex items-center gap-1 ${lastResult.success ? 'text-green-500' : 'text-red-500'}`}>
                    {lastResult.success ? (
                        <>
                            <Check className="h-4 w-4" />
                            {lastResult.count}件
                        </>
                    ) : (
                        <>
                            <AlertCircle className="h-4 w-4" />
                            失敗
                        </>
                    )}
                </span>
            )}
        </div>
    )
}
