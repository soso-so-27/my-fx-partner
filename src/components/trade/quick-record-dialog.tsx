"use client"

import { useState } from "react"
import { tradeService } from "@/lib/trade-service"
import { CreateTradeInput } from "@/types/trade"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TagSelector } from "@/components/ui/tag-selector"
import { useAuth } from "@/contexts/auth-context"

interface QuickRecordDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function QuickRecordDialog({ open, onOpenChange, onSuccess }: QuickRecordDialogProps) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        pair: '',
        direction: 'BUY' as 'BUY' | 'SELL',
        entryPrice: '',
        exitPrice: '',
        pnl: '',
        notes: '',
        tags: [] as string[]
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)

        try {
            const trade: CreateTradeInput = {
                pair: formData.pair,
                direction: formData.direction,
                entryPrice: parseFloat(formData.entryPrice),
                exitPrice: formData.exitPrice ? parseFloat(formData.exitPrice) : undefined,
                notes: formData.notes,
                tags: formData.tags
            }

            // Calculate PnL if both entry and exit prices are provided
            if (formData.pnl) {
                trade.exitPrice = parseFloat(formData.exitPrice || '0')
            }

            await tradeService.createTrade(trade, user.id)

            // Reset form
            setFormData({
                pair: '',
                direction: 'BUY',
                entryPrice: '',
                exitPrice: '',
                pnl: '',
                notes: '',
                tags: []
            })

            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error('Failed to create trade:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>クイック記録</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>通貨ペア *</Label>
                            <Input
                                placeholder="EUR/USD"
                                value={formData.pair}
                                onChange={(e) => setFormData({ ...formData, pair: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label>方向 *</Label>
                            <select
                                value={formData.direction}
                                onChange={(e) => setFormData({ ...formData, direction: e.target.value as 'BUY' | 'SELL' })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                required
                            >
                                <option value="BUY">買い</option>
                                <option value="SELL">売り</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>エントリー価格 *</Label>
                            <Input
                                type="number"
                                step="0.00001"
                                placeholder="1.08500"
                                value={formData.entryPrice}
                                onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label>決済価格</Label>
                            <Input
                                type="number"
                                step="0.00001"
                                placeholder="1.08700"
                                value={formData.exitPrice}
                                onChange={(e) => setFormData({ ...formData, exitPrice: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <Label>損益 (円)</Label>
                        <Input
                            type="number"
                            placeholder="5000"
                            value={formData.pnl}
                            onChange={(e) => setFormData({ ...formData, pnl: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label>メモ</Label>
                        <Textarea
                            placeholder="トレンドフォローでエントリー"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={2}
                        />
                    </div>

                    <div>
                        <TagSelector
                            selectedTags={formData.tags}
                            onChange={(tags) => setFormData({ ...formData, tags })}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            キャンセル
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? '記録中...' : '記録'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
