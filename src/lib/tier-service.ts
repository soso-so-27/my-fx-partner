
import { SupabaseClient } from '@supabase/supabase-js'

export type UserTier = 'free' | 'pro' | 'premium'

export const TierLimits = {
    free: {
        patterns: 1,
        aiChat: 3, // Daily high quality
    },
    pro: {
        patterns: 5,
        aiChat: 50,
    },
    premium: {
        patterns: 100,
        aiChat: 1000,
    }
}

export async function getUserTier(supabase: SupabaseClient, userId: string): Promise<UserTier> {
    // TODO: Implement actual DB fetch
    // const { data } = await supabase.from('profiles').select('tier').eq('id', userId).single()
    // return (data?.tier as UserTier) || 'free'

    // For development/demo, we might want to default to 'pro' if needed, 
    // but sticking to 'free' ensures we test limits.
    return 'free'
}
