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
                throw new Error(data.error)
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
                <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20 h-9 px-3">
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
        <Button onClick={() => signIn("google")} className="bg-red-600 hover:bg-red-700 text-white">
            <Mail className="mr-2 h-4 w-4" />
            Gmailと連携する
        </Button>
    )
}
