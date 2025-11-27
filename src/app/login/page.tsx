"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const { signIn, signUp } = useAuth()
    const router = useRouter()

    const [successMessage, setSuccessMessage] = useState("")

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setSuccessMessage("")
        setLoading(true)

        try {
            await signIn(email, password)
            router.push("/")
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setSuccessMessage("")
        setLoading(true)

        try {
            await signUp(email, password)
            setSuccessMessage("確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。")
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-gold">My FX Partner</CardTitle>
                    <CardDescription>トレード記録・分析アプリ</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login">ログイン</TabsTrigger>
                            <TabsTrigger value="signup">新規登録</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <form onSubmit={handleSignIn} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="login-email">メールアドレス</Label>
                                    <Input
                                        id="login-email"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="login-password">パスワード</Label>
                                    <Input
                                        id="login-password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                {error && (
                                    <div className="text-sm text-destructive">{error}</div>
                                )}
                                <Button
                                    type="submit"
                                    className="w-full bg-gold hover:bg-gold/80 text-black"
                                    disabled={loading}
                                >
                                    {loading ? "処理中..." : "ログイン"}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="signup">
                            <form onSubmit={handleSignUp} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="signup-email">メールアドレス</Label>
                                    <Input
                                        id="signup-email"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-password">パスワード</Label>
                                    <Input
                                        id="signup-password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>
                                {error && (
                                    <div className="text-sm text-destructive">{error}</div>
                                )}
                                {successMessage && (
                                    <div className="text-sm text-green-500">{successMessage}</div>
                                )}
                                <Button
                                    type="submit"
                                    className="w-full bg-gold hover:bg-gold/80 text-black"
                                    disabled={loading}
                                >
                                    {loading ? "処理中..." : "新規登録"}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
