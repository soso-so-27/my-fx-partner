"use client"

import { InstallPrompt } from "@/components/pwa/install-prompt"

export function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <InstallPrompt />
        </>
    )
}
