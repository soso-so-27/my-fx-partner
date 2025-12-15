"use client"

import { Button } from "@/components/ui/button"
import { signIn, signOut, useSession } from "next-auth/react"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Mail, RefreshCw } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

export function GmailConnectButton() {
    const { data: session } = useSession()
    const [syncing, setSyncing] = useState(false)
    const { toast } = useToast()

    const handleSync = async () => {
        setSyncing(true)
        try {
            const res = await fetch('/api/sync-trades', { method: 'POST' })
            const data = await res.json()

            if (data.success) {
                toast({
                    title: "同期完了",
                    description: `${data.count}件のトレードを取り込みました。`,
                })
            } else {
                // Check for auth errors
                if (data.error?.includes('401') || data.error?.includes('Unauthorized') || data.error?.includes('403')) {
                    toast({
                        title: "認証エラー",
                        description: "Gmail連携の認証が切れました。「解除」→「再連携」してください。",
                        variant: "destructive"
                    })
                } else {
                    // Update: use details if available for better debugging
                    throw new Error(data.details || data.error)
                }
            }
        } catch (error: any) {
            toast({
                title: "同期エラー",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setSyncing(false)
        }
    }

    if (session) {
        return (
            <div className="flex items-center gap-4">
                <Badge variant="secondary" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-500/30 h-9 px-3">
                    <CheckCircle2 className="h-4 w-4" />
                    連携済み ({session.user?.email})
                </Badge>
                <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                    今すぐ同期
                </Button>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                    解除
                </Button>
            </div>
        )
    }

    return (
        <Button onClick={() => signIn("google")} className="bg-solo-gold hover:bg-solo-gold/80 text-solo-black">
            <Mail className="mr-2 h-4 w-4" />
            Gmailと連携する
        </Button>
    )
}
