"use client"

import { Home, BookOpen, Bell, BarChart3, Vote } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MobileNav() {
    const pathname = usePathname()

    // New 5-tab navigation: ホーム / ジャーナル / 通知 / 投票 / 分析
    const navItems = [
        { href: '/', icon: Home, label: 'ホーム' },
        { href: '/journal', icon: BookOpen, label: 'ジャーナル' },
        { href: '/alerts', icon: Bell, label: '通知' },
        { href: '/polls', icon: Vote, label: '投票' },
        { href: '/analysis', icon: BarChart3, label: '分析' },
    ]

    // Don't show nav on login page
    if (pathname === '/login') return null

    return (
        <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-background md:hidden z-50">
            <div className="grid grid-cols-5 h-14 items-center pb-[env(safe-area-inset-bottom)]">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full min-h-[44px] gap-0.5",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            <Icon className="h-6 w-6" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}

