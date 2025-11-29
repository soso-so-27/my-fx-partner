"use client"

import { useTheme } from "next-themes"
import { LogOut, User as UserIcon, Moon, Sun, Laptop, BookOpen, Settings } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { profileService } from "@/lib/profile-service"
import { UserProfile } from "@/types/user-profile"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"

export function UserMenu() {
    const { user, signOut } = useAuth()
    const { setTheme } = useTheme()
    const [profile, setProfile] = useState<UserProfile | null>(null)

    useEffect(() => {
        const loadProfile = async () => {
            if (!user) return
            const userProfile = await profileService.getUserProfile(user.id)
            setProfile(userProfile)
        }
        loadProfile()
    }, [user])

    if (!user) return null

    const handleSignOut = async () => {
        await signOut()
        window.location.href = "/login"
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 overflow-hidden border-2 border-solo-gold/20">
                    {profile?.avatarUrl ? (
                        <img src={profile.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                        <UserIcon className="h-5 w-5 text-solo-gold" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                            {profile?.displayName || "アカウント"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <Link href="/settings">
                    <DropdownMenuItem className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        設定
                    </DropdownMenuItem>
                </Link>

                <Link href="/settings/rules">
                    <DropdownMenuItem className="cursor-pointer">
                        <BookOpen className="mr-2 h-4 w-4" />
                        トレードルール
                    </DropdownMenuItem>
                </Link>

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="ml-2">テーマ切替</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => setTheme("light")}>
                            <Sun className="mr-2 h-4 w-4" />
                            ライト
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                            <Moon className="mr-2 h-4 w-4" />
                            ダーク
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")}>
                            <Laptop className="mr-2 h-4 w-4" />
                            システム
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    ログアウト
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
