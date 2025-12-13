"use client"

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Pattern, SUPPORTED_TIMEFRAMES } from '@/lib/pattern-service'
import {
    Target,
    Link2,
    Plus,
    Trash2,
    ExternalLink,
    Clock,
    TrendingUp,
    TrendingDown,
    Twitter,
    Youtube,
    FileText,
    Loader2
} from 'lucide-react'

interface Clip {
    id: string
    url: string
    title: string | null
    content_type: 'x' | 'youtube' | 'blog' | 'note' | 'other'
    thumbnail_url: string | null
    memo: string | null
    tags: string[]
    importance: number
    linkedAt?: string
}

interface PatternDetailDialogProps {
    pattern: Pattern | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

const contentTypeIcons = {
    x: Twitter,
    youtube: Youtube,
    blog: FileText,
    note: FileText,
    other: Link2,
}

export function PatternDetailDialog({ pattern, open, onOpenChange }: PatternDetailDialogProps) {
    const [linkedClips, setLinkedClips] = useState<Clip[]>([])
    const [availableClips, setAvailableClips] = useState<Clip[]>([])
    const [selectedClipId, setSelectedClipId] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)
    const [isLinking, setIsLinking] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        if (open && pattern) {
            fetchLinkedClips()
            fetchAvailableClips()
        }
    }, [open, pattern])

    const fetchLinkedClips = async () => {
        if (!pattern) return
        setIsLoading(true)
        try {
            const res = await fetch(`/api/patterns/${pattern.id}/clips`)
            if (res.ok) {
                const data = await res.json()
                setLinkedClips(data.clips || [])
            }
        } catch (error) {
            console.error('Error fetching linked clips:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchAvailableClips = async () => {
        try {
            const res = await fetch('/api/clips')
            if (res.ok) {
                const data = await res.json()
                setAvailableClips(data.clips || [])
            }
        } catch (error) {
            console.error('Error fetching clips:', error)
        }
    }

    const handleLinkClip = async () => {
        if (!pattern || !selectedClipId) return
        setIsLinking(true)
        try {
            const res = await fetch(`/api/patterns/${pattern.id}/clips`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clipId: selectedClipId })
            })

            if (res.ok) {
                toast({ title: 'クリップを紐づけました' })
                setSelectedClipId('')
                fetchLinkedClips()
            } else {
                const data = await res.json()
                toast({
                    title: data.error || '紐づけに失敗しました',
                    variant: 'destructive'
                })
            }
        } catch (error) {
            console.error('Error linking clip:', error)
            toast({ title: '紐づけに失敗しました', variant: 'destructive' })
        } finally {
            setIsLinking(false)
        }
    }

    const handleUnlinkClip = async (clipId: string) => {
        if (!pattern) return
        try {
            const res = await fetch(`/api/patterns/${pattern.id}/clips`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clipId })
            })

            if (res.ok) {
                toast({ title: '紐づけを解除しました' })
                setLinkedClips(linkedClips.filter(c => c.id !== clipId))
            }
        } catch (error) {
            console.error('Error unlinking clip:', error)
            toast({ title: '解除に失敗しました', variant: 'destructive' })
        }
    }

    // Filter out already linked clips
    const unlinkedClips = availableClips.filter(
        clip => !linkedClips.some(linked => linked.id === clip.id)
    )

    if (!pattern) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        {pattern.name}
                    </DialogTitle>
                </DialogHeader>

                {/* Pattern Info */}
                <div className="space-y-4">
                    {/* Image */}
                    {pattern.imageUrl && (
                        <div className="w-full h-40 bg-muted rounded-lg overflow-hidden">
                            <img
                                src={pattern.imageUrl}
                                alt={pattern.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">{pattern.currencyPair}</Badge>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {SUPPORTED_TIMEFRAMES.find(t => t.value === pattern.timeframe)?.label}
                        </span>
                        {pattern.direction && (
                            <span className="flex items-center gap-1 text-sm">
                                {pattern.direction === 'long' ? (
                                    <TrendingUp className="h-3 w-3 text-green-500" />
                                ) : (
                                    <TrendingDown className="h-3 w-3 text-red-500" />
                                )}
                                {pattern.direction === 'long' ? 'ロング' : 'ショート'}
                            </span>
                        )}
                    </div>

                    {/* Linked Clips Section */}
                    <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                            <Link2 className="h-4 w-4" />
                            関連クリップ
                        </h4>

                        {/* Add Clip */}
                        {unlinkedClips.length > 0 && (
                            <div className="flex gap-2">
                                <Select value={selectedClipId} onValueChange={setSelectedClipId}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="クリップを選択..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {unlinkedClips.map(clip => (
                                            <SelectItem key={clip.id} value={clip.id}>
                                                {clip.title || clip.url.slice(0, 40)}...
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    size="icon"
                                    onClick={handleLinkClip}
                                    disabled={!selectedClipId || isLinking}
                                >
                                    {isLinking ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        )}

                        {/* Linked Clips List */}
                        {isLoading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : linkedClips.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                関連クリップがありません
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {linkedClips.map(clip => {
                                    const Icon = contentTypeIcons[clip.content_type] || Link2
                                    return (
                                        <div
                                            key={clip.id}
                                            className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                                        >
                                            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {clip.title || 'タイトルなし'}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {clip.url}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 shrink-0"
                                                onClick={() => window.open(clip.url, '_blank')}
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                                                onClick={() => handleUnlinkClip(clip.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
