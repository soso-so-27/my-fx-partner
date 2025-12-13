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
                        {/* Pattern Image */}
                        <div className="w-full h-32 bg-muted relative">
                            {pattern.imageUrl ? (
                                <img
                                    src={pattern.imageUrl}
                                    alt={pattern.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Target className="h-12 w-12 text-muted-foreground" />
                                </div>
                            )}
                            {/* Delete button overlay */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => handleDelete(pattern.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Pattern Info */}
                        <CardContent className="p-3">
                            <h4 className="font-semibold">{pattern.name}</h4>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
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
                        </CardContent>
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
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { toast } = useToast()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            toast({
                title: "サポートされていない形式です",
                description: "JPEG, PNG, GIF, WebP のみ対応",
                variant: "destructive"
            })
            return
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "ファイルサイズが大きすぎます",
                description: "5MB以下にしてください",
                variant: "destructive"
            })
            return
        }

        setImageFile(file)
        setImageUrl("") // Clear URL if file is selected

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setImagePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name || !currencyPair || !timeframe) {
            toast({ title: "必須項目を入力してください", variant: "destructive" })
            return
        }

        setIsSubmitting(true)
        let finalImageUrl = imageUrl || "https://via.placeholder.com/400x300?text=Pattern"

        try {
            // Upload image if file is selected
            if (imageFile) {
                setIsUploading(true)
                const formData = new FormData()
                formData.append('file', imageFile)
                formData.append('bucket', 'chart-images')

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                })

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json()
                    finalImageUrl = uploadData.url
                } else {
                    const uploadError = await uploadRes.json()
                    toast({
                        title: "画像アップロードに失敗しました",
                        description: uploadError.error,
                        variant: "destructive"
                    })
                    setIsSubmitting(false)
                    setIsUploading(false)
                    return
                }
                setIsUploading(false)
            }

            // Create pattern
            const res = await fetch('/api/patterns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    currencyPair,
                    timeframe,
                    direction: direction === "none" ? null : direction || null,
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

            {/* Image Upload */}
            <div className="space-y-2">
                <Label>パターン画像</Label>
                <div className="space-y-3">
                    {/* File Input */}
                    <div className="flex items-center gap-2">
                        <Input
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleFileChange}
                            className="cursor-pointer"
                        />
                    </div>

                    {/* Preview */}
                    {imagePreview && (
                        <div className="relative w-full h-40 bg-muted rounded-lg overflow-hidden">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-full object-contain"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    setImageFile(null)
                                    setImagePreview(null)
                                }}
                                className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {/* Or URL input */}
                    {!imageFile && (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">または URL を入力:</p>
                            <Input
                                placeholder="https://..."
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isUploading ? "画像アップロード中..." : isSubmitting ? "登録中..." : "パターンを登録"}
            </Button>
        </form>
    )
}
