"use client"

import { useState, useEffect } from "react"
import { TradeRule, CreateRuleInput } from "@/types/trade-rule"
import { tradeRuleService } from "@/lib/trade-rule-service"
import { RuleCard } from "@/components/trade/rule-card"
import { RuleFormDialog } from "@/components/trade/rule-form-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function TradeRuleManager() {
    const { user } = useAuth()
    const [rules, setRules] = useState<TradeRule[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingRule, setEditingRule] = useState<TradeRule | undefined>(undefined)
    const [activeTab, setActiveTab] = useState("all")

    useEffect(() => {
        if (user) {
            loadRules()
        }
    }, [user])

    const loadRules = async () => {
        if (!user) return
        try {
            const data = await tradeRuleService.getRules(user.id)
            setRules(data)
        } catch (error) {
            console.error("Failed to load rules:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (input: CreateRuleInput) => {
        if (!user) return
        await tradeRuleService.createRule(input, user.id)
        await loadRules()
    }

    const handleUpdate = async (input: CreateRuleInput) => {
        if (!editingRule) return
        await tradeRuleService.updateRule(editingRule.id, input)
        await loadRules()
        setEditingRule(undefined)
    }

    const handleToggleActive = async (id: string) => {
        await tradeRuleService.toggleRuleActive(id)
        await loadRules()
    }

    const handleDelete = async (id: string) => {
        if (confirm('このルールを削除してもよろしいですか？')) {
            await tradeRuleService.deleteRule(id)
            await loadRules()
        }
    }

    const openCreateDialog = () => {
        setEditingRule(undefined)
        setDialogOpen(true)
    }

    const openEditDialog = (rule: TradeRule) => {
        setEditingRule(rule)
        setDialogOpen(true)
    }

    const filteredRules = activeTab === "all"
        ? rules
        : rules.filter(r => r.category === activeTab)

    return (
        <div className="pb-20 max-w-2xl mx-auto min-h-[500px]">
            <div className="flex justify-between items-center mb-6">
                <p className="text-muted-foreground text-sm">
                    自身のトレードルールを登録・管理します。<br />
                    AIがこれらのルールに基づいてトレードを評価します。
                </p>
                <Button onClick={openCreateDialog} className="shrink-0">
                    <Plus className="h-4 w-4 mr-2" />
                    新規
                </Button>
            </div>

            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="grid grid-cols-5 w-full">
                    <TabsTrigger value="all">全て</TabsTrigger>
                    <TabsTrigger value="ENTRY">入</TabsTrigger>
                    <TabsTrigger value="EXIT">出</TabsTrigger>
                    <TabsTrigger value="RISK">資金</TabsTrigger>
                    <TabsTrigger value="MENTAL">心</TabsTrigger>
                </TabsList>
            </Tabs>

            {loading ? (
                <div className="text-center py-10">読み込み中...</div>
            ) : (
                <div className="space-y-4">
                    {filteredRules.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground border rounded-lg border-dashed">
                            ルールが登録されていません
                        </div>
                    ) : (
                        filteredRules.map((rule) => (
                            <RuleCard
                                key={rule.id}
                                rule={rule}
                                onToggleActive={handleToggleActive}
                                onEdit={openEditDialog}
                                onDelete={handleDelete}
                            />
                        ))
                    )}
                </div>
            )}

            <RuleFormDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open)
                    if (!open) setEditingRule(undefined)
                }}
                onSubmit={editingRule ? handleUpdate : handleCreate}
                initialData={editingRule}
                mode={editingRule ? 'edit' : 'create'}
            />
        </div>
    )
}
