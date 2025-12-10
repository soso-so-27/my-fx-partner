import { AnalysisStats } from "@/lib/analysis-engine"
import { Button } from "@/components/ui/button"
import { Download, Share2, ShieldCheck, CheckCircle2 } from "lucide-react"

interface SocialCardProps {
    stats: AnalysisStats
    period?: string
    theme?: 'ocean' | 'sunset' | 'midnight' | 'minimal'
}

const GRADIENT_THEMES = {
    ocean: {
        bg: 'bg-gradient-to-br from-blue-500 via-teal-500 to-emerald-500',
        text: 'text-white',
        accent: 'bg-white/20',
        border: 'border-white/30'
    },
    sunset: {
        bg: 'bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600',
        text: 'text-white',
        accent: 'bg-white/20',
        border: 'border-white/30'
    },
    midnight: {
        bg: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
        text: 'text-white',
        accent: 'bg-solo-gold/20',
        border: 'border-solo-gold/30'
    },
    minimal: {
        bg: 'bg-white dark:bg-solo-black',
        text: 'text-solo-black dark:text-solo-white',
        accent: 'bg-solo-gold/10',
        border: 'border-border/50'
    }
}

export function SocialCard({ stats, period = "Weekly Report", theme = 'minimal' }: SocialCardProps) {
    const selectedTheme = GRADIENT_THEMES[theme]

    return (
        <div className="flex flex-col gap-4 items-center">
            {/* Redesigned SOLO Card - Emphasizes Verified Data */}
            <div className={`relative w-full max-w-md aspect-[4/5] ${selectedTheme.bg} ${selectedTheme.text} p-8 flex flex-col justify-between shadow-2xl border ${selectedTheme.border} overflow-hidden`}>
                {/* Animated Background Elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 dark:bg-solo-gold/10 rounded-full blur-3xl -z-0 animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 dark:bg-solo-navy/10 rounded-full blur-2xl -z-0" />

                {/* Header with Verified Badge */}
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium tracking-[0.2em] uppercase opacity-90">SOLO Growth OS</span>
                        {stats.verifiedRate > 0 && (
                            <div className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded-full">
                                <ShieldCheck className="h-3 w-3 text-green-400" />
                                <span className="text-[10px] text-green-400 font-medium">Real {stats.verifiedRate}%</span>
                            </div>
                        )}
                    </div>
                    <h2 className="text-2xl font-light tracking-tight mb-1">{period}</h2>
                    <div className={`h-1 w-12 ${theme === 'minimal' ? 'bg-solo-gold' : 'bg-white'} mt-3`} />
                </div>

                {/* Main Metric - Now shows Profit/Loss prominently */}
                <div className="relative z-10 flex flex-col items-center justify-center my-4">
                    <div className="text-center relative">
                        {theme !== 'minimal' && (
                            <div className="absolute inset-0 bg-white/10 blur-xl rounded-full" />
                        )}
                        <p className="text-xs mb-1 uppercase tracking-widest opacity-70">
                            損益
                        </p>
                        <p className={`text-5xl font-bold font-numbers tracking-tighter relative ${stats.totalPnl >= 0
                                ? (theme === 'minimal' ? 'text-profit' : 'text-white')
                                : (theme === 'minimal' ? 'text-loss' : 'text-white')
                            }`}>
                            {stats.totalPnl >= 0 ? '+' : ''}{stats.totalPnl.toLocaleString()}
                            <span className={`text-xl ${theme === 'minimal' ? '' : 'opacity-80'}`}>pips</span>
                        </p>
                    </div>
                </div>

                {/* Secondary Stats - Win Rate, PF, Trades */}
                <div className={`relative z-10 grid grid-cols-3 gap-3 border-t ${selectedTheme.border} pt-4 backdrop-blur-sm ${selectedTheme.accent} rounded-lg p-3`}>
                    <div className="text-center">
                        <p className="text-[10px] mb-0.5 uppercase tracking-wider opacity-70">勝率</p>
                        <p className={`text-lg font-bold font-numbers ${theme === 'minimal' ? (stats.winRate >= 50 ? 'text-profit' : 'text-loss') : ''}`}>
                            {stats.winRate}%
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] mb-0.5 uppercase tracking-wider opacity-70">PF</p>
                        <p className={`text-lg font-bold font-numbers ${theme === 'minimal' ? (stats.profitFactor >= 1 ? 'text-profit' : 'text-loss') : ''}`}>
                            {stats.profitFactor}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] mb-0.5 uppercase tracking-wider opacity-70">取引数</p>
                        <p className="text-lg font-bold font-numbers">{stats.totalTrades}</p>
                    </div>
                </div>

                {/* Footer - Emphasizes authenticity */}
                <div className="relative z-10 pt-3 mt-1">
                    <p className="text-[9px] text-center tracking-widest uppercase opacity-50">
                        メール連携による自動記録 • 改ざん不可
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
