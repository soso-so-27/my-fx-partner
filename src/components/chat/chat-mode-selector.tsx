"use client"

import { ShieldCheck, PenTool, BookOpen } from "lucide-react"

interface ChatModeSelectorProps {
    onSelectMode: (mode: 'pre-trade' | 'post-trade' | 'review') => void
}

export function ChatModeSelector({ onSelectMode }: ChatModeSelectorProps) {
    return (
        <div className="flex flex-col gap-6 p-4 max-w-2xl mx-auto w-full">
            <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">何について話しますか？</h3>
                <p className="text-sm text-muted-foreground">
                    モードを選ぶか、下の入力欄から自由に話しかけてください。
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                    onClick={() => onSelectMode('pre-trade')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all text-center group"
                >
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="font-bold text-sm block">エントリー前</span>
                        <span className="text-[10px] text-muted-foreground">ルール適合チェック</span>
                    </div>
                </button>

                <button
                    onClick={() => onSelectMode('post-trade')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all text-center group"
                >
                    <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 group-hover:scale-110 transition-transform">
                        <PenTool className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="font-bold text-sm block">トレード記録</span>
                        <span className="text-[10px] text-muted-foreground">感情と事実の整理</span>
                    </div>
                </button>

                <button
                    onClick={() => onSelectMode('review')}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all text-center group"
                >
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                        <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="font-bold text-sm block">振り返り</span>
                        <span className="text-[10px] text-muted-foreground">改善点の発見</span>
                    </div>
                </button>
            </div>
        </div>
    )
}
