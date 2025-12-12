"use client"

import { LogOut, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { profileService } from "@/lib/profile-service"
import { UserProfile } from "@/types/user-profile"
import { useSession, signOut } from "next-auth/react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserMenu() {
    const { data: session, status } = useSession()
    const [profile, setProfile] = useState<UserProfile | null>(null)

    useEffect(() => {
        const loadProfile = async () => {
            if (!session?.user?.email) return
            // Try to load profile if available
            try {
                // Note: This may fail if Supabase is not configured, which is fine
            } catch (e) {
                console.log('Profile loading skipped')
            }
        }
        loadProfile()
    }, [session])

    if (status !== "authenticated" || !session) return null

    const handleSignOut = () => {
        signOut({ callbackUrl: "/login" })
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 overflow-hidden border-2 border-solo-gold/20">
                    {session.user?.image ? (
                        <img src={session.user.image} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                        <UserIcon className="h-5 w-5 text-solo-gold" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                            {session.user?.name || "アカウント"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {session.user?.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onSelect={(e) => {
                        e.preventDefault()
                        console.log('Logout clicked')
                        signOut({ callbackUrl: "/login" })
                    }}
                    className="text-destructive cursor-pointer"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    ログアウト
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

