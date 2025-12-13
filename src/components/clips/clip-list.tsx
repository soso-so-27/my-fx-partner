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
    Loader2
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
function ClipForm({ onSuccess }: { onSuccess: () => void }) {
    const [url, setUrl] = useState('')
    const [title, setTitle] = useState('')
    const [contentType, setContentType] = useState<string>('blog')
    const [memo, setMemo] = useState('')
    const [importance, setImportance] = useState(3)
    const [isSubmitting, setIsSubmitting] = useState(false)
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
                <Input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    required
                />
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
export function ClipList({ userId }: ClipListProps) {
    const [clips, setClips] = useState<Clip[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedClip, setSelectedClip] = useState<Clip | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const { toast } = useToast()

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
        <div className="space-y-4">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    保存済み: {clips.length} クリップ
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            追加
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>クリップを保存</DialogTitle>
                        </DialogHeader>
                        <ClipForm onSuccess={handleClipCreated} />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Clips List */}
            {clips.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="h-16 w-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                            <Bookmark className="h-8 w-8 text-secondary" />
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
                <div className="space-y-3">
                    {clips.map((clip) => {
                        const config = contentTypeConfig[clip.contentType]
                        const Icon = config.icon

                        return (
                            <Card
                                key={clip.id}
                                className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-shadow"
                                onClick={() => {
                                    setSelectedClip(clip)
                                    setIsDetailOpen(true)
                                }}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        {/* Content Type Icon */}
                                        <div className={`shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${config.color}`}>
                                            <Icon className="h-5 w-5" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <h4 className="font-medium text-sm truncate">
                                                        {clip.title || 'タイトルなし'}
                                                    </h4>
                                                    <a
                                                        href={clip.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-muted-foreground hover:text-primary truncate block"
                                                    >
                                                        {clip.url}
                                                    </a>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            window.open(clip.url, '_blank')
                                                        }}
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDelete(clip.id)
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Memo */}
                                            {clip.memo && (
                                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                                    {clip.memo}
                                                </p>
                                            )}

                                            {/* Footer */}
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge variant="secondary" className="text-xs">
                                                    {config.label}
                                                </Badge>
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <Star
                                                            key={star}
                                                            className={`h-3 w-3 ${star <= clip.importance
                                                                ? 'text-yellow-500 fill-yellow-500'
                                                                : 'text-gray-300'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
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
