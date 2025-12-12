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

// ルールカテゴリの色: 落ち着いたカラーを基調に、ライト/ダーク両対応
// 4カテゴリを自然で控えめなトーンで表現し、視認性向上
export const RULE_CATEGORIES: { value: RuleCategory; label: string; color: string }[] = [
    { value: 'ENTRY', label: 'エントリー', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/40' },
    { value: 'EXIT', label: '決済', color: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-700/40' },
    { value: 'RISK', label: '資金管理', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/40' },
    { value: 'MENTAL', label: 'メンタル', color: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600' },
]
