"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageSquare, History, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { FABButton } from "./fab-button"
import { UserMenu } from "./user-menu"

export function MobileNav() {
    const pathname = usePathname()

    const navItems = [
        { href: '/', icon: Home, label: 'ホーム' },
        { href: '/chat', icon: MessageSquare, label: 'ノート' },
        { href: null, icon: null, label: null }, // Spacer for FAB
        { href: '/history', icon: History, label: '履歴' },
        { href: '/analysis', icon: TrendingUp, label: '分析' },
    ]

    // Don't show nav on login page
    if (pathname === '/login') return null

    return (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur-lg md:hidden z-50 pb-safe">
            <nav className="relative grid grid-cols-5 h-16 items-center">
                <FABButton />
                {navItems.map((item, index) => {
                    // Spacer for FAB (Center item)
                    if (index === 2) {
                        return <div key="spacer" className="w-full h-full" />
                    }

                    const Icon = item.icon!
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href!}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-primary/80"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
