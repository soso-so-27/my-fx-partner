"use client"

import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface XEmbedProps {
    url: string
    className?: string
}

// Declare Twitter widget type
declare global {
    interface Window {
        twttr?: {
            widgets: {
                load: (element?: HTMLElement) => void
                createTweet: (
                    tweetId: string,
                    container: HTMLElement,
                    options?: {
                        theme?: 'light' | 'dark'
                        width?: number
                        align?: 'left' | 'center' | 'right'
                        conversation?: 'none' | 'all'
                        cards?: 'hidden' | 'visible'
                        dnt?: boolean
                    }
                ) => Promise<HTMLElement | undefined>
            }
        }
    }
}

// Extract tweet ID from X/Twitter URL
function extractTweetId(url: string): string | null {
    // Support both twitter.com and x.com URLs
    // Format: https://twitter.com/username/status/1234567890
    // Format: https://x.com/username/status/1234567890
    const patterns = [
        /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
        /(?:twitter\.com|x\.com)\/\w+\/statuses\/(\d+)/,
    ]

    for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match && match[1]) {
            return match[1]
        }
    }

    return null
}

export function XEmbed({ url, className = '' }: XEmbedProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const embedLoadedRef = useRef(false)

    const tweetId = extractTweetId(url)

    useEffect(() => {
        if (!tweetId || !containerRef.current || embedLoadedRef.current) return

        const loadTwitterScript = () => {
            return new Promise<void>((resolve) => {
                if (window.twttr) {
                    resolve()
                    return
                }

                const script = document.createElement('script')
                script.src = 'https://platform.twitter.com/widgets.js'
                script.async = true
                script.charset = 'utf-8'
                script.onload = () => resolve()
                script.onerror = () => {
                    setError('Twitterウィジェットの読み込みに失敗しました')
                    setIsLoading(false)
                }
                document.head.appendChild(script)
            })
        }

        const embedTweet = async () => {
            try {
                await loadTwitterScript()

                if (!window.twttr || !containerRef.current) return

                // Clear container
                containerRef.current.innerHTML = ''

                // Check for dark mode
                const isDarkMode = document.documentElement.classList.contains('dark')

                const tweetElement = await window.twttr.widgets.createTweet(
                    tweetId,
                    containerRef.current,
                    {
                        theme: isDarkMode ? 'dark' : 'light',
                        align: 'center',
                        conversation: 'none',
                        dnt: true, // Do not track
                    }
                )

                if (!tweetElement) {
                    setError('ツイートが見つかりませんでした')
                }

                embedLoadedRef.current = true
                setIsLoading(false)
            } catch (err) {
                console.error('Error embedding tweet:', err)
                setError('ツイートの読み込みに失敗しました')
                setIsLoading(false)
            }
        }

        embedTweet()
    }, [tweetId])

    if (!tweetId) {
        return (
            <div className={`text-sm text-muted-foreground ${className}`}>
                無効なTwitter/X URLです
            </div>
        )
    }

    if (error) {
        return (
            <div className={`p-4 rounded-lg bg-muted text-center ${className}`}>
                <p className="text-sm text-muted-foreground">{error}</p>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline mt-2 inline-block"
                >
                    X.comで開く →
                </a>
            </div>
        )
    }

    return (
        <div className={className}>
            {isLoading && (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            )}
            <div ref={containerRef} className="twitter-embed-container" />
        </div>
    )
}
