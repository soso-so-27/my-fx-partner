import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { Trade } from '@/types/trade'

const ANALYSIS_SYSTEM_PROMPT = `あなたはFXトレードの分析を行うAIアシスタントです。

【あなたの役割】
- トレード履歴から統計的なパターンを発見する
- 改善点を客観的に指摘する
- 成長している点を認識させる

【分析の観点】
1. 勝率・損益の傾向
2. 時間帯・曜日のパターン
3. 通貨ペア別の成績
4. メンタル面の傾向（タグから推測）

【重要な制約】
- 投資助言は絶対にしない
- 「〇〇を買うべき」などの推奨はしない
- 過去データの分析と気づきの提供のみ

【出力形式】
日本語で、以下の構成で回答してください：
1. 📊 統計サマリー（数値の確認）
2. 💡 発見したパターン
3. ✅ うまくいっていること
4. ⚠️ 改善の余地があること
5. 🎯 次に意識できること（質問形式で）`

export async function POST(request: NextRequest) {
    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        })
        const { trades, period = '全期間' } = await request.json()

        if (!trades || !Array.isArray(trades) || trades.length === 0) {
            return NextResponse.json({ error: 'Trades data is required' }, { status: 400 })
        }

        // Prepare trade summary for AI
        const tradeSummary = prepareTradeData(trades)

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
                {
                    role: 'user',
                    content: `以下のトレードデータを分析してください。

【期間】${period}
【トレード件数】${trades.length}件

${tradeSummary}

分析をお願いします。`
                }
            ],
            max_tokens: 1500,
            temperature: 0.5,
        })

        const analysis = completion.choices[0]?.message?.content || '分析を生成できませんでした。'

        return NextResponse.json({
            analysis,
            usage: completion.usage,
        })
    } catch (error) {
        console.error('Trade analysis error:', error)
        return NextResponse.json({
            error: 'Failed to analyze trades',
            analysis: 'トレード分析を実行できませんでした。'
        }, { status: 500 })
    }
}

function prepareTradeData(trades: Trade[]): string {
    // Calculate basic stats
    const closedTrades = trades.filter(t => t.exitPrice !== undefined)
    const wins = closedTrades.filter(t => (t.pnl?.amount ?? 0) > 0)
    const losses = closedTrades.filter(t => (t.pnl?.amount ?? 0) <= 0)

    const winRate = closedTrades.length > 0
        ? ((wins.length / closedTrades.length) * 100).toFixed(1)
        : '0'

    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl?.amount ?? 0), 0)
    const avgWin = wins.length > 0
        ? (wins.reduce((sum, t) => sum + (t.pnl?.amount ?? 0), 0) / wins.length).toFixed(0)
        : '0'
    const avgLoss = losses.length > 0
        ? (losses.reduce((sum, t) => sum + (t.pnl?.amount ?? 0), 0) / losses.length).toFixed(0)
        : '0'

    // Pair breakdown
    const pairStats: Record<string, { wins: number, total: number, pnl: number }> = {}
    closedTrades.forEach(t => {
        if (!pairStats[t.pair]) {
            pairStats[t.pair] = { wins: 0, total: 0, pnl: 0 }
        }
        pairStats[t.pair].total++
        pairStats[t.pair].pnl += t.pnl?.amount ?? 0
        if ((t.pnl?.amount ?? 0) > 0) pairStats[t.pair].wins++
    })

    // Direction breakdown
    const buyTrades = closedTrades.filter(t => t.direction === 'BUY')
    const sellTrades = closedTrades.filter(t => t.direction === 'SELL')
    const buyWins = buyTrades.filter(t => (t.pnl?.amount ?? 0) > 0).length
    const sellWins = sellTrades.filter(t => (t.pnl?.amount ?? 0) > 0).length

    // Tag analysis
    const tagCounts: Record<string, number> = {}
    trades.forEach(t => {
        t.tags?.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
    })

    return `【基本統計】
- 勝率: ${winRate}%（${wins.length}勝 / ${losses.length}敗）
- 合計損益: ${totalPnl > 0 ? '+' : ''}${totalPnl}
- 平均利益: +${avgWin}
- 平均損失: ${avgLoss}

【方向別】
- BUY: ${buyTrades.length}件（勝率 ${buyTrades.length > 0 ? ((buyWins / buyTrades.length) * 100).toFixed(0) : 0}%）
- SELL: ${sellTrades.length}件（勝率 ${sellTrades.length > 0 ? ((sellWins / sellTrades.length) * 100).toFixed(0) : 0}%）

【通貨ペア別】
${Object.entries(pairStats)
            .sort((a, b) => b[1].pnl - a[1].pnl)
            .slice(0, 5)
            .map(([pair, stats]) =>
                `- ${pair}: ${stats.total}件, 勝率${((stats.wins / stats.total) * 100).toFixed(0)}%, 損益${stats.pnl > 0 ? '+' : ''}${stats.pnl}`
            ).join('\n')}

【タグ（感情・状況）】
${Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tag, count]) => `- ${tag}: ${count}回`)
            .join('\n')}`
}
