"use client"

import { useState, useEffect } from "react"
import { Trade } from "@/types/trade"
import { tradeService } from "@/lib/trade-service"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TagSelector } from "@/components/ui/tag-selector"
import { Check, X, ShieldCheck, Minus } from "lucide-react"
import { TradeRule } from "@/types/trade-rule"
import { tradeRuleService } from "@/lib/trade-rule-service"
import { RuleCompliance } from "@/types/trade"

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
        pnl: trade.pnl?.amount?.toString() || '',
        notes: trade.notes,
        tags: trade.tags || []
    })

    // Rule Compliance State
    const [rules, setRules] = useState<TradeRule[]>([])
    const [compliance, setCompliance] = useState<RuleCompliance[]>(trade.ruleCompliance || [])

    // Load Rules
    useEffect(() => {
        let mounted = true
        const loadRules = async () => {
            try {
                const fetched = await tradeRuleService.getRules(trade.userId)
                if (mounted) setRules(fetched.filter(r => r.isActive))
            } catch (error) {
                console.error('Failed to load rules', error)
            }
        }
        loadRules()
        return () => { mounted = false }
    }, [trade.userId])

    const updateCompliance = (ruleId: string, status: 'complied' | 'violated' | 'ignored') => {
        setCompliance(prev => {
            const existing = prev.find(c => c.ruleId === ruleId)
            if (existing) {
                return prev.map(c => c.ruleId === ruleId ? { ...c, status } : c)
            } else {
                return [...prev, { ruleId, status }]
            }
        })
    }

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
                pnl: formData.pnl ? {
                    amount: parseFloat(formData.pnl),
                    currency: 'JPY'
                } : undefined,
                notes: formData.notes,
                tags: formData.tags,
                ruleCompliance: compliance
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
                            <Label>決済損益</Label>
                            <Input
                                type="number"
                                value={formData.pnl}
                                onChange={(e) => setFormData({ ...formData, pnl: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-3 border rounded-lg p-4 bg-muted/10">
                        <div className="flex items-center justify-between">
                            <Label className="font-bold flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-solo-navy dark:text-solo-gold" />
                                ルール遵守チェック
                            </Label>
                            <span className="text-xs text-muted-foreground">{rules.length}個のアクティブなルール</span>
                        </div>

                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                            {rules.map(rule => {
                                const currentStatus = compliance.find(c => c.ruleId === rule.id)?.status

                                return (
                                    <div key={rule.id} className="flex items-center justify-between bg-background p-2 rounded-md border text-sm">
                                        <span className="truncate mr-2 flex-1" title={rule.title}>{rule.title}</span>
                                        <div className="flex gap-1 shrink-0">
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant={currentStatus === 'complied' ? 'default' : 'outline'}
                                                className={`h-7 w-7 ${currentStatus === 'complied' ? 'bg-green-600 hover:bg-green-700 border-green-600 text-white' : 'text-muted-foreground'}`}
                                                onClick={() => updateCompliance(rule.id, 'complied')}
                                                title="守った"
                                            >
                                                <Check className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant={currentStatus === 'violated' ? 'default' : 'outline'}
                                                className={`h-7 w-7 ${currentStatus === 'violated' ? 'bg-red-600 hover:bg-red-700 border-red-600 text-white' : 'text-muted-foreground'}`}
                                                onClick={() => updateCompliance(rule.id, 'violated')}
                                                title="破った"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant={currentStatus === 'ignored' ? 'secondary' : 'ghost'}
                                                className={`h-7 w-7 ${currentStatus === 'ignored' ? 'bg-muted text-muted-foreground' : 'text-muted-foreground/50'}`}
                                                onClick={() => updateCompliance(rule.id, 'ignored')}
                                                title="対象外/無視"
                                            >
                                                <Minus className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                            {rules.length === 0 && (
                                <div className="text-center py-4 text-muted-foreground text-xs">
                                    アクティブなルールが設定されていません。<br />
                                    設定ページからマイルールを追加しましょう。
                                </div>
                            )}
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
