"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import {
    AlertTriangle, CheckCircle2, Shield, Target, Clock, Zap,
    Calendar, ChevronDown, ChevronUp, AlertOctagon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { WeeklyPlan } from "./types"
import { format } from "date-fns"

interface StrategyDashboardProps {
    plan: WeeklyPlan;
    economicEvents: any[]; // EconomicEvent type
    onEdit: () => void;
}

export function StrategyDashboard({ plan, economicEvents, onEdit }: StrategyDashboardProps) {
    const [checklistOpen, setChecklistOpen] = useState(false);
    const [ignoredPairs, setIgnoredPairs] = useState<string[]>(plan.ignoredPairs || []);

    // Signal Logic (Simplified for UI Demo)
    // In real app, this needs current time & trade history
    const [signal, setSignal] = useState<'ok' | 'caution' | 'ng'>('ok');
    const [signalReason, setSignalReason] = useState<string>('');
    const [nextOkTime, setNextOkTime] = useState<string | null>(null);

    // Effect to calculate signal based on time/events
    useEffect(() => {
        const checkSignal = () => {
            const now = new Date();
            const currentTime = format(now, 'HH:mm');

            // 1. No Look Time check
            if (plan.limits.no_look.enabled) {
                const { start, end } = plan.limits.no_look;
                // Simple string comparison for HH:mm (handling cross-day needed in real app)
                // Assuming start > end means overnight (e.g. 23:00 to 07:00)
                let isNoLook = false;
                if (start > end) {
                    isNoLook = currentTime >= start || currentTime <= end;
                } else {
                    isNoLook = currentTime >= start && currentTime <= end;
                }

                if (isNoLook) {
                    setSignal('ng');
                    setSignalReason(`見ない時間 (${start}-${end})`);
                    setNextOkTime(end);
                    return;
                }
            }

            // 2. Event Stop Window check
            if (plan.eventSettings.use_stop_window) {
                // Check against economicEvents (simplified: assume sorted)
                const nextHighEvent = economicEvents.find(e => e.importance >= 3); // Assuming filtered
                if (nextHighEvent) {
                    // Parse event time (assuming JST 'HH:mm') - this requires date match too
                    // Skipping full logic for brevity, just placeholder
                }
            }

            // Default
            setSignal('ok');
            setSignalReason('全グリーン');
            setNextOkTime(null);
        };

        checkSignal();
        const interval = setInterval(checkSignal, 60000); // Update every min
        return () => clearInterval(interval);
    }, [plan, economicEvents]);

    const handleToggleIgnorePair = (pair: string) => {
        // Toggle logic (Visual only for now, needs persistence upward)
        setIgnoredPairs(prev =>
            prev.includes(pair) ? prev.filter(p => p !== pair) : [...prev, pair]
        );
        // Note: Real app should call onUpdatePlan
    };

    return (
        <div className="space-y-4">

            {/* Header: Traffic Signal */}
            <Card className={cn("border-2",
                signal === 'ok' ? "border-green-500/50 bg-green-500/10" :
                    signal === 'caution' ? "border-yellow-500/50 bg-yellow-500/10" : "border-red-500/50 bg-red-500/10"
            )}>
                <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {signal === 'ok' ? <CheckCircle2 className="h-8 w-8 text-green-600" /> :
                            signal === 'caution' ? <AlertTriangle className="h-8 w-8 text-yellow-600" /> :
                                <AlertOctagon className="h-8 w-8 text-red-600" />}
                        <div>
                            <div className="font-bold text-lg">
                                {signal === 'ok' ? "ENTRY OK" : signal === 'caution' ? "CAUTION" : "NO ENTRY"}
                            </div>
                            <div className="text-xs font-medium opacity-80">
                                {signalReason}
                            </div>
                        </div>
                    </div>
                    {nextOkTime && (
                        <div className="text-right">
                            <div className="text-[10px] text-muted-foreground">NEXT OK</div>
                            <div className="text-xl font-mono font-bold">{nextOkTime}</div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Next Important Event */}
            {economicEvents.length > 0 && (
                <Card>
                    <CardHeader className="py-2 px-4 border-b bg-muted/30">
                        <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
                            <span>次の重要指標</span>
                            <span>{plan.eventSettings.use_stop_window ? `停止窓 ±${plan.eventSettings.stop_window}分 ON` : "停止窓 OFF"}</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3 flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold">{economicEvents[0].time}</span>
                                <Badge variant="outline">{economicEvents[0].currency}</Badge>
                            </div>
                            <div className="text-sm truncate">{economicEvents[0].name}</div>
                        </div>
                        <div className="text-yellow-500 text-xs">★★★</div>
                    </CardContent>
                </Card>
            )}

            {/* Limits & Rules */}
            <div className="grid grid-cols-2 gap-3">
                <Card>
                    <CardHeader className="py-2 px-3 bg-muted/30">
                        <CardTitle className="text-xs">残り枠</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2">
                        <div className="text-xs">
                            <div className="text-muted-foreground mb-0.5">新規回数</div>
                            <div className="font-mono text-lg font-bold">
                                2 <span className="text-xs font-normal text-muted-foreground">/ {plan.limits.trade_count}</span>
                            </div>
                            <Progress value={40} className="h-1" />
                        </div>
                        <div className="text-xs">
                            <div className="text-muted-foreground mb-0.5">損失許容</div>
                            <div className="font-mono text-sm font-bold">
                                -1,200 <span className="text-xs font-normal text-muted-foreground">/ {plan.limits.loss_amount}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="py-2 px-3 bg-muted/30">
                        <CardTitle className="text-xs">禁止ルール</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2">
                        {plan.rules.map(rule => (
                            <div key={rule.id} className="flex items-start gap-2 text-xs">
                                <Shield className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                                <span className="leading-tight">{rule.label}</span>
                            </div>
                        ))}
                        {plan.limits.consecutive_loss_stop !== 'none' && (
                            <div className="flex items-start gap-2 text-xs">
                                <Shield className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                                <span className="leading-tight">{plan.limits.consecutive_loss_stop}連敗で停止</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Checklist */}
            <Card>
                <div
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setChecklistOpen(!checklistOpen)}
                >
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold">エントリー前チェック</span>
                    </div>
                    {checklistOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
                {checklistOpen && (
                    <CardContent className="p-3 pt-0 border-t bg-muted/10">
                        <div className="space-y-3 py-2">
                            {[
                                "損切り位置を先に決めた",
                                "停止窓/上限ルールに抵触していない",
                                "根拠が2つある",
                                "ロットは上限内",
                                "見送る条件に該当しない"
                            ].map((item, i) => (
                                <label key={i} className="flex items-center gap-3 text-sm cursor-pointer">
                                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                                    <span>{item}</span>
                                </label>
                            ))}
                        </div>
                        <Button className="w-full mt-2" size="sm">チェック完了</Button>
                    </CardContent>
                )}
            </Card>

            {/* Pairs */}
            <Card>
                <CardHeader className="py-2 px-4 bg-muted/30">
                    <CardTitle className="text-xs">監視ペア & 距離モード</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {plan.focusPairs.map(pair => (
                        <div key={pair} className="flex items-center justify-between p-3 border-b last:border-0">
                            <div className="flex items-center gap-3">
                                <span className="font-bold font-mono">{pair}</span>
                                {/* Related events count badge could go here */}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={cn("text-[10px] font-medium", ignoredPairs.includes(pair) ? "text-primary" : "text-muted-foreground")}>
                                    {ignoredPairs.includes(pair) ? "触らない" : "監視中"}
                                </span>
                                <Switch
                                    checked={ignoredPairs.includes(pair)}
                                    onCheckedChange={() => handleToggleIgnorePair(pair)}
                                    className="scale-75"
                                />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Theme */}
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="text-xs text-primary font-bold mb-1">今週のテーマ</div>
                <div className="text-sm font-bold">{plan.theme.label}</div>
                <div className="text-xs text-muted-foreground mt-1">
                    成功条件: {plan.theme.condition}
                </div>
                <Button variant="link" className="h-auto p-0 text-xs mt-2 text-primary" onClick={onEdit}>
                    作戦を修正する
                </Button>
            </div>

        </div>
    )
}
