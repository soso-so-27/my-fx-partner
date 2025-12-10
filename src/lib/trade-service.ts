import { supabase } from '@/lib/supabase/client'
import { Trade, CreateTradeInput } from '@/types/trade'


export const tradeService = {
    async getTrades(userId?: string): Promise<Trade[]> {
        if (!userId) return []

        const { data, error } = await supabase
            .from('trades')
            .select('*')
            .eq('user_id', userId)
            .order('entry_time', { ascending: false })

        if (error) {
            console.error('Error fetching trades:', error)
            return []
        }

        return (data || []).map(mapDbTradeToTrade)
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
        const dbInput = {
            user_id: userId,
            pair: input.pair,
            pair_normalized: input.pair.toUpperCase().replace(/[/\s]/g, ''),
            direction: input.direction,
            entry_price: input.entryPrice,
            entry_time: input.entryTime || new Date().toISOString(),
            exit_price: input.exitPrice,
            exit_time: input.exitTime,
            timezone: input.timezone || 'Asia/Tokyo',
            session: null, // TODO: Calculate session based on time
            stop_loss: input.stopLoss,
            take_profit: input.takeProfit,
            lot_size: input.lotSize,
            lot_size_raw: input.lotSizeRaw,
            pnl: input.pnl || { currency: 'JPY' },
            pnl_source: input.pnlSource || 'manual',
            chart_images: input.chartImages || [],
            notes: input.notes,
            tags: input.tags || [],
            is_verified: input.isVerified || false,
            verification_source: input.verificationSource,
            broker: input.broker,
            original_email_id: input.originalEmailId,
            rule_compliance: input.ruleCompliance || []
        }

        const { data, error } = await supabase
            .from('trades')
            .insert(dbInput)
            .select()
            .single()

        if (error) throw error
        return mapDbTradeToTrade(data)
    },

    async updateTrade(id: string, updates: Partial<Trade>): Promise<Trade | null> {
        const dbUpdates: any = {
            updated_at: new Date().toISOString()
        }
        if (updates.pair) {
            dbUpdates.pair = updates.pair
            dbUpdates.pair_normalized = updates.pair.toUpperCase().replace(/[/\s]/g, '')
        }
        if (updates.direction) dbUpdates.direction = updates.direction
        if (updates.entryPrice) dbUpdates.entry_price = updates.entryPrice
        if (updates.entryTime) dbUpdates.entry_time = updates.entryTime
        if (updates.exitPrice) dbUpdates.exit_price = updates.exitPrice
        if (updates.exitTime) dbUpdates.exit_time = updates.exitTime
        if (updates.timezone) dbUpdates.timezone = updates.timezone

        if (updates.stopLoss) dbUpdates.stop_loss = updates.stopLoss
        if (updates.takeProfit) dbUpdates.take_profit = updates.takeProfit

        if (updates.lotSize) dbUpdates.lot_size = updates.lotSize
        if (updates.lotSizeRaw) dbUpdates.lot_size_raw = updates.lotSizeRaw

        if (updates.pnl) dbUpdates.pnl = updates.pnl
        if (updates.pnlSource) dbUpdates.pnl_source = updates.pnlSource

        if (updates.chartImages) dbUpdates.chart_images = updates.chartImages

        if (updates.notes) dbUpdates.notes = updates.notes
        if (updates.tags) dbUpdates.tags = updates.tags

        if (updates.isVerified !== undefined) dbUpdates.is_verified = updates.isVerified
        if (updates.verificationSource) dbUpdates.verification_source = updates.verificationSource
        if (updates.broker) dbUpdates.broker = updates.broker
        if (updates.isFrequentPair !== undefined) dbUpdates.is_frequent_pair = updates.isFrequentPair
        if (updates.ruleCompliance) dbUpdates.rule_compliance = updates.ruleCompliance

        const { data, error } = await supabase
            .from('trades')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single()

        if (error) return null
        return mapDbTradeToTrade(data)
    },

    async deleteTrade(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('trades')
            .delete()
            .eq('id', id)

        return !error
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

        isFrequentPair: dbTrade.is_frequent_pair,
        ruleCompliance: dbTrade.rule_compliance || []
    }
}
