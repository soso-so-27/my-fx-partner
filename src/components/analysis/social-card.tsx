import { AnalysisStats } from "@/lib/analysis-engine"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Share2 } from "lucide-react"

interface SocialCardProps {
    stats: AnalysisStats
    period?: string
}

export function SocialCard({ stats, period = "Weekly Report" }: SocialCardProps) {
    return (
        <div className="flex flex-col gap-4 items-center">
            {/* SOLO Style: Elegant & Serene */}
            <div className="relative w-full max-w-md aspect-[4/5] bg-white dark:bg-solo-black text-solo-black dark:text-solo-white p-8 flex flex-col justify-between shadow-2xl border border-border/50">
                {/* Background Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-solo-gold/10 rounded-bl-full -z-0" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-solo-navy/5 rounded-tr-full -z-0" />

                {/* Header */}
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium tracking-[0.2em] text-solo-gold uppercase">SOLO Growth OS</span>
                        <span className="text-[10px] text-muted-foreground">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <h2 className="text-3xl font-light tracking-tight">{period}</h2>
                    <div className="h-1 w-12 bg-solo-gold mt-4" />
                </div>

                {/* Main Metric */}
                <div className="relative z-10 flex flex-col items-center justify-center my-8">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2 uppercase tracking-widest">Win Rate</p>
                        <p className="text-6xl font-bold font-numbers text-solo-navy dark:text-solo-white tracking-tighter">
                            {stats.winRate}<span className="text-3xl text-solo-gold">%</span>
                        </p>
                    </div>
                </div>

                {/* Secondary Stats */}
                <div className="relative z-10 grid grid-cols-2 gap-8 border-t border-border/50 pt-8">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Profit Factor</p>
                        <p className="text-2xl font-bold font-numbers">{stats.profitFactor}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Total PnL</p>
                        <p className={`text-2xl font-bold font-numbers ${stats.totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                            {stats.totalPnl > 0 ? '+' : ''}{stats.totalPnl}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Trades</p>
                        <p className="text-xl font-medium font-numbers">{stats.totalTrades}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Best Pair</p>
                        <p className="text-xl font-medium">{stats.bestPair}</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 pt-6 mt-2">
                    <p className="text-[10px] text-center text-muted-foreground tracking-widest uppercase">
                        Serenity x Growth x Individual Contour
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
