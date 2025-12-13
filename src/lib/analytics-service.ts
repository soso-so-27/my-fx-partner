import { SupabaseClient } from '@supabase/supabase-js'

export type EventType = 'login' | 'chat_message' | 'trade_log' | 'page_view' | 'review_complete' | 'ai_limit_reached' | 'ai_chat'

export const AnalyticsService = {
    async trackEvent(
        supabase: SupabaseClient,
        userId: string,
        eventType: EventType,
        metadata: Record<string, any> = {}
    ) {
        try {
            const { error } = await supabase.from('user_events').insert({
                user_id: userId,
                event_type: eventType,
                metadata
            })

            if (error) {
                console.error('Analytics insert error:', error)
            }
        } catch (err) {
            console.error('Analytics unexpected error:', err)
        }
    },

    // KPI Calculation helpers (Server-side usage mainly)
    async getWeeklyReviewStats(supabase: SupabaseClient, userId: string) {
        // Example: Count reviews in last 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const { count } = await supabase
            .from('user_events')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('event_type', 'review_complete')
            .gte('created_at', sevenDaysAgo.toISOString())

        return count || 0
    }
}
