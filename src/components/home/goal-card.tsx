"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Target, Pencil, Check, X } from "lucide-react"

interface GoalCardProps {
    currentProfit: number
}

const STORAGE_KEY = 'solo_monthly_profit_goal'

export function GoalCard({ currentProfit }: GoalCardProps) {
    const [goalAmount, setGoalAmount] = useState<number>(0)
    const [isEditing, setIsEditing] = useState(false)
    const [editValue, setEditValue] = useState("")

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            setGoalAmount(parseInt(saved, 10))
        } else {
            setGoalAmount(100000) // Default 100k
        }
    }, [])

    const handleSave = () => {
        const val = parseInt(editValue, 10)
        if (!isNaN(val) && val > 0) {
            setGoalAmount(val)
            localStorage.setItem(STORAGE_KEY, val.toString())
        }
        setIsEditing(false)
    }

    const startEdit = () => {
        setEditValue(goalAmount.toString())
        setIsEditing(true)
    }

    // Calculate progress
    // If goal is 0 (shouldn't happen with default), progress is 0.
    // If profit is negative, progress is 0 (or we could show negative, but progress bar usually 0-100).
    const progress = Math.min(Math.max((currentProfit / goalAmount) * 100, 0), 100)

    // Format currency
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(val)
    }

    return (
        <Card className="bg-card/50 shadow-sm border-dashed">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Target className="h-4 w-4 text-solo-gold" />
                        <span>今月の目標</span>
                    </div>
                    {!isEditing && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={startEdit}>
                            <Pencil className="h-3 w-3" />
                        </Button>
                    )}
                </div>

                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-8 text-sm"
                            autoFocus
                        />
                        <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleSave}>
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setIsEditing(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-end justify-between mb-2">
                            <span className="text-2xl font-bold tracking-tight">
                                {Math.round(progress)}%
                            </span>
                            <span className="text-sm text-muted-foreground mb-1">
                                {formatCurrency(currentProfit)} / {formatCurrency(goalAmount)}
                            </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </>
                )}
            </CardContent>
        </Card>
    )
}
