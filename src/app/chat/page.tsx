"use client"

import { ChatInterface } from "@/components/chat/chat-interface"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function ChatPage() {
    return (
        <ProtectedRoute>
            <div className="container mx-auto p-4 h-screen">
                <ChatInterface />
            </div>
        </ProtectedRoute>
    )
}
