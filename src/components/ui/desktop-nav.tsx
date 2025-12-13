"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BookOpen, Bell, Vote, TrendingUp, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { SyncButton } from "./sync-button"
import { ModeToggle } from "./mode-toggle"

export function DesktopNav() {
    const pathname = usePathname()

    // Main navigation items (5 items matching mobile)
    const navItems = [
        { href: '/', icon: Home, label: 'ホーム' },
        { href: '/journal', icon: BookOpen, label: 'ジャーナル' },
        { href: '/alerts', icon: Bell, label: '通知' },
        { href: '/polls', icon: Vote, label: '投票' },
        { href: '/analysis', icon: TrendingUp, label: '分析' },
    ]

    // Don't show nav on login page
    if (pathname === '/login') return null

    return (
        <nav className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-lg border-b z-50">
            <div className="container mx-auto flex items-center justify-between px-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-xl font-bold text-primary">SOLO</span>
                </Link>

                {/* Navigation Links */}
                <div className="flex items-center gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </div>

                {/* Right Side Actions - Settings in header */}
                <div className="flex items-center gap-2">
                    <SyncButton variant="icon" />
                    <ModeToggle />
                    <Link
                        href="/settings"
                        className={cn(
                            "p-2 rounded-lg transition-colors",
                            pathname === '/settings'
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                    >
                        <Settings className="h-5 w-5" />
                    </Link>
                </div>
            </div>
        </nav>
    )
}
