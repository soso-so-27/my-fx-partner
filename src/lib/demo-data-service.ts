import { Trade, PnlInfo, MarketSession } from "@/types/trade"
import { Insight } from "@/types/insight"
import { TradeRule, RuleCategory } from "@/types/trade-rule"
import { v4 as uuidv4 } from 'uuid'
import { addDays, subDays, subHours, format } from "date-fns"

export const demoDataService = {
    getDemoTrades(userId: string): Trade[] {
        const now = new Date()
        const trades: Trade[] = []

        // 1. Winning Trade (USDJPY, Tokyo Session)
        trades.push({
            id: uuidv4(),
            userId,
            createdAt: subDays(now, 1).toISOString(),
            updatedAt: subDays(now, 1).toISOString(),
            pair: "USD/JPY",
            pairNormalized: "USDJPY",
            direction: "BUY",
            entryPrice: 150.20,
            exitPrice: 150.55,
            entryTime: subDays(now, 1).toISOString(), // Yesterday
            exitTime: subDays(now, 1).toISOString(),
            timezone: "Asia/Tokyo",
            session: "tokyo",
            lotSize: 1.0,
            pnl: {
                pips: 35,
                amount: 35000,
                percentage: 3.5,
                currency: "JPY"
            },
            pnlSource: "manual",
            chartImages: [],
            notes: "東京時間の仲値に向けた上昇を狙いエントリー。150.20のサポートが機能した。",
            tags: ["順張り", "東京時間", "仲値"],
            isVerified: false,
            isFrequentPair: true
        })

        // 2. Losing Trade (EURUSD, London Session)
        trades.push({
            id: uuidv4(),
            userId,
            createdAt: subDays(now, 2).toISOString(),
            updatedAt: subDays(now, 2).toISOString(),
            pair: "EUR/USD",
            pairNormalized: "EURUSD",
            direction: "SELL",
            entryPrice: 1.0850,
            exitPrice: 1.0870,
            stopLoss: 1.0870,
            takeProfit: 1.0800,
            entryTime: subDays(now, 2).toISOString(),
            exitTime: subDays(now, 2).toISOString(),
            timezone: "Asia/Tokyo",
            session: "london",
            lotSize: 0.5,
            pnl: {
                pips: -20,
                amount: -15000, // Approx
                percentage: -1.5,
                currency: "JPY"
            },
            pnlSource: "manual",
            chartImages: [],
            notes: "ロンドン初動の騙しに引っかかった。戻り売りを狙ったが、指標発表で急騰し損切り。",
            tags: ["逆張り", "ロンドン時間", "指標"],
            isVerified: false,
            isFrequentPair: true
        })

        // 3. Small Win (GBP/JPY, NY Session)
        trades.push({
            id: uuidv4(),
            userId,
            createdAt: subDays(now, 3).toISOString(),
            updatedAt: subDays(now, 3).toISOString(),
            pair: "GBP/JPY",
            pairNormalized: "GBPJPY",
            direction: "BUY",
            entryPrice: 190.00,
            exitPrice: 190.25,
            entryTime: subDays(now, 3).toISOString(),
            exitTime: subDays(now, 3).toISOString(),
            timezone: "Asia/Tokyo",
            session: "newyork",
            lotSize: 0.2,
            pnl: {
                pips: 25,
                amount: 5000,
                percentage: 0.5,
                currency: "JPY"
            },
            pnlSource: "manual",
            chartImages: [],
            notes: "NY時間の押し目買い。ボラティリティが高かったためロットを落としてエントリー。",
            tags: ["順張り", "NY時間", "リスク管理"],
            isVerified: false,
            isFrequentPair: true
        })

        return trades
    },

    getDemoInsights(userId: string): Insight[] {
        const now = new Date()
        return [
            {
                id: uuidv4(),
                userId,
                content: "今週は「待つ」ことができた週だった。特に火曜日のEURUSDは、形が崩れたので見送ったのが正解。以前なら飛び乗って負けていた場面。",
                mode: "review",
                userNote: "週末の振り返り",
                createdAt: subDays(now, 2).toISOString(),
                tags: ["メンタル", "規律"]
            },
            {
                id: uuidv4(),
                userId,
                content: "東京時間はボラティリティが低いので、無理にブレイクアウトを狙わないこと。レンジ下限からの逆張りの方が勝率が高い傾向がある。",
                mode: "post-trade",
                userNote: "東京時間の傾向",
                createdAt: subDays(now, 5).toISOString(),
                tags: ["東京時間", "手法"]
            }
        ]
    },

    getDemoRules(userId: string): TradeRule[] {
        const now = new Date()
        return [
            {
                id: uuidv4(),
                userId,
                title: "損切りは絶対",
                category: "RISK",
                description: "エントリーと同時に必ず損切り注文を入れる。一度決めた損切りラインは絶対に動かさない。",
                isActive: true,
                createdAt: now.toISOString(),
                updatedAt: now.toISOString()
            },
            {
                id: uuidv4(),
                userId,
                title: "3連敗したら終了",
                category: "MENTAL",
                description: "1日に3回連続で負けたら、その日はトレードを終了してチャートを閉じる。熱くなって取り返そうとしない。",
                isActive: true,
                createdAt: now.toISOString(),
                updatedAt: now.toISOString()
            },
            {
                id: uuidv4(),
                userId,
                title: "上位足のトレンドに従う",
                category: "ENTRY",
                description: "1時間足、4時間足のトレンド方向と同じ方向にのみエントリーする。逆張りはしない。",
                isActive: true,
                createdAt: now.toISOString(),
                updatedAt: now.toISOString()
            }
        ]
    }
}
