export type RuleCategory = 'ENTRY' | 'EXIT' | 'RISK' | 'MENTAL'

export interface TradeRule {
    id: string
    userId: string
    title: string
    category: RuleCategory
    description: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export interface CreateRuleInput {
    title: string
    category: RuleCategory
    description: string
    isActive?: boolean
}

export const RULE_CATEGORIES: { value: RuleCategory; label: string; color: string }[] = [
    { value: 'ENTRY', label: 'エントリー', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { value: 'EXIT', label: '決済', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
    { value: 'RISK', label: '資金管理', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
    { value: 'MENTAL', label: 'メンタル', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
]
