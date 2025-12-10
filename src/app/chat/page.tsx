"use client"

import { ChatInterface } from "@/components/chat/chat-interface"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { MessageSquare } from "lucide-react"

export default function ChatPage() {
    return (
        <ProtectedRoute>
            <div className="container mx-auto p-4 h-screen pb-24 flex flex-col">
                <header className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-solo-gold/10 flex items-center justify-center">
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
