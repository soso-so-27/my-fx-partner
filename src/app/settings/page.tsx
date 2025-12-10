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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { RULE_TEMPLATES } from "@/lib/rule-templates"
import { tradeRuleService } from "@/lib/trade-rule-service"
import { ModeToggle } from "@/components/ui/mode-toggle"

export default function SettingsPage() {
    const [mounted, setMounted] = useState(false)
    const { user } = useAuth()
    const { toast } = useToast()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [displayName, setDisplayName] = useState("")
    const [bio, setBio] = useState("")
    const [avatarUrl, setAvatarUrl] = useState("")
    const [saving, setSaving] = useState(false)
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
    const [applyingTemplate, setApplyingTemplate] = useState(false)

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

        if (!user) return

        try {
            const dataUrl = await profileService.uploadAvatar(user.id, file)
            if (dataUrl) {
                setAvatarUrl(dataUrl)
            } else {
                throw new Error("Upload failed")
            }
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

    const handleApplyTemplate = async () => {
        if (!user || !selectedTemplateId) return
        setApplyingTemplate(true)
        try {
            const template = RULE_TEMPLATES.find(t => t.id === selectedTemplateId)
            if (!template) return

            // Create rules from template
            for (const rule of template.rules) {
                await tradeRuleService.createRule({
                    title: rule.title,
                    category: rule.category,
                    description: rule.description,
                    isActive: true
                }, user.id)
            }

            toast({
                title: "ルールを適用しました",
                description: `${template.name}のルールを追加しました。`
            })
            setSelectedTemplateId("")
        } catch (error) {
            toast({
                title: "適用に失敗しました",
                description: "もう一度お試しください。",
                variant: "destructive"
            })
        } finally {
            setApplyingTemplate(false)
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

                    {/* Trade Rules */}
                    <Card>
                        <CardHeader>
                            <CardTitle>トレードルール設定</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>テンプレートから一括登録</Label>
                                <p className="text-sm text-muted-foreground">
                                    スタイルに合わせたルールを自動で設定します。
                                    <span className="text-red-500 text-xs ml-1">※既存のルールは上書きされます</span>
                                </p>
                                <div className="flex gap-2">
                                    <Select
                                        value={selectedTemplateId}
                                        onValueChange={setSelectedTemplateId}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="スタイルを選択..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {RULE_TEMPLATES.map((template) => (
                                                <SelectItem key={template.id} value={template.id}>
                                                    {template.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        onClick={handleApplyTemplate}
                                        disabled={!selectedTemplateId || applyingTemplate}
                                        variant="outline"
                                    >
                                        {applyingTemplate ? "適用中..." : "適用"}
                                    </Button>
                                </div>
                                {selectedTemplateId && (
                                    <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
                                        {RULE_TEMPLATES.find(t => t.id === selectedTemplateId)?.description}
                                    </div>
                                )}
                            </div>
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

                    {/* App Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle>アプリ設定</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label>テーマ設定</Label>
                                    <p className="text-sm text-muted-foreground">
                                        画面の明るさを切り替えます
                                    </p>
                                </div>
                                <ModeToggle />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Account Actions */}
                    <Card className="border-destructive/20">
                        <CardHeader>
                            <CardTitle>アカウント</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button
                                variant="outline"
                                className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={async () => {
                                    const { signOut } = await import("@/contexts/auth-context").then(m => ({ signOut: () => { } }))
                                    // Direct sign out
                                    const supabase = (await import("@/lib/supabase")).supabase
                                    await supabase.auth.signOut()
                                    window.location.href = "/login"
                                }}
                            >
                                ログアウト
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ProtectedRoute>
    )
}
