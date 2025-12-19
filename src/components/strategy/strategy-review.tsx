"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertTriangle, ArrowRight, Save, Clock, Sparkles, Shield, Target } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { PAIR_OPTIONS } from "./types"

interface StrategyReviewProps {
    onComplete: (data: any) => void;
}

export function StrategyReview({ onComplete }: StrategyReviewProps) {
    const { toast } = useToast()
    const [step, setStep] = useState(1);
    const [isAnimating, setIsAnimating] = useState(false);

    // Survey State
    const [compliance, setCompliance] = useState<'yes' | 'partial' | 'no' | null>(null);
    const [violationCause, setViolationCause] = useState<string[]>([]);
    const [chartFrequency, setChartFrequency] = useState<'low' | 'mid' | 'high' | null>(null);
    const [priorityPairs, setPriorityPairs] = useState<string[]>([]);
    const [limitFocus, setLimitFocus] = useState<string>('');
    const [note, setNote] = useState<string>('');

    // Output State
    const [reviewOutput, setReviewOutput] = useState<any>(null);

    // Mock AI Logic ("Ordering" Generator)
    const generateOutput = () => {
        // Logic-based templates to simulate AI
        const prohibited = [];
        const flags = [];
        let theme = "基本の徹底";
        let motto = "守る週：勝たなくていい、崩さない";

        // Logic 1: Prohibited Rules based on Cause
        if (violationCause.includes('時間帯')) prohibited.push("23時以降の新規エントリー禁止");
        if (violationCause.includes('感情')) prohibited.push("負けた直後の即エントリー禁止");
        if (violationCause.includes('指標前後')) prohibited.push("重要指標の前後60分はアプリを閉じる");
        if (violationCause.includes('連敗後')) prohibited.push("2連敗したらその日は終了");
        if (prohibited.length === 0) prohibited.push("セットアップ不十分なエントリー禁止");

        // Logic 2: Caution Flags
        if (chartFrequency === 'high') flags.push("チャート見すぎ：アラートのみで対応");
        if (priorityPairs.length > 0) flags.push(`${priorityPairs.join(', ')} 以外は監視しない`);

        // Logic 3: Theme
        if (compliance === 'no') theme = "リハビリ：回数を極限まで減らす";
        else if (limitFocus === 'stop_loss') theme = "損切り：遅れをゼロにする";
        else if (limitFocus === 'no_look') theme = "メリハリ：見ない時間を守る";
        else theme = "精度向上：得意パターンのみ狙う";

        // Logic 4: Motto (Headspace style)
        const mottos = [
            "焦らない。相場は逃げない。",
            "自分との約束を守るだけで100点。",
            "呼吸を整えて、待つことを楽しむ。",
            "一回の勝ち負けより、一回の正しい判断。"
        ];
        motto = mottos[Math.floor(Math.random() * mottos.length)];

        return {
            prohibited_rules: prohibited.slice(0, 3),
            caution_flags: flags,
            training_theme: theme,
            motto: motto
        };
    };

    const handleSurveySubmit = () => {
        setIsAnimating(true);
        // Simulate "Thinking" time
        setTimeout(() => {
            const output = generateOutput();
            setReviewOutput(output);
            setStep(2);
            setIsAnimating(false);

            // Quiet Toast
            toast({
                title: "お疲れ様でした",
                description: "今週の振り返りが完了しました。ストリーク +1 🔥",
            });
        }, 1500); // 1.5s delay
    };

    const handleFinalize = () => {
        onComplete({
            completedAt: new Date().toISOString(),
            score: 100, // Placeholder
            badges: ['weekly_review_done'],
            survey: {
                compliance,
                violation_cause: violationCause,
                chart_frequency: chartFrequency,
                chart_frequency_reason: '', // Simplified for UI
                next_priority_pairs: priorityPairs,
                next_limit_focus: limitFocus,
                note
            },
            output: reviewOutput
        });
    };

    // Toggle helper
    const toggleSelection = (current: string[], item: string, max: number = 99) => {
        if (current.includes(item)) return current.filter(i => i !== item);
        if (current.length >= max) return current;
        return [...current, item];
    };

    return (
        <div className="space-y-4 relative">
            {isAnimating && (
                <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
                    <p className="text-sm font-medium animate-pulse">AIが来週の「整え」を作成中...</p>
                </div>
            )}

            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">週末レビュー (60秒)</h2>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {step === 1 ? (
                        <>
                            <Clock className="h-3 w-3" />
                            <span>目標: 1分</span>
                        </>
                    ) : (
                        <span className="text-primary font-bold">完了!</span>
                    )}
                </div>
            </div>

            {step === 1 && (
                <Card>
                    <CardHeader className="pb-3 border-b bg-muted/20">
                        <CardTitle className="text-sm flex items-center gap-2">
                            ✏️ 今週の事実を入力
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                        {/* Q1. Compliance */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground">Q1. 今週、ルールは守れた？</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {[{ id: 'yes', label: '守れた' }, { id: 'partial', label: '一部' }, { id: 'no', label: '崩れた' }].map(opt => (
                                    <Button
                                        key={opt.id}
                                        variant={compliance === opt.id ? "default" : "outline"}
                                        size="sm"
                                        className={cn("h-9", compliance === opt.id && "ring-2 ring-offset-1")}
                                        onClick={() => setCompliance(opt.id as any)}
                                    >
                                        {opt.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Q2. Violation Cause */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground">Q2. 崩れた・危なかった主因は？（複数可）</Label>
                            <div className="flex flex-wrap gap-2">
                                {['時間帯', '特定の通貨', '指標前後', '連敗後', '感情/焦り', '慢心', 'なし'].map(opt => (
                                    <Badge
                                        key={opt}
                                        variant={violationCause.includes(opt) ? "default" : "outline"}
                                        className="cursor-pointer py-1.5 px-3 hover:bg-primary/20 transition-colors"
                                        onClick={() => setViolationCause(prev => toggleSelection(prev, opt))}
                                    >
                                        {opt}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Q3. Chart Frequency */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground">Q3. チャートを見る頻度は？</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {[{ id: 'low', label: '少なめ' }, { id: 'mid', label: '適度' }, { id: 'high', label: '見すぎ' }].map(opt => (
                                    <Button
                                        key={opt.id}
                                        variant={chartFrequency === opt.id ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setChartFrequency(opt.id as any)}
                                    >
                                        {opt.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Q4. Priority Pairs */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground">Q4. 来週の優先通貨（最大3つ）</Label>
                            <div className="flex flex-wrap gap-2">
                                {PAIR_OPTIONS.slice(0, 8).map(pair => (
                                    <Badge
                                        key={pair}
                                        variant={priorityPairs.includes(pair) ? "default" : "outline"}
                                        className="cursor-pointer font-mono"
                                        onClick={() => setPriorityPairs(prev => toggleSelection(prev, pair, 3))}
                                    >
                                        {pair}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Q5. Next Limit Focus */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground">Q5. 来週の意識（上限）</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {['新規回数', '損失額', '見ない時間'].map(opt => (
                                    <Button
                                        key={opt}
                                        variant={limitFocus === opt ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setLimitFocus(opt)}
                                    >
                                        {opt}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <Button
                            className="w-full font-bold"
                            size="lg"
                            disabled={!compliance || !chartFrequency || !limitFocus}
                            onClick={handleSurveySubmit}
                        >
                            <Sparkles className="mr-2 h-4 w-4" />
                            整える (AI生成)
                        </Button>
                    </CardContent>
                </Card>
            )}

            {step === 2 && reviewOutput && (
                <Card className="border-2 border-primary/20 overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500" />
                    <CardHeader className="pb-2 text-center">
                        <Badge variant="secondary" className="mx-auto mb-2 w-fit px-3 py-1 text-[10px] uppercase tracking-wider">
                            Weekly Alignment
                        </Badge>
                        <CardTitle className="text-xl font-bold">来週の「整え」</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-6 pt-2">
                        {/* Motto */}
                        <div className="text-center p-4 bg-muted/30 rounded-lg italic text-muted-foreground text-sm">
                            &quot;{reviewOutput.motto}&quot;
                        </div>

                        <div className="grid gap-4">
                            {/* Prohibited */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase">
                                    <Shield className="h-3.5 w-3.5" />
                                    禁止ルール (Stop Doing)
                                </Label>
                                <ul className="space-y-1 bg-red-50 dark:bg-red-900/10 p-3 rounded-md">
                                    {reviewOutput.prohibited_rules.map((rule: string, i: number) => (
                                        <li key={i} className="text-sm flex items-start gap-2">
                                            <span className="text-red-500 mt-1">●</span>
                                            {rule}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Theme */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase">
                                    <Target className="h-3.5 w-3.5" />
                                    練習テーマ (Theme)
                                </Label>
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-md text-sm font-bold text-center border border-blue-100 dark:border-blue-900/30">
                                    {reviewOutput.training_theme}
                                </div>
                            </div>
                        </div>

                        {/* Flags if any */}
                        {reviewOutput.caution_flags.length > 0 && (
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-yellow-600 font-bold text-xs uppercase">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    注意フラグ (Flags)
                                </Label>
                                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-md text-xs text-muted-foreground">
                                    {reviewOutput.caution_flags.join(' / ')}
                                </div>
                            </div>
                        )}

                        <Button className="w-full" onClick={handleFinalize}>
                            <Save className="mr-2 h-4 w-4" />
                            これで来週へ進む
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
