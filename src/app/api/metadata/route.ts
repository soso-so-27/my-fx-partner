import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

// Fetch URL metadata (title, description, OGP image)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const url = searchParams.get('url')

        if (!url) {
            return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
        }

        // Validate URL
        try {
            new URL(url)
        } catch {
            return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
        }

        // Fetch the page
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

        let html: string
        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; MyFXPartner/1.0)',
                    'Accept': 'text/html',
                },
            })
            clearTimeout(timeoutId)

            if (!response.ok) {
                return NextResponse.json({
                    error: `Failed to fetch URL: ${response.status}`
                }, { status: 400 })
            }

            html = await response.text()
        } catch (fetchError: any) {
            clearTimeout(timeoutId)
            if (fetchError.name === 'AbortError') {
                return NextResponse.json({ error: 'Request timed out' }, { status: 408 })
            }
            return NextResponse.json({
                error: 'Failed to fetch URL'
            }, { status: 400 })
        }

        // Parse metadata
        const metadata = parseMetadata(html, url)

        return NextResponse.json(metadata)
    } catch (error) {
        console.error('Error in GET /api/metadata:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// Parse HTML for metadata
function parseMetadata(html: string, url: string): {
    title: string | null
    description: string | null
    image: string | null
    siteName: string | null
    contentType: 'x' | 'youtube' | 'blog' | 'note' | 'other'
} {
    // Helper to extract tag content
    const getMetaContent = (property: string): string | null => {
        const patterns = [
            new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'),
            new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, 'i'),
            new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i'),
            new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${property}["']`, 'i'),
        ]

        for (const pattern of patterns) {
            const match = html.match(pattern)
            if (match && match[1]) {
                return decodeHtmlEntities(match[1])
            }
        }
        return null
    }

    // Get title
    let title = getMetaContent('og:title') || getMetaContent('twitter:title')
    if (!title) {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
        title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : null
    }

    // Get description
    const description = getMetaContent('og:description')
        || getMetaContent('twitter:description')
        || getMetaContent('description')

    // Get image
    const image = getMetaContent('og:image')
        || getMetaContent('twitter:image')
        || getMetaContent('twitter:image:src')

    // Get site name
    const siteName = getMetaContent('og:site_name')

    // Detect content type
    const contentType = detectContentType(url)

    return {
        title,
        description,
        image: image ? resolveUrl(image, url) : null,
        siteName,
        contentType,
    }
}

// Detect content type from URL
function detectContentType(url: string): 'x' | 'youtube' | 'blog' | 'note' | 'other' {
    const lowerUrl = url.toLowerCase()

    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
        return 'x'
    }
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
        return 'youtube'
    }
    if (lowerUrl.includes('note.com')) {
        return 'note'
    }

    // Detect common blog patterns
    const blogPatterns = [
        'blog', 'medium.com', 'dev.to', 'qiita.com', 'zenn.dev',
        'hashnode', 'substack'
    ]
    for (const pattern of blogPatterns) {
        if (lowerUrl.includes(pattern)) {
            return 'blog'
        }
    }

    return 'other'
}

// Resolve relative URLs
function resolveUrl(imageUrl: string, baseUrl: string): string {
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl
    }

    try {
        const base = new URL(baseUrl)
        if (imageUrl.startsWith('//')) {
            return `${base.protocol}${imageUrl}`
        }
        if (imageUrl.startsWith('/')) {
            return `${base.origin}${imageUrl}`
        }
        return new URL(imageUrl, base.origin).href
    } catch {
        return imageUrl
    }
}

// Decode HTML entities
function decodeHtmlEntities(text: string): string {
    const entities: Record<string, string> = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&apos;': "'",
        '&#x27;': "'",
        '&nbsp;': ' ',
    }

    let result = text
    for (const [entity, char] of Object.entries(entities)) {
        result = result.replace(new RegExp(entity, 'g'), char)
    }

    // Decode numeric entities
    result = result.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))

    return result
}
