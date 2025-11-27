"use client"

import { useState } from "react"
import { Trade } from "@/types/trade"
import { tradeService } from "@/lib/trade-service"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TagSelector } from "@/components/ui/tag-selector"

interface EditTradeDialogProps {
    trade: Trade
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function EditTradeDialog({ trade, open, onOpenChange, onSuccess }: EditTradeDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        pair: trade.pair,
        direction: trade.direction,
        entryPrice: trade.entryPrice.toString(),
        exitPrice: trade.exitPrice?.toString() || '',
        stopLoss: trade.stopLoss?.toString() || '',
        takeProfit: trade.takeProfit?.toString() || '',
        lotSize: trade.lotSize?.toString() || '',
        pnl: trade.pnl?.toString() || '',
        notes: trade.notes,
        tags: trade.tags || []
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const updates: Partial<Trade> = {
                pair: formData.pair,
                direction: formData.direction as 'BUY' | 'SELL',
                entryPrice: parseFloat(formData.entryPrice),
                exitPrice: formData.exitPrice ? parseFloat(formData.exitPrice) : undefined,
                stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss) : undefined,
                takeProfit: formData.takeProfit ? parseFloat(formData.takeProfit) : undefined,
                lotSize: formData.lotSize ? parseFloat(formData.lotSize) : undefined,
                pnl: formData.pnl ? parseFloat(formData.pnl) : undefined,
                notes: formData.notes,
                tags: formData.tags
            }

            await tradeService.updateTrade(trade.id, updates)
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error('Failed to update trade:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>トレードを編集</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>通貨ペア</Label>
                            <Input
                                value={formData.pair}
                                onChange={(e) => setFormData({ ...formData, pair: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label>方向</Label>
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
                            <Label>エントリー価格</Label>
                            <Input
                                type="number"
                                step="0.00001"
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
                                value={formData.exitPrice}
                                onChange={(e) => setFormData({ ...formData, exitPrice: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>損切り</Label>
                            <Input
                                type="number"
                                step="0.00001"
                                value={formData.stopLoss}
                                onChange={(e) => setFormData({ ...formData, stopLoss: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>利確</Label>
                            <Input
                                type="number"
                                step="0.00001"
                                value={formData.takeProfit}
                                onChange={(e) => setFormData({ ...formData, takeProfit: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>ロットサイズ</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.lotSize}
                                onChange={(e) => setFormData({ ...formData, lotSize: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>損益</Label>
                            <Input
                                type="number"
                                value={formData.pnl}
                                onChange={(e) => setFormData({ ...formData, pnl: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <Label>メモ</Label>
                        <Textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
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
                            {loading ? '保存中...' : '保存'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
