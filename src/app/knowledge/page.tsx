"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
    Library,
    Inbox,
    Pin,
    Tag,
    Search,
    Link2,
    Twitter,
    FileText,
    Youtube,
    Plus,
    Loader2,
    Trash2,
    LayoutGrid
} from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Knowledge as KnowledgeType } from "@/types/knowledge"

const CONTENT_TYPE_CONFIG = {
    x: { icon: Twitter, label: 'X', color: 'bg-black text-white' },
    youtube: { icon: Youtube, label: 'YouTube', color: 'bg-red-500 text-white' },
    note: { icon: FileText, label: 'note', color: 'bg-green-500 text-white' },
    blog: { icon: Link2, label: 'ブログ', color: 'bg-orange-500 text-white' },
    memo: { icon: FileText, label: 'メモ', color: 'bg-blue-500 text-white' },
    rule: { icon: FileText, label: 'ルール', color: 'bg-purple-500 text-white' },
    other: { icon: Link2, label: 'リンク', color: 'bg-gray-500 text-white' },
}

export default function KnowledgePage() {
    const { data: session, status } = useSession()
    const { toast } = useToast()
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState("inbox")
    const [loading, setLoading] = useState(true)
    const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeType[]>([])
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [newKnowledge, setNewKnowledge] = useState({ title: '', content: '', url: '' })
    const [isSaving, setIsSaving] = useState(false)
    const [editingItem, setEditingItem] = useState<KnowledgeType | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const loadKnowledge = useCallback(async () => {
        if (status !== "authenticated") return

        try {
            setLoading(true)
            const response = await fetch('/api/knowledge')
            if (response.ok) {
                const data = await response.json()
                setKnowledgeItems(data)
            }
        } catch (error) {
            console.error('Failed to load knowledge:', error)
        } finally {
            setLoading(false)
        }
    }, [status])

    useEffect(() => {
        loadKnowledge()
    }, [loadKnowledge])

    // Filter items based on tab and search
    const filteredItems = knowledgeItems.filter(item => {
        const matchesSearch = searchQuery === "" ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

        if (activeTab === 'inbox') return matchesSearch && !item.isProcessed
        if (activeTab === 'pinned') return matchesSearch && item.isPinned
        if (activeTab === 'all') return matchesSearch
        return matchesSearch
    })

    const togglePin = async (id: string) => {
        try {
            const item = knowledgeItems.find(k => k.id === id)
            if (!item) return

            const newIsPinned = !item.isPinned
            const response = await fetch('/api/knowledge', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    isPinned: newIsPinned,
                    // ピン留め時に処理済みにする（未整理から消す）
                    isProcessed: newIsPinned ? true : item.isProcessed
                })
            })

            if (response.ok) {
                setKnowledgeItems(items =>
                    items.map(k => k.id === id ? {
                        ...k,
                        isPinned: newIsPinned,
                        isProcessed: newIsPinned ? true : k.isProcessed
                    } : k)
                )
                toast({
                    title: newIsPinned ? "ピン留め" : "ピン解除",
                    description: newIsPinned ? "ピン留めしました" : "ピンを解除しました"
                })
            }
        } catch (error) {
            console.error('Failed to toggle pin:', error)
            toast({ title: "エラー", variant: "destructive" })
        }
    }

    const handleAddKnowledge = async () => {
        if (!newKnowledge.title.trim()) {
            toast({ title: "タイトルを入力してください", variant: "destructive" })
            return
        }

        try {
            setIsSaving(true)
            const response = await fetch('/api/knowledge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newKnowledge.title,
                    content: newKnowledge.content || undefined,
                    url: newKnowledge.url || undefined,
                    contentType: newKnowledge.url ? undefined : 'memo'
                })
            })

            if (response.ok) {
                const created = await response.json()
                setKnowledgeItems(prev => [created, ...prev])
                setNewKnowledge({ title: '', content: '', url: '' })
                setIsAddDialogOpen(false)
                toast({ title: "ナレッジを追加しました" })
            } else {
                throw new Error('Failed to create')
            }
        } catch (error) {
            console.error('Failed to add knowledge:', error)
            toast({ title: "追加に失敗しました", variant: "destructive" })
        } finally {
            setIsSaving(false)
        }
    }

    const handleUpdateKnowledge = async () => {
        if (!editingItem) return
        setIsSaving(true)

        try {
            const response = await fetch('/api/knowledge', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingItem.id,
                    title: editingItem.title,
                    content: editingItem.content,
                    url: editingItem.url
                })
            })

            if (response.ok) {
                setKnowledgeItems(items =>
                    items.map(k => k.id === editingItem.id ? editingItem : k)
                )
                setEditingItem(null)
                toast({ title: "更新しました" })
            } else {
                throw new Error('Failed to update')
            }
        } catch (error) {
            console.error('Failed to update knowledge:', error)
            toast({ title: "更新に失敗しました", variant: "destructive" })
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteKnowledge = async () => {
        if (!editingItem) return
        setIsDeleting(true)

        try {
            const response = await fetch(`/api/knowledge?id=${editingItem.id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                setKnowledgeItems(items => items.filter(k => k.id !== editingItem.id))
                setEditingItem(null)
                toast({ title: "削除しました" })
            } else {
                throw new Error('Failed to delete')
            }
        } catch (error) {
            console.error('Failed to delete knowledge:', error)
            toast({ title: "削除に失敗しました", variant: "destructive" })
        } finally {
            setIsDeleting(false)
        }
    }

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="container mx-auto p-4 pb-20 flex items-center justify-center min-h-[50vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </ProtectedRoute>
        )
    }

    return (
        <ProtectedRoute>
            <div className="container mx-auto p-4 pb-20 space-y-4">
                {/* Header */}
                <header className="flex items-center justify-between pt-[env(safe-area-inset-top)]">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Library className="h-5 w-5 text-primary" />
                        </div>
                        <h1 className="text-lg font-bold">ナレッジ</h1>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => setIsAddDialogOpen(true)}>
                        <Plus className="h-4 w-4" />
                        追加
                    </Button>
                </header>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="inbox" className="flex items-center gap-1">
                            <Inbox className="h-4 w-4" />
                            <span>未整理</span>
                            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                                {knowledgeItems.filter(i => !i.isProcessed).length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="pinned" className="flex items-center gap-1">
                            <Pin className="h-4 w-4" />
                            <span>ピン</span>
                        </TabsTrigger>
                        <TabsTrigger value="all" className="flex items-center gap-1">
                            <LayoutGrid className="h-4 w-4" />
                            <span>すべて</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="inbox" className="mt-4">
                        <KnowledgeList
                            items={filteredItems}
                            onTogglePin={togglePin}
                            onItemClick={setEditingItem}
                            emptyMessage="未整理のナレッジはありません"
                        />
                    </TabsContent>

                    <TabsContent value="pinned" className="mt-4">
                        <KnowledgeList
                            items={filteredItems}
                            onTogglePin={togglePin}
                            onItemClick={setEditingItem}
                            emptyMessage="ピン留めしたナレッジはありません"
                        />
                    </TabsContent>

                    <TabsContent value="all" className="mt-4">
                        <KnowledgeList
                            items={filteredItems}
                            onTogglePin={togglePin}
                            onItemClick={setEditingItem}
                            emptyMessage="ナレッジがありません"
                        />
                    </TabsContent>
                </Tabs>

                {/* Add Knowledge Dialog - iOS keyboard friendly */}
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogContent className="max-w-md max-h-[85dvh] overflow-y-auto top-[5%] translate-y-0 sm:top-[50%] sm:translate-y-[-50%]">
                        <DialogHeader>
                            <DialogTitle>ナレッジを追加</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">タイトル *</Label>
                                <Input
                                    id="title"
                                    placeholder="例: 損切りは逆指値で機械的に"
                                    value={newKnowledge.title}
                                    onChange={(e) => setNewKnowledge(prev => ({ ...prev, title: e.target.value }))}
                                    onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="url">URL（任意）</Label>
                                <Input
                                    id="url"
                                    placeholder="https://x.com/..."
                                    value={newKnowledge.url}
                                    onChange={(e) => setNewKnowledge(prev => ({ ...prev, url: e.target.value }))}
                                    onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="content">メモ（任意）</Label>
                                <Textarea
                                    id="content"
                                    placeholder="学んだこと、気づきなど"
                                    rows={2}
                                    value={newKnowledge.content}
                                    onChange={(e) => setNewKnowledge(prev => ({ ...prev, content: e.target.value }))}
                                    onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                                />
                            </div>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                キャンセル
                            </Button>
                            <Button type="button" onClick={handleAddKnowledge} disabled={isSaving}>
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                追加
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Knowledge Dialog - iOS keyboard friendly */}
                <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                    <DialogContent className="max-w-md max-h-[85dvh] overflow-y-auto top-[5%] translate-y-0 sm:top-[50%] sm:translate-y-[-50%]">
                        <DialogHeader>
                            <DialogTitle>ナレッジを編集</DialogTitle>
                        </DialogHeader>
                        {editingItem && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-title">タイトル *</Label>
                                    <Input
                                        id="edit-title"
                                        value={editingItem.title}
                                        onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                                        onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-url">URL</Label>
                                    <Input
                                        id="edit-url"
                                        value={editingItem.url || ''}
                                        onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                                        onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-content">メモ</Label>
                                    <Textarea
                                        id="edit-content"
                                        rows={2}
                                        value={editingItem.content || ''}
                                        onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value })}
                                        onFocus={(e) => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                                    />
                                </div>
                            </div>
                        )}
                        <DialogFooter className="pt-4 flex justify-between">
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteKnowledge}
                                disabled={isDeleting}
                            >
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
                                削除
                            </Button>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
                                    キャンセル
                                </Button>
                                <Button type="button" onClick={handleUpdateKnowledge} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    保存
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ProtectedRoute>
    )
}

// Knowledge List Component
function KnowledgeList({
    items,
    onTogglePin,
    onItemClick,
    emptyMessage
}: {
    items: KnowledgeType[]
    onTogglePin: (id: string) => void
    onItemClick: (item: KnowledgeType) => void
    emptyMessage: string
}) {
    if (items.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <Library className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{emptyMessage}</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {items.map(item => {
                const config = CONTENT_TYPE_CONFIG[item.contentType] || CONTENT_TYPE_CONFIG.other
                const Icon = config.icon

                return (
                    <Card
                        key={item.id}
                        className="overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => onItemClick(item)}
                    >
                        <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                                {/* Content Type Icon */}
                                <div className={cn(
                                    "h-8 w-8 rounded flex items-center justify-center shrink-0",
                                    config.color
                                )}>
                                    <Icon className="h-4 w-4" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="text-sm font-medium line-clamp-2">
                                            {item.title}
                                        </h3>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 shrink-0"
                                            onClick={(e) => { e.stopPropagation(); onTogglePin(item.id); }}
                                        >
                                            <Pin className={cn(
                                                "h-4 w-4",
                                                item.isPinned ? "fill-solo-gold text-solo-gold" : "text-muted-foreground"
                                            )} />
                                        </Button>
                                    </div>

                                    {item.content && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {item.content}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-2 mt-2">
                                        {item.tags.slice(0, 3).map(tag => (
                                            <Badge
                                                key={tag}
                                                variant="secondary"
                                                className="text-[10px] px-1.5 py-0"
                                            >
                                                #{tag}
                                            </Badge>
                                        ))}
                                        <span className="text-[10px] text-muted-foreground ml-auto">
                                            {format(new Date(item.createdAt), 'M/d', { locale: ja })}
                                        </span>
                                    </div>

                                    {item.linkedTradeCount && item.linkedTradeCount > 0 && (
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            📎 {item.linkedTradeCount}件のトレードに紐付け
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}

// Tags View Component
function TagsView({ items }: { items: KnowledgeType[] }) {
    // Extract all unique tags with counts
    const tagCounts = items.reduce((acc, item) => {
        item.tags.forEach(tag => {
            acc[tag] = (acc[tag] || 0) + 1
        })
        return acc
    }, {} as Record<string, number>)

    const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])

    if (sortedTags.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">タグがありません</p>
            </div>
        )
    }

    return (
        <div className="flex flex-wrap gap-2">
            {sortedTags.map(([tag, count]) => (
                <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                >
                    #{tag}
                    <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                        {count}
                    </Badge>
                </Button>
            ))}
        </div>
    )
}
