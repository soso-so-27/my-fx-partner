
import { Trade, MarketSession } from "@/types/trade"
import { v4 as uuidv4 } from 'uuid'
import { addDays, subDays, subHours, format } from "date-fns"

// Persona Types
export type MarketingPersona =
    | 'GAMBLER'
    | 'BONUS_HUNTER'
    | 'SCALPER'
    | 'SWAP_LOVER'
    | 'ANALYST'
    | 'CHALLENGE'
    | 'CRYPTO_DEG'
    | 'DOMESTIC'
    | 'CLICKER'
    | 'POINT_MASTER'

interface SeedConfig {
    persona: MarketingPersona
    count: number
    winRate: number
    brokerName: string
}

export const marketingSeeds = {
    generate(userId: string, config: SeedConfig): Trade[] {
        const trades: Trade[] = []
        const now = new Date()

        for (let i = 0; i < config.count; i++) {
            const isWin = Math.random() < config.winRate
            const tradeDate = subDays(now, Math.floor(i / (config.count / 30))) // Spread over 30 days

            // Basic trade structure
            const trade: Trade = {
                id: uuidv4(),
                userId,
                createdAt: tradeDate.toISOString(),
                updatedAt: tradeDate.toISOString(),
                pair: "USD/JPY", // Default
                pairNormalized: "USDJPY",
                direction: Math.random() > 0.5 ? "BUY" : "SELL",
                entryPrice: 150.00,
                entryTime: tradeDate.toISOString(),
                exitTime: subHours(tradeDate, -1).toISOString(),
                timezone: "Asia/Tokyo",
                session: "tokyo",
                pnl: { currency: "JPY", amount: 0, pips: 0 },
                pnlSource: "manual",
                chartImages: [],
                notes: "",
                tags: [],
                isVerified: false,
                isFrequentPair: false,
                broker: config.brokerName
            }

            // Apply Persona Specific Logic
            this.applyPersonaLogic(trade, config.persona, isWin)
            trades.push(trade)
        }
        return trades
    },

    applyPersonaLogic(trade: Trade, persona: MarketingPersona, isWin: boolean) {
        switch (persona) {
            case 'GAMBLER': // Exness, Gold, High Leverage
                trade.pair = "XAU/USD"
                trade.pairNormalized = "XAUUSD"
                trade.lotSize = isWin ? 5.0 : 10.0 // Over-leveraged
                trade.pnl.pips = isWin ? 50 : -100
                trade.pnl.amount = isWin ? 500000 : -1000000
                trade.tags = ["フルレバ", "ハイレバ"]
                trade.notes = isWin ? "神エントリー！このまま億り人へ" : "またゼロカット...なんでいつもこうなる"
                break;

            case 'DOMESTIC': // DMM FX, Manual
                trade.pair = "USD/JPY"
                trade.broker = "DMM FX"
                trade.lotSizeRaw = { value: 1, unit: "万通貨", broker: "DMM FX" }
                trade.pnl.pips = isWin ? 10 : -8
                trade.pnl.amount = isWin ? 1000 : -800
                trade.tags = ["DMM", "スイング"]
                trade.notes = "DMMの約定通知メールから自動連携"
                break;

            case 'SCALPER': // Titan FX, Many trades
                trade.pair = "EUR/USD"
                trade.broker = "Titan FX"
                trade.lotSize = 1.0
                trade.pnl.pips = isWin ? 5.2 : -4.8
                trade.pnl.amount = isWin ? 5200 : -4800
                trade.tags = ["スキャル", "秒速"]
                break;

            case 'CHALLENGE': // Fintokei
                trade.pair = "GBP/JPY"
                trade.broker = "Fintokei"
                trade.lotSize = 0.5
                trade.pnl.percentage = isWin ? 0.8 : -0.5
                trade.pnl.amount = isWin ? 8000 : -5000
                trade.notes = isWin ? "日次目標クリア" : "ドローダウンに注意"
                break;

            case 'SWAP_LOVER': // OANDA
                trade.pair = "USD/JPY"
                trade.direction = "BUY"
                trade.broker = "OANDA"
                trade.lotSize = 0.1
                trade.pnl.amount = 50 // Swap only
                trade.tags = ["スワップ", "長期"]
                trade.notes = "スワップ金利獲得"
                break;

            case 'BONUS_HUNTER': // XM
                trade.pair = "EUR/USD"
                trade.broker = "XM Trading"
                trade.lotSize = 0.05
                trade.pnl.amount = isWin ? 500 : -500
                trade.tags = ["ボーナス消化", "XMP"]
                trade.notes = "XMPポイントのみ狙い"
                break;

            case 'ANALYST': // Axiory
                trade.pair = "GBP/USD"
                trade.broker = "Axiory"
                trade.lotSize = 0.3
                trade.pnl.pips = isWin ? 20 : -15
                trade.pnl.amount = isWin ? 6000 : -4500
                trade.tags = ["cTrader", "分析"]
                break;

            case 'CRYPTO_DEG': // Bybit
                trade.pair = "BTC/USD"
                trade.pairNormalized = "BTCUSD"
                trade.broker = "Bybit"
                trade.lotSize = 0.1
                trade.pnl.amount = isWin ? 50000 : -30000
                trade.tags = ["週末", "仮想通貨"]
                break;

            case 'CLICKER': // GMO
                trade.pair = "USD/JPY"
                trade.broker = "GMOクリック証券"
                trade.lotSizeRaw = { value: 5, unit: "枚", broker: "GMO" } // GMO unit
                trade.pnl.pips = isWin ? 2 : -2
                trade.pnl.amount = isWin ? 200 : -200
                trade.tags = ["連打", "はっちゅう君"]
                break;

            case 'POINT_MASTER': // Rakuten
                trade.pair = "AUD/JPY"
                trade.broker = "楽天証券"
                trade.lotSizeRaw = { value: 1000, unit: "通貨", broker: "Rakuten" } // Rakuten small lots
                trade.pnl.amount = isWin ? 100 : -80
                trade.tags = ["楽天ポイント", "ポイ活"]
                break;
        }

        // Add Common Cleanup Tag
        if (!trade.tags) trade.tags = []
        trade.tags.push("#DEMO")
    }
}
