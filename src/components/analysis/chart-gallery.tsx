"use client"

import { useState, useRef } from "react"
import { Trade, ChartImage } from "@/types/trade"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Image as ImageIcon, ZoomIn, TrendingUp, TrendingDown, Plus, Upload, Loader2, X, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { compressImage } from "@/lib/image-utils"
import { tradeService } from "@/lib/trade-service"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"

interface ChartGalleryProps {
    trades: Trade[]
    onTradeCreated?: () => void
}

interface GalleryItem {
    image: ChartImage
    trade: Trade
}

export function ChartGallery({ trades, onTradeCreated }: ChartGalleryProps) {
    const { user } = useAuth()
    const { toast } = useToast()

    // Upload State
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [uploadFile, setUploadFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Form State
    const [pair, setPair] = useState("")
    const [direction, setDirection] = useState<'BUY' | 'SELL' | 'ANALYSIS'>('ANALYSIS')
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd HH:mm'))
    const [note, setNote] = useState("")

    // Extract all images with their trade context
    const galleryItems: GalleryItem[] = trades.flatMap(trade =>
        (trade.chartImages || []).map(image => ({
            image,
            trade
        }))
    ).sort((a, b) => new Date(b.trade.entryTime).getTime() - new Date(a.trade.entryTime).getTime())

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setUploadFile(file)
            // Create preview
            const reader = new FileReader()
            reader.onload = (e) => setPreviewUrl(e.target?.result as string)
            reader.readAsDataURL(file)
        }
    }

    const handleUpload = async () => {
        if (!user || !uploadFile) return
        setIsUploading(true)
        try {
            // Compress image (Stronger compression for safety)
            const base64Image = await compressImage(uploadFile, 800, 0.6)

            // Create minimal trade with image
            await tradeService.createTrade({
                pair: pair.trim().toUpperCase() || "WATCH", // Default to WATCH if empty
                direction,
                entryPrice: 0,
                notes: note,
                entryTime: new Date(date).toISOString(),
                chartImages: [{
                    id: crypto.randomUUID(),
                    url: base64Image,
                    type: direction === 'ANALYSIS' ? 'analysis' : 'entry',
                    aiAnalyzed: false,
                    uploadedAt: new Date().toISOString(),
                    fileSize: uploadFile.size,
                    mimeType: uploadFile.type
                }]
            }, user.id)

            toast({ title: "画像を追加しました" })
            setIsUploadOpen(false)
            setUploadFile(null)
            setPreviewUrl(null)
            setPair("")
            setNote("")
            setDirection('ANALYSIS')

            if (onTradeCreated) onTradeCreated()
        } catch (error: any) {
            console.error(error)
            toast({
                title: "追加に失敗しました",
                description: error.message || "画像のサイズが大きすぎるか、ネットワークエラーの可能性があります",
                variant: "destructive"
            })
        } finally {
            setIsUploading(false)
        }
    }

    const getDirectionBadge = (dir: string) => {
        if (dir === 'BUY') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        if (dir === 'SELL') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }

    return (
        <div className="relative min-h-[50vh]">
            {/* FAB for Adding Image */}
            <div className="fixed bottom-24 right-4 z-10 md:absolute md:bottom-6 md:right-4">
                <Button
                    className="h-14 w-14 rounded-full shadow-lg bg-solo-navy dark:bg-solo-gold hover:opacity-90 transition-transform active:scale-95"
                    onClick={() => setIsUploadOpen(true)}
                >
                    <Plus className="h-6 w-6 text-white dark:text-black" />
                </Button>
            </div>

            {galleryItems.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>チャート画像がありません</p>
                    <p className="text-sm mt-2">右下のボタンから画像をアップロードするか<br />相談機能で送信した画像が表示されます</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20">
                    {galleryItems.map((item) => (
                        <Dialog key={item.image.id}>
                            <DialogTrigger asChild>
                                <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group relative border-muted">
                                    {/* Image Thumbnail */}
                                    <div className="aspect-square relative bg-muted">
                                        <img
                                            src={item.image.thumbnailUrl || item.image.url}
                                            alt="Chart"
                                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <ZoomIn className="h-6 w-6 text-white drop-shadow-md" />
                                        </div>
                                    </div>

                                    {/* Mini Info */}
                                    <CardContent className="p-3">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-xs truncate max-w-[80px]">{item.trade.pair}</span>
                                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-0 ${getDirectionBadge(item.trade.direction)}`}>
                                                {item.trade.direction === 'ANALYSIS' ? 'WATCH' : item.trade.direction}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                                            <span>{format(new Date(item.trade.entryTime), 'MM/dd')}</span>
                                            {item.trade.direction !== 'ANALYSIS' && item.trade.pnl?.pips !== undefined && (
                                                <div className={`flex items-center gap-0.5 font-medium ${(item.trade.pnl.pips || 0) > 0 ? 'text-profit' : 'text-loss'
                                                    }`}>
                                                    {(item.trade.pnl.pips || 0) > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                                    {item.trade.pnl.pips}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </DialogTrigger>

                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto p-0 border-0 bg-transparent shadow-none">
                                <div className="relative">
                                    <img
                                        src={item.image.url}
                                        alt="Chart Detail"
                                        className="w-full h-auto rounded-lg shadow-2xl ring-1 ring-border bg-black/50"
                                    />
                                    {/* Overlay Info */}
                                    <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur-md p-4 rounded-lg shadow-lg border border-border/50 text-sm">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold mb-1 flex items-center gap-2">
                                                    {item.trade.pair}
                                                    <Badge variant="outline" className={getDirectionBadge(item.trade.direction)}>
                                                        {item.trade.direction === 'ANALYSIS' ? 'WATCH' : item.trade.direction}
                                                    </Badge>
                                                    <span className="text-muted-foreground font-normal text-xs ml-2">
                                                        {format(new Date(item.trade.entryTime), 'yyyy/MM/dd HH:mm', { locale: ja })}
                                                    </span>
                                                </h3>
                                                <p className="text-muted-foreground text-xs line-clamp-2">{item.trade.notes}</p>
                                            </div>
                                            {item.trade.direction !== 'ANALYSIS' && (item.trade.pnl.amount || item.trade.pnl.pips) && (
                                                <div className="text-right">
                                                    <div className="font-bold text-lg mb-0.5">
                                                        {(item.trade.pnl.amount || 0).toLocaleString()}円
                                                    </div>
                                                    <div className={`text-xs ${(item.trade.pnl.pips || 0) > 0 ? 'text-profit' : 'text-loss'}`}>
                                                        {(item.trade.pnl.pips || 0) > 0 ? '+' : ''}{item.trade.pnl.pips} pips
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {item.image.aiInsights && (
                                            <div className="mt-3 pt-3 border-t border-border/50">
                                                <p className="text-xs font-bold mb-1 text-solo-navy dark:text-solo-gold">AI分析コメント</p>
                                                <p className="text-xs text-muted-foreground">{item.image.aiInsights}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    ))}
                </div>
            )}

            {/* Upload Dialog */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>画像を追加 (簡易記録)</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Image Upload Area */}
                        <div
                            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors flex flex-col items-center justify-center min-h-[150px]"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileSelect}
                            />
                            {previewUrl ? (
                                <div className="relative w-full h-40">
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                                    <Button
                                        variant="destructive" size="icon" className="absolute top-0 right-0 h-6 w-6 rounded-full shadow-md"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setUploadFile(null)
                                            setPreviewUrl(null)
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">クリックして画像を選択</p>
                                </>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>売買 / 目的</Label>
                                <Select value={direction} onValueChange={(v: any) => setDirection(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ANALYSIS"><div className="flex items-center gap-2"><Eye className="h-3 w-3" /> 分析 (Entryなし)</div></SelectItem>
                                        <SelectItem value="BUY"><div className="flex items-center gap-2"><TrendingUp className="h-3 w-3 text-red-500" /> BUY (ロング)</div></SelectItem>
                                        <SelectItem value="SELL"><div className="flex items-center gap-2"><TrendingDown className="h-3 w-3 text-blue-500" /> SELL (ショート)</div></SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>通貨ペア (任意)</Label>
                                <Input
                                    placeholder="例: USDJPY (空欄ならWATCH)"
                                    value={pair}
                                    onChange={(e) => setPair(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>メモ</Label>
                            <Textarea
                                placeholder="気付き、監視ポイントなど..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="min-h-[80px]"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUploadOpen(false)}>キャンセル</Button>
                        <Button onClick={handleUpload} disabled={isUploading || !uploadFile}>
                            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            追加
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
