"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bot, Smile, Frown, Flame, Ghost } from "lucide-react"
import { cn } from "@/lib/utils"

interface AIPartnerWidgetProps {
    userName?: string
    winRate?: number
    verifiedRate?: number // Rule compliance
}

export function AIPartnerWidget({ userName, winRate, verifiedRate }: AIPartnerWidgetProps) {
    const [mood, setMood] = useState<'calm' | 'anxious' | 'angry' | null>(null)
    const [message, setMessage] = useState("")

    useEffect(() => {
        // Simple logic for initial message
        const getInitialMessage = () => {
            if (verifiedRate !== undefined && verifiedRate < 50) {
                return "最近、少しルールを破りがちのようです。焦らず、まずは深呼吸しましょう。"
            }
            if (winRate !== undefined && winRate > 70) {
                return "素晴らしい調子です！この調子で、慢心せずにいきましょう。"
            }
            const hour = new Date().getHours()
            if (hour < 12) return "おはようございます。今日のトレードプランは決まりましたか？"
            if (hour < 18) return "お疲れ様です。メンタルは落ち着いていますか？"
            return "こんばんは。無理なトレードは控えて、明日への準備をしましょう。"
        }
        setMessage(getInitialMessage())
    }, [verifiedRate, winRate])

    const handleMoodSelect = (selectedMood: 'calm' | 'anxious' | 'angry') => {
        setMood(selectedMood)
        // In a real app, we would log this to the backend
        if (selectedMood === 'calm') {
            setMessage("良い状態ですね。冷静な判断ができるはずです。")
        } else if (selectedMood === 'anxious') {
            setMessage("不安がある時は、一度チャートから離れるのも戦略です。5分休憩しませんか？")
        } else if (selectedMood === 'angry') {
            setMessage("危険な状態です。リベンジトレードのリスクが高いです。今日はもうPCを閉じましょう。")
        }
    }

    return (
        <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-none shadow-lg text-white mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
            <CardContent className="p-6">
                <div className="flex items-start gap-4">
                    <div className="relative">
                        <Avatar className="h-14 w-14 lg:h-16 lg:w-16 border-2 border-solo-gold/50 shadow-gold-glow">
                            <AvatarImage src="/ai-avatar.png" alt="AI Agent" />
                            <AvatarFallback className="bg-solo-navy text-solo-gold">
                                <Bot className="h-8 w-8 lg:h-9 lg:w-9" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 lg:w-4 lg:h-4 rounded-full border-2 border-slate-900"></div>
                    </div>

                    <div className="flex-1 space-y-3">
                        <div className="bg-white/10 rounded-2xl p-4 lg:p-5 rounded-tl-none relative backdrop-blur-sm border border-white/5">
                            <p className="text-base lg:text-lg leading-relaxed font-medium">
                                {userName && <span className="font-bold block mb-1 text-sm lg:text-base opacity-90">{userName}さん</span>}
                                {message}
                            </p>
                        </div>

                        {!mood && (
                            <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in duration-500 delay-300">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMoodSelect('calm')}
                                    className="bg-white/5 border-white/10 hover:bg-green-500/20 hover:text-green-300 hover:border-green-500/50 transition-all text-sm h-9 px-4"
                                >
                                    <Smile className="mr-2 h-4 w-4" />
                                    落ち着いている
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMoodSelect('anxious')}
                                    className="bg-white/5 border-white/10 hover:bg-yellow-500/20 hover:text-yellow-300 hover:border-yellow-500/50 transition-all text-sm h-9 px-4"
                                >
                                    <Ghost className="mr-2 h-4 w-4" />
                                    不安・迷い
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMoodSelect('angry')}
                                    className="bg-white/5 border-white/10 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/50 transition-all text-sm h-9 px-4"
                                >
                                    <Flame className="mr-2 h-4 w-4" />
                                    イライラ・焦り
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
