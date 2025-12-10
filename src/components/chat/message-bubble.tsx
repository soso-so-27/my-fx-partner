"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Bookmark, Sparkles, User } from "lucide-react"
import { InsightMode } from "@/types/insight"

interface MessageBubbleProps {
    role: 'user' | 'ai'
    content: string
    timestamp?: string
    mode?: InsightMode
    onSaveInsight?: (content: string, mode: InsightMode) => void
}

export function MessageBubble({ role, content, timestamp, mode, onSaveInsight }: MessageBubbleProps) {
    const isAI = role === 'ai'

    return (
        <div className={cn(
            "w-full py-4 px-4 md:px-8",
            isAI ? "bg-transparent" : "bg-muted/30"
        )}>
            <div className="max-w-3xl mx-auto flex gap-4">
                {/* Avatar */}
                <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                    isAI
                        ? "bg-solo-gold text-solo-black"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                )}>
                    {isAI ? (
                        <Sparkles className="h-4 w-4" />
                    ) : (
                        <User className="h-4 w-4" />
                    )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0 space-y-2">
                    {/* Role Label */}
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "text-sm font-semibold",
                            isAI ? "text-solo-gold" : "text-foreground"
                        )}>
                            {isAI ? "SOLO" : "あなた"}
                        </span>
                        {timestamp && (
                            <span className="text-xs text-muted-foreground">
                                {timestamp}
                            </span>
                        )}
                    </div>

                    {/* Message Text */}
                    <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                        {content}
                    </div>

                    {/* Actions */}
                    {isAI && mode && onSaveInsight && (
                        <div className="flex items-center gap-2 pt-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-solo-gold"
                                onClick={() => onSaveInsight(content, mode)}
                            >
                                <Bookmark className="h-3.5 w-3.5 mr-1.5" />
                                気づきを保存
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
