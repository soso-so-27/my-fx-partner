import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

const IMAGE_ANALYSIS_PROMPT = `あなたはFXチャートを分析するテクニカルアナリストです。

【分析の観点】
1. チャートパターン（ダブルトップ、三角保ち合い等）
2. トレンドの方向性
3. サポート/レジスタンスライン
4. ローソク足のパターン

【重要な制約】
- 投資助言は絶対にしない
- 「買うべき」「売るべき」などの推奨はしない
- 客観的な観察事実のみを伝える
- 最終判断はトレーダー自身が行うことを明記

【出力形式】
1. 📈 観察できるパターン
2. 📊 トレンド状況
3. 🔍 注目ポイント
4. ❓ トレーダーへの質問（自分で考えさせる）

「この分析は参考情報であり、投資判断はご自身の責任で行ってください」という免責を最後に必ず入れてください。`

export async function POST(request: NextRequest) {
    try {
        const { imageBase64, imageUrl, context = '' } = await request.json()

        if (!imageBase64 && !imageUrl) {
            return NextResponse.json({ error: 'Image data is required' }, { status: 400 })
        }

        const imageContent: OpenAI.ChatCompletionContentPart = imageUrl
            ? { type: 'image_url', image_url: { url: imageUrl } }
            : { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o', // Vision capabilities require gpt-4o
            messages: [
                { role: 'system', content: IMAGE_ANALYSIS_PROMPT },
                {
                    role: 'user',
                    content: [
                        imageContent,
                        {
                            type: 'text',
                            text: context
                                ? `このチャート画像を分析してください。\n\n【追加情報】${context}`
                                : 'このチャート画像を分析してください。'
                        }
                    ]
                }
            ],
            max_tokens: 1000,
            temperature: 0.5,
        })

        const analysis = completion.choices[0]?.message?.content || '画像分析を生成できませんでした。'

        return NextResponse.json({
            analysis,
            usage: completion.usage,
        })
    } catch (error) {
        console.error('Image analysis error:', error)

        if (error instanceof OpenAI.APIError && error.status === 400) {
            return NextResponse.json({
                error: 'Invalid image format',
                analysis: '画像形式が正しくありません。JPEGまたはPNG形式でアップロードしてください。'
            }, { status: 400 })
        }

        return NextResponse.json({
            error: 'Failed to analyze image',
            analysis: '画像分析を実行できませんでした。'
        }, { status: 500 })
    }
}
