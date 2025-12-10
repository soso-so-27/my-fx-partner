import { useState, useEffect } from "react"
import { tradeService } from "@/lib/trade-service"
import { CreateTradeInput, RuleCompliance } from "@/types/trade"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TagSelector } from "@/components/ui/tag-selector"
import { useAuth } from "@/contexts/auth-context"
import { TradeRule } from "@/types/trade-rule"
import { tradeRuleService } from "@/lib/trade-rule-service"
import { Check, X, ShieldCheck, Minus } from "lucide-react"

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

    // Rule Compliance State
    const [rules, setRules] = useState<TradeRule[]>([])
    const [compliance, setCompliance] = useState<RuleCompliance[]>([])

    // Load Rules
    useEffect(() => {
        if (!user || !open) return
        const loadRules = async () => {
            try {
                const fetched = await tradeRuleService.getRules(user.id)
                setRules(fetched.filter(r => r.isActive))
                // Reset compliance when dialog opens
                setCompliance([])
            } catch (error) {
                console.error('Failed to load rules', error)
            }
        }
        loadRules()
    }, [user, open])

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
        if (!user) return

        setLoading(true)

        try {
            const trade: CreateTradeInput = {
                pair: formData.pair,
                direction: formData.direction,
                entryPrice: parseFloat(formData.entryPrice),
                exitPrice: formData.exitPrice ? parseFloat(formData.exitPrice) : undefined,
                notes: formData.notes,
                tags: formData.tags,
                ruleCompliance: compliance
            }

            // Calculate PnL if both entry and exit prices are provided
            if (formData.pnl) {
                trade.exitPrice = parseFloat(formData.exitPrice || '0')
                trade.pnl = {
                    amount: parseFloat(formData.pnl),
                    currency: 'JPY'
                }
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
            setCompliance([])

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
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
                                    ジャーナルページからマイルールを追加しましょう。
                                </div>
                            )}
                        </div>
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
