"use client"

import { TradeRule, RULE_CATEGORIES } from "@/types/trade-rule"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Edit2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface RuleCardProps {
    rule: TradeRule
    onToggleActive: (id: string) => void
    onEdit: (rule: TradeRule) => void
    onDelete: (id: string) => void
}

export function RuleCard({ rule, onToggleActive, onEdit, onDelete }: RuleCardProps) {
    const category = RULE_CATEGORIES.find(c => c.value === rule.category)

    return (
        <Card className={cn("transition-all", !rule.isActive && "opacity-60")}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-xs font-normal", category?.color)}>
                            {category?.label}
                        </Badge>
                        <CardTitle className="text-base font-medium leading-none">
                            {rule.title}
                        </CardTitle>
                    </div>
                </div>
                <Switch
                    checked={rule.isActive}
                    onCheckedChange={() => onToggleActive(rule.id)}
                />
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">
                    {rule.description}
                </p>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(rule)}>
                        <Edit2 className="h-4 w-4 mr-1" />
                        編集
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(rule.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4 mr-1" />
                        削除
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
