"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageSquare, TrendingUp, BookText, History, Settings, ListTodo } from "lucide-react"
import { cn } from "@/lib/utils"
import { SyncButton } from "./sync-button"
import { ModeToggle } from "./mode-toggle"

export function DesktopNav() {
    const pathname = usePathname()

    const navItems = [
        { href: '/', icon: Home, label: 'ホーム' },
        { href: '/chat', icon: MessageSquare, label: 'AIパートナー' },
        { href: '/polls', icon: ListTodo, label: '投票' },
        { href: '/history', icon: History, label: '履歴' },
        { href: '/journal', icon: BookText, label: 'ジャーナル' },
        { href: '/analysis', icon: TrendingUp, label: '分析' },
        { href: '/settings', icon: Settings, label: '設定' },
    ]

    // Don't show nav on login page
    if (pathname === '/login') return null

    return (
        <nav className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-lg border-b z-50">
            <div className="container mx-auto flex items-center justify-between px-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-xl font-bold text-solo-navy dark:text-solo-gold">SOLO</span>
                </Link>

                {/* Navigation Links */}
                <div className="flex items-center gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-solo-gold/10 text-solo-gold"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-2">
                    <SyncButton variant="icon" />
                    <ModeToggle />
                </div>
            </div>
        </nav>
    )
}

