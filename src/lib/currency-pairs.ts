// Major currency pairs (most commonly traded)
export const MAJOR_PAIRS = [
    'USDJPY',
    'EURJPY',
    'GBPJPY',
    'AUDJPY',
    'EURUSD',
    'GBPUSD',
    'AUDUSD',
    'NZDUSD',
] as const

// Minor currency pairs
export const MINOR_PAIRS = [
    'CHFJPY',
    'CADJPY',
    'NZDJPY',
    'ZARJPY',
    'TRYJPY',
    'MXNJPY',
    'EURGBP',
    'EURAUD',
    'EURNZD',
    'EURCHF',
    'EURCAD',
    'GBPAUD',
    'GBPNZD',
    'GBPCHF',
    'GBPCAD',
    'AUDNZD',
    'AUDCAD',
    'AUDCHF',
    'NZDCAD',
    'NZDCHF',
    'CADCHF',
    'USDCHF',
    'USDCAD',
    'USDZAR',
    'USDTRY',
    'USDMXN',
] as const

// All supported pairs
export const ALL_PAIRS = [...MAJOR_PAIRS, ...MINOR_PAIRS] as const

// Normalize currency pair format
export function normalizeCurrencyPair(input: string): string {
    // Remove spaces and slashes
    let normalized = input.replace(/[\s\/]/g, '').toUpperCase()

    // Check if it's a known pair
    if (ALL_PAIRS.includes(normalized as any)) {
        return normalized
    }

    // If not found, return as-is (user might be trading exotic pairs)
    return normalized
}

// Get display format for currency pair
export function formatCurrencyPair(pair: string, format: 'slash' | 'plain' = 'plain'): string {
    const normalized = normalizeCurrencyPair(pair)

    if (format === 'slash' && normalized.length === 6) {
        return `${normalized.slice(0, 3)}/${normalized.slice(3)}`
    }

    return normalized
}

// Check if a pair is major
export function isMajorPair(pair: string): boolean {
    const normalized = normalizeCurrencyPair(pair)
    return MAJOR_PAIRS.includes(normalized as any)
}

// Check if a pair is minor
export function isMinorPair(pair: string): boolean {
    const normalized = normalizeCurrencyPair(pair)
    return MINOR_PAIRS.includes(normalized as any)
}

// Get pair suggestions based on input
export function getPairSuggestions(input: string): string[] {
    if (!input) return [...MAJOR_PAIRS]

    const upperInput = input.toUpperCase()
    const suggestions = ALL_PAIRS.filter(pair =>
        pair.includes(upperInput)
    )

    return suggestions.length > 0 ? suggestions : [...MAJOR_PAIRS]
}
