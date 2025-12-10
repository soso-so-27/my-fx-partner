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

// 統一されたタグカラー - SOLOブランドカラーを基調に、ライト/ダーク両対応
// 色数を3種類に抑えて視点誘導を明確に
export const TAG_COLORS = {
    // スタイル: ゴールド系（SOLOブランドメイン）
    style: 'bg-solo-gold/10 text-solo-gold border-solo-gold/30 dark:bg-solo-gold/20 dark:text-solo-gold dark:border-solo-gold/40',
    // 戦略: ネイビー系（SOLOブランドセカンダリ）
    strategy: 'bg-solo-navy/10 text-solo-navy border-solo-navy/30 dark:bg-solo-navy/30 dark:text-slate-200 dark:border-slate-500/40',
    // セッション: ニュートラル
    session: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
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

