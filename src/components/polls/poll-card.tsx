import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Users, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Poll } from "@/lib/poll-service"

interface PollCardProps {
    poll: Poll
}

export function PollCard({ poll }: PollCardProps) {
    const isExpired = new Date(poll.end_at) < new Date()

    return (
        <Card className="hover:border-solo-gold/50 transition-colors">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <Badge variant={poll.type === 'direction' ? 'default' : 'secondary'}>
                        {poll.type === 'direction' ? '方向感' : poll.type === 'indicator' ? '経済指標' : '行動'}
                    </Badge>
                    {isExpired && <Badge variant="outline" className="text-muted-foreground">終了</Badge>}
                </div>
                <CardTitle className="text-lg mt-2">{poll.title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {poll.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>あと {calculateTimeRemaining(poll.end_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{poll.participant_count || 0}人参加</span>
                    </div>
                </div>

                <Link href={`/polls/${poll.id}`} className="w-full">
                    <Button className="w-full group">
                        投票詳細へ
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
            </CardContent>
        </Card>
    )
}

function calculateTimeRemaining(endAt: string) {
    const diff = new Date(endAt).getTime() - new Date().getTime()
    if (diff <= 0) return '終了'
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}時間${minutes}分`
}
