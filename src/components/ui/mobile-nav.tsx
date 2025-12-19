"use client"

import { CalendarDays, Target, Library, BarChart3 } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MobileNav() {
    const pathname = usePathname()

    // 4-tab navigation: カレンダー / 戦略 / ナレッジ / 分析
    const navItems = [
        { href: '/', icon: CalendarDays, label: 'カレンダー' },
        { href: '/today', icon: Target, label: '戦略' },
        { href: '/knowledge', icon: Library, label: 'ナレッジ' },
        { href: '/analysis', icon: BarChart3, label: '分析' },
    ]

    // Don't show nav on login page
    if (pathname === '/login') return null

    return (
        <nav className={cn(
            "fixed bottom-0 left-0 right-0 md:hidden z-50",
            // 髪の毛線 + 上向き薄い影でソフトに分離
            "border-t border-slate-200 dark:border-slate-800",
            "shadow-[0_-4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.2)]",
            // ナビだけ1段ズラした背景
            "bg-surface-1"
        )}>
            <div className="grid grid-cols-4 h-16 items-center pb-[env(safe-area-inset-bottom)]">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full min-h-[44px] gap-0.5 relative transition-colors",
                                // 選択中: primary色 + テキスト色
                                // 非選択: 徹底的に薄く
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground/70"
                            )}
                        >
                            <Icon className={cn(
                                "h-5 w-5 transition-transform",
                                isActive && "scale-110"
                            )} />
                            <span className={cn(
                                "text-[10px]",
                                isActive ? "font-bold" : "font-medium"
                            )}>{item.label}</span>
                            {/* 選択中インジケーター（ドット） */}
                            {isActive && (
                                <span className="absolute top-1.5 w-1 h-1 rounded-full bg-primary" />
                            )}
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
