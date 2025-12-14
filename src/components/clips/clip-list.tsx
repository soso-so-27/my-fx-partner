"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { ClipDetailDialog } from './clip-detail-dialog'
import {
    Plus,
    Trash2,
    ExternalLink,
    Bookmark,
    Twitter,
    Youtube,
    FileText,
    Link2,
    Star,
    Loader2,
    Search,
    X,
    Filter
} from 'lucide-react'

// Types
interface Clip {
    id: string
    url: string
    title: string | null
    contentType: 'x' | 'youtube' | 'blog' | 'note' | 'other'
    thumbnailUrl: string | null
    memo: string | null
    tags: string[]
    importance: number
    createdAt: string
}

interface ClipListProps {
    userId: string
    sharedData?: {
        url?: string
        title?: string
        text?: string
    } | null
}

// Content type icons and colors
const contentTypeConfig = {
    x: { icon: Twitter, label: 'X (Twitter)', color: 'bg-black text-white' },
    youtube: { icon: Youtube, label: 'YouTube', color: 'bg-red-500 text-white' },
    blog: { icon: FileText, label: 'ブログ', color: 'bg-blue-500 text-white' },
    note: { icon: FileText, label: 'note', color: 'bg-green-500 text-white' },
    other: { icon: Link2, label: 'その他', color: 'bg-gray-500 text-white' },
}

// Clip Form Component
function ClipForm({ onSuccess, initialUrl, initialTitle }: { onSuccess: () => void, initialUrl?: string, initialTitle?: string }) {
    const [url, setUrl] = useState(initialUrl || '')
    const [title, setTitle] = useState(initialTitle || '')
    const [contentType, setContentType] = useState<string>('blog')
    const [memo, setMemo] = useState('')
    const [importance, setImportance] = useState(3)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isFetchingMetadata, setIsFetchingMetadata] = useState(false)
    const { toast } = useToast()

    // Auto-detect content type from URL
    useEffect(() => {
        if (url.includes('twitter.com') || url.includes('x.com')) {
            setContentType('x')
        } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
            setContentType('youtube')
        } else if (url.includes('note.com')) {
            setContentType('note')
        }
    }, [url])

    // Fetch metadata from URL
    const fetchMetadata = async () => {
        if (!url) return

        setIsFetchingMetadata(true)
        try {
            const res = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`)
            if (res.ok) {
                const data = await res.json()
                if (data.title) setTitle(data.title)
                if (data.contentType) setContentType(data.contentType)
                toast({ title: '情報を取得しました' })
            } else {
                toast({
                    title: '情報の取得に失敗しました',
                    description: 'タイトルを手動で入力してください',
                    variant: 'destructive'
                })
            }
        } catch (error) {
            console.error('Error fetching metadata:', error)
        } finally {
            setIsFetchingMetadata(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const res = await fetch('/api/clips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url,
                    title: title || null,
                    contentType,
                    memo: memo || null,
                    importance,
                }),
            })

            if (res.ok) {
                toast({
                    title: "クリップを保存しました",
                    description: "リストに追加されました",
                })
                onSuccess()
                // Reset form
                setUrl('')
                setTitle('')
                setContentType('blog')
                setMemo('')
                setImportance(3)
            } else {
                const data = await res.json()
                toast({
                    title: "エラー",
                    description: data.error || "保存に失敗しました",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error('Error creating clip:', error)
            toast({
                title: "エラー",
                description: "保存に失敗しました",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="url">URL *</Label>
                <div className="flex gap-2">
                    <Input
                        id="url"
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://..."
                        required
                        className="flex-1"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={fetchMetadata}
                        disabled={!url || isFetchingMetadata}
                    >
                        {isFetchingMetadata ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            '取得'
                        )}
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="title">タイトル（任意）</Label>
                <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="コンテンツのタイトル"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="contentType">種類</Label>
                <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="x">X (Twitter)</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="blog">ブログ</SelectItem>
                        <SelectItem value="note">note</SelectItem>
                        <SelectItem value="other">その他</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="memo">メモ（任意）</Label>
                <Textarea
                    id="memo"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="このクリップについてのメモ..."
                    rows={3}
                />
            </div>

            <div className="space-y-2">
                <Label>重要度</Label>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setImportance(star)}
                            className={`p-1 ${star <= importance ? 'text-yellow-500' : 'text-gray-300'}`}
                        >
                            <Star className="h-5 w-5 fill-current" />
                        </button>
                    ))}
                </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        保存中...
                    </>
                ) : (
                    <>
                        <Bookmark className="h-4 w-4 mr-2" />
                        クリップを保存
                    </>
                )}
            </Button>
        </form>
    )
}

// Main ClipList Component
export function ClipList({ userId, sharedData }: ClipListProps) {
    const [clips, setClips] = useState<Clip[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedClip, setSelectedClip] = useState<Clip | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState<string>('all')
    const [filterImportance, setFilterImportance] = useState<number>(0)
    const { toast } = useToast()

    // Auto-open dialog if there is shared data from Web Share Target
    useEffect(() => {
        if (sharedData?.url || sharedData?.text) {
            setIsDialogOpen(true)
        }
    }, [sharedData])

    const fetchClips = async () => {
        try {
            const res = await fetch('/api/clips')
            if (res.ok) {
                const data = await res.json()
                setClips(data.clips || [])
            }
        } catch (error) {
            console.error('Error fetching clips:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchClips()
    }, [])

    // Filter clips based on search query, type, and importance
    const filteredClips = clips.filter(clip => {
        // Search filter
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch = searchQuery === '' ||
            clip.title?.toLowerCase().includes(searchLower) ||
            clip.url.toLowerCase().includes(searchLower) ||
            clip.memo?.toLowerCase().includes(searchLower)

        // Type filter
        const matchesType = filterType === 'all' || clip.contentType === filterType

        // Importance filter
        const matchesImportance = filterImportance === 0 || clip.importance >= filterImportance

        return matchesSearch && matchesType && matchesImportance
    })

    const handleDelete = async (id: string) => {
        if (!confirm('このクリップを削除しますか？')) return

        try {
            const res = await fetch(`/api/clips/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setClips(clips.filter(c => c.id !== id))
                toast({
                    title: "削除しました",
                    description: "クリップが削除されました",
                })
            }
        } catch (error) {
            console.error('Error deleting clip:', error)
            toast({
                title: "エラー",
                description: "削除に失敗しました",
                variant: "destructive",
            })
        }
    }

    const handleClipCreated = () => {
        setIsDialogOpen(false)
        fetchClips()
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {/* Search and Filter Section */}
            <div className="space-y-1.5">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="タイトル、URL、メモで検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
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

                {/* Filters Row */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Content Type Filter */}
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                            <Filter className="h-3 w-3 mr-1" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">すべて</SelectItem>
                            <SelectItem value="x">X (Twitter)</SelectItem>
                            <SelectItem value="youtube">YouTube</SelectItem>
                            <SelectItem value="blog">ブログ</SelectItem>
                            <SelectItem value="note">note</SelectItem>
                            <SelectItem value="other">その他</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Importance Filter */}
                    <div className="flex items-center gap-1 bg-muted/50 rounded-md px-2 py-1">
                        <span className="text-[10px] text-muted-foreground mr-1">重要度</span>
                        {[0, 1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setFilterImportance(star === filterImportance ? 0 : star)}
                                className={`p-0.5 transition-colors ${star === 0
                                    ? filterImportance === 0 ? 'text-primary' : 'text-muted-foreground'
                                    : star <= filterImportance ? 'text-yellow-500' : 'text-gray-300'
                                    }`}
                                title={star === 0 ? 'フィルタ解除' : `${star}以上`}
                            >
                                {star === 0 ? (
                                    <span className="text-[10px]">全</span>
                                ) : (
                                    <Star className="h-3.5 w-3.5 fill-current" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1" />

                    {/* Add Button */}
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="h-8">
                                <Plus className="h-4 w-4 mr-1" />
                                追加
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>クリップを保存</DialogTitle>
                            </DialogHeader>
                            <ClipForm
                                onSuccess={handleClipCreated}
                                initialUrl={sharedData?.url || (sharedData?.text?.startsWith('http') ? sharedData.text : undefined)}
                                initialTitle={sharedData?.title}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Results Count */}
                <div className="text-xs text-muted-foreground">
                    {filteredClips.length === clips.length
                        ? `${clips.length} クリップ`
                        : `${filteredClips.length} / ${clips.length} クリップ`
                    }
                </div>
            </div>

            {/* Clips List */}
            {clips.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center mb-3">
                            <Bookmark className="h-6 w-6 text-secondary" />
                        </div>
                        <h3 className="font-semibold mb-2">クリップがありません</h3>
                        <p className="text-sm text-muted-foreground text-center max-w-xs mb-4">
                            X（Twitter）やYouTube、ブログなど有用なコンテンツを保存しましょう
                        </p>
                        <Button onClick={() => setIsDialogOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            最初のクリップを保存
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-1">
                    {filteredClips.map((clip) => {
                        const config = contentTypeConfig[clip.contentType]
                        const Icon = config.icon

                        return (
                            <div
                                key={clip.id}
                                className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => {
                                    setSelectedClip(clip)
                                    setIsDetailOpen(true)
                                }}
                            >
                                {/* Content Type Icon */}
                                <div className={`shrink-0 h-7 w-7 rounded flex items-center justify-center ${config.color}`}>
                                    <Icon className="h-3.5 w-3.5" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-xs truncate">
                                        {clip.title || 'タイトルなし'}
                                    </h4>
                                    <div className="flex items-center gap-1.5">
                                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                                            {config.label}
                                        </Badge>
                                        <div className="flex">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`h-2 w-2 ${star <= clip.importance
                                                        ? 'text-yellow-500 fill-yellow-500'
                                                        : 'text-gray-300'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            window.open(clip.url, '_blank')
                                        }}
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDelete(clip.id)
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
            {/* Clip Detail Dialog */}
            <ClipDetailDialog
                clip={selectedClip}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
            />
        </div>
    )
}
