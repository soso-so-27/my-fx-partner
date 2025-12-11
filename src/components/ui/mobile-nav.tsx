"use client"

import { Home, BookOpen, MessageSquare, BarChart3, RefreshCw } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MobileNav() {
    const pathname = usePathname()

    // iOS style 5-tab navigation (no FAB)
    // Following iOS HIG: Tab bar height = 49pt + safe area for home indicator
    const navItems = [
        { href: '/', icon: Home, label: 'ホーム' },
        { href: '/chat', icon: MessageSquare, label: '相談' },
        { href: '/journal', icon: BookOpen, label: 'ジャーナル' },
        { href: '/analysis', icon: BarChart3, label: '分析' },
    ]

    // Don't show nav on login page
    if (pathname === '/login') return null

    return (
        <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-background md:hidden z-50">
            {/* iOS Tab Bar: Minimum 44pt touch targets */}
            <div className="grid grid-cols-4 h-14 items-center pb-[env(safe-area-inset-bottom)]">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full min-h-[44px] gap-0.5",
                                isActive ? "text-solo-gold" : "text-muted-foreground"
                            )}
                        >
                            {/* iOS HIG: Tab bar icons = 25x25pt (h-6 = 24px) */}
                            <Icon className="h-6 w-6" />
                            {/* iOS HIG: Labels below icons */}
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
