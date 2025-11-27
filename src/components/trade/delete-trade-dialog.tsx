"use client"

import { useState } from "react"
import { tradeService } from "@/lib/trade-service"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeleteTradeDialogProps {
    tradeId: string
    tradePair: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function DeleteTradeDialog({ tradeId, tradePair, open, onOpenChange, onSuccess }: DeleteTradeDialogProps) {
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        setLoading(true)
        try {
            await tradeService.deleteTrade(tradeId)
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error('Failed to delete trade:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>トレードを削除しますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                        「{tradePair}」のトレードを削除します。この操作は取り消せません。
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>キャンセル</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={loading} className="bg-destructive hover:bg-destructive/90">
                        {loading ? '削除中...' : '削除'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
