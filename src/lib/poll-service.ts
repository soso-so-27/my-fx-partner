import { SupabaseClient } from '@supabase/supabase-js'

export type PollType = 'direction' | 'indicator' | 'action'
export type Confidence = 'low' | 'mid' | 'high'

export interface Poll {
    id: string
    type: PollType
    title: string
    description?: string
    target?: string
    time_window?: string
    start_at: string
    end_at: string
    result_visibility: 'after_vote' | 'after_close'
    status: 'active' | 'closed'
    created_at: string
    participant_count?: number
    votes?: PollVote[]
}

export interface PollVote {
    poll_id: string
    user_id: string
    choice: string
    confidence?: Confidence
    created_at: string
}

export const PollService = {
    // Get active polls with participant count
    async getActivePolls(supabase: SupabaseClient) {
        const now = new Date().toISOString()
        const { data, error } = await supabase
            .from('polls')
            .select(`
        *,
        votes:poll_votes(count)
      `)
            .eq('status', 'active')
            .gt('end_at', now)
            .order('end_at', { ascending: true })

        if (error) throw error

        // Map count properly
        return data.map((p: any) => ({
            ...p,
            participant_count: p.votes[0]?.count || 0
        })) as Poll[]
    },

    // Get poll details
    async getPoll(supabase: SupabaseClient, pollId: string) {
        const { data, error } = await supabase
            .from('polls')
            .select('*')
            .eq('id', pollId)
            .single()
        if (error) throw error
        return data as Poll
    },

    // Submit vote
    async submitVote(supabase: SupabaseClient, userId: string, pollId: string, choice: string, confidence?: string) {
        const { error } = await supabase
            .from('poll_votes')
            .insert({
                poll_id: pollId,
                user_id: userId,
                choice,
                confidence
            })
        if (error) throw error
    },

    // Check if user voted
    async getUserVote(supabase: SupabaseClient, userId: string, pollId: string) {
        const { data, error } = await supabase
            .from('poll_votes')
            .select('*')
            .eq('poll_id', pollId)
            .eq('user_id', userId)
            .maybeSingle()
        if (error) throw error
        return data as PollVote | null
    },

    // Get aggregated results
    async getPollResults(supabase: SupabaseClient, pollId: string) {
        // Supabase doesn't support GROUP BY directly in JS client easily without views or RPC
        // For now, fetch all votes (if small scale) or use RPC.
        // Assuming small scale < 1000 votes
        const { data, error } = await supabase
            .from('poll_votes')
            .select('choice')
            .eq('poll_id', pollId)

        if (error) throw error

        const results: Record<string, number> = {}
        data.forEach((v: any) => {
            results[v.choice] = (results[v.choice] || 0) + 1
        })
        return results
    }
}
