import { getSupabaseAdmin } from './supabase-admin'
import { generateFeatureVectorFromUrl } from './feature-vector'

// Types
export interface Pattern {
    id: string
    userId: string
    name: string
    description?: string
    imageUrl: string
    currencyPair: string
    timeframe: string
    direction?: 'long' | 'short' | null
    tags: string[]
    isActive: boolean
    similarityThreshold: number
    checkFrequency: string
    createdAt: Date
    updatedAt: Date
}

export interface PatternInput {
    name: string
    description?: string
    imageUrl: string
    currencyPair: string
    timeframe: string
    direction?: 'long' | 'short' | null
    tags?: string[]
    similarityThreshold?: number
    checkFrequency?: string
}

export interface Alert {
    id: string
    userId: string
    patternId: string
    similarity: number
    chartSnapshotUrl?: string
    status: 'unread' | 'read' | 'acted' | 'dismissed'
    userFeedback?: 'thumbs_up' | 'thumbs_down' | null
    createdAt: Date
    readAt?: Date
    actedAt?: Date
    pattern?: Pattern
}

// Currency pairs supported (MVP)
export const SUPPORTED_CURRENCY_PAIRS = [
    'USDJPY',
    'EURUSD',
    'GBPJPY',
] as const

// Timeframes supported (MVP)
// Timeframes supported (MVP) - Minimum 15m as per user request (Cron constraints)
export const SUPPORTED_TIMEFRAMES = [
    { value: '15m', label: '15分' },
    { value: '1h', label: '1時間' },
    { value: '4h', label: '4時間' },
    { value: '1d', label: '日足' },
] as const

// Pattern Service
export const patternService = {
    // ... (existing methods)

    // Find matching patterns for a given chart image and timeframe
    async findMatches(
        userId: string,
        chartImageUrl: string,
        timeframe: string
    ): Promise<{ pattern: Pattern; similarity: number }[]> {
        const supabase = getSupabaseAdmin()

        // 1. Fetch active patterns for this user AND timeframe
        const { data: patternsData, error } = await supabase
            .from('patterns')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .eq('timeframe', timeframe) // Strict timeframe matching

        if (error || !patternsData || patternsData.length === 0) {
            return []
        }

        // 2. Generate vector for the input chart
        let targetVector: number[] = []
        try {
            const { vector } = await generateFeatureVectorFromUrl(chartImageUrl)
            targetVector = vector
        } catch (e) {
            console.error('Error generating vector for target chart:', e)
            return []
        }

        // 3. Compare against all candidate patterns
        // We need to map DB rows to the format expected by comparePatternToMultiple
        // Note: patternsData has 'feature_vector' column.

        // Dynamic import to avoid circular dependency issues if any, or just standard import
        const { comparePatternToMultiple } = await import('./pattern-similarity')

        const candidates = patternsData.map(p => ({
            id: p.id,
            vector: p.feature_vector as number[]
        }))

        const matches = comparePatternToMultiple(targetVector, candidates)

        // 4. Filter by threshold and map back to Pattern objects
        // We do this manually to attach the full Pattern object
        const results: { pattern: Pattern; similarity: number }[] = []

        for (const match of matches) {
            const patternRow = patternsData.find(p => p.id === match.id)
            if (!patternRow) continue

            const pattern = mapPattern(patternRow)
            // Use the pattern's specific threshold, or default to 70%
            const threshold = pattern.similarityThreshold || 70

            if (match.percent >= threshold) {
                results.push({
                    pattern,
                    similarity: match.similarity
                })
            }
        }

        return results
    },

    // Get all patterns for a user
    async getPatterns(userId: string): Promise<Pattern[]> {
        const supabase = getSupabaseAdmin()
        const { data, error } = await supabase
            .from('patterns')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching patterns:', error)
            return []
        }

        return (data || []).map(mapPattern)
    },


    // Get a single pattern by ID
    async getPattern(patternId: string): Promise<Pattern | null> {
        const supabase = getSupabaseAdmin()
        const { data, error } = await supabase
            .from('patterns')
            .select('*')
            .eq('id', patternId)
            .single()

        if (error) {
            console.error('Error fetching pattern:', error)
            return null
        }

        return data ? mapPattern(data) : null
    },

    // Create a new pattern
    async createPattern(userId: string, input: PatternInput): Promise<Pattern | null> {
        const supabase = getSupabaseAdmin()

        // Generate feature vector from the uploaded image URL
        // Now using real analysis via Sharp
        let featureVector: number[] = []
        try {
            const result = await generateFeatureVectorFromUrl(input.imageUrl)
            featureVector = result.vector
        } catch (e) {
            console.error('Failed to generate feature vector for pattern:', input.name, e)
            featureVector = new Array(67).fill(0)
        }

        const { data, error } = await supabase
            .from('patterns')
            .insert({
                user_id: userId,
                name: input.name,
                description: input.description,
                image_url: input.imageUrl,
                currency_pair: input.currencyPair,
                timeframe: input.timeframe,
                direction: input.direction,
                tags: input.tags || [],
                is_active: true,
                feature_vector: featureVector,
                similarity_threshold: 70,
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating pattern:', error)
            return null
        }

        return data ? mapPattern(data) : null
    },

    // Update a pattern
    async updatePattern(patternId: string, userId: string, input: Partial<PatternInput>): Promise<Pattern | null> {
        const updateData: Record<string, unknown> = {}

        if (input.name !== undefined) updateData.name = input.name
        if (input.description !== undefined) updateData.description = input.description
        if (input.imageUrl !== undefined) updateData.image_url = input.imageUrl
        if (input.currencyPair !== undefined) updateData.currency_pair = input.currencyPair
        if (input.timeframe !== undefined) updateData.timeframe = input.timeframe
        if (input.direction !== undefined) updateData.direction = input.direction
        if (input.tags !== undefined) updateData.tags = input.tags
        if (input.similarityThreshold !== undefined) updateData.similarity_threshold = input.similarityThreshold
        if (input.checkFrequency !== undefined) updateData.check_frequency = input.checkFrequency

        const supabase = getSupabaseAdmin()
        const { data, error } = await supabase
            .from('patterns')
            .update(updateData)
            .eq('id', patternId)
            .eq('user_id', userId)
            .select()
            .single()

        if (error) {
            console.error('Error updating pattern:', error)
            return null
        }

        return data ? mapPattern(data) : null
    },

    // Delete (soft delete) a pattern
    async deletePattern(patternId: string, userId: string): Promise<boolean> {
        const supabase = getSupabaseAdmin()
        const { error } = await supabase
            .from('patterns')
            .update({ is_active: false })
            .eq('id', patternId)
            .eq('user_id', userId)

        if (error) {
            console.error('Error deleting pattern:', error)
            return false
        }

        return true
    },

    // Get pattern count for a user (for plan limits)
    async getPatternCount(userId: string): Promise<number> {
        const supabase = getSupabaseAdmin()
        const { count, error } = await supabase
            .from('patterns')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_active', true)

        if (error) {
            console.error('Error counting patterns:', error)
            return 0
        }

        return count || 0
    },
}

// Alert Service
export const alertService = {
    // Get all alerts for a user
    async getAlerts(userId: string, limit = 50): Promise<Alert[]> {
        const supabase = getSupabaseAdmin()
        const { data, error } = await supabase
            .from('alerts')
            .select(`
                *,
                pattern:patterns(*)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('Error fetching alerts:', error)
            return []
        }

        return (data || []).map(mapAlert)
    },

    // Get unread alert count
    async getUnreadCount(userId: string): Promise<number> {
        const supabase = getSupabaseAdmin()
        const { count, error } = await supabase
            .from('alerts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'unread')

        if (error) {
            console.error('Error counting unread alerts:', error)
            return 0
        }

        return count || 0
    },

    // Mark alert as read
    async markAsRead(alertId: string, userId: string): Promise<boolean> {
        const supabase = getSupabaseAdmin()
        const { error } = await supabase
            .from('alerts')
            .update({
                status: 'read',
                read_at: new Date().toISOString()
            })
            .eq('id', alertId)
            .eq('user_id', userId)

        if (error) {
            console.error('Error marking alert as read:', error)
            return false
        }

        return true
    },

    // Mark alert as acted (user traded)
    async markAsActed(alertId: string, userId: string): Promise<boolean> {
        const supabase = getSupabaseAdmin()
        const { error } = await supabase
            .from('alerts')
            .update({
                status: 'acted',
                acted_at: new Date().toISOString()
            })
            .eq('id', alertId)
            .eq('user_id', userId)

        if (error) {
            console.error('Error marking alert as acted:', error)
            return false
        }

        return true
    },

    // Submit feedback (thumbs up/down)
    async submitFeedback(alertId: string, userId: string, feedback: 'thumbs_up' | 'thumbs_down'): Promise<boolean> {
        const supabase = getSupabaseAdmin()
        const { error } = await supabase
            .from('alerts')
            .update({ user_feedback: feedback })
            .eq('id', alertId)
            .eq('user_id', userId)

        if (error) {
            console.error('Error submitting feedback:', error)
            return false
        }

        return true
    },

    // Create a new alert (called by the pattern matching worker)
    async createAlert(
        userId: string,
        patternId: string,
        similarity: number,
        chartSnapshotUrl?: string
    ): Promise<Alert | null> {
        const supabase = getSupabaseAdmin()
        const { data, error } = await supabase
            .from('alerts')
            .insert({
                user_id: userId,
                pattern_id: patternId,
                similarity,
                chart_snapshot_url: chartSnapshotUrl,
                status: 'unread',
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating alert:', error)
            return null
        }

        return data ? mapAlert(data) : null
    },
}

// Mappers
function mapPattern(row: Record<string, unknown>): Pattern {
    return {
        id: row.id as string,
        userId: row.user_id as string,
        name: row.name as string,
        description: row.description as string | undefined,
        imageUrl: row.image_url as string,
        currencyPair: row.currency_pair as string,
        timeframe: row.timeframe as string,
        direction: row.direction as 'long' | 'short' | null,
        tags: (row.tags as string[]) || [],
        isActive: row.is_active as boolean,
        similarityThreshold: (row.similarity_threshold as number) || 70,
        checkFrequency: (row.check_frequency as string) || '15m',
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
    }
}

function mapAlert(row: Record<string, unknown>): Alert {
    return {
        id: row.id as string,
        userId: row.user_id as string,
        patternId: row.pattern_id as string,
        similarity: row.similarity as number,
        chartSnapshotUrl: row.chart_snapshot_url as string | undefined,
        status: row.status as Alert['status'],
        userFeedback: row.user_feedback as Alert['userFeedback'],
        createdAt: new Date(row.created_at as string),
        readAt: row.read_at ? new Date(row.read_at as string) : undefined,
        actedAt: row.acted_at ? new Date(row.acted_at as string) : undefined,
        pattern: row.pattern ? mapPattern(row.pattern as Record<string, unknown>) : undefined,
    }
}
