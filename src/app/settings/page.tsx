"use client"

import { GmailConnectButton } from "./gmail-connect-button"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { profileService } from "@/lib/profile-service"
import { UserProfile } from "@/types/user-profile"
import { useToast } from "@/components/ui/use-toast"
import { User, Upload } from "lucide-react"

export default function SettingsPage() {
    const [mounted, setMounted] = useState(false)
    const { user } = useAuth()
    const { toast } = useToast()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [displayName, setDisplayName] = useState("")
    const [bio, setBio] = useState("")
    const [avatarUrl, setAvatarUrl] = useState("")
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        setMounted(true)
        loadProfile()
    }, [user])

    const loadProfile = async () => {
        if (!user) return
        const userProfile = await profileService.getUserProfile(user.id)
        if (userProfile) {
            setProfile(userProfile)
            setDisplayName(userProfile.displayName || "")
            setBio(userProfile.bio || "")
            setAvatarUrl(userProfile.avatarUrl || "")
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            toast({
                title: "ファイルサイズが大きすぎます",
                description: "2MB以下の画像を選択してください。",
                variant: "destructive"
            })
            return
        }

        try {
            const dataUrl = await profileService.uploadAvatar(file)
            setAvatarUrl(dataUrl)
        } catch (error) {
            toast({
                title: "アップロードに失敗しました",
                description: "もう一度お試しください。",
                variant: "destructive"
            })
        }
    }

    const handleSaveProfile = async () => {
        if (!user) return
        setSaving(true)
        try {
            await profileService.updateProfile(user.id, {
                displayName: displayName || undefined,
                bio: bio || undefined,
                avatarUrl: avatarUrl || undefined
            })
            toast({
                title: "保存しました",
                description: "プロフィールを更新しました。"
            })
            await loadProfile()
        } catch (error) {
            toast({
                title: "保存に失敗しました",
                description: "もう一度お試しください。",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    if (!mounted) return null

    return (
        <ProtectedRoute>
            <div className="container mx-auto p-4 max-w-4xl pb-24">
                <h1 className="text-2xl font-bold mb-6">設定</h1>

                <div className="space-y-6">
                    {/* Profile Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>プロフィール設定</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Avatar */}
                            <div className="space-y-2">
                                <Label>アイコン画像</Label>
                                <div className="flex items-center gap-4">
                                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-solo-gold/20">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-10 w-10 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="avatar-upload" className="cursor-pointer">
                                            <div className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                                                <Upload className="h-4 w-4" />
                                                <span className="text-sm">画像を選択</span>
                                            </div>
                                            <input
                                                id="avatar-upload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleAvatarUpload}
                                            />
                                        </Label>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            2MB以下 (JPG, PNG)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Display Name */}
                            <div className="space-y-2">
                                <Label htmlFor="displayName">表示名</Label>
                                <Input
                                    id="displayName"
                                    placeholder="例: トレーダー太郎"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    maxLength={50}
                                />
                            </div>

                            {/* Bio */}
                            <div className="space-y-2">
                                <Label htmlFor="bio">自己紹介</Label>
                                <Textarea
                                    id="bio"
                                    placeholder="例: FX歴3年。スキャルピング中心に取引しています。"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    maxLength={200}
                                    rows={3}
                                />
                                <p className="text-xs text-muted-foreground text-right">
                                    {bio.length}/200
                                </p>
                            </div>

                            <Button
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="w-full bg-solo-gold hover:bg-solo-gold/80 text-solo-black"
                            >
                                {saving ? "保存中..." : "保存する"}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* External Services */}
                    <Card>
                        <CardHeader>
                            <CardTitle>外部サービス連携</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                                <div className="space-y-1">
                                    <h3 className="font-medium flex items-center gap-2">
                                        Gmail連携
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Beta</span>
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        約定メールを自動で取り込み、トレード履歴に「Real」バッジを付与します。
                                    </p>
                                </div>
                                <GmailConnectButton />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ProtectedRoute>
    )
}
