import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Bookmark } from "lucide-react"
import { InsightMode } from "@/types/insight"

interface MessageBubbleProps {
    role: 'user' | 'ai'
    content: string
    timestamp?: string
    mode?: InsightMode
    onSaveInsight?: (content: string, mode: InsightMode) => void
}

export function MessageBubble({ role, content, timestamp, mode, onSaveInsight }: MessageBubbleProps) {
    return (
        <div className={cn(
            "flex w-full p-3",
            role === 'user' ? "justify-end" : "justify-start"
        )}>
            <div className={cn(
                "flex flex-col max-w-[85%]",
                role === 'user' ? "items-end" : "items-start"
            )}>
                <div className={cn(
                    "rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",
                    role === 'user'
                        ? "bg-solo-gold text-solo-black"
                        : "bg-muted text-foreground"
                )}>
                    {content}
                </div>

                <div className="flex items-center gap-2 mt-1 px-2">
                    {timestamp && (
                        <span className="text-xs text-muted-foreground">
                            {timestamp}
                        </span>
                    )}
                    {role === 'ai' && mode && onSaveInsight && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-solo-gold"
                            onClick={() => onSaveInsight(content, mode)}
                        >
                            <Bookmark className="h-3 w-3 mr-1" />
                            気づきを保存
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
