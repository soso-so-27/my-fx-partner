import { Trade } from "@/types/trade";

export interface AnalysisStats {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    totalPnl: number;       // 金額（円）
    totalPnlPips: number;   // pips
    averageWin: number;
    averageLoss: number;
    maxDrawdown: number;
    bestPair: string;
    worstPair: string;
    verifiedRate: number; // 検証済み（Real）トレードの割合
    verifiedCount: number; // 検証済みトレード数
}

export const analysisEngine = {
    calculateStats(trades: Trade[]): AnalysisStats {
        const closedTrades = trades.filter(t => t.exitTime !== undefined && t.pnl !== undefined);
        const totalTrades = closedTrades.length;

        if (totalTrades === 0) {
            return {
                totalTrades: 0,
                winRate: 0,
                profitFactor: 0,
                totalPnl: 0,
                totalPnlPips: 0,
                averageWin: 0,
                averageLoss: 0,
                maxDrawdown: 0,
                bestPair: '-',
                worstPair: '-',
                verifiedRate: 0,
                verifiedCount: 0
            };
        }

        const wins = closedTrades.filter(t => t.pnl?.amount && t.pnl.amount > 0);
        const losses = closedTrades.filter(t => t.pnl?.amount && t.pnl.amount <= 0);
        const verified = closedTrades.filter(t => t.isVerified);

        const totalWinPnl = wins.reduce((sum, t) => sum + (t.pnl?.amount ?? 0), 0);
        const totalLossPnl = Math.abs(losses.reduce((sum, t) => sum + (t.pnl?.amount ?? 0), 0));

        const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
        const profitFactor = totalLossPnl === 0 ? totalWinPnl : totalWinPnl / totalLossPnl;
        const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl?.amount ?? 0), 0);
        const totalPnlPips = closedTrades.reduce((sum, t) => sum + (t.pnl?.pips ?? 0), 0);
        const verifiedRate = totalTrades > 0 ? (verified.length / totalTrades) * 100 : 0;

        const averageWin = wins.length > 0 ? totalWinPnl / wins.length : 0;
        const averageLoss = losses.length > 0 ? totalLossPnl / losses.length : 0;

        // Simple pair analysis
        const pairPerformance: Record<string, number> = {};
        closedTrades.forEach(t => {
            pairPerformance[t.pair] = (pairPerformance[t.pair] || 0) + (t.pnl?.amount ?? 0);
        });

        const sortedPairs = Object.entries(pairPerformance).sort((a, b) => b[1] - a[1]);
        const bestPair = sortedPairs.length > 0 ? sortedPairs[0][0] : '-';
        const worstPair = sortedPairs.length > 0 ? sortedPairs[sortedPairs.length - 1][0] : '-';

        return {
            totalTrades,
            winRate: parseFloat(winRate.toFixed(1)),
            profitFactor: parseFloat(profitFactor.toFixed(2)),
            totalPnl: parseFloat(totalPnl.toFixed(0)),
            totalPnlPips: parseFloat(totalPnlPips.toFixed(1)),
            averageWin: parseFloat(averageWin.toFixed(0)),
            averageLoss: parseFloat(averageLoss.toFixed(0)),
            maxDrawdown: 0, // Placeholder for complex calculation
            bestPair,
            worstPair,
            verifiedRate: parseFloat(verifiedRate.toFixed(1)),
            verifiedCount: verified.length
        };
    }
};

