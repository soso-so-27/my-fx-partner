"use client"

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { XEmbed } from './x-embed'
import {
    ExternalLink,
    Star,
    Twitter,
    Youtube,
    FileText,
    Link2,
} from 'lucide-react'

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

interface ClipDetailDialogProps {
    clip: Clip | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

const contentTypeConfig = {
    x: { icon: Twitter, label: 'X (Twitter)', color: 'text-sky-500' },
    youtube: { icon: Youtube, label: 'YouTube', color: 'text-red-500' },
    blog: { icon: FileText, label: 'ブログ', color: 'text-orange-500' },
    note: { icon: FileText, label: 'note', color: 'text-green-500' },
    other: { icon: Link2, label: 'その他', color: 'text-gray-500' },
}

export function ClipDetailDialog({ clip, open, onOpenChange }: ClipDetailDialogProps) {
    if (!clip) return null

    const config = contentTypeConfig[clip.contentType] || contentTypeConfig.other
    const Icon = config.icon

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${config.color}`} />
                        {clip.title || 'クリップ詳細'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Content Type Badge & Importance */}
                    <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="gap-1">
                            <Icon className={`h-3 w-3 ${config.color}`} />
                            {config.label}
                        </Badge>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                    key={i}
                                    className={`h-4 w-4 ${i < clip.importance
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-muted-foreground'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* X/Twitter Embed */}
                    {clip.contentType === 'x' && (
                        <div className="border rounded-lg p-2 bg-muted/30">
                            <XEmbed url={clip.url} />
                        </div>
                    )}

                    {/* YouTube Embed */}
                    {clip.contentType === 'youtube' && (
                        <div className="aspect-video rounded-lg overflow-hidden">
                            <iframe
                                src={getYouTubeEmbedUrl(clip.url)}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    )}

                    {/* Other content types - just show link */}
                    {clip.contentType !== 'x' && clip.contentType !== 'youtube' && (
                        <div className="p-4 border rounded-lg bg-muted/30">
                            <a
                                href={clip.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-2"
                            >
                                <ExternalLink className="h-4 w-4" />
                                {clip.url}
                            </a>
                        </div>
                    )}

                    {/* Memo */}
                    {clip.memo && (
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-muted-foreground">メモ</h4>
                            <p className="text-sm whitespace-pre-wrap">{clip.memo}</p>
                        </div>
                    )}

                    {/* Tags */}
                    {clip.tags && clip.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {clip.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                    #{tag}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Open External Link Button */}
                    <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => window.open(clip.url, '_blank')}
                    >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        元のページを開く
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// Helper function to get YouTube embed URL
function getYouTubeEmbedUrl(url: string): string {
    const videoIdMatch = url.match(
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    )
    const videoId = videoIdMatch ? videoIdMatch[1] : null
    return videoId ? `https://www.youtube.com/embed/${videoId}` : ''
}
