"use client"

import { ShieldCheck, PenTool, BookOpen } from "lucide-react"

interface ChatModeSelectorProps {
    onSelectMode: (mode: 'pre-trade' | 'post-trade' | 'review') => void
}

export function ChatModeSelector({ onSelectMode }: ChatModeSelectorProps) {
    return (
        <div className="flex flex-col gap-3 p-4 w-full">
            <div className="text-center space-y-1 mb-2">
                <h3 className="font-bold text-base">何について話しますか？</h3>
                <p className="text-xs text-muted-foreground">
                    モードを選ぶか、下の入力欄から自由に話してください
                </p>
            </div>

            <div className="flex flex-col gap-2 w-full max-w-md mx-auto">
                <button
                    onClick={() => onSelectMode('pre-trade')}
                    className="group flex items-center gap-3 p-4 rounded-lg border-2 border-border bg-card hover:border-solo-gold hover:bg-solo-gold/5 transition-all text-left w-full"
                >
                    <div className="h-10 w-10 rounded-lg bg-muted group-hover:bg-solo-gold/10 flex items-center justify-center transition-colors flex-shrink-0">
                        <ShieldCheck className="h-5 w-5 text-muted-foreground group-hover:text-solo-gold transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm">エントリー前チェック</div>
                        <div className="text-xs text-muted-foreground">ルール適合を確認</div>
                    </div>
                </button>

                <button
                    onClick={() => onSelectMode('post-trade')}
                    className="group flex items-center gap-3 p-4 rounded-lg border-2 border-border bg-card hover:border-solo-gold hover:bg-solo-gold/5 transition-all text-left w-full"
                >
                    <div className="h-10 w-10 rounded-lg bg-muted group-hover:bg-solo-gold/10 flex items-center justify-center transition-colors flex-shrink-0">
                        <PenTool className="h-5 w-5 text-muted-foreground group-hover:text-solo-gold transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm">トレード記録・内省</div>
                        <div className="text-xs text-muted-foreground">感情と事実を整理</div>
                    </div>
                </button>

                <button
                    onClick={() => onSelectMode('review')}
                    className="group flex items-center gap-3 p-4 rounded-lg border-2 border-border bg-card hover:border-solo-gold hover:bg-solo-gold/5 transition-all text-left w-full"
                >
                    <div className="h-10 w-10 rounded-lg bg-muted group-hover:bg-solo-gold/10 flex items-center justify-center transition-colors flex-shrink-0">
                        <BookOpen className="h-5 w-5 text-muted-foreground group-hover:text-solo-gold transition-colors" />
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
