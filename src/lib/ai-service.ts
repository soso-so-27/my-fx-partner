import { TradeRule } from "@/types/trade-rule";

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

export async function analyzeTrade(input: string | File): Promise<AnalysisResult> {
    // Mock implementation
    console.log('Analyzing trade:', input);

    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                summary: 'これはトレードの模擬分析結果です。',
                sentiment: 'Neutral',
                tradeType: 'Long',
            });
        }, 1000);
    });
}

export async function reviewTrade(input: string, rules: TradeRule[]): Promise<ReviewResult> {
    // Mock AI review logic
    console.log('Reviewing trade against rules:', rules);

    return new Promise((resolve) => {
        setTimeout(() => {
            const violatedRules: string[] = [];
            let feedback = "トレードルールに基づいたAIレビュー:\n\n";

            // Simple keyword matching for demo purposes
            // In a real app, this would be an LLM call

            // Check for "impulsive" or "rushed" keywords for mental rules
            if (input.includes("飛び乗り") || input.includes("焦って") || input.includes("急いで")) {
                const mentalRules = rules.filter(r => r.category === 'MENTAL');
                if (mentalRules.length > 0) {
                    violatedRules.push(mentalRules[0].title);
                    feedback += `⚠️ **メンタルルール違反の可能性**: 「${mentalRules[0].title}」に抵触している可能性があります。感情的なエントリーは避けましょう。\n`;
                }
            }

            // Check for "news" or "indicator" keywords for risk rules
            if (input.includes("指標") || input.includes("発表")) {
                const riskRules = rules.filter(r => r.category === 'RISK');
                if (riskRules.length > 0) {
                    violatedRules.push(riskRules[0].title);
                    feedback += `⚠️ **資金管理ルール注意**: 「${riskRules[0].title}」を確認してください。指標発表前後のボラティリティに注意が必要です。\n`;
                }
            }

            if (violatedRules.length === 0) {
                feedback += "✅ **素晴らしいです！**\n登録されているトレードルールを遵守しているようです。この調子で規律あるトレードを続けましょう。";
            } else {
                feedback += "\n次回のトレードではこれらの点に注意して、改善していきましょう。";
            }

            resolve({
                compliant: violatedRules.length === 0,
                feedback,
                violatedRules
            });
        }, 1500);
    });
}
