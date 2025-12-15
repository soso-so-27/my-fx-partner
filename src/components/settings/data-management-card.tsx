"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { tradeService } from "@/lib/trade-service"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Trash2, Database, AlertTriangle } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function DataManagementCard() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [cleaning, setCleaning] = useState(false)
    const [demoCount, setDemoCount] = useState<number | null>(null)

    const checkDemoData = async () => {
        if (!user) return
        // Efficiently fetch only demo data count
        const trades = await tradeService.getTrades(user.id, 'demo')
        setDemoCount(trades.length)
        return trades.length
    }

    const handleCleanup = async () => {
        if (!user) return
        setCleaning(true)

        try {
            const currentCount = demoCount ?? await checkDemoData()
            if (!currentCount) {
                toast({
                    title: "デモデータはありません",
                    description: "削除対象のデータは見つかりませんでした。",
                })
                setCleaning(false)
                return
            }

            const success = await tradeService.cleanupDemoData()

            if (success) {
                toast({
                    title: "削除完了",
                    description: "デモデータをすべて削除しました。",
                })
                setDemoCount(0)
            } else {
                throw new Error("API cleanup failed")
            }
        } catch (error) {
            console.error(error)
            toast({
                title: "エラー",
                description: "削除に失敗しました。",
                variant: "destructive"
            })
        } finally {
            setCleaning(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    データ管理
                </CardTitle>
                <CardDescription>
                    アカウント内のデータを整理・管理します。
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                    <div className="space-y-1">
                        <h3 className="font-medium flex items-center gap-2">
                            デモデータの削除
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            サンプルとして生成されたデータのみを削除します。<br />
                            <span className="text-xs text-muted-foreground/80">
                                ※手動入力やGmail同期されたデータは保護されます。
                            </span>
                        </p>
                    </div>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="text-destructive hover:bg-destructive/10 border-destructive/20"
                                onClick={() => checkDemoData()}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                削除する
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                    <AlertTriangle className="h-5 w-5" />
                                    デモデータを削除しますか？
                                </AlertDialogTitle>
                                <AlertDialogDescription className="space-y-3">
                                    <p>
                                        アカウントから <strong>{demoCount !== null ? `${demoCount}件` : '検出中...'}</strong> のデモデータを完全に削除します。
                                    </p>
                                    <div className="bg-muted p-3 rounded-md text-sm">
                                        <p className="font-medium mb-1">保護されるデータ:</p>
                                        <ul className="list-disc list-inside text-muted-foreground">
                                            <li>Gmailから同期されたトレード</li>
                                            <li>手動で入力されたトレード</li>
                                        </ul>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        ※この操作は取り消せません。
                                    </p>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleCleanup}
                                    className="bg-destructive hover:bg-destructive/90"
                                    disabled={cleaning || (demoCount === 0)}
                                >
                                    {cleaning ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            削除中...
                                        </>
                                    ) : (
                                        "削除を実行"
                                    )}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    )
}
