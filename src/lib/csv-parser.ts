export interface ImportTrade {
    ticket?: string
    openTime: string
    type: 'buy' | 'sell'
    size: number
    item: string // symbol
    openPrice: number
    closeTime?: string
    closePrice?: number
    profit?: number
    commission?: number
    swap?: number
}

export const ImportParser = {
    // Parse raw text pasted from email or CSV content
    parse(text: string): ImportTrade[] {
        const lines = text.split('\n')
        const trades: ImportTrade[] = []

        // Very basic heuristic parser (to be improved later)
        // Checks for XM/MT4 email format keywords

        // Example: "buy 0.01 USDJPY at 150.000"

        return trades
    },

    // Mock function for demo
    getMockData(): ImportTrade[] {
        return [
            {
                ticket: '12345678',
                openTime: new Date().toISOString(),
                type: 'buy',
                size: 0.1,
                item: 'USDJPY',
                openPrice: 154.50,
                closeTime: new Date().toISOString(),
                closePrice: 154.80,
                profit: 3000
            }
        ]
    }
}
