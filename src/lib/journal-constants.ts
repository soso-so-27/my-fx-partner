export const EMOTION_TAGS = [
    { id: 'calm', label: '冷静', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    { id: 'confident', label: '自信', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    { id: 'anxious', label: '焦り', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
    { id: 'fear', label: '恐怖', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
    { id: 'greedy', label: '欲', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
    { id: 'anger', label: '怒り', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
    { id: 'regret', label: '後悔', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
] as const

export type EmotionTagId = typeof EMOTION_TAGS[number]['id']

export const getEmotionColor = (id: string) => {
    return EMOTION_TAGS.find(t => t.id === id)?.color || 'bg-secondary text-secondary-foreground'
}
