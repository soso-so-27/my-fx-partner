import { SupabaseClient } from '@supabase/supabase-js'
import { UserTier } from '@/lib/tier-service'

const LIMITS = {
    free: {
        highQuality: 3, // Per day (or simple counter)
        lightweight: 10
    },
    pro: {
        highQuality: 50,
        lightweight: 1000
    },
    premium: {
        highQuality: 1000,
        lightweight: 10000
    }
}

export const AIUsageService = {
    async checkLimit(supabase: SupabaseClient, userId: string, tier: UserTier = 'free'): Promise<{ allowed: boolean, remaining: number }> {
        // 1. Get current usage
        // For simplicity, we just check a daily record or total record. 
        // Let's assume usage record is created daily or managed per month.
        // Here we implement a simple "today" check or "total" check.

        // To keep it simple and robust:
        // We check records created today.
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const { data, error } = await supabase
            .from('ai_usage')
            .select('*')
            .eq('user_id', userId)
            .gte('created_at', today.toISOString())
            .maybeSingle()

        // If no record for today, create one? Or just count events?
        // Better to count events from user_events if we want to be stateless, 
        // but user_events might get heavy.
        // Let's rely on user_events count for today for simplicity if ai_usage table is complex to maintain.

        // Actually, let's just count user_events for 'ai_chat' type created today.
        const { count } = await supabase
            .from('user_events')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('event_type', 'ai_chat')
            .gte('created_at', today.toISOString())

        const used = count || 0
        const limit = LIMITS[tier].highQuality // Assume all are high quality for now

        return {
            allowed: used < limit,
            remaining: Math.max(0, limit - used)
        }
    },

    async getUsageStats(supabase: SupabaseClient, userId: string) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const { count } = await supabase
            .from('user_events')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('event_type', 'ai_chat')
            .gte('created_at', today.toISOString())

        return count || 0
    }
}
