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

export const TAG_COLORS = {
    style: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    strategy: 'bg-green-500/20 text-green-300 border-green-500/30',
    session: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
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
    return category ? TAG_COLORS[category] : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
}
