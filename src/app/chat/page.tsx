"use client"

import { ChatInterface } from "@/components/chat/chat-interface"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { MessageSquare } from "lucide-react"

export default function ChatPage() {
    return (
        <ProtectedRoute>
            <div className="container mx-auto p-4 h-[100dvh] pb-20 flex flex-col">
                <header className="sticky top-0 z-50 -mx-4 px-4 pt-[env(safe-area-inset-top)] pb-2 bg-background border-b border-border flex items-center gap-2 shrink-0">
                    <div className="h-7 w-7 rounded-full bg-solo-gold/10 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-solo-gold" />
                    </div>
                    <h1 className="text-base font-bold">AIパートナー</h1>
                </header>
                <div className="flex-1 min-h-0">
                    <ChatInterface />
                </div>
            </div>
        </ProtectedRoute>
    )
}
