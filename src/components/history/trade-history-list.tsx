"use client"

import { useEffect, useState } from "react"
import { Trade } from "@/types/trade"
import { tradeService } from "@/lib/trade-service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PeriodFilter } from "@/components/ui/period-filter"
import { Period, filterByPeriod } from "@/lib/date-utils"
import { TagFilter } from "@/components/ui/tag-filter"
import { getTagColor } from "@/lib/tag-constants"
import { SearchBar } from "@/components/ui/search-bar"
import { searchTrades } from "@/lib/search-utils"
import { ExportControls } from "@/components/ui/export-controls"
import { EditTradeDialog } from "@/components/trade/edit-trade-dialog"
import { DeleteTradeDialog } from "@/components/trade/delete-trade-dialog"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2, ShieldCheck, Plus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { QuickRecordDialog } from "@/components/trade/quick-record-dialog"

export function TradeHistoryList() {
    const { user } = useAuth()
    const [allTrades, setAllTrades] = useState<Trade[]>([])
    const [filteredTrades, setFilteredTrades] = useState<Trade[]>([])
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState<Period>('all')
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [editingTrade, setEditingTrade] = useState<Trade | null>(null)
    const [deletingTrade, setDeletingTrade] = useState<{ id: string, pair: string } | null>(null)
    const [showAddDialog, setShowAddDialog] = useState(false)

    useEffect(() => {
        const loadTrades = async () => {
            if (!user) {
                setLoading(false)
                return
            }
            try {
                const data = await tradeService.getTrades(user.id)
                setAllTrades(data)
                setFilteredTrades(data)
            } catch (error) {
                console.error("Failed to load trades", error)
            } finally {
                setLoading(false)
            }
        }
        loadTrades()
    }, [user])

    useEffect(() => {
        let filtered = filterByPeriod(allTrades, period)

        // Filter by tags if any selected
        if (selectedTags.length > 0) {
            filtered = filtered.filter(trade =>
                trade.tags && trade.tags.some(tag => selectedTags.includes(tag))
            )
        }

        // Filter by search query
        if (searchQuery) {
            filtered = searchTrades(filtered, searchQuery)
        }

        setFilteredTrades(filtered)
    }, [period, selectedTags, searchQuery, allTrades])

    const refreshTrades = async () => {
        if (!user) return
        try {
            const data = await tradeService.getTrades(user.id)
            setAllTrades(data)
            // Filtering will happen automatically via the other useEffect
        } catch (error) {
            console.error("Failed to refresh trades", error)
        }
    }

    if (loading) {
        return <div className="p-4">Loading trades...</div>
    }

    return (
        <div className="flex flex-col h-full min-h-[600px]">
            <header className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">検索・フィルタ</h2>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddDialog(true)}
                        className="gap-1"
                    >
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">手動追加</span>
                    </Button>
                    <ExportControls trades={filteredTrades} />
                </div>
            </header>

            <div className="mb-4 space-y-3">
                <SearchBar value={searchQuery} onChange={setSearchQuery} />
                <div className="flex gap-2 overflow-x-auto pb-1">
                    <PeriodFilter value={period} onChange={setPeriod} />
                </div>
                <TagFilter selectedTags={selectedTags} onChange={setSelectedTags} />
            </div>

            <ScrollArea className="flex-1 -mx-4 px-4">
                <div className="grid gap-4 pb-24">
                    {filteredTrades.map((trade) => (
                        <Card key={trade.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-base font-medium font-numbers flex items-center gap-2">
                                    {trade.pair} <span className="text-muted-foreground text-sm">({trade.direction})</span>
                                    {trade.isVerified && (
                                        <Badge variant="secondary" className="bg-solo-gold/10 text-amber-700 border-solo-gold/30 dark:bg-solo-gold/20 dark:text-solo-gold dark:border-solo-gold/40 gap-1 h-5 px-1.5">
                                            <ShieldCheck className="h-3 w-3" />
                                            <span className="text-[10px]">Real</span>
                                        </Badge>
                                    )}
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <Badge variant={trade.pnl?.amount && trade.pnl.amount > 0 ? "default" : "destructive"} className={trade.pnl?.amount && trade.pnl.amount > 0 ? "bg-profit hover:bg-profit/80" : "bg-loss hover:bg-loss/80"}>
                                        <span className="font-numbers">{trade.pnl?.amount ? `${trade.pnl.amount > 0 ? '+' : ''}${trade.pnl.amount}` : '決済待ち'}</span>
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <span className="text-muted-foreground">エントリー:</span> <span className="font-numbers">{trade.entryPrice}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">日時:</span> {new Date(trade.entryTime).toLocaleDateString('ja-JP')}
                                        </div>
                                    </div>
                                    {trade.tags && trade.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 pt-1">
                                            {trade.tags.map((tag) => (
                                                <Badge key={tag} variant="outline" className={`text-xs ${getTagColor(tag)}`}>
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                    {trade.notes && (
                                        <div>
                                            <span className="text-muted-foreground">メモ:</span> {trade.notes}
                                        </div>
                                    )}
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setEditingTrade(trade)}
                                            className="gap-1"
                                        >
                                            <Edit2 className="h-3 w-3" />
                                            編集
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setDeletingTrade({ id: trade.id, pair: trade.pair })}
                                            className="gap-1 text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            削除
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {filteredTrades.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            トレードが見つかりませんでした
                        </div>
                    )}
                </div>
            </ScrollArea>

            {editingTrade && (
                <EditTradeDialog
                    trade={editingTrade}
                    open={!!editingTrade}
                    onOpenChange={(open) => !open && setEditingTrade(null)}
                    onSuccess={refreshTrades}
                />
            )}

            {deletingTrade && (
                <DeleteTradeDialog
                    tradeId={deletingTrade.id}
                    tradePair={deletingTrade.pair}
                    open={!!deletingTrade}
                    onOpenChange={(open) => !open && setDeletingTrade(null)}
                    onSuccess={refreshTrades}
                />
            )}

            <QuickRecordDialog
                open={showAddDialog}
                onOpenChange={setShowAddDialog}
                onSuccess={refreshTrades}
            />
        </div>
    )
}
