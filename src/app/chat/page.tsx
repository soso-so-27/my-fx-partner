"use client"

import { ChatInterface } from "@/components/chat/chat-interface"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function ChatPage() {
    return (
        <ProtectedRoute>
            <div className="h-[100dvh] pb-16 flex flex-col">
                <ChatInterface />
            </div>
        </ProtectedRoute>
    )
}
