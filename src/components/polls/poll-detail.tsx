"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Poll, PollVote } from "@/lib/poll-service"
import { useToast } from "@/components/ui/use-toast"
import { ArrowUpRight, ArrowDownRight, ArrowRight, Activity, TrendingUp } from "lucide-react"

interface PollDetailProps {
    poll: Poll
    initialVote: PollVote | null
    initialResults: Record<string, number> | null
}

export function PollDetail({ poll, initialVote, initialResults }: PollDetailProps) {
    const [vote, setVote] = useState<PollVote | null>(initialVote)
    const [selectedChoice, setSelectedChoice] = useState("")
    const [confidence, setConfidence] = useState("mid")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { toast } = useToast()

    const isClosed = poll.status === 'closed' || new Date(poll.end_at) < new Date()
    const showResults = !!vote || (isClosed && poll.result_visibility !== 'after_vote')

    const choices = [
        { value: 'up', label: '上昇', icon: ArrowUpRight, color: 'text-red-500' },
        { value: 'down', label: '下落', icon: ArrowDownRight, color: 'text-blue-500' },
        { value: 'flat', label: '横ばい', icon: ArrowRight, color: 'text-gray-500' }
    ]

    const handleVote = async () => {
        if (!selectedChoice) return
        setIsSubmitting(true)
        try {
            const res = await fetch('/api/polls/vote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pollId: poll.id,
                    choice: selectedChoice,
                    confidence
                })
            })

            if (!res.ok) throw new Error('Vote failed')

            toast({ title: "投票しました！" })
            setVote({
                poll_id: poll.id,
                user_id: 'me',
                choice: selectedChoice,
                confidence: confidence as any,
                created_at: new Date().toISOString()
            })
        } catch (error) {
            toast({
                title: "エラーが発生しました",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (showResults) {
        // Results View
        return (
            <Card>
                <CardHeader>
                    <CardTitle>投票結果</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <p className="font-bold text-lg mb-1">
                            あなたの予想: {choices.find(c => c.value === vote?.choice)?.label}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            自信度: {vote?.confidence === 'high' ? '高' : vote?.confidence === 'low' ? '低' : '中'}
                        </p>
                    </div>

                    {/* Mock Results Graph if results are null (for demo) */}
                    <div className="space-y-4">
                        {choices.map(choice => {
                            // Calculate percentage based on initialResults or Mock
                            // Simply show layout for now
                            return (
                                <div key={choice.value} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <choice.icon className={`h-4 w-4 ${choice.color}`} />
                                            {choice.label}
                                        </span>
                                        <span>--%</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary/20 w-1/3" />
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="text-center text-xs text-muted-foreground pt-4 border-t">
                        結果確定をお待ちください
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Voting Form
    return (
        <Card>
            <CardHeader>
                <CardTitle>あなたの予想は？</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                    {choices.map((choice) => (
                        <div
                            key={choice.value}
                            onClick={() => setSelectedChoice(choice.value)}
                            className={`
                                cursor-pointer flex flex-col items-center justify-between rounded-md border-2 p-4 h-24 transition-all
                                ${selectedChoice === choice.value ? 'border-primary bg-accent text-accent-foreground' : 'border-muted bg-popover hover:bg-accent hover:text-accent-foreground'}
                            `}
                        >
                            <choice.icon className={`mb-3 h-6 w-6 ${choice.value === selectedChoice ? choice.color : 'text-muted-foreground'}`} />
                            <span className="text-sm font-medium">{choice.label}</span>
                        </div>
                    ))}
                </div>

                <div className="space-y-3">
                    <Label>自信度</Label>
                    <div className="flex gap-2">
                        {['low', 'mid', 'high'].map((level) => (
                            <Button
                                key={level}
                                variant={confidence === level ? "default" : "outline"}
                                size="sm"
                                onClick={() => setConfidence(level)}
                                className="flex-1"
                            >
                                {level === 'low' ? '低' : level === 'high' ? '高' : '中'}
                            </Button>
                        ))}
                    </div>
                </div>

                <Button
                    className="w-full bg-solo-gold hover:bg-solo-gold/80 text-solo-black font-bold h-12"
                    onClick={handleVote}
                    disabled={!selectedChoice || isSubmitting}
                >
                    {isSubmitting ? "送信中..." : "投票する"}
                </Button>
            </CardContent>
        </Card>
    )
}
