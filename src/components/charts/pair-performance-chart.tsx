"use client"

import { Trade } from "@/types/trade"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'

interface PairPerformanceChartProps {
    trades: Trade[]
}

export function PairPerformanceChart({ trades }: PairPerformanceChartProps) {
    // Group trades by pair and calculate total PnL
    const pairData = trades
        .filter(t => t.pnl?.amount !== undefined)
        .reduce((acc, trade) => {
            if (!acc[trade.pair]) {
                acc[trade.pair] = { pair: trade.pair, totalPnL: 0, count: 0 }
            }
            acc[trade.pair].totalPnL += trade.pnl?.amount || 0
            acc[trade.pair].count += 1
            return acc
        }, {} as Record<string, { pair: string, totalPnL: number, count: number }>)

    const data = Object.values(pairData)
        .sort((a, b) => b.totalPnL - a.totalPnL)

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                データがありません
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                    dataKey="pair"
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
                    formatter={(value: number, name: string, props: any) => [
                        `¥${value.toLocaleString()}`,
                        `合計損益 (${props.payload.count}件)`
                    ]}
                />
                <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                <Bar dataKey="totalPnL" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={entry.totalPnL >= 0 ? '#ff4444' : '#4444ff'}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}
