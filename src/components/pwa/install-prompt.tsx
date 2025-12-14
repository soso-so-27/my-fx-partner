"use client"

import { useState, useEffect } from "react"
import { Download, X, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [isVisible, setIsVisible] = useState(false)
    const [isInstalled, setIsInstalled] = useState(false)

    useEffect(() => {
        // Check if already installed
        if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true)
            return
        }

        // Check if dismissed in this session
        if (typeof sessionStorage !== 'undefined') {
            const dismissed = sessionStorage.getItem('install-prompt-dismissed')
            if (dismissed) {
                return
            }
        }

        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as BeforeInstallPromptEvent)
            // Delay showing the prompt for better UX
            setTimeout(() => setIsVisible(true), 3000)
        }

        window.addEventListener('beforeinstallprompt', handler)

        // Check if app was just installed
        const installedHandler = () => {
            setIsInstalled(true)
            setIsVisible(false)
            setDeferredPrompt(null)
        }
        window.addEventListener('appinstalled', installedHandler)

        return () => {
            window.removeEventListener('beforeinstallprompt', handler)
            window.removeEventListener('appinstalled', installedHandler)
        }
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return

        try {
            await deferredPrompt.prompt()
            const { outcome } = await deferredPrompt.userChoice

            if (outcome === 'accepted') {
                setIsVisible(false)
                setDeferredPrompt(null)
            }
        } catch (error) {
            console.error('Error prompting install:', error)
        }
    }

    const handleDismiss = () => {
        setIsVisible(false)
        sessionStorage.setItem('install-prompt-dismissed', 'true')
    }

    // Don't render if already installed or no prompt available
    if (isInstalled || !isVisible) return null

    return (
        <div
            className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80 animate-in slide-in-from-bottom-10 fade-in duration-300"
        >
            <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl shadow-2xl p-4">
                <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                        <Smartphone className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm">SOLOをホーム画面に追加</h3>
                        <p className="text-xs opacity-90 mt-0.5">
                            アプリのようにすぐアクセス＆通知を受け取れます
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-white/80 hover:text-white hover:bg-white/10"
                        onClick={handleDismiss}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex gap-2 mt-3">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 bg-white text-primary hover:bg-white/90"
                        onClick={handleInstall}
                    >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        追加する
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-white/80 hover:text-white hover:bg-white/10"
                        onClick={handleDismiss}
                    >
                        後で
                    </Button>
                </div>
            </div>
        </div>
    )
}
