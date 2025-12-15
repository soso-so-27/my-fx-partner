
"use client"

import { Button } from "@/components/ui/button"
import { marketingSeeds, MarketingPersona } from "@/lib/marketing-seeds"
import { useAuth } from "@/contexts/auth-context"
import { tradeService } from "@/lib/trade-service"
import { useToast } from "@/components/ui/use-toast"
import { useState } from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, Trash2 } from "lucide-react"

const PERSONA_LABELS: Record<MarketingPersona, string> = {
    'GAMBLER': '💀 ギャンブラー (Exness / ハイレバ・ゴールド)',
    'BONUS_HUNTER': '🎁 ボーナスハンター (XM / 入金ボーナス頼み)',
    'SCALPER': '⚡ 秒速スキャルパー (Titan / 手数料負け予備軍)',
    'SWAP_LOVER': '🐢 スワップ生活 (OANDA / 長期保有)',
    'ANALYST': '📊 分析好き (Axiory / 勝てそうで勝てない)',
    'CHALLENGE': '🔥 プロップ挑戦者 (Fintokei / 合格祈願)',
    'CRYPTO_DEG': '💎 週末クリプト (Bybit / 土日も休まない)',
    'DOMESTIC': '🏠 堅実な兼業 (DMM FX / ドル円スイング)',
    'CLICKER': '👆 連打スキャル (GMO / 無駄打ち多め)',
    'POINT_MASTER': '🐼 ポイント勢 (楽天 / 資産管理)'
}

export function MarketingSeedButton() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [cleaning, setCleaning] = useState(false)
    const [selectedPersona, setSelectedPersona] = useState<MarketingPersona | "">("")

    const handleGenerate = async () => {
        if (!user || !selectedPersona) return
        setLoading(true)

        try {
            // Generate trades
            const trades = marketingSeeds.generate(user.id, {
                persona: selectedPersona,
                count: 30, // Default 30 trades
                winRate: getWinRate(selectedPersona),
                brokerName: getBrokerName(selectedPersona)
            })

            // Save to DB
            let successCount = 0
            for (const trade of trades) {
                try {
                    await tradeService.createTrade({
                        pair: trade.pair,
                        direction: trade.direction,
                        entryPrice: trade.entryPrice,
                        notes: trade.notes,
                        entryTime: trade.entryTime,
                        exitTime: trade.exitTime,
                        timezone: trade.timezone,
                        exitPrice: trade.exitPrice,
                        lotSize: trade.lotSize,
                        lotSizeRaw: trade.lotSizeRaw,
                        pnl: trade.pnl,
                        pnlSource: trade.pnlSource,
                        tags: trade.tags,
                        isVerified: trade.isVerified,
                        broker: trade.broker,
                        dataSource: 'demo'
                    }, user.id)
                    successCount++
                } catch (e) {
                    console.error("Failed to seed trade", e)
                }
            }

            toast({
                title: "生成完了！🎉",
                description: `${successCount}件のデータを追加しました。ジャーナルや履歴ページで確認してください。（直近30日間のデータが含まれます）`,
                duration: 5000,
            })
        } catch (error) {
            console.error(error)
            toast({
                title: "エラー",
                description: "データの生成に失敗しました。",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleCleanup = async () => {
        if (!user) return
        if (!confirm("デモデータを全て削除しますか？\n※この操作は取り消せません。\n※手動入力やGmail同期データは保護されます。")) return
        setCleaning(true)

        try {
            const trades = await tradeService.getTrades(user.id)
            // Filter by dataSource='demo' or tag #DEMO for backward compatibility
            const demoTrades = trades.filter(t => t.dataSource === 'demo' || t.tags?.includes("#DEMO"))

            let deletedCount = 0
            // Delete one by one (could be optimized but safe)
            for (const t of demoTrades) {
                await tradeService.deleteTrade(t.id)
                deletedCount++
            }

            toast({
                title: "削除完了 🗑️",
                description: `${deletedCount}件のデモデータを削除しました。`,
            })
        } catch (error) {
            console.error(error)
            toast({
                title: "エラー",
                description: "削除に失敗しました。",
                variant: "destructive"
            })
        } finally {
            setCleaning(false)
            setLoading(false) // Just in case
        }
    }

    const getWinRate = (persona: MarketingPersona): number => {
        switch (persona) {
            case 'GAMBLER': return 0.2;
            case 'SCALPER': return 0.55;
            case 'DOMESTIC': return 0.6;
            case 'BONUS_HUNTER': return 0.45;
            case 'POINT_MASTER': return 0.9;
            default: return 0.5;
        }
    }

    const getBrokerName = (persona: MarketingPersona): string => {
        switch (persona) {
            case 'GAMBLER': return "Exness";
            case 'DOMESTIC': return "DMM FX";
            case 'SCALPER': return "Titan FX";
            case 'BONUS_HUNTER': return "XM Trading";
            case 'CLICKER': return "GMOクリック証券";
            case 'POINT_MASTER': return "楽天証券";
            case 'CHALLENGE': return "Fintokei";
            case 'CRYPTO_DEG': return "Bybit";
            case 'SWAP_LOVER': return "OANDA Japan";
            case 'ANALYST': return "Axiory";
            default: return "Demo Broker";
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-2 items-end">
                <div className="grid gap-2 flex-1">
                    <Select value={selectedPersona} onValueChange={(v) => setSelectedPersona(v as MarketingPersona)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="ペルソナを選択 (デモデータ)" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(PERSONA_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    onClick={handleGenerate}
                    disabled={loading || !selectedPersona}
                    className="bg-solo-gold text-solo-black hover:bg-solo-gold/90"
                >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    生成
                </Button>
            </div>

            {/* Cleanup button moved to Data Management settings */}
        </div>
    )
}
