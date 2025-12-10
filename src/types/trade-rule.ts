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

// ルールカテゴリの色: SOLOブランドカラーを基調に、ライト/ダーク両対応
// 4カテゴリを2色（Gold系とNavy系）のバリエーションで表現し、視認性向上
export const RULE_CATEGORIES: { value: RuleCategory; label: string; color: string }[] = [
    { value: 'ENTRY', label: 'エントリー', color: 'bg-solo-gold/10 text-amber-700 border-solo-gold/30 dark:bg-solo-gold/20 dark:text-solo-gold dark:border-solo-gold/40' },
    { value: 'EXIT', label: '決済', color: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-500/30' },
    { value: 'RISK', label: '資金管理', color: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-500/30' },
    { value: 'MENTAL', label: 'メンタル', color: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600' },
]
