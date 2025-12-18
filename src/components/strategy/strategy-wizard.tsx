"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
    ChevronRight, ChevronLeft, CheckCircle2, Target, Shield,
    TrendingUp, Zap, Clock, AlertTriangle, Info
} from "lucide-react"
import { cn } from "@/lib/utils"
// Import shared types and constants
import { WeeklyPlan, PAIR_OPTIONS, THEME_CANDIDATES, RULE_CANDIDATES } from "./types"

interface StrategyWizardProps {
    onSave: (plan: WeeklyPlan) => void;
    onCancel: () => void;
}

// Steps definition
const TOTAL_STEPS = 8;

export function StrategyWizard({ onSave, onCancel }: StrategyWizardProps) {
    const [step, setStep] = useState(1);

    // Form State
    // Step 1: Pair & Mode
    const [focusPairs, setFocusPairs] = useState<string[]>([]);
    const [mode, setMode] = useState<WeeklyPlan['mode']>('protect');

    // Step 2-3: Time
    const [activeHours, setActiveHours] = useState<string[]>([]); // Tokyo, London, NY
    const [noLookEnabled, setNoLookEnabled] = useState(false);
    const [noLookStart, setNoLookStart] = useState("23:30");
    const [noLookEnd, setNoLookEnd] = useState("07:30");

    // Step 4-5: Limits
    const [tradeLimit, setTradeLimit] = useState(5);
    const [lossLimit, setLossLimit] = useState(-5000);

    // Step 6-7: Stop Rules
    const [consecutiveLossStop, setConsecutiveLossStop] = useState<WeeklyPlan['limits']['consecutive_loss_stop']>('2');
    const [eventStopEnabled, setEventStopEnabled] = useState(true);
    const [eventStopWindow, setEventStopWindow] = useState(30);

    // Step 8: Confirmation (Rules & Theme)
    const [selectedRules, setSelectedRules] = useState<string[]>([]);
    const [selectedThemeId, setSelectedThemeId] = useState<string>('');

    // Handlers
    const handleNext = () => setStep(prev => Math.min(prev + 1, TOTAL_STEPS));
    const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

    const handleTogglePair = (pair: string) => {
        setFocusPairs(prev =>
            prev.includes(pair) ? prev.filter(p => p !== pair) : [...prev, pair].slice(0, 3) // Max 3
        );
    };

    const handleToggleRule = (ruleId: string) => {
        setSelectedRules(prev =>
            prev.includes(ruleId) ? prev.filter(r => r !== ruleId) : [...prev, ruleId].slice(0, 3) // Max 3 rules
        );
    };

    // Auto-select candidates based on previous answers (Step 8 init)
    useMemo(() => {
        if (step === 8) {
            // Default rules logic
            const defaults = [];
            if (eventStopEnabled) defaults.push('stop_window');
            if (noLookEnabled) defaults.push('no_look');
            if (consecutiveLossStop !== 'none') defaults.push('consecutive_stop');
            defaults.push('limit_stop'); // Always suggest limit stop

            // Merge with refined persistent selection logic if needed, 
            // but for MVP we just set defaults if empty or prioritize them
            // Here we just prepopulate if empty
            if (selectedRules.length === 0) {
                setSelectedRules(defaults.slice(0, 3));
            }
        }
    }, [step, eventStopEnabled, noLookEnabled, consecutiveLossStop]);

    // Validation
    const canProceed = () => {
        switch (step) {
            case 1: return focusPairs.length > 0;
            // Other steps have defaults
            default: return true;
        }
    };

    const canSave = () => selectedThemeId !== '';

    const handleSave = () => {
        // Construct WeeklyPlan object
        const themeObj = THEME_CANDIDATES[mode].find(t => t.id === selectedThemeId);

        const plan: WeeklyPlan = {
            mode,
            busyness: 'normal', // TODO: user input or derived
            mental: 'medium',   // TODO: user input or derived
            focusPairs,
            ignoredPairs: [], // Init empty
            limits: {
                trade_count: tradeLimit,
                loss_amount: lossLimit,
                consecutive_loss_stop: consecutiveLossStop,
                no_look: { enabled: noLookEnabled, start: noLookStart, end: noLookEnd }
            },
            eventSettings: {
                use_stop_window: eventStopEnabled,
                stop_window: eventStopEnabled ? eventStopWindow : 0
            },
            rules: selectedRules.map(id => {
                const r = RULE_CANDIDATES.find(c => c.id === id);
                return { id, label: r?.label || id, active: true };
            }),
            theme: {
                id: selectedThemeId,
                label: themeObj?.label || '',
                condition: themeObj?.condition || ''
            }
        };

        onSave(plan);
    };

    return (
        <Card className="border-primary/30">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center pb-2">
                    <CardTitle className="text-sm">今週の作戦を立てる ({step}/{TOTAL_STEPS})</CardTitle>
                    <Button variant="ghost" size="sm" onClick={onCancel}>中断</Button>
                </div>
                <Progress value={(step / TOTAL_STEPS) * 100} className="h-1.5" />
            </CardHeader>
            <CardContent className="space-y-6 pt-4">

                {/* Step 1: Pairs & Mode */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label>Q1. 今週監視するペア（最大3つ）</Label>
                            <div className="flex flex-wrap gap-2">
                                {PAIR_OPTIONS.map(pair => (
                                    <Badge
                                        key={pair}
                                        variant={focusPairs.includes(pair) ? "default" : "outline"}
                                        className="cursor-pointer px-3 py-1.5"
                                        onClick={() => handleTogglePair(pair)}
                                    >
                                        {pair}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label>Q2. 今週の方針（モード）</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'protect', label: '守る', desc: 'ブレない' },
                                    { id: 'improve', label: '整える', desc: '習慣化' },
                                    { id: 'grow', label: '増やす', desc: '好機重視' },
                                    { id: 'distance', label: '距離', desc: '見ない' }
                                ].map(opt => (
                                    <Button
                                        key={opt.id}
                                        variant={mode === opt.id ? "default" : "outline"}
                                        className="h-auto flex-col items-start p-3"
                                        onClick={() => setMode(opt.id as any)}
                                    >
                                        <div className="font-bold text-sm">{opt.label}</div>
                                        <div className="text-[10px] text-muted-foreground">{opt.desc}</div>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Time */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label>Q3. 触れる時間帯</Label>
                            <div className="flex flex-wrap gap-2">
                                {['東京', 'ロンドン', 'NY', '不定'].map(t => (
                                    <Button
                                        key={t}
                                        variant={activeHours.includes(t) ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setActiveHours(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                                    >
                                        {t}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4 pt-2 border-t">
                            <div className="flex items-center justify-between">
                                <Label>Q4. "見ない時間"を作る</Label>
                                <Switch checked={noLookEnabled} onCheckedChange={setNoLookEnabled} />
                            </div>
                            {noLookEnabled && (
                                <div className="flex gap-2 items-center">
                                    <Input
                                        type="time"
                                        value={noLookStart}
                                        onChange={(e) => setNoLookStart(e.target.value)}
                                        className="w-24 text-center"
                                    />
                                    <span className="text-sm">〜</span>
                                    <Input
                                        type="time"
                                        value={noLookEnd}
                                        onChange={(e) => setNoLookEnd(e.target.value)}
                                        className="w-24 text-center"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 3: Trade Limit */}
                {step === 3 && (
                    <div className="space-y-4">
                        <Label>Q5. 新規エントリー上限（週）</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {[3, 5, 7, 10].map(num => (
                                <Button
                                    key={num}
                                    variant={tradeLimit === num ? "default" : "outline"}
                                    onClick={() => setTradeLimit(num)}
                                >
                                    {num}回
                                </Button>
                            ))}
                        </div>
                        <Input
                            type="number"
                            placeholder="自由入力"
                            value={tradeLimit}
                            onChange={(e) => setTradeLimit(parseInt(e.target.value) || 0)}
                            className="text-center"
                        />
                    </div>
                )}

                {/* Step 4: Loss Limit */}
                {step === 4 && (
                    <div className="space-y-4">
                        <Label>Q6. 最大損失許容額（週）</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {[-3000, -5000, -8000, -10000].map(num => (
                                <Button
                                    key={num}
                                    variant={lossLimit === num ? "default" : "outline"}
                                    onClick={() => setLossLimit(num)}
                                >
                                    {num.toLocaleString()}
                                </Button>
                            ))}
                        </div>
                        <Input
                            type="number"
                            placeholder="自由入力(マイナス)"
                            value={lossLimit}
                            onChange={(e) => setLossLimit(parseInt(e.target.value) || 0)}
                            className="text-center"
                        />
                    </div>
                )}

                {/* Step 5: Stop Rules */}
                {step === 5 && (
                    <div className="space-y-4">
                        <Label>Q7. 連敗停止ルール</Label>
                        <div className="space-y-2">
                            {[
                                { id: '2', label: '2連敗で停止' },
                                { id: '3', label: '3連敗で停止' },
                                { id: 'none', label: 'なし' }
                            ].map(opt => (
                                <div key={opt.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={opt.id}
                                        checked={consecutiveLossStop === opt.id}
                                        onCheckedChange={() => setConsecutiveLossStop(opt.id as any)}
                                    />
                                    <label htmlFor={opt.id} className="text-sm cursor-pointer ml-2 py-2 flex-1" onClick={() => setConsecutiveLossStop(opt.id as any)}>
                                        {opt.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 6: Event Rules */}
                {step === 6 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Q8. 重要指標(★3)前後は控える</Label>
                            <Switch checked={eventStopEnabled} onCheckedChange={setEventStopEnabled} />
                        </div>
                        {eventStopEnabled && (
                            <div className="space-y-3 pt-2">
                                <Label className="text-xs text-muted-foreground">停止する時間（前後）</Label>
                                <div className="flex gap-2">
                                    {[15, 30, 60].map(min => (
                                        <Button
                                            key={min}
                                            variant={eventStopWindow === min ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setEventStopWindow(min)}
                                            className="flex-1"
                                        >
                                            ±{min}分
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 7: Rule Confirmation (Candidates) */}
                {step === 7 && (
                    <div className="space-y-4">
                        <Label>確認1: 禁止ルールの選択（最大3つ）</Label>
                        <div className="space-y-2">
                            {RULE_CANDIDATES.map(rule => (
                                <div
                                    key={rule.id}
                                    className={cn(
                                        "flex items-center space-x-2 p-3 rounded border cursor-pointer transition-colors",
                                        selectedRules.includes(rule.id) ? "bg-primary/5 border-primary" : "border-muted"
                                    )}
                                    onClick={() => handleToggleRule(rule.id)}
                                >
                                    <div className={cn(
                                        "h-4 w-4 rounded border flex items-center justify-center",
                                        selectedRules.includes(rule.id) ? "bg-primary border-primary" : "border-muted-foreground"
                                    )}>
                                        {selectedRules.includes(rule.id) && <CheckCircle2 className="h-3 w-3 text-white" />}
                                    </div>
                                    <span className="text-sm font-medium">{rule.label}</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            ※Qの回答からおすすめが自動選択されています
                        </p>
                    </div>
                )}

                {/* Step 8: Theme Selection */}
                {step === 8 && (
                    <div className="space-y-4">
                        <Label>確認2: 今週の練習テーマ（1つ）</Label>
                        <div className="space-y-2">
                            {THEME_CANDIDATES[mode].map(theme => (
                                <div
                                    key={theme.id}
                                    className={cn(
                                        "p-3 rounded border cursor-pointer transition-colors",
                                        selectedThemeId === theme.id ? "bg-primary/5 border-primary" : "border-muted"
                                    )}
                                    onClick={() => setSelectedThemeId(theme.id)}
                                >
                                    <div className="font-bold text-sm mb-1">{theme.label}</div>
                                    <div className="text-xs text-muted-foreground">成功条件: {theme.condition}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-3 pt-4 border-t mt-4">
                    {step > 1 && (
                        <Button variant="outline" className="flex-1" onClick={handleBack}>
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            戻る
                        </Button>
                    )}
                    {step < TOTAL_STEPS ? (
                        <Button className="flex-1" onClick={handleNext} disabled={!canProceed()}>
                            次へ
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    ) : (
                        <Button className="flex-1" onClick={handleSave} disabled={!canSave()}>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            保存して開始
                        </Button>
                    )}
                </div>

            </CardContent>
        </Card>
    );
}
