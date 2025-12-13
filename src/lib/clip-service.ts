import { getSupabaseAdmin } from './supabase-admin'

// ============================================
// Types
// ============================================

export interface Clip {
    id: string
    userId: string
    url: string
    title: string | null
    contentType: 'x' | 'youtube' | 'blog' | 'note' | 'other'
    thumbnailUrl: string | null
    memo: string | null
    tags: string[]
    importance: number
    createdAt: string
    updatedAt: string
}

export interface ClipInput {
    url: string
    title?: string
    contentType: 'x' | 'youtube' | 'blog' | 'note' | 'other'
    thumbnailUrl?: string
    memo?: string
    tags?: string[]
    importance?: number
}

// ============================================
// Helper Functions
// ============================================

function mapClip(data: Record<string, unknown>): Clip {
    return {
        id: data.id as string,
        userId: data.user_id as string,
        url: data.url as string,
        title: data.title as string | null,
        contentType: data.content_type as Clip['contentType'],
        thumbnailUrl: data.thumbnail_url as string | null,
        memo: data.memo as string | null,
        tags: (data.tags as string[]) || [],
        importance: (data.importance as number) || 1,
        createdAt: data.created_at as string,
        updatedAt: data.updated_at as string,
    }
}

function detectContentType(url: string): Clip['contentType'] {
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
    return 'blog'
}

// ============================================
// Clip Service
// ============================================

export const clipService = {
    async getClips(userId: string): Promise<Clip[]> {
        const supabase = getSupabaseAdmin()
        const { data, error } = await supabase
            .from('clips')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching clips:', error)
            return []
        }

        return (data || []).map(mapClip)
    },

    async getClip(id: string): Promise<Clip | null> {
        const supabase = getSupabaseAdmin()
        const { data, error } = await supabase
            .from('clips')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            console.error('Error fetching clip:', error)
            return null
        }

        return data ? mapClip(data) : null
    },

    async createClip(userId: string, input: ClipInput): Promise<Clip | null> {
        const supabase = getSupabaseAdmin()

        // Auto-detect content type if not provided
        const contentType = input.contentType || detectContentType(input.url)

        const { data, error } = await supabase
            .from('clips')
            .insert({
                user_id: userId,
                url: input.url,
                title: input.title || null,
                content_type: contentType,
                thumbnail_url: input.thumbnailUrl || null,
                memo: input.memo || null,
                tags: input.tags || [],
                importance: input.importance || 1,
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating clip:', error)
            return null
        }

        return data ? mapClip(data) : null
    },

    async updateClip(id: string, userId: string, input: Partial<ClipInput>): Promise<Clip | null> {
        const supabase = getSupabaseAdmin()

        const updateData: Record<string, unknown> = {}
        if (input.url !== undefined) updateData.url = input.url
        if (input.title !== undefined) updateData.title = input.title
        if (input.contentType !== undefined) updateData.content_type = input.contentType
        if (input.thumbnailUrl !== undefined) updateData.thumbnail_url = input.thumbnailUrl
        if (input.memo !== undefined) updateData.memo = input.memo
        if (input.tags !== undefined) updateData.tags = input.tags
        if (input.importance !== undefined) updateData.importance = input.importance

        const { data, error } = await supabase
            .from('clips')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single()

        if (error) {
            console.error('Error updating clip:', error)
            return null
        }

        return data ? mapClip(data) : null
    },

    async deleteClip(id: string, userId: string): Promise<boolean> {
        const supabase = getSupabaseAdmin()
        const { error } = await supabase
            .from('clips')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)

        if (error) {
            console.error('Error deleting clip:', error)
            return false
        }

        return true
    },

    async getClipCount(userId: string): Promise<number> {
        const supabase = getSupabaseAdmin()
        const { count, error } = await supabase
            .from('clips')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)

        if (error) {
            console.error('Error counting clips:', error)
            return 0
        }

        return count || 0
    },

    async searchClips(userId: string, query: string): Promise<Clip[]> {
        const supabase = getSupabaseAdmin()
        const { data, error } = await supabase
            .from('clips')
            .select('*')
            .eq('user_id', userId)
            .or(`title.ilike.%${query}%,memo.ilike.%${query}%,url.ilike.%${query}%`)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error searching clips:', error)
            return []
        }

        return (data || []).map(mapClip)
    }
}
