"use client"

import { useState, useEffect } from "react"
import { TradeRule, CreateRuleInput, RULE_CATEGORIES, RuleCategory } from "@/types/trade-rule"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface RuleFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (data: CreateRuleInput) => Promise<void>
    initialData?: TradeRule
    mode: 'create' | 'edit'
}

export function RuleFormDialog({ open, onOpenChange, onSubmit, initialData, mode }: RuleFormDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<CreateRuleInput>({
        title: '',
        category: 'ENTRY',
        description: '',
        isActive: true
    })

    useEffect(() => {
        if (open && initialData) {
            setFormData({
                title: initialData.title,
                category: initialData.category,
                description: initialData.description,
                isActive: initialData.isActive
            })
        } else if (open && !initialData) {
            setFormData({
                title: '',
                category: 'ENTRY',
                description: '',
                isActive: true
            })
        }
    }, [open, initialData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await onSubmit(formData)
            onOpenChange(false)
        } catch (error) {
            console.error('Failed to submit rule:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{mode === 'create' ? '新しいルールを追加' : 'ルールを編集'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>タイトル</Label>
                        <Input
                            placeholder="例: リスクリワード 1:2以上"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>カテゴリ</Label>
                        <Select
                            value={formData.category}
                            onValueChange={(value) => setFormData({ ...formData, category: value as RuleCategory })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {RULE_CATEGORIES.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>詳細説明</Label>
                        <Textarea
                            placeholder="ルールの詳細な条件や理由を入力..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            required
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
