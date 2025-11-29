"use client"

import { ShieldCheck, PenTool, BookOpen } from "lucide-react"

interface ChatModeSelectorProps {
    onSelectMode: (mode: 'pre-trade' | 'post-trade' | 'review') => void
}

export function ChatModeSelector({ onSelectMode }: ChatModeSelectorProps) {
    return (
        <div className="flex flex-col gap-4 p-4 w-full">
            <div className="text-center space-y-1">
                <h3 className="font-bold text-lg">何について話しますか？</h3>
                <p className="text-sm text-muted-foreground">
                    モードを選ぶか、下の入力欄から自由に話してください
                </p>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
                <button
                    onClick={() => onSelectMode('pre-trade')}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-blue-600/10 border-2 border-blue-500/30 hover:border-blue-500 transition-all text-left group w-full shadow-sm"
                >
                    <div className="h-12 w-12 rounded-full bg-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-base">エントリー前チェック</div>
                        <div className="text-sm text-muted-foreground">ルール適合を確認</div>
                    </div>
                </button>

                <button
                    onClick={() => onSelectMode('post-trade')}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-2 border-yellow-500/30 hover:border-yellow-500 transition-all text-left group w-full shadow-sm"
                >
                    <div className="h-12 w-12 rounded-full bg-yellow-500/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 flex-shrink-0">
                        <PenTool className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-base">トレード記録・内省</div>
                        <div className="text-sm text-muted-foreground">感情と事実を整理</div>
                    </div>
                </button>

                <button
                    onClick={() => onSelectMode('review')}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-green-500/20 to-green-600/10 border-2 border-green-500/30 hover:border-green-500 transition-all text-left group w-full shadow-sm"
                >
                    <div className="h-12 w-12 rounded-full bg-green-500/30 flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-base">振り返り・分析</div>
                        <div className="text-sm text-muted-foreground">改善点を発見</div>
                    </div>
                </button>
            </div>
        </div>
    )
}
