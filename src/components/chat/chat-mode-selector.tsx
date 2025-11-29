"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ShieldCheck, PenTool, BookOpen } from "lucide-react"

interface ChatModeSelectorProps {
    onSelectMode: (mode: 'pre-trade' | 'post-trade' | 'review') => void
}

export function ChatModeSelector({ onSelectMode }: ChatModeSelectorProps) {
    return (
        <div className="grid gap-4 p-4">
            <p className="text-center text-muted-foreground text-sm mb-2">
                今の状態に合ったモードを選んでください
            </p>

            <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-blue-500" onClick={() => onSelectMode('pre-trade')}>
                <CardContent className="flex items-center gap-4 p-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">エントリー前チェック</h3>
                        <p className="text-xs text-muted-foreground">ルール適合を確認し、無駄なトレードを防ぐ</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-solo-gold" onClick={() => onSelectMode('post-trade')}>
                <CardContent className="flex items-center gap-4 p-4">
                    <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                        <PenTool className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">トレード記録・内省</h3>
                        <p className="text-xs text-muted-foreground">感情と事実を記録し、冷静さを取り戻す</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-green-500" onClick={() => onSelectMode('review')}>
                <CardContent className="flex items-center gap-4 p-4">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                        <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">振り返り・分析</h3>
                        <p className="text-xs text-muted-foreground">過去のトレードから学び、改善点を見つける</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
