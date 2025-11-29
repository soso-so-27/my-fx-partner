import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
            "flex w-full gap-3 p-4",
            role === 'user' ? "flex-row-reverse" : "flex-row"
        )}>
            <Avatar className="h-8 w-8">
                {role === 'ai' ? (
                    <>
                        <AvatarImage src="/ai-avatar.png" alt="AI" />
                        <AvatarFallback>AI</AvatarFallback>
                    </>
                ) : (
                    <>
                        <AvatarImage src="/user-avatar.png" alt="User" />
                        <AvatarFallback>ME</AvatarFallback>
                    </>
                )}
            </Avatar>

            <div className={cn(
                "flex flex-col max-w-[80%]",
                role === 'user' ? "items-end" : "items-start"
            )}>
                <div className={cn(
                    "rounded-lg px-4 py-2 text-sm whitespace-pre-wrap",
                    role === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                )}>
                    {content}
                </div>

                <div className="flex items-center gap-2 mt-1">
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
