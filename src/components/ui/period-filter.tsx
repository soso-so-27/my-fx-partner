"use client"

import { Period } from "@/lib/date-utils"
import { cn } from "@/lib/utils"

interface PeriodFilterProps {
    value: Period
    onChange: (period: Period) => void
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
    const periods: { value: Period; label: string }[] = [
        { value: 'today', label: '今日' },
        { value: 'week', label: '今週' },
        { value: 'month', label: '今月' },
        { value: 'all', label: '全期間' },
    ]

    return (
        <div className="flex gap-2 overflow-x-auto pb-1">
            {periods.map((period) => (
                <button
                    key={period.value}
                    onClick={() => onChange(period.value)}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                        value === period.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                >
                    {period.label}
                </button>
            ))}
        </div>
    )
}
