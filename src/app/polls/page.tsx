import { PollCard } from "@/components/polls/poll-card"
import { getSupabaseAdmin } from "@/lib/supabase-admin" // Use admin for public fetch for now or client
import { PollService, Poll } from "@/lib/poll-service"

export const dynamic = 'force-dynamic'

// This is a Server Component
export default async function PollsPage() {
    const supabaseAdmin = getSupabaseAdmin()

    // In real app, we might want to use createServerComponentClient to respect RLS
    // but for "Public Active Polls", admin check is fine if we filter correctly.
    // However, let's try to fetch safely using Service.

    let polls: Poll[] = []
    try {
        polls = await PollService.getActivePolls(supabaseAdmin)
    } catch (e) {
        console.error('Failed to fetch polls', e)
    }

    return (
        <div className="container mx-auto p-4 max-w-4xl pb-20">
            <header className="mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    🗳️ 投票チャレンジ
                </h1>
                <p className="text-muted-foreground">
                    市場の方向感を予測し、コミュニティの相場観を確認しましょう。
                </p>
            </header>

            {polls.length === 0 ? (
                <div className="text-center py-10 bg-muted/30 rounded-lg">
                    <p className="text-muted-foreground">現在開催中の投票はありません</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {polls.map(poll => (
                        <PollCard key={poll.id} poll={poll} />
                    ))}
                </div>
            )}
        </div>
    )
}
