import { CreateTradeInput } from "@/types/trade"

export interface ParsedTrade extends CreateTradeInput {
    broker: string
    originalEmailId?: string
}

export const emailParser = {
    parse(subject: string, body: string, emailId: string): ParsedTrade | null {
        // 1. XM Trading Parser
        if (subject.includes("XMTrading") || body.includes("XMTrading") || subject.includes("Test")) {
            return this.parseXM(body, emailId)
        }

        // 2. Exness Parser (Placeholder)
        if (subject.includes("Exness") || body.includes("Exness")) {
            return this.parseExness(body, emailId)
        }

        return null
    },

    parseXM(body: string, emailId: string): ParsedTrade | null {
        try {
            // Relaxed Regex patterns to handle various formats and whitespace
            const typeMatch = body.match(/(?:Type|タイプ)[:：]?\s*(Buy|Sell|買い|売り)/i)
            const symbolMatch = body.match(/(?:Symbol|Pair|銘柄|通貨)[:：]?\s*([A-Z0-9]+)/i)
            const priceMatch = body.match(/(?:Price|Rate|価格)[:：]?\s*([0-9.]+)/i)

            if (!typeMatch || !symbolMatch || !priceMatch) return null

            let direction: 'BUY' | 'SELL' = 'BUY'
            const typeStr = typeMatch[1].toLowerCase()
            if (typeStr === 'sell' || typeStr === '売り') direction = 'SELL'

            return {
                pair: symbolMatch[1],
                direction: direction,
                entryPrice: parseFloat(priceMatch[1]),
                entryTime: new Date().toISOString(), // Use email time if available
                notes: "Auto-imported from XMTrading email",
                broker: "XMTrading",
                originalEmailId: emailId,
                isVerified: true,
                verificationSource: "gmail_import",
                tags: ["XM", "AutoImport"]
            }
        } catch (e) {
            console.error("XM Parsing Error", e)
            return null
        }
    },

    parseExness(body: string, emailId: string): ParsedTrade | null {
        // Implement Exness parsing logic here
        return null
    }
}
