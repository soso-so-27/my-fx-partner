import { Trade } from "@/types/trade";

export interface AnalysisStats {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    totalPnl: number;
    averageWin: number;
    averageLoss: number;
    maxDrawdown: number;
    bestPair: string;
    worstPair: string;
}

export const analysisEngine = {
    calculateStats(trades: Trade[]): AnalysisStats {
        const closedTrades = trades.filter(t => t.status === 'Closed' && t.pnl !== undefined);
        const totalTrades = closedTrades.length;

        if (totalTrades === 0) {
            return {
                totalTrades: 0,
                winRate: 0,
                profitFactor: 0,
                totalPnl: 0,
                averageWin: 0,
                averageLoss: 0,
                maxDrawdown: 0,
                bestPair: '-',
                worstPair: '-'
            };
        }

        const wins = closedTrades.filter(t => t.pnl! > 0);
        const losses = closedTrades.filter(t => t.pnl! <= 0);

        const totalWinPnl = wins.reduce((sum, t) => sum + t.pnl!, 0);
        const totalLossPnl = Math.abs(losses.reduce((sum, t) => sum + t.pnl!, 0));

        const winRate = (wins.length / totalTrades) * 100;
        const profitFactor = totalLossPnl === 0 ? totalWinPnl : totalWinPnl / totalLossPnl;
        const totalPnl = closedTrades.reduce((sum, t) => sum + t.pnl!, 0);

        const averageWin = wins.length > 0 ? totalWinPnl / wins.length : 0;
        const averageLoss = losses.length > 0 ? totalLossPnl / losses.length : 0;

        // Simple pair analysis
        const pairPerformance: Record<string, number> = {};
        closedTrades.forEach(t => {
            pairPerformance[t.pair] = (pairPerformance[t.pair] || 0) + t.pnl!;
        });

        const sortedPairs = Object.entries(pairPerformance).sort((a, b) => b[1] - a[1]);
        const bestPair = sortedPairs.length > 0 ? sortedPairs[0][0] : '-';
        const worstPair = sortedPairs.length > 0 ? sortedPairs[sortedPairs.length - 1][0] : '-';

        return {
            totalTrades,
            winRate: parseFloat(winRate.toFixed(1)),
            profitFactor: parseFloat(profitFactor.toFixed(2)),
            totalPnl,
            averageWin: parseFloat(averageWin.toFixed(0)),
            averageLoss: parseFloat(averageLoss.toFixed(0)),
            maxDrawdown: 0, // Placeholder for complex calculation
            bestPair,
            worstPair
        };
    }
};
