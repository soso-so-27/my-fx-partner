"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { insightService } from "@/lib/insight-service"
import { Insight } from "@/types/insight"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Lightbulb, Target, Search, PlusCircle, CheckCircle2, PenSquare, X, ChevronDown, ChevronUp, Undo2, Send } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { EMOTION_TAGS, EmotionTagId } from "@/lib/journal-constants"

const MODE_ICONS = {
    'pre-trade': Target,
    'post-trade': Lightbulb,
    'review': Search
}

const MODE_LABELS = {
    'pre-trade': 'トレード前',
    'post-trade': 'トレード後',
    'review': '振り返り'
}

const MODE_COLORS = {
    'pre-trade': 'text-blue-500 bg-blue-500/10',
    'post-trade': 'text-amber-500 bg-amber-500/10',
    'review': 'text-purple-500 bg-purple-500/10'
}

const EMOTION_PREFIX = 'emotion:'

export function JournalNotes() {
    const { data: session, status } = useSession()
    const { toast } = useToast()
    const [insights, setInsights] = useState<Insight[]>([])
    const [loading, setLoading] = useState(true)

    // Search State
    const [searchQuery, setSearchQuery] = useState("")
    const [filterEmotion, setFilterEmotion] = useState<EmotionTagId | null>(null)

    // Inline Create State
    const [isCreating, setIsCreating] = useState(false)
    const [newNoteContent, setNewNoteContent] = useState("")
    const [selectedEmotions, setSelectedEmotions] = useState<EmotionTagId[]>([])
    const createInputRef = useRef<HTMLTextAreaElement>(null)

    // Expand State
    const [expandedId, setExpandedId] = useState<string | null>(null)

    // Edit State (inline)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editContent, setEditContent] = useState("")
    const [editNote, setEditNote] = useState("")

    // Undo State
    const [deletedInsight, setDeletedInsight] = useState<Insight | null>(null)
    const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const loadInsights = async () => {
            if (status !== "authenticated") {
                setLoading(false)
                return
            }
            try {
                const data = await insightService.getAllInsights()
                setInsights(data)
            } catch (error) {
                console.error("Failed to load insights", error)
            } finally {
                setLoading(false)
            }
        }
        loadInsights()
    }, [status])

    // Focus on create input when opening
    useEffect(() => {
        if (isCreating && createInputRef.current) {
            createInputRef.current.focus()
        }
    }, [isCreating])

    // Filter insights
    const filteredInsights = insights.filter(insight => {
        const matchesSearch = searchQuery === "" ||
            insight.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            insight.userNote?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesEmotion = !filterEmotion ||
            insight.tags?.some(tag => tag === `${EMOTION_PREFIX}${filterEmotion}`)

        return matchesSearch && matchesEmotion
    })

    // --- Delete with Undo ---
    const handleDelete = async (insight: Insight) => {
        // Clear any existing undo timeout
        if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current)
        }

        // Optimistic delete (keep for undo)
        setDeletedInsight(insight)
        setInsights(insights.filter(i => i.id !== insight.id))

        toast({
            title: "削除しました",
            action: (
                <Button variant="ghost" size="sm" onClick={() => handleUndo(insight)}>
                    <Undo2 className="h-4 w-4 mr-1" />
                    元に戻す
                </Button>
            ),
            duration: 5000
        })

        // Actually delete after 5 seconds
        undoTimeoutRef.current = setTimeout(async () => {
            try {
                await insightService.deleteInsight(insight.id)
                setDeletedInsight(null)
            } catch (error) {
                // Restore on error
                setInsights(prev => [insight, ...prev])
                toast({ title: "削除に失敗しました", variant: "destructive" })
            }
        }, 5000)
    }

    const handleUndo = (insight: Insight) => {
        if (undoTimeoutRef.current) {
            clearTimeout(undoTimeoutRef.current)
        }
        setInsights(prev => [insight, ...prev].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ))
        setDeletedInsight(null)
        toast({ title: "元に戻しました" })
    }

    // --- Inline Create ---
    const handleCreate = async () => {
        if (status !== "authenticated" || !newNoteContent.trim()) return
        try {
            const newEmotionTags = selectedEmotions.map(id => `${EMOTION_PREFIX}${id}`)
            const created = await insightService.createInsight({
                content: newNoteContent,
                mode: 'review',
                userNote: '',
                tags: newEmotionTags
            }, '')

            setInsights([created, ...insights])
            setIsCreating(false)
            setNewNoteContent("")
            setSelectedEmotions([])
            toast({ title: "作成しました" })
        } catch (error: any) {
            console.error("Failed to create note:", error)
            toast({
                title: "作成に失敗しました",
                description: error?.message || "不明なエラー",
                variant: "destructive"
            })
        }
    }

    // --- Inline Edit ---
    const startEdit = (insight: Insight) => {
        setEditingId(insight.id)
        setEditContent(insight.content)
        setEditNote(insight.userNote || "")
        setExpandedId(insight.id)
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditContent("")
        setEditNote("")
    }

    const saveEdit = async (insight: Insight) => {
        try {
            await insightService.updateInsight(insight.id, {
                userNote: editNote,
            })
            setInsights(insights.map(i =>
                i.id === insight.id ? { ...i, userNote: editNote } : i
            ))
            setEditingId(null)
            toast({ title: "更新しました" })
        } catch (error) {
            toast({ title: "更新に失敗しました", variant: "destructive" })
        }
    }

    const toggleEmotion = (id: EmotionTagId) => {
        if (selectedEmotions.includes(id)) {
            setSelectedEmotions(selectedEmotions.filter(e => e !== id))
        } else {
            setSelectedEmotions([...selectedEmotions, id])
        }
    }

    // Group insights by date
    const groupedInsights = Object.entries(
        filteredInsights.reduce((groups, insight) => {
            const date = new Date(insight.createdAt)
            const now = new Date()
            let key = 'earlier'

            const dateStr = format(date, 'yyyyMMdd')
            const todayStr = format(now, 'yyyyMMdd')
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            const yesterdayStr = format(yesterday, 'yyyyMMdd')

            if (dateStr === todayStr) key = 'today'
            else if (dateStr === yesterdayStr) key = 'yesterday'
            else if (date > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) key = 'recent'

            if (!groups[key]) groups[key] = []
            groups[key].push(insight)
            return groups
        }, {} as Record<string, Insight[]>)
    ).sort((a, b) => {
        const order = { today: 0, yesterday: 1, recent: 2, earlier: 3 }
        return (order[a[0] as keyof typeof order] || 99) - (order[b[0] as keyof typeof order] || 99)
    })

    const getGroupTitle = (key: string) => {
        switch (key) {
            case 'today': return '今日'
            case 'yesterday': return '昨日'
            case 'recent': return '今週'
            case 'earlier': return 'もっと前'
            default: return ''
        }
    }

    if (loading) return <div className="p-4 text-muted-foreground text-sm">読み込み中...</div>

    return (
        <div className="h-full flex flex-col relative">
            {/* Search Bar */}
            <div className="shrink-0 space-y-2 mb-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="キーワードで検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                    />
                    {searchQuery && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setSearchQuery('')}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                {/* Emotion Filter */}
                <div className="flex gap-1.5 flex-wrap">
                    <Button
                        variant={filterEmotion === null ? "secondary" : "ghost"}
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => setFilterEmotion(null)}
                    >
                        すべて
                    </Button>
                    {EMOTION_TAGS.map(tag => (
                        <Button
                            key={tag.id}
                            variant={filterEmotion === tag.id ? "secondary" : "ghost"}
                            size="sm"
                            className={`h-6 text-[10px] px-2 ${filterEmotion === tag.id ? tag.color : ''}`}
                            onClick={() => setFilterEmotion(filterEmotion === tag.id ? null : tag.id)}
                        >
                            {tag.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Notes List */}
            <ScrollArea className="flex-1 -mx-4 px-4">
                <div className="pb-32 space-y-4">
                    {filteredInsights.length === 0 && !loading && !isCreating && (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed mx-2">
                            <PenSquare className="h-6 w-6 text-solo-gold opacity-60 mb-2" />
                            <p className="text-sm mb-3">
                                {searchQuery || filterEmotion ? "条件に一致するノートがありません" : "トレードの記録や気づきを残しましょう"}
                            </p>
                            {!searchQuery && !filterEmotion && (
                                <Button size="sm" onClick={() => setIsCreating(true)} className="bg-solo-navy dark:bg-solo-gold text-white">
                                    <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                                    ノートを作成
                                </Button>
                            )}
                        </div>
                    )}

                    {groupedInsights.map(([groupKey, groupInsights]) => {
                        if (groupInsights.length === 0) return null

                        return (
                            <div key={groupKey} className="space-y-2">
                                <div className="flex items-center gap-2 px-1">
                                    <h3 className="text-xs font-semibold text-muted-foreground">{getGroupTitle(groupKey)}</h3>
                                    <div className="h-px flex-1 bg-border/40" />
                                </div>
                                <div className="space-y-1.5">
                                    {groupInsights.map(insight => {
                                        const isExpanded = expandedId === insight.id
                                        const isEditing = editingId === insight.id
                                        const emotionTags = (insight.tags || [])
                                            .filter(tag => tag.startsWith(EMOTION_PREFIX))
                                            .map(tag => tag.replace(EMOTION_PREFIX, ''))

                                        return (
                                            <Card
                                                key={insight.id}
                                                className={`border-l-2 ml-0.5 transition-all cursor-pointer ${isExpanded ? 'ring-1 ring-primary/30' : 'hover:bg-muted/5'}`}
                                                style={{ borderLeftColor: insight.mode === 'pre-trade' ? '#3b82f6' : insight.mode === 'post-trade' ? '#f59e0b' : '#a855f7' }}
                                                onClick={() => !isEditing && setExpandedId(isExpanded ? null : insight.id)}
                                            >
                                                <CardHeader className="flex flex-row items-start justify-between pb-1 pt-2 px-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <Badge variant="outline" className={`border-0 font-normal text-[10px] px-1.5 py-0 ${MODE_COLORS[insight.mode]}`}>
                                                            {MODE_LABELS[insight.mode]}
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground font-numbers">
                                                            {format(new Date(insight.createdAt), 'HH:mm', { locale: ja })}
                                                        </span>
                                                        {isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                                                    </div>
                                                    <div className="flex gap-0.5" onClick={e => e.stopPropagation()}>
                                                        {!isEditing && (
                                                            <>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-5 w-5 text-muted-foreground hover:text-primary"
                                                                    onClick={() => startEdit(insight)}
                                                                >
                                                                    <PenSquare className="h-2.5 w-2.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-5 w-5 text-muted-foreground hover:text-destructive"
                                                                    onClick={() => handleDelete(insight)}
                                                                >
                                                                    <Trash2 className="h-2.5 w-2.5" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="px-3 pb-2 space-y-1.5">
                                                    {isEditing ? (
                                                        <div className="space-y-2" onClick={e => e.stopPropagation()}>
                                                            <div className="text-xs whitespace-pre-wrap leading-relaxed bg-muted/30 p-2 rounded">
                                                                {insight.content}
                                                            </div>
                                                            <Textarea
                                                                value={editNote}
                                                                onChange={(e) => setEditNote(e.target.value)}
                                                                placeholder="追記メモを入力..."
                                                                className="text-xs min-h-[60px]"
                                                                autoFocus
                                                            />
                                                            <div className="flex gap-2 justify-end">
                                                                <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                                                    キャンセル
                                                                </Button>
                                                                <Button size="sm" onClick={() => saveEdit(insight)}>
                                                                    保存
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className={`text-xs whitespace-pre-wrap leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
                                                                {insight.content}
                                                            </div>

                                                            {emotionTags.length > 0 && (
                                                                <div className="flex flex-wrap gap-1.5 opacity-80">
                                                                    {emotionTags.map(emotionId => {
                                                                        const tagDef = EMOTION_TAGS.find(t => t.id === emotionId)
                                                                        if (!tagDef) return null
                                                                        return (
                                                                            <Badge key={emotionId} variant="outline" className={`text-[10px] border-0 px-2 py-0.5 rounded-full ${tagDef.color}`}>
                                                                                {tagDef.label}
                                                                            </Badge>
                                                                        )
                                                                    })}
                                                                </div>
                                                            )}

                                                            {insight.userNote && isExpanded && (
                                                                <div className="bg-muted/50 p-2 rounded text-xs mt-1">
                                                                    <span className="text-[9px] font-medium text-muted-foreground block mb-0.5">追記メモ</span>
                                                                    <p className="text-muted-foreground">{insight.userNote}</p>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>

            {/* Inline Create Panel (Bottom Sheet Style) */}
            {isCreating ? (
                <div className="absolute bottom-0 left-0 right-0 bg-background border-t shadow-lg p-4 space-y-3 rounded-t-xl animate-in slide-in-from-bottom duration-200">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">新規ノート</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsCreating(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {EMOTION_TAGS.map(tag => {
                            const isSelected = selectedEmotions.includes(tag.id)
                            return (
                                <button
                                    key={tag.id}
                                    onClick={() => toggleEmotion(tag.id)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all
                                        ${isSelected ? `${tag.color} ring-1 ring-primary/20` : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                >
                                    {isSelected && <CheckCircle2 className="h-2.5 w-2.5" />}
                                    {tag.label}
                                </button>
                            )
                        })}
                    </div>
                    <div className="flex gap-2">
                        <Textarea
                            ref={createInputRef}
                            value={newNoteContent}
                            onChange={(e) => setNewNoteContent(e.target.value)}
                            placeholder="何を考え、どう行動しましたか？"
                            className="flex-1 min-h-[80px] text-sm"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                    handleCreate()
                                }
                            }}
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleCreate} disabled={!newNoteContent.trim()} size="sm">
                            <Send className="h-3.5 w-3.5 mr-1.5" />
                            作成
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="absolute bottom-20 right-4 z-10">
                    <Button
                        className="h-12 w-12 rounded-full shadow-lg bg-solo-navy dark:bg-solo-gold hover:opacity-90"
                        onClick={() => setIsCreating(true)}
                    >
                        <PlusCircle className="h-5 w-5 text-white dark:text-black" />
                    </Button>
                </div>
            )}
        </div>
    )
}
