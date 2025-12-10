import { TradeRule } from "@/types/trade-rule";
import { Trade } from "@/types/trade";

// Feature flag to switch between mock and real AI
const USE_REAL_AI = true;

export interface AnalysisResult {
    summary: string;
    sentiment: string;
    tradeType: 'Long' | 'Short' | 'Unknown';
}

export interface ReviewResult {
    compliant: boolean;
    feedback: string;
    violatedRules: string[];
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

/**
 * Generate AI coaching response using OpenAI GPT-4
 */
export async function generateCoachingResponse(
    input: string,
    context: 'pre-trade' | 'post-trade' | 'review',
    conversationHistory: ChatMessage[] = []
): Promise<string> {
    if (!USE_REAL_AI) {
        return mockCoachingResponse(input, context);
    }

    try {
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: input,
                mode: context,
                conversationHistory: conversationHistory.map(msg => ({
                    role: msg.role,
                    content: msg.content
                }))
            })
        });

        if (!response.ok) {
            console.error('AI API error:', response.status);
            return mockCoachingResponse(input, context);
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Failed to call AI API:', error);
        return mockCoachingResponse(input, context);
    }
}

/**
 * Analyze trades using OpenAI GPT-4
 */
export async function analyzeTradesWithAI(trades: Trade[], period: string = '全期間'): Promise<string> {
    if (!USE_REAL_AI) {
        return "これはトレードの模擬分析結果です。実際のAI分析を有効にするには、OpenAI APIキーを設定してください。";
    }

    try {
        const response = await fetch('/api/ai/analyze-trade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trades, period })
        });

        if (!response.ok) {
            console.error('Trade analysis API error:', response.status);
            return "トレード分析を実行できませんでした。";
        }

        const data = await response.json();
        return data.analysis;
    } catch (error) {
        console.error('Failed to analyze trades:', error);
        return "トレード分析中にエラーが発生しました。";
    }
}

/**
 * Analyze chart image using GPT-4 Vision
 */
export async function analyzeChartImage(imageBase64: string, context?: string): Promise<string> {
    if (!USE_REAL_AI) {
        return "これはチャートの模擬分析結果です。実際のAI画像分析を有効にするには、OpenAI APIキーを設定してください。";
    }

    try {
        const response = await fetch('/api/ai/analyze-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64, context })
        });

        if (!response.ok) {
            console.error('Image analysis API error:', response.status);
            return "画像分析を実行できませんでした。";
        }

        const data = await response.json();
        return data.analysis;
    } catch (error) {
        console.error('Failed to analyze image:', error);
        return "画像分析中にエラーが発生しました。";
    }
}

/**
 * Legacy function for backward compatibility
 */
export async function analyzeTrade(input: string | File): Promise<AnalysisResult> {
    console.log('Analyzing trade:', input);
    return {
        summary: 'これはトレードの模擬分析結果です。',
        sentiment: 'Neutral',
        tradeType: 'Long',
    };
}

/**
 * Review trade against rules using AI
 */
export async function reviewTrade(input: string, rules: TradeRule[]): Promise<ReviewResult> {
    if (!USE_REAL_AI || rules.length === 0) {
        return mockReviewTrade(input, rules);
    }

    try {
        // Use coaching API with rule context
        const ruleContext = rules.map(r => `- ${r.title}: ${r.description}`).join('\n');
        const prompt = `以下のトレード内容を、登録されたルールと照合してレビューしてください。

【トレード内容】
${input}

【登録済みルール】
${ruleContext}

ルール違反があれば指摘し、問題なければ褒めてください。`;

        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: prompt,
                mode: 'review',
                conversationHistory: []
            })
        });

        if (!response.ok) {
            return mockReviewTrade(input, rules);
        }

        const data = await response.json();
        const feedback = data.response;

        // Simple heuristic to detect violations
        const hasViolation = feedback.includes('⚠️') || feedback.includes('違反') || feedback.includes('注意');

        return {
            compliant: !hasViolation,
            feedback,
            violatedRules: hasViolation ? ['AIが懸念点を検出しました'] : []
        };
    } catch (error) {
        console.error('Failed to review trade:', error);
        return mockReviewTrade(input, rules);
    }
}

// ============== Mock Functions (Fallback) ==============

function mockCoachingResponse(input: string, context: 'pre-trade' | 'post-trade' | 'review'): Promise<string> {
    return new Promise((resolve) => {
        setTimeout(() => {
            let response = "";

            if (context === 'pre-trade') {
                if (input.length < 20) {
                    response = "エントリー根拠が少し短いようです。\n**「なぜ今なのか？」「損切りラインはどこか？」**\nこの2点を具体的に教えていただけますか？";
                } else if (!input.includes("損切り") && !input.includes("SL")) {
                    response = "シナリオは良さそうですね。\nただ、**「損切り位置（撤退ライン）」**についてはどう考えていますか？\nエントリー前に必ず決めておきましょう。";
                } else {
                    response = "論理的なシナリオですね。\n**「もしこのシナリオが崩れるとしたら、何がきっかけになると思いますか？」**\n逆の視点も持っておくと冷静さを保てます。";
                }
            } else if (context === 'post-trade') {
                if (input.includes("負け") || input.includes("損切り")) {
                    response = "損切りは辛いですが、ルール通りならナイスロスです。\n**「エントリー時の想定と、実際の動きで違った点」**はどこでしたか？\nそこから学びを見つけましょう。";
                } else if (input.includes("勝ち") || input.includes("利確")) {
                    response = "ナイス利確です！\n**「今回の勝因を1つだけ挙げるとしたら何ですか？」**\n再現性を高めるために言語化しておきましょう。";
                } else {
                    response = "お疲れ様でした。\n**「トレード中の感情の揺れ」**はありましたか？\n焦りや不安があったなら、それはなぜだったのか深掘りしてみましょう。";
                }
            } else {
                response = "振り返りは成長の源泉です。\n**「今週のトレードで、自分を褒めたいポイント」**はどこですか？\n小さな成功体験を積み重ねていきましょう。";
            }

            resolve(response);
        }, 500);
    });
}

function mockReviewTrade(input: string, rules: TradeRule[]): Promise<ReviewResult> {
    return new Promise((resolve) => {
        setTimeout(() => {
            const violatedRules: string[] = [];
            let feedback = "トレードルールに基づいたAIレビュー:\n\n";

            if (input.includes("飛び乗り") || input.includes("焦って") || input.includes("急いで")) {
                const mentalRules = rules.filter(r => r.category === 'MENTAL');
                if (mentalRules.length > 0) {
                    violatedRules.push(mentalRules[0].title);
                    feedback += `⚠️ **メンタルルール違反の可能性**: 「${mentalRules[0].title}」に抵触している可能性があります。\n`;
                }
            }

            if (input.includes("指標") || input.includes("発表")) {
                const riskRules = rules.filter(r => r.category === 'RISK');
                if (riskRules.length > 0) {
                    violatedRules.push(riskRules[0].title);
                    feedback += `⚠️ **資金管理ルール注意**: 「${riskRules[0].title}」を確認してください。\n`;
                }
            }

            if (violatedRules.length === 0) {
                feedback += "✅ **素晴らしいです！**\n登録されているトレードルールを遵守しているようです。";
            }

            resolve({
                compliant: violatedRules.length === 0,
                feedback,
                violatedRules
            });
        }, 500);
    });
}
