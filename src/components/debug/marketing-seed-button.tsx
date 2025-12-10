
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
import { Loader2 } from "lucide-react"

const PERSONA_LABELS: Record<MarketingPersona, string> = {
    'GAMBLER': 'The Gambler (Exness/Gold/HighRisk)',
    'BONUS_HUNTER': 'The Bonus Hunter (XM/Stagnant)',
    'SCALPER': 'The Scalper (Titan/HighFreq)',
    'SWAP_LOVER': 'The Swap Lover (OANDA/LongTerm)',
    'ANALYST': 'The Analyst (Axiory/Analysis)',
    'CHALLENGE': 'The Challenge (Fintokei/Prop)',
    'CRYPTO_DEG': 'The Crypto Deg (Bybit/Weekend)',
    'DOMESTIC': 'The Domestic (DMM/Manual)',
    'CLICKER': 'The Clicker (GMO/Scalp)',
    'POINT_MASTER': 'The Point Master (Rakuten/Points)'
}

export function MarketingSeedButton() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
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
                    // Convert to correct input format for createTrade
                    // Note: tradeService.createTrade expects CreateTradeInput, but we have full Trade objects.
                    // We need to map or skip validation if we use a direct insert service (not exposed currently).
                    // For now, we reuse tradeService.createTrade which is safer but slower.

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
                        broker: trade.broker
                    }, user.id)
                    successCount++
                } catch (e) {
                    console.error("Failed to seed trade", e)
                }
            }

            toast({
                title: "生成完了",
                description: `${successCount}件の取引データを生成しました。`,
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
        <div className="flex gap-2 items-end">
            <div className="grid gap-2 flex-1">
                <Select value={selectedPersona} onValueChange={(v) => setSelectedPersona(v as MarketingPersona)}>
                    <SelectTrigger className="w-[280px]">
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
                variant="outline"
            >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                生成する
            </Button>
        </div>
    )
}
