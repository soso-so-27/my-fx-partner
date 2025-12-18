"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CheckCircle2, AlertTriangle, ArrowRight, Save } from "lucide-react"

interface StrategyReviewProps {
    onComplete: (data: any) => void;
}

export function StrategyReview({ onComplete }: StrategyReviewProps) {
    const [step, setStep] = useState(1);

    // Survey Data
    const [isFollowed, setIsFollowed] = useState<string>('');
    const [breakFactor, setBreakFactor] = useState<string>('');
    const [nextChange, setNextChange] = useState<string>('');
    const [note, setNote] = useState<string>('');

    // Mock AI Feedback (In real app, fetch from API after survey submit)
    const [aiFeedback, setAiFeedback] = useState<any>(null);

    const handleSurveySubmit = () => {
        // Simulate API call to get AI feedback
        setAiFeedback({
            good: "上限ルールを3日守れました",
            bad: "停止窓中のエントリーが2回ありました",
            keep: "来週は停止窓を±60分に広げましょう"
        });
        setStep(2);
    };

    const handleFinalize = () => {
        onComplete({
            completedAt: new Date().toISOString(),
            score: 78, // Mock score
            badges: ['stop_window_guard'],
            survey: { isFollowed, breakFactor, nextChange, note },
            ai_feedback: aiFeedback
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">先週の振り返り</h2>
                <span className="text-xs text-muted-foreground">{step === 1 ? "アンケート" : "フィードバック"}</span>
            </div>

            {/* Step 0: Facts Card (Always visible or summary) */}
            <Card className="bg-muted/30">
                <CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                    <div>
                        <div className="text-xs text-muted-foreground">ルール遵守率</div>
                        <div className="text-2xl font-bold font-mono">78%</div>
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground">違反トップ</div>
                        <div className="text-sm font-bold text-red-500">停止窓 2回</div>
                    </div>
                </CardContent>
            </Card>

            {step === 1 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">60秒アンケート</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Q1. 今週の作戦は守れた？</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {['はい', '一部', 'いいえ'].map(opt => (
                                    <Button
                                        key={opt} variant={isFollowed === opt ? "default" : "outline"} size="sm"
                                        onClick={() => setIsFollowed(opt)}
                                    >
                                        {opt}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs">Q2. 一番崩れた要因は？</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {['時間がない', '感情', '指標', '取り返したい', 'ルール重い', 'その他'].map(opt => (
                                    <Button
                                        key={opt} variant={breakFactor === opt ? "default" : "outline"} size="sm"
                                        className="text-[10px]"
                                        onClick={() => setBreakFactor(opt)}
                                    >
                                        {opt}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs">Q3. 来週変えるのは？（1つだけ）</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {['禁止ルール', '上限', '見ない時間', '練習テーマ', '変えない'].map(opt => (
                                    <Button
                                        key={opt} variant={nextChange === opt ? "default" : "outline"} size="sm"
                                        className="text-xs"
                                        onClick={() => setNextChange(opt)}
                                    >
                                        {opt}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs">ひとこと（任意）</Label>
                            <Textarea
                                placeholder="来週へのメモ..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="h-20 text-sm"
                            />
                        </div>

                        <Button
                            className="w-full"
                            disabled={!isFollowed || !breakFactor || !nextChange}
                            onClick={handleSurveySubmit}
                        >
                            結果を見る
                            <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                    </CardContent>
                </Card>
            )}

            {step === 2 && aiFeedback && (
                <Card className="border-primary/50">
                    <CardHeader className="py-3 bg-primary/5 border-b border-primary/10">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            AIからのフィードバック
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="space-y-3 text-sm">
                            <div>
                                <div className="text-xs font-bold text-green-600">良かった点</div>
                                <div>{aiFeedback.good}</div>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-red-600">崩れた点</div>
                                <div>{aiFeedback.bad}</div>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-blue-600">来週の引き継ぎ案</div>
                                <div>{aiFeedback.keep}</div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" className="flex-1 text-xs">
                                修正して引き継ぐ
                            </Button>
                            <Button className="flex-1 text-xs" onClick={handleFinalize}>
                                <Save className="h-3 w-3 mr-1" />
                                このまま来週へ
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

        </div>
    )
}
