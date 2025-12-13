import { PollDetail } from "@/components/polls/poll-detail"
import { getSupabaseAdmin, getOrCreateUserProfile } from "@/lib/supabase-admin"
import { PollService } from "@/lib/poll-service"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { notFound } from "next/navigation"

export default async function PollDetailPage({ params }: { params: { id: string } }) {
    const supabaseAdmin = getSupabaseAdmin()
    const session = await getServerSession(authOptions)

    let poll = null
    let userVote = null
    let results = null

    try {
        poll = await PollService.getPoll(supabaseAdmin, params.id)
        if (!poll) return notFound()

        if (session?.user?.email) {
            const userId = await getOrCreateUserProfile(supabaseAdmin, session.user.email)
            userVote = await PollService.getUserVote(supabaseAdmin, userId, params.id)
        }

        // Always get results (and filter in component based on visibility if needed, 
        // strictly simpler to just fetch and let client component handle display logic or hide sensitive data here)
        // For security, strict implementation should hide results here if not visible.
        results = await PollService.getPollResults(supabaseAdmin, params.id)

    } catch (e) {
        console.error('Error loading poll detail', e)
        return notFound() // Or error page
    }

    return (
        <div className="container mx-auto p-4 max-w-2xl pb-20">
            <h1 className="text-2xl font-bold mb-4">{poll.title}</h1>
            <p className="text-muted-foreground mb-6">{poll.description}</p>

            <PollDetail
                poll={poll}
                initialVote={userVote}
                initialResults={results}
            />
        </div>
    )
}
