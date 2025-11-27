import { Trade } from "@/types/trade"

/**
 * Search trades by query text
 * Searches in: pair, notes
 */
export function searchTrades(trades: Trade[], query: string): Trade[] {
    if (!query || query.trim() === '') {
        return trades
    }

    const searchTerm = query.toLowerCase().trim()

    return trades.filter(trade => {
        // Search in currency pair
        if (trade.pair.toLowerCase().includes(searchTerm)) {
            return true
        }

        // Search in notes
        if (trade.notes && trade.notes.toLowerCase().includes(searchTerm)) {
            return true
        }

        // Search in direction
        if (trade.direction.toLowerCase().includes(searchTerm)) {
            return true
        }

        return false
    })
}
