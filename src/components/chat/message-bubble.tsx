import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface MessageBubbleProps {
    role: 'user' | 'ai'
    content: string
    timestamp?: string
}

export function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
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
                    "rounded-lg px-4 py-2 text-sm",
                    role === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                )}>
                    {content}
                </div>
                {timestamp && (
                    <span className="text-xs text-muted-foreground mt-1">
                        {timestamp}
                    </span>
                )}
            </div>
        </div>
    )
}
