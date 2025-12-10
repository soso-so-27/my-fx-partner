import { Trade } from "@/types/trade"
import { Button } from "@/components/ui/button"
import { Download, Share2, TrendingUp, ArrowUpCircle, ArrowDownCircle } from "lucide-react"

interface BestTradeCardProps {
    trade: Trade
    theme?: 'victory' | 'focus' | 'minimal'
}

const TRADE_THEMES = {
    victory: {
        bg: 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500',
        text: 'text-white',
        iconBg: 'bg-white/20',
        border: 'border-white/30'
    },
    focus: {
        bg: 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500',
        text: 'text-white',
        iconBg: 'bg-white/20',
        border: 'border-white/30'
    },
    minimal: {
        bg: 'bg-white dark:bg-solo-black',
        text: 'text-solo-black dark:text-solo-white',
        iconBg: 'bg-solo-gold/10',
        border: 'border-border/50'
    }
}

export function BestTradeCard({ trade, theme = 'minimal' }: BestTradeCardProps) {
    const selectedTheme = TRADE_THEMES[theme]
    const pnl = trade.pnl?.pips ?? 0
    const isWin = pnl > 0

    return (
        <div className="flex flex-col gap-4 items-center">
            {/* Best Trade Showcase Card */}
            <div className={`relative w-full max-w-md aspect-[4/5] ${selectedTheme.bg} ${selectedTheme.text} p-8 flex flex-col justify-between shadow-2xl border ${selectedTheme.border} overflow-hidden`}>
                {/* Animated Background */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 dark:bg-solo-gold/10 rounded-full blur-3xl -z-0 animate-pulse" style={{ animationDuration: '3s' }} />
                <div className="absolute bottom-1/4 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-2xl -z-0" />

                {/* Header */}
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-medium tracking-[0.2em] uppercase opacity-90">SOLO Best Trade</span>
                        <span className="text-[10px] opacity-70">
                            {trade.entryTime ? new Date(trade.entryTime).toLocaleDateString('ja-JP') : ''}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`h-14 w-14 rounded-full ${selectedTheme.iconBg} backdrop-blur-sm flex items-center justify-center`}>
                            {isWin ? (
                                <TrendingUp className="h-7 w-7" />
                            ) : (
                                <ArrowDownCircle className="h-7 w-7" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight">{trade.pair}</h2>
                            <p className={`text-sm ${theme === 'minimal' ? (isWin ? 'text-profit' : 'text-loss') : 'opacity-80'}`}>
                                {trade.direction}
                            </p>
                        </div>
                    </div>
                    <div className={`h-1 w-16 ${theme === 'minimal' ? 'bg-solo-gold' : 'bg-white'} mt-4`} />
                </div>

                {/* Main PnL Display */}
                <div className="relative z-10 flex flex-col items-center justify-center my-6">
                    <div className="text-center relative">
                        {theme !== 'minimal' && (
                            <div className={`absolute inset-0 ${isWin ? 'bg-emerald-300/20' : 'bg-red-300/20'} blur-2xl rounded-full`} />
                        )}
                        <p className="text-sm mb-2 uppercase tracking-widest opacity-80">Profit/Loss</p>
                        <p className={`text-7xl font-bold font-numbers tracking-tighter relative ${theme === 'minimal' ? (isWin ? 'text-profit' : 'text-loss') : ''}`}>
                            {pnl > 0 ? '+' : ''}{pnl}
                            <span className="text-3xl opacity-80 ml-1">pips</span>
                        </p>
                    </div>
                </div>

                {/* Trade Details */}
                <div className={`relative z-10 border-t ${selectedTheme.border} pt-6 space-y-4 backdrop-blur-sm ${selectedTheme.iconBg} rounded-lg p-4 -mb-2`}>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs mb-1 uppercase tracking-wider opacity-70">Entry</p>
                            <p className="text-lg font-medium font-numbers">{trade.entryPrice.toFixed(3)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs mb-1 uppercase tracking-wider opacity-70">Exit</p>
                            <p className="text-lg font-medium font-numbers">{trade.exitPrice?.toFixed(3) ?? '--'}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs mb-1 uppercase tracking-wider opacity-70">Lot Size</p>
                            <p className="text-base font-medium font-numbers">{trade.lotSize}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs mb-1 uppercase tracking-wider opacity-70">Session</p>
                            <p className="text-base font-medium capitalize">{trade.session ?? 'N/A'}</p>
                        </div>
                    </div>
                    {trade.notes && (
                        <div className="pt-2 border-t border-white/10 dark:border-solo-gold/10">
                            <p className="text-xs opacity-80 line-clamp-2 italic">
                                "{trade.notes}"
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="relative z-10 pt-4 mt-2">
                    <p className="text-[10px] text-center tracking-widest uppercase opacity-60">
                        Serenity × Growth × Individual Contour
                    </p>
                </div>
            </div>

            <div className="flex gap-2 w-full max-w-md">
                <Button className="flex-1 bg-solo-navy hover:bg-solo-navy/90 text-white" onClick={() => alert("画像生成をシミュレーションしました！")}>
                    <Download className="mr-2 h-4 w-4" /> 保存
                </Button>
                <Button className="flex-1" variant="outline" onClick={() => alert("シェアをシミュレーションしました！")}>
                    <Share2 className="mr-2 h-4 w-4" /> シェア
                </Button>
            </div>
        </div>
    )
}
