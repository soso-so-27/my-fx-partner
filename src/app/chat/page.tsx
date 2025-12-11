"use client"

import { ChatInterface } from "@/components/chat/chat-interface"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { MessageSquare } from "lucide-react"

export default function ChatPage() {
    return (
        <ProtectedRoute>
            <div className="container mx-auto p-4 h-screen pb-24 flex flex-col">
                <header className="sticky top-0 z-50 -mx-4 px-4 py-2 pt-[max(env(safe-area-inset-top),0.5rem)] bg-background/95 backdrop-blur-xl border-b border-border/10 flex items-center gap-3 mb-2 shadow-sm">
                    <div className="h-8 w-8 rounded-full bg-solo-gold/10 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-solo-gold" />
                    </div>
                    <h1 className="text-lg font-bold">AIパートナー</h1>
                </header>
                <div className="flex-1 min-h-0">
                    <ChatInterface />
                </div>
            </div>
        </ProtectedRoute>
    )
}
