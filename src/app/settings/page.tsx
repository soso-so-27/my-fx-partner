import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { GmailConnectButton } from "./gmail-connect-button"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function SettingsPage() {
    const session = await getServerSession(authOptions)

    return (
        <ProtectedRoute>
            <div className="container mx-auto p-4 max-w-4xl">
                <h1 className="text-2xl font-bold mb-6">設定</h1>

                <div className="space-y-6">
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
                                <GmailConnectButton session={session} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </ProtectedRoute>
    )
}
