"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { status } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login")
        }
    }, [status, router])

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-muted-foreground">読み込み中...</div>
            </div>
        )
    }

    if (status === "unauthenticated") {
        return null
    }

    return <>{children}</>
}
