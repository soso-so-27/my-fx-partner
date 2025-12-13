"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { Bell, BellOff, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'

export function NotificationSettings() {
    const {
        isSupported,
        isSubscribed,
        permission,
        error,
        isLoading,
        subscribe,
        unsubscribe,
    } = usePushNotifications()

    const handleToggle = async () => {
        if (isSubscribed) {
            await unsubscribe()
        } else {
            await subscribe()
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    プッシュ通知
                </CardTitle>
                <CardDescription>
                    パターンアラートをリアルタイムで受け取る
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Support Status */}
                {!isSupported ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <p className="text-sm">
                            このブラウザではプッシュ通知がサポートされていません。
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Permission Status */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">通知を許可</Label>
                                <p className="text-sm text-muted-foreground">
                                    パターンが検出されたときに通知を受け取る
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {permission === 'denied' && (
                                    <Badge variant="destructive" className="text-xs">
                                        ブロック中
                                    </Badge>
                                )}
                                {isLoading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Switch
                                        checked={isSubscribed}
                                        onCheckedChange={handleToggle}
                                        disabled={permission === 'denied' || isLoading}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Status Message */}
                        {isSubscribed && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400">
                                <CheckCircle2 className="h-5 w-5 shrink-0" />
                                <p className="text-sm">
                                    通知が有効です。パターンアラートを受信できます。
                                </p>
                            </div>
                        )}

                        {permission === 'denied' && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-700 dark:text-red-400">
                                <BellOff className="h-5 w-5 shrink-0" />
                                <div className="text-sm">
                                    <p className="font-medium">通知がブロックされています</p>
                                    <p>ブラウザの設定から通知を許可してください。</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-700 dark:text-red-400">
                                <AlertTriangle className="h-5 w-5 shrink-0" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {/* Test Notification */}
                        {isSubscribed && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                    // Test local notification
                                    if ('Notification' in window && Notification.permission === 'granted') {
                                        new Notification('テスト通知', {
                                            body: 'プッシュ通知が正常に動作しています！',
                                            icon: '/icon-192.png',
                                        })
                                    }
                                }}
                            >
                                テスト通知を送信
                            </Button>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}
