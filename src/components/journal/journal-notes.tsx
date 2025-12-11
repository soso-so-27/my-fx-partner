"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { insightService } from "@/lib/insight-service"
import { Insight } from "@/types/insight"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Trash2, Edit2, Lightbulb, Target, Search, PlusCircle, CheckCircle2, PenSquare } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { EMOTION_TAGS, getEmotionColor, EmotionTagId } from "@/lib/journal-constants"

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
    const { user } = useAuth()
    const { toast } = useToast()
    const [insights, setInsights] = useState<Insight[]>([])
    const [loading, setLoading] = useState(true)

    // Edit State
    const [editingInsight, setEditingInsight] = useState<Insight | null>(null)
    const [editNote, setEditNote] = useState("")

    // Create State
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [newNoteContent, setNewNoteContent] = useState("")

    // Shared Emotion State (used by both dialogs, strictly managed)
    const [selectedEmotions, setSelectedEmotions] = useState<EmotionTagId[]>([])

    useEffect(() => {
        const loadInsights = async () => {
            if (!user) return
            try {
                const data = await insightService.getAllInsights(user.id)
                setInsights(data)
            } catch (error) {
                console.error("Failed to load insights", error)
            } finally {
                setLoading(false)
            }
        }
        loadInsights()
    }, [user])

    const handleDelete = async (id: string) => {
        if (!confirm('このメモを削除しますか？')) return
        try {
            await insightService.deleteInsight(id)
            setInsights(insights.filter(i => i.id !== id))
            toast({ title: "削除しました" })
        } catch (error) {
            toast({ title: "削除に失敗しました", variant: "destructive" })
        }
    }

    // --- Create Logic ---
    const openCreateDialog = () => {
        setNewNoteContent("")
        setSelectedEmotions([])
        setCreateDialogOpen(true)
    }

    const handleCreate = async () => {
        if (!user || !newNoteContent.trim()) return
        try {
            const newEmotionTags = selectedEmotions.map(id => `${EMOTION_PREFIX}${id}`)

            const created = await insightService.createInsight({
                content: newNoteContent,
                mode: 'review', // Default mode for manual entry
                userNote: '',
                tags: newEmotionTags
            }, user.id)

            // Insert at top
            setInsights([created, ...insights])

            setCreateDialogOpen(false)
            setNewNoteContent("")
            setSelectedEmotions([])
            toast({ title: "作成しました" })
        } catch (error: any) {
            console.error("Failed to create note:", error)
            toast({
                title: "作成に失敗しました",
                description: error?.message || "不明なエラーが発生しました",
                variant: "destructive"
            })
        }
    }

    // --- Edit Logic ---
    const openEditDialog = (insight: Insight) => {
        setEditingInsight(insight)
        setEditNote(insight.userNote || "")
        // Extract existing emotions from tags
        const emotions = (insight.tags || [])
            .filter(tag => tag.startsWith(EMOTION_PREFIX))
            .map(tag => tag.replace(EMOTION_PREFIX, '') as EmotionTagId)
        setSelectedEmotions(emotions)
    }

    const handleUpdate = async () => {
        if (!editingInsight) return
        try {
            // Merge existing non-emotion tags with new emotion tags
            const existingNonEmotionTags = (editingInsight.tags || []).filter(tag => !tag.startsWith(EMOTION_PREFIX))
            const newEmotionTags = selectedEmotions.map(id => `${EMOTION_PREFIX}${id}`)
            const updatedTags = [...existingNonEmotionTags, ...newEmotionTags]

            await insightService.updateInsight(editingInsight.id, {
                userNote: editNote,
                tags: updatedTags
            })

            setInsights(insights.map(i =>
                i.id === editingInsight.id ? { ...i, userNote: editNote, tags: updatedTags } : i
            ))
            setEditingInsight(null)
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

    if (loading) return <div className="p-4">Loading journal...</div>

    return (
        <div className="h-full flex flex-col relative">
            <div className="absolute bottom-20 right-4 z-10">
                <Button
                    className="h-12 w-12 rounded-full shadow-lg bg-solo-navy dark:bg-solo-gold hover:opacity-90"
                    onClick={openCreateDialog}
                >
                    <PenSquare className="h-5 w-5 text-white dark:text-black" />
                </Button>
            </div>

            <ScrollArea className="flex-1 -mx-4 px-4">
                <div className="pb-24 space-y-8">
                    {insights.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed mx-2">
                            <PenSquare className="h-6 w-6 text-solo-gold opacity-60 mb-2" />
                            <p className="text-sm mb-3">トレードの記録や気づきを残しましょう</p>
                            <Button size="sm" onClick={openCreateDialog} className="bg-solo-navy dark:bg-solo-gold text-white">
                                <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                                ノートを作成
                            </Button>
                        </div>
                    )}

                    {/* Grouped Render Logic */}
                    {Object.entries(
                        insights.reduce((groups, insight) => {
                            const date = new Date(insight.createdAt);
                            const now = new Date();
                            let key = 'earlier';

                            if (ja.options?.weekStartsOn === undefined) {
                                // Fallback or assume 1 (Monday)
                            }

                            // Simple date checks using date-fns would be better but doing inline to match imports if possible, 
                            // otherwise need to update imports. Let's use logic with available or standard Date objects if imports are tricky,
                            // OR assuming I can add imports. I will assume I can update imports in a separate call if needed, 
                            // but actually replace_file_content is single block.
                            // I should have checked imports first. format and ja are imported. 
                            // I will use string comparison for today/yesterday to be safe with existing imports or use a helper function approach inside.

                            // Let's rely on standard comparison for safety in this block or use the imported 'format'
                            const dateStr = format(date, 'yyyyMMdd');
                            const todayStr = format(now, 'yyyyMMdd');
                            const yesterday = new Date();
                            yesterday.setDate(yesterday.getDate() - 1);
                            const yesterdayStr = format(yesterday, 'yyyyMMdd');

                            if (dateStr === todayStr) key = 'today';
                            else if (dateStr === yesterdayStr) key = 'yesterday';
                            else if (date > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) key = 'recent';

                            if (!groups[key]) groups[key] = [];
                            groups[key].push(insight);
                            return groups;
                        }, {} as Record<string, Insight[]>)
                    ).sort((a, b) => {
                        const order = { today: 0, yesterday: 1, recent: 2, earlier: 3 };
                        return (order[a[0] as keyof typeof order] || 99) - (order[b[0] as keyof typeof order] || 99);
                    }).map(([groupKey, groupInsights]) => {
                        if (groupInsights.length === 0) return null;

                        let groupTitle = '';
                        switch (groupKey) {
                            case 'today': groupTitle = '今日'; break;
                            case 'yesterday': groupTitle = '昨日'; break;
                            case 'recent': groupTitle = '今週'; break;
                            case 'earlier': groupTitle = 'もっと前'; break;
                        }

                        return (
                            <div key={groupKey} className="space-y-4">
                                <div className="flex items-center gap-2 px-2">
                                    <h3 className="text-sm font-bold text-muted-foreground">{groupTitle}</h3>
                                    <div className="h-px flex-1 bg-border/50" />
                                </div>
                                <div className="space-y-4">
                                    {groupInsights.map(insight => {
                                        const Icon = MODE_ICONS[insight.mode] || Lightbulb
                                        const emotionTags = (insight.tags || [])
                                            .filter(tag => tag.startsWith(EMOTION_PREFIX))
                                            .map(tag => tag.replace(EMOTION_PREFIX, ''))

                                        const regularTags = (insight.tags || []).filter(tag => !tag.startsWith(EMOTION_PREFIX))

                                        return (
                                            <Card key={insight.id} className="border-l-4 ml-1 hover:bg-muted/5 transition-colors" style={{ borderLeftColor: insight.mode === 'pre-trade' ? '#3b82f6' : insight.mode === 'post-trade' ? '#f59e0b' : '#a855f7' }}>
                                                <CardHeader className="flex flex-row items-start justify-between pb-2 pt-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className={`border-0 font-normal ${MODE_COLORS[insight.mode]}`}>
                                                            {MODE_LABELS[insight.mode]}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground font-numbers">
                                                            {format(new Date(insight.createdAt), 'HH:mm', { locale: ja })}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-muted-foreground hover:text-destructive -mr-2 -mt-2"
                                                        onClick={() => handleDelete(insight.id)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </CardHeader>
                                                <CardContent className="px-4 pb-4 space-y-3">
                                                    <div className="text-sm whitespace-pre-wrap leading-relaxed">
                                                        {insight.content}
                                                    </div>

                                                    {(emotionTags.length > 0 || regularTags.length > 0) && (
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
                                                            {regularTags.map(tag => (
                                                                <Badge key={tag} variant="secondary" className="text-[10px] text-muted-foreground bg-muted font-normal">
                                                                    #{tag}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {insight.userNote && (
                                                        <div className="bg-muted/50 p-3 rounded-lg text-sm mt-2">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-[10px] font-bold text-muted-foreground">追記メモ</span>
                                                                <button onClick={() => openEditDialog(insight)} className="text-[10px] text-solo-navy hover:underline">編集</button>
                                                            </div>
                                                            <p className="text-muted-foreground">{insight.userNote}</p>
                                                        </div>
                                                    )}

                                                    {!insight.userNote && (
                                                        <button
                                                            onClick={() => openEditDialog(insight)}
                                                            className="text-[10px] text-muted-foreground hover:text-solo-gold flex items-center mt-2 transition-colors"
                                                        >
                                                            <PlusCircle className="h-3 w-3 mr-1" />
                                                            メモを追加
                                                        </button>
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

            {/* Create Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>新規ノート作成</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">今の感情は？</label>
                            <div className="flex flex-wrap gap-2">
                                {EMOTION_TAGS.map(tag => {
                                    const isSelected = selectedEmotions.includes(tag.id)
                                    return (
                                        <button
                                            key={tag.id}
                                            onClick={() => toggleEmotion(tag.id)}
                                            className={`
                                                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                                                ${isSelected
                                                    ? `ring-2 ring-offset-1 ${tag.color} ring-primary/20`
                                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'}
                                            `}
                                        >
                                            {isSelected && <CheckCircle2 className="h-3 w-3" />}
                                            {tag.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">内容</label>
                            <Textarea
                                value={newNoteContent}
                                onChange={(e) => setNewNoteContent(e.target.value)}
                                placeholder="何を考え、どう行動しましたか？"
                                className="min-h-[150px]"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>キャンセル</Button>
                        <Button onClick={handleCreate} disabled={!newNoteContent.trim()}>作成</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editingInsight} onOpenChange={(open) => !open && setEditingInsight(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>メモ・感情記録</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">今の感情は？</label>
                            <div className="flex flex-wrap gap-2">
                                {EMOTION_TAGS.map(tag => {
                                    const isSelected = selectedEmotions.includes(tag.id)
                                    return (
                                        <button
                                            key={tag.id}
                                            onClick={() => toggleEmotion(tag.id)}
                                            className={`
                                                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                                                ${isSelected
                                                    ? `ring-2 ring-offset-1 ${tag.color} ring-primary/20`
                                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'}
                                            `}
                                        >
                                            {isSelected && <CheckCircle2 className="h-3 w-3" />}
                                            {tag.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">メモ・アクションプラン</label>
                            <Textarea
                                value={editNote}
                                onChange={(e) => setEditNote(e.target.value)}
                                placeholder="追記や修正を行いましょう"
                                className="min-h-[120px]"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingInsight(null)}>キャンセル</Button>
                        <Button onClick={handleUpdate}>保存</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
