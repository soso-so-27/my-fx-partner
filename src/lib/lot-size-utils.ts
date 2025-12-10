import { LotSizeRaw } from '@/types/trade'

// Broker-specific lot size conversion rules
export const LOT_SIZE_CONVERSIONS: Record<string, {
    unit: string
    multiplier: number  // multiplier to convert to standard lot
    description: string
}> = {
    // Japanese brokers (万通貨 = 10,000 units)
    'GMOクリック証券': {
        unit: '万通貨',
        multiplier: 0.1,  // 10万通貨 = 1.0 standard lot
        description: '1万通貨 = 0.1 lot'
    },
    'DMM FX': {
        unit: '万通貨',
        multiplier: 0.1,
        description: '1万通貨 = 0.1 lot'
    },
    'SBI FXトレード': {
        unit: '通貨',
        multiplier: 0.00001,  // 100,000 units = 1.0 lot
        description: '100,000通貨 = 1.0 lot'
    },
    '外為どっとコム': {
        unit: '万通貨',
        multiplier: 0.1,
        description: '1万通貨 = 0.1 lot'
    },

    // International brokers
    'XM': {
        unit: 'Lot',
        multiplier: 1.0,  // 1 Lot = 1.0 standard lot
        description: '1 Lot = 100,000 units'
    },
    'OANDA': {
        unit: 'Units',
        multiplier: 0.00001,  // 100,000 units = 1.0 lot
        description: '100,000 units = 1.0 lot'
    },
    'FXCM': {
        unit: 'K',
        multiplier: 0.01,  // 1K = 1,000 units = 0.01 lot
        description: '1K = 1,000 units = 0.01 lot'
    },
    'IG証券': {
        unit: 'Lot',
        multiplier: 1.0,
        description: '1 Lot = 100,000 units'
    },
}

// Detect broker from email domain or sender name
export function detectBroker(email: string, senderName?: string): string | null {
    const lowerEmail = email.toLowerCase()
    const lowerSender = senderName?.toLowerCase() || ''

    // GMO
    if (lowerEmail.includes('click-sec.com') || lowerSender.includes('gmo')) {
        return 'GMOクリック証券'
    }

    // DMM
    if (lowerEmail.includes('dmm.com') || lowerSender.includes('dmm')) {
        return 'DMM FX'
    }

    // SBI
    if (lowerEmail.includes('sbifxt.co.jp') || lowerSender.includes('sbi')) {
        return 'SBI FXトレード'
    }

    // 外為どっとコム
    if (lowerEmail.includes('gaitame.com')) {
        return '外為どっとコム'
    }

    // XM
    if (lowerEmail.includes('xm.com') || lowerSender.includes('xm')) {
        return 'XM'
    }

    // OANDA
    if (lowerEmail.includes('oanda.com')) {
        return 'OANDA'
    }

    // FXCM
    if (lowerEmail.includes('fxcm.com')) {
        return 'FXCM'
    }

    // IG証券
    if (lowerEmail.includes('ig.com') || lowerSender.includes('ig証券')) {
        return 'IG証券'
    }

    return null
}

// Convert lot size to standard lot (1.0 = 100,000 units)
export function convertToStandardLot(
    value: number,
    unit: string,
    broker?: string
): number {
    // Try to find conversion rule by broker
    if (broker && LOT_SIZE_CONVERSIONS[broker]) {
        return value * LOT_SIZE_CONVERSIONS[broker].multiplier
    }

    // Fallback: detect from unit
    const lowerUnit = unit.toLowerCase()

    if (lowerUnit.includes('万通貨')) {
        return value * 0.1
    }

    if (lowerUnit === 'lot' || lowerUnit === 'lots') {
        return value * 1.0
    }

    if (lowerUnit === 'k') {
        return value * 0.01
    }

    if (lowerUnit.includes('通貨') || lowerUnit === 'units') {
        return value * 0.00001
    }

    // Default: assume it's already in standard lot
    return value
}

// Parse lot size from email text
export function parseLotSize(text: string, broker?: string): {
    value: number
    unit: string
    standardLot: number
} | null {
    // Pattern 1: "10万通貨" (Japanese)
    const pattern1 = /(\d+(?:\.\d+)?)\s*万通貨/
    const match1 = text.match(pattern1)
    if (match1) {
        const value = parseFloat(match1[1])
        return {
            value,
            unit: '万通貨',
            standardLot: convertToStandardLot(value, '万通貨', broker)
        }
    }

    // Pattern 2: "1.5 Lot" or "1.5 lots"
    const pattern2 = /(\d+(?:\.\d+)?)\s*lots?/i
    const match2 = text.match(pattern2)
    if (match2) {
        const value = parseFloat(match2[1])
        return {
            value,
            unit: 'Lot',
            standardLot: convertToStandardLot(value, 'Lot', broker)
        }
    }

    // Pattern 3: "100K" or "100 K"
    const pattern3 = /(\d+(?:\.\d+)?)\s*K/i
    const match3 = text.match(pattern3)
    if (match3) {
        const value = parseFloat(match3[1])
        return {
            value,
            unit: 'K',
            standardLot: convertToStandardLot(value, 'K', broker)
        }
    }

    // Pattern 4: "100000 units" or "100,000通貨"
    const pattern4 = /(\d+(?:,\d+)*(?:\.\d+)?)\s*(units?|通貨)/i
    const match4 = text.match(pattern4)
    if (match4) {
        const value = parseFloat(match4[1].replace(/,/g, ''))
        return {
            value,
            unit: match4[2].toLowerCase().includes('unit') ? 'Units' : '通貨',
            standardLot: convertToStandardLot(value, match4[2], broker)
        }
    }

    return null
}

// Format lot size for display
export function formatLotSize(
    standardLot: number,
    format: 'standard' | 'units' | 'japanese' = 'standard'
): string {
    switch (format) {
        case 'standard':
            return `${standardLot.toFixed(2)} Lot`
        case 'units':
            return `${(standardLot * 100000).toLocaleString()} units`
        case 'japanese':
            return `${(standardLot * 10).toFixed(1)}万通貨`
        default:
            return `${standardLot.toFixed(2)} Lot`
    }
}
