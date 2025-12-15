import { supabase } from '@/lib/supabase/client'
import { Trade, CreateTradeInput } from '@/types/trade'

export const tradeService = {
    async getTrades(userId?: string, dataSource?: string): Promise<Trade[]> {
        // Use API route to handle auth and profile lookup securely
        const url = dataSource && dataSource !== 'all'
            ? `/api/trades?dataSource=${dataSource}`
            : '/api/trades'

        const response = await fetch(url)

        if (!response.ok) {
            console.error('Error fetching trades')
            return []
        }

        const data = await response.json()
        return (data || []).map(mapDbTradeToTrade)
    },

    async cleanupDemoData(): Promise<boolean> {
        const response = await fetch('/api/trades?dataSource=demo', {
            method: 'DELETE'
        })
        return response.ok
    },

    async getTradeById(id: string): Promise<Trade | undefined> {
        const { data, error } = await supabase
            .from('trades')
            .select('*')
            .eq('id', id)
            .single()

        if (error) return undefined
        return mapDbTradeToTrade(data)
    },

    async createTrade(input: CreateTradeInput, userId: string): Promise<Trade> {
        // Use API route to bypass RLS
        const response = await fetch('/api/trades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input)
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to create trade')
        }

        const data = await response.json()
        return mapDbTradeToTrade(data)
    },

    async updateTrade(id: string, updates: Partial<Trade>): Promise<Trade | null> {
        const response = await fetch('/api/trades', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...updates })
        })

        if (!response.ok) {
            console.error('Error updating trade')
            return null
        }

        // Re-fetch the updated trade
        const updated = await this.getTradeById(id)
        return updated || null
    },

    async deleteTrade(id: string): Promise<boolean> {
        const response = await fetch(`/api/trades?id=${id}`, {
            method: 'DELETE'
        })

        return response.ok
    }
}

function mapDbTradeToTrade(dbTrade: any): Trade {
    return {
        id: dbTrade.id,
        userId: dbTrade.user_id,
        createdAt: dbTrade.created_at,
        updatedAt: dbTrade.updated_at,

        pair: dbTrade.pair,
        pairNormalized: dbTrade.pair_normalized,
        direction: dbTrade.direction,

        entryPrice: Number(dbTrade.entry_price),
        exitPrice: dbTrade.exit_price ? Number(dbTrade.exit_price) : undefined,
        stopLoss: dbTrade.stop_loss ? Number(dbTrade.stop_loss) : undefined,
        takeProfit: dbTrade.take_profit ? Number(dbTrade.take_profit) : undefined,

        entryTime: dbTrade.entry_time,
        exitTime: dbTrade.exit_time,
        timezone: dbTrade.timezone,
        session: dbTrade.session,

        lotSize: dbTrade.lot_size ? Number(dbTrade.lot_size) : undefined,
        lotSizeRaw: dbTrade.lot_size_raw,

        pnl: dbTrade.pnl,
        pnlSource: dbTrade.pnl_source,

        chartImages: dbTrade.chart_images || [],

        notes: dbTrade.notes,
        tags: dbTrade.tags || [],

        isVerified: dbTrade.is_verified,
        verificationSource: dbTrade.verification_source,
        broker: dbTrade.broker,
        originalEmailId: dbTrade.original_email_id,

        dataSource: dbTrade.data_source || 'manual',
        wasModified: dbTrade.was_modified || false,

        isFrequentPair: dbTrade.is_frequent_pair,
        ruleCompliance: dbTrade.rule_compliance || []
    }
}
