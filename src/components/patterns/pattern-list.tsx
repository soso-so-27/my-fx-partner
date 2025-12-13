"use client"

import { useState, useEffect } from "react"
import { Target, Plus, Trash2, Clock, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pattern, SUPPORTED_CURRENCY_PAIRS, SUPPORTED_TIMEFRAMES } from "@/lib/pattern-service"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

interface PatternListProps {
    userId: string
}

export function PatternList({ userId }: PatternListProps) {
    const [patterns, setPatterns] = useState<Pattern[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const { toast } = useToast()

    const fetchPatterns = async () => {
        try {
            const res = await fetch('/api/patterns')
            if (res.ok) {
                const data = await res.json()
                setPatterns(data.patterns || [])
            }
        } catch (error) {
            console.error('Error fetching patterns:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchPatterns()
    }, [])

    const handleDelete = async (patternId: string) => {
        if (!confirm('このパターンを削除しますか？')) return

        try {
            const res = await fetch(`/api/patterns/${patternId}`, { method: 'DELETE' })
            if (res.ok) {
                setPatterns(patterns.filter(p => p.id !== patternId))
                toast({ title: "パターンを削除しました" })
            } else {
                toast({ title: "削除に失敗しました", variant: "destructive" })
            }
        } catch (error) {
            console.error('Error deleting pattern:', error)
            toast({ title: "削除に失敗しました", variant: "destructive" })
        }
    }

    const handlePatternCreated = () => {
        setIsDialogOpen(false)
        fetchPatterns()
        toast({ title: "パターンを登録しました", description: "類似パターン検出時に通知されます" })
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2].map(i => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="h-24" />
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    登録済み: {patterns.length} / 1 パターン
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" disabled={patterns.length >= 1}>
                            <Plus className="h-4 w-4 mr-1" />
                            追加
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>パターンを登録</DialogTitle>
                        </DialogHeader>
                        <PatternForm onSuccess={handlePatternCreated} />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Empty State */}
            {patterns.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Target className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="font-semibold mb-2">パターンを登録しよう</h3>
                        <p className="text-sm text-muted-foreground text-center max-w-xs mb-4">
                            得意なチャートパターンのスクリーンショットを登録すると、
                            類似パターン出現時に通知を受け取れます。
                        </p>
                        <Button onClick={() => setIsDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            最初のパターンを登録
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                /* Pattern Cards */
                patterns.map(pattern => (
                    <Card key={pattern.id} className="overflow-hidden">
                        <div className="flex">
                            {/* Pattern Image */}
                            <div className="w-24 h-24 bg-muted flex-shrink-0">
                                {pattern.imageUrl ? (
                                    <img
                                        src={pattern.imageUrl}
                                        alt={pattern.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Target className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                )}
                            </div>

                            {/* Pattern Info */}
                            <CardContent className="flex-1 p-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-semibold">{pattern.name}</h4>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                            <Badge variant="secondary" className="text-xs">
                                                {pattern.currencyPair}
                                            </Badge>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {SUPPORTED_TIMEFRAMES.find(t => t.value === pattern.timeframe)?.label || pattern.timeframe}
                                            </span>
                                            {pattern.direction && (
                                                <span className="flex items-center gap-1">
                                                    {pattern.direction === 'long' ? (
                                                        <TrendingUp className="h-3 w-3 text-green-500" />
                                                    ) : (
                                                        <TrendingDown className="h-3 w-3 text-red-500" />
                                                    )}
                                                    {pattern.direction === 'long' ? 'ロング' : 'ショート'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDelete(pattern.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </div>
                    </Card>
                ))
            )}

            {/* Upgrade Prompt */}
            {patterns.length >= 1 && (
                <Card className="border-dashed">
                    <CardContent className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                            もっとパターンを登録したい場合は、Proプランにアップグレードしてください。
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

// Pattern Registration Form
function PatternForm({ onSuccess }: { onSuccess: () => void }) {
    const [name, setName] = useState("")
    const [currencyPair, setCurrencyPair] = useState("")
    const [timeframe, setTimeframe] = useState("")
    const [direction, setDirection] = useState<string>("")
    const [imageUrl, setImageUrl] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name || !currencyPair || !timeframe) {
            toast({ title: "必須項目を入力してください", variant: "destructive" })
            return
        }

        // For MVP, use placeholder image URL
        const finalImageUrl = imageUrl || "https://via.placeholder.com/400x300?text=Pattern"

        setIsSubmitting(true)
        try {
            const res = await fetch('/api/patterns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    currencyPair,
                    timeframe,
                    direction: direction || null,
                    imageUrl: finalImageUrl,
                })
            })

            if (res.ok) {
                onSuccess()
            } else {
                const data = await res.json()
                toast({
                    title: data.error || "登録に失敗しました",
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error('Error creating pattern:', error)
            toast({ title: "登録に失敗しました", variant: "destructive" })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pattern Name */}
            <div className="space-y-2">
                <Label htmlFor="name">パターン名 *</Label>
                <Input
                    id="name"
                    placeholder="例: 5分押し目ロング"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>

            {/* Currency Pair */}
            <div className="space-y-2">
                <Label>通貨ペア *</Label>
                <Select value={currencyPair} onValueChange={setCurrencyPair}>
                    <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                        {SUPPORTED_CURRENCY_PAIRS.map(pair => (
                            <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Timeframe */}
            <div className="space-y-2">
                <Label>時間足 *</Label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                        {SUPPORTED_TIMEFRAMES.map(tf => (
                            <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Direction (Optional) */}
            <div className="space-y-2">
                <Label>想定方向（任意）</Label>
                <Select value={direction} onValueChange={setDirection}>
                    <SelectTrigger>
                        <SelectValue placeholder="指定なし" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">指定なし</SelectItem>
                        <SelectItem value="long">ロング</SelectItem>
                        <SelectItem value="short">ショート</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Image URL (Temporary for MVP) */}
            <div className="space-y-2">
                <Label>パターン画像URL（任意）</Label>
                <Input
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                    ※ 画像アップロード機能は開発中です
                </p>
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "登録中..." : "パターンを登録"}
            </Button>
        </form>
    )
}
