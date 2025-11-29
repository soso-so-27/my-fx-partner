"use client"

import { ShieldCheck, PenTool, BookOpen } from "lucide-react"

interface ChatModeSelectorProps {
    onSelectMode: (mode: 'pre-trade' | 'post-trade' | 'review') => void
}

export function ChatModeSelector({ onSelectMode }: ChatModeSelectorProps) {
    return (
        <div className="flex flex-col gap-4 p-6 w-full">
            <div className="text-center space-y-1">
                <h3 className="font-semibold text-base">何について話しますか？</h3>
                <p className="text-xs text-muted-foreground">
                    モードを選ぶか、下の入力欄から自由に話してください
                </p>
            </div>

            <div className="flex flex-col gap-2 w-full max-w-md mx-auto">
                <button
                    onClick={() => onSelectMode('pre-trade')}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-blue-500/10 hover:border-blue-500 transition-all text-left group w-full"
                >
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                        <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm">エントリー前チェック</div>
                        <div className="text-xs text-muted-foreground">ルール適合を確認</div>
                    </div>
                </button>

                <button
                    onClick={() => onSelectMode('post-trade')}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-yellow-500/10 hover:border-yellow-500 transition-all text-left group w-full"
                >
                    <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 flex-shrink-0">
                        <PenTool className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm">トレード記録・内省</div>
                        <div className="text-xs text-muted-foreground">感情と事実を整理</div>
                    </div>
                </button>

                <button
                    onClick={() => onSelectMode('review')}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-green-500/10 hover:border-green-500 transition-all text-left group w-full"
                >
                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0">
                        <BookOpen className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm">振り返り・分析</div>
                        <div className="text-xs text-muted-foreground">改善点を発見</div>
                    </div>
                </button>
            </div>
        </div>
    )
}
