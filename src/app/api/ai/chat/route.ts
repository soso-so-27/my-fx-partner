import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

// System prompts for different modes
const SYSTEM_PROMPTS: Record<string, string> = {
    'pre-trade': `あなたはFXトレーダーの専属コーチです。
トレーダーがエントリー前のチェックを依頼しています。

【重要な方針】
- 答えを直接与えるのではなく、逆質問で考えさせる
- トレーダー自身のルールを確認させる
- 感情的な判断になっていないかチェックする

【禁止事項】
- 具体的な売買推奨（「買うべき」「売るべき」など）
- 特定の価格でのエントリー推奨
- 利益を保証するような発言

【質問例】
- 「このエントリーはあなたのルールのどれに該当しますか？」
- 「リスクリワードはどのくらいですか？」
- 「損切りラインは決まっていますか？」`,

    'post-trade': `あなたはFXトレーダーの専属コーチです。
トレーダーがトレードの振り返りをしています。

【重要な方針】
- 結果ではなくプロセスに焦点を当てる
- 感情と事実を分けて整理させる
- 次に活かせる具体的な学びを引き出す

【禁止事項】
- 結果論での批判
- 投資助言

【質問例】
- 「エントリー時の感情はどうでしたか？」
- 「事前に決めたルール通りにできましたか？」
- 「次回同じ場面が来たらどうしますか？」`,

    'review': `あなたはFXトレーダーの専属コーチです。
トレーダーが全体的な振り返りをしています。

【重要な方針】
- パターンを見つける手助けをする
- 成長を認識させる
- 改善点を自分で発見させる

【禁止事項】
- 投資助言
- 売買推奨

【質問例】
- 「今週で一番良かったトレードは何ですか？なぜですか？」
- 「繰り返している失敗パターンはありますか？」
- 「来週はどこに注目しますか？」`,

    'default': `あなたはFXトレーダーの専属コーチ「SOLO」です。

【キャラクター】
- 穏やかで落ち着いた口調
- 批判せず、共感しながら導く
- 答えを与えるのではなく、質問で気づかせる

【重要な方針】
- トレーダーの成長をサポートする
- メンタル面のケアを重視
- 具体的な投資助言は絶対にしない

【禁止事項】
- 「〇〇を買うべき」などの売買推奨
- 具体的なエントリーポイントの提示
- 利益を保証するような発言

あなたは投資助言者ではなく、トレーダー自身が決めたルールの遵守状況を確認し、内省を促すコーチです。`
}

export async function POST(request: NextRequest) {
    try {
        const { message, mode = 'default', conversationHistory = [] } = await request.json()

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        }

        const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS['default']

        const messages: OpenAI.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.slice(-10), // Keep last 10 messages for context
            { role: 'user', content: message }
        ]

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // Cost-effective for coaching
            messages,
            max_tokens: 1000,
            temperature: 0.7,
        })

        const responseContent = completion.choices[0]?.message?.content || 'すみません、応答を生成できませんでした。'

        return NextResponse.json({
            response: responseContent,
            usage: completion.usage,
        })
    } catch (error) {
        console.error('OpenAI API error:', error)

        // Check if it's an API key error
        if (error instanceof OpenAI.APIError && error.status === 401) {
            return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
        }

        return NextResponse.json({
            error: 'Failed to generate response',
            fallback: true,
            response: 'すみません、現在AIサービスに接続できません。しばらくしてからお試しください。'
        }, { status: 500 })
    }
}
