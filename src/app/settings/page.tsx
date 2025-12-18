"use client"

import { GmailConnectButton } from "./gmail-connect-button"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { ArrowLeft, User, Upload, LogOut, Mail, Bell, Database, Settings2 } from "lucide-react"
import Link from "next/link"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RULE_TEMPLATES } from "@/lib/rule-templates"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { DataManagementCard } from "@/components/settings/data-management-card"
import { EmailForwardingSetup } from "@/components/settings/email-forwarding-setup"

export default function SettingsPage() {
    const { data: session } = useSession()
    const user = session?.user
    const { toast } = useToast()
    const [mounted, setMounted] = useState(false)

    // Profile state
    const [displayName, setDisplayName] = useState("")
    const [bio, setBio] = useState("")
    const [avatarUrl, setAvatarUrl] = useState("")
    const [saving, setSaving] = useState(false)

    // Template state
    const [selectedTemplateId, setSelectedTemplateId] = useState("")
    const [applyingTemplate, setApplyingTemplate] = useState(false)

    useEffect(() => {
        setMounted(true)
        loadProfile()
    }, [])

    async function loadProfile() {
        if (!user?.email) return
        const { data } = await supabase
            .from("profiles")
            .select("display_name, bio, avatar_url")
            .eq("email", user.email)
            .single()

        if (data) {
            setDisplayName(data.display_name || "")
            setBio(data.bio || "")
            setAvatarUrl(data.avatar_url || "")
        }
    }

    async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            toast({ title: "ファイルサイズは2MB以下にしてください", variant: "destructive" })
            return
        }

        const formData = new FormData()
        formData.append("file", file)
        formData.append("type", "avatar")

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            if (!response.ok) throw new Error("Upload failed")

            const { url } = await response.json()
            setAvatarUrl(url)

            // Auto-save avatar to DB
            if (user?.email) {
                await supabase
                    .from("profiles")
                    .update({ avatar_url: url })
                    .eq("email", user.email)
            }

            toast({ title: "アイコンを保存しました" })
        } catch {
            toast({ title: "アップロードに失敗しました", variant: "destructive" })
        }
    }

    async function handleSaveProfile() {
        if (!user?.email) return
        setSaving(true)

        try {
            // Use API route to bypass RLS
            const response = await fetch('/api/profiles', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    display_name: displayName,
                    bio: bio,
                    avatar_url: avatarUrl,
                })
            })

            if (!response.ok) throw new Error('Failed to save')
            toast({ title: "プロフィールを保存しました" })
        } catch {
            toast({ title: "保存に失敗しました", variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    async function handleApplyTemplate() {
        if (!selectedTemplateId || !user?.email) return
        setApplyingTemplate(true)

        try {
            const template = RULE_TEMPLATES.find(t => t.id === selectedTemplateId)
            if (!template) throw new Error("Template not found")

            const { data: profile } = await supabase
                .from("profiles")
                .select("id")
                .eq("email", user.email)
                .single()

            if (!profile) throw new Error("Profile not found")

            await supabase.from("trading_rules").delete().eq("user_id", profile.id)

            const rulesToInsert = template.rules.map(rule => ({
                user_id: profile.id,
                ...rule
            }))

            const { error } = await supabase.from("trading_rules").insert(rulesToInsert)
            if (error) throw error

            toast({ title: `「${template.name}」のルールを適用しました` })
        } catch {
            toast({ title: "ルールの適用に失敗しました", variant: "destructive" })
        } finally {
            setApplyingTemplate(false)
        }
    }

    if (!mounted) return null

    return (
        <ProtectedRoute>
            <div className="container mx-auto p-4 max-w-4xl pb-20">
                <header className="sticky top-0 z-50 -mx-4 px-4 pt-[env(safe-area-inset-top)] pb-2 bg-background border-b border-border flex items-center gap-2 mb-4">
                    <Link href="/">
                        <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center">
                        <User className="h-4 w-4 text-solo-navy dark:text-solo-gold" />
                    </div>
                    <h1 className="text-base font-bold">設定</h1>
                </header>

                <Tabs defaultValue="account" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3 h-auto">
                        <TabsTrigger value="account" className="flex flex-col gap-1 py-2 text-xs">
                            <User className="h-4 w-4" />
                            アカウント
                        </TabsTrigger>
                        <TabsTrigger value="sync" className="flex flex-col gap-1 py-2 text-xs">
                            <Mail className="h-4 w-4" />
                            同期
                        </TabsTrigger>
                        <TabsTrigger value="customize" className="flex flex-col gap-1 py-2 text-xs">
                            <Settings2 className="h-4 w-4" />
                            カスタマイズ
                        </TabsTrigger>
                    </TabsList>

                    {/* Account Tab */}
                    <TabsContent value="account" className="space-y-4">
                        {/* Profile */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">プロフィール</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-solo-gold/20">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-8 w-8 text-muted-foreground" />
                                        )}
                                    </div>
                                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                                        <div className="flex items-center gap-2 px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-sm">
                                            <Upload className="h-4 w-4" />
                                            変更
                                        </div>
                                        <input
                                            id="avatar-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleAvatarUpload}
                                        />
                                    </Label>
                                </div>

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

                                <div className="space-y-2">
                                    <Label htmlFor="bio">自己紹介</Label>
                                    <Textarea
                                        id="bio"
                                        placeholder="例: FX歴3年。スキャルピング中心。"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        maxLength={200}
                                        rows={2}
                                    />
                                </div>

                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={saving}
                                    className="w-full bg-solo-gold hover:bg-solo-gold/80 text-solo-black"
                                    size="sm"
                                >
                                    {saving ? "保存中..." : "保存"}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Theme */}
                        <Card>
                            <CardContent className="py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-sm">テーマ</p>
                                        <p className="text-xs text-muted-foreground">ライト/ダーク/システム</p>
                                    </div>
                                    <ModeToggle />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Logout */}
                        <Card className="border-destructive/20">
                            <CardContent className="py-4">
                                <Button
                                    variant="outline"
                                    className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                                    onClick={() => {
                                        import("next-auth/react").then(({ signOut }) => {
                                            signOut({ callbackUrl: "/login" })
                                        })
                                    }}
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    ログアウト
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Sync Tab */}
                    <TabsContent value="sync" className="space-y-4">
                        <EmailForwardingSetup />
                        {user?.email === "nakanishisoya@gmail.com" && (
                            <>
                                <NotificationSettings />
                                <DataManagementCard />
                            </>
                        )}
                    </TabsContent>

                    {/* Customize Tab */}
                    <TabsContent value="customize" className="space-y-4">
                        {/* Trade Rules */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">トレードルール</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-xs text-muted-foreground">
                                    テンプレートから一括登録
                                    <span className="text-red-500 ml-1">※既存ルール上書き</span>
                                </p>
                                <div className="flex gap-2">
                                    <Select
                                        value={selectedTemplateId}
                                        onValueChange={setSelectedTemplateId}
                                    >
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="スタイルを選択" />
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
                                        size="sm"
                                    >
                                        {applyingTemplate ? "..." : "適用"}
                                    </Button>
                                </div>
                                {selectedTemplateId && (
                                    <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                        {RULE_TEMPLATES.find(t => t.id === selectedTemplateId)?.description}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Data Import */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">データインポート (Beta)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-xs text-muted-foreground">
                                    MT4/MT5の履歴やCSVを貼り付け
                                </p>
                                <Textarea
                                    placeholder="例: buy 0.1 USDJPY at 150.00..."
                                    className="font-mono text-xs"
                                    rows={3}
                                />
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => toast({ title: "解析機能は準備中です" })}
                                >
                                    解析プレビュー
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </ProtectedRoute>
    )
}
