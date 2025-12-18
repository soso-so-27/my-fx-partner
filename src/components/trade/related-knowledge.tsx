"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import {
    Library,
    Link2,
    Plus,
    X,
    Star,
    Loader2,
    Lightbulb,
    FileText,
    Twitter,
    Youtube
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Knowledge } from "@/types/knowledge"

interface RelatedKnowledgeProps {
    tradeId: string
    tradePair: string
    userId: string
}

const CONTENT_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    x: Twitter,
    youtube: Youtube,
    note: FileText,
    memo: FileText,
    rule: FileText,
    blog: Link2,
    other: Link2,
}

export function RelatedKnowledge({ tradeId, tradePair, userId }: RelatedKnowledgeProps) {
    const { toast } = useToast()
    const [linkedKnowledge, setLinkedKnowledge] = useState<Knowledge[]>([])
    const [suggestedKnowledge, setSuggestedKnowledge] = useState<Knowledge[]>([])
    const [loading, setLoading] = useState(true)
    const [linking, setLinking] = useState<string | null>(null)

    const loadKnowledge = useCallback(async () => {
        try {
            setLoading(true)

            // Get linked knowledge for this trade
            const linkedRes = await fetch(`/api/knowledge?tradeId=${tradeId}`)
            if (linkedRes.ok) {
                const linked = await linkedRes.json()
                setLinkedKnowledge(linked)
            }

            // Get all knowledge for suggestions (filter out already linked)
            const allRes = await fetch('/api/knowledge')
            if (allRes.ok) {
                const all = await allRes.json()
                // Simple suggestion: show unlinked pinned or recent items
                const linkedIds = new Set((await linkedRes.json())?.map((k: Knowledge) => k.id) || [])
                const suggestions = all
                    .filter((k: Knowledge) => !linkedIds.has(k.id))
                    .filter((k: Knowledge) =>
                        k.isPinned ||
                        k.tags.some(t => tradePair.includes(t)) ||
                        k.title.toLowerCase().includes(tradePair.toLowerCase().replace('/', ''))
                    )
                    .slice(0, 3)
                setSuggestedKnowledge(suggestions)
            }
        } catch (error) {
            console.error('Failed to load knowledge:', error)
        } finally {
            setLoading(false)
        }
    }, [tradeId, tradePair])

    useEffect(() => {
        loadKnowledge()
    }, [loadKnowledge])

    const handleLink = async (knowledgeId: string) => {
        try {
            setLinking(knowledgeId)
            const response = await fetch('/api/knowledge/link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tradeId, knowledgeId, linkType: 'manual' })
            })

            if (response.ok) {
                // Move from suggested to linked
                const linked = suggestedKnowledge.find(k => k.id === knowledgeId)
                if (linked) {
                    setLinkedKnowledge(prev => [...prev, linked])
                    setSuggestedKnowledge(prev => prev.filter(k => k.id !== knowledgeId))
                }
                toast({ title: "紐付けしました" })
            }
        } catch (error) {
            console.error('Failed to link:', error)
            toast({ title: "エラー", variant: "destructive" })
        } finally {
            setLinking(null)
        }
    }

    const handleUnlink = async (knowledgeId: string) => {
        try {
            setLinking(knowledgeId)
            const response = await fetch(`/api/knowledge/link?tradeId=${tradeId}&knowledgeId=${knowledgeId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                // Move from linked to suggested
                const unlinked = linkedKnowledge.find(k => k.id === knowledgeId)
                if (unlinked) {
                    setSuggestedKnowledge(prev => [unlinked, ...prev].slice(0, 3))
                    setLinkedKnowledge(prev => prev.filter(k => k.id !== knowledgeId))
                }
                toast({ title: "紐付けを解除しました" })
            }
        } catch (error) {
            console.error('Failed to unlink:', error)
            toast({ title: "エラー", variant: "destructive" })
        } finally {
            setLinking(null)
        }
    }

    if (loading) {
        return (
            <div className="py-2 flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-xs">読み込み中...</span>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <label className="text-xs text-muted-foreground font-bold flex items-center gap-1">
                <Library className="h-3.5 w-3.5" />
                関連ナレッジ
            </label>

            {/* Suggested Knowledge */}
            {suggestedKnowledge.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" />
                        関連しそう
                    </p>
                    {suggestedKnowledge.map(k => {
                        const Icon = CONTENT_TYPE_ICONS[k.contentType] || Link2
                        return (
                            <div
                                key={k.id}
                                className="flex items-center justify-between p-2 rounded-md border border-dashed bg-muted/30"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span className="text-xs truncate">{k.title}</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs px-2"
                                    onClick={() => handleLink(k.id)}
                                    disabled={linking === k.id}
                                >
                                    {linking === k.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <>
                                            <Plus className="h-3 w-3 mr-1" />
                                            紐付け
                                        </>
                                    )}
                                </Button>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Linked Knowledge */}
            {linkedKnowledge.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-[10px] text-muted-foreground">📎 紐付け済み</p>
                    {linkedKnowledge.map(k => {
                        const Icon = CONTENT_TYPE_ICONS[k.contentType] || Link2
                        return (
                            <div
                                key={k.id}
                                className="flex items-center justify-between p-2 rounded-md border bg-primary/5"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                                    <span className="text-xs font-medium truncate">{k.title}</span>
                                    {k.isPinned && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs px-2 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleUnlink(k.id)}
                                    disabled={linking === k.id}
                                >
                                    {linking === k.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <>
                                            <X className="h-3 w-3 mr-1" />
                                            外す
                                        </>
                                    )}
                                </Button>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Empty State */}
            {linkedKnowledge.length === 0 && suggestedKnowledge.length === 0 && (
                <div className="text-center py-3 text-muted-foreground">
                    <Library className="h-6 w-6 mx-auto mb-1 opacity-50" />
                    <p className="text-xs">まだナレッジがありません</p>
                    <p className="text-[10px]">ナレッジタブから追加できます</p>
                </div>
            )}
        </div>
    )
}
