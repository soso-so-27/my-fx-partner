export const PREDEFINED_TAGS = {
    style: {
        label: '取引スタイル',
        tags: ['スキャルピング', 'デイトレード', 'スイングトレード']
    },
    strategy: {
        label: '戦略',
        tags: ['順張り', '逆張り', 'ブレイクアウト', 'レンジ']
    },
    session: {
        label: '時間帯',
        tags: ['東京', 'ロンドン', 'ニューヨーク']
    }
} as const

export type TagCategory = keyof typeof PREDEFINED_TAGS

// 統一されたタグカラー - 落ち着いたブランドカラーを基調に、ライト/ダーク両対応
// 色数を3種類に抑えて視点誘導を明確に
export const TAG_COLORS = {
    // スタイル: セージグリーン系（ブランドメイン）
    style: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/40',
    // 戦略: グレー系（ブランドセカンダリ）
    strategy: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700/30 dark:text-slate-300 dark:border-slate-500/40',
    // セッション: ニュートラル
    session: 'bg-stone-100 text-stone-600 border-stone-300 dark:bg-stone-800 dark:text-stone-400 dark:border-stone-600'
} as const

export function getTagCategory(tag: string): TagCategory | null {
    for (const [category, { tags }] of Object.entries(PREDEFINED_TAGS)) {
        if ((tags as readonly string[]).includes(tag)) {
            return category as TagCategory
        }
    }
    return null
}

export function getTagColor(tag: string): string {
    const category = getTagCategory(tag)
    return category ? TAG_COLORS[category] : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600'
}

