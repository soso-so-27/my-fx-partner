"use client"

import { Trade } from "@/types/trade"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface PnLChartProps {
    trades: Trade[]
}

export function PnLChart({ trades }: PnLChartProps) {
    // Calculate cumulative PnL over time
    const data = trades
        .filter(t => t.pnl?.amount !== undefined)
        .sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime())
        .reduce((acc, trade, index) => {
            const cumulative = index === 0
                ? (trade.pnl.amount || 0)
                : acc[index - 1].cumulative + (trade.pnl.amount || 0)

            acc.push({
                date: new Date(trade.entryTime).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
                cumulative,
                pnl: trade.pnl.amount || 0
            })
            return acc
        }, [] as { date: string, cumulative: number, pnl: number }[])

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                データがありません
            </div>
        )
    }

    return (
        <div style={{ width: '100%', height: 300, touchAction: 'pan-y' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis
                        dataKey="date"
                        stroke="#888"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="#888"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => `¥${value.toLocaleString()}`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '8px'
                        }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(value: number) => [`¥${value.toLocaleString()}`, '累計決済損益']}
                    />
                    <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                    <Line
                        type="monotone"
                        dataKey="cumulative"
                        stroke="#d4af37"
                        strokeWidth={2}
                        dot={{ fill: '#d4af37', r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
