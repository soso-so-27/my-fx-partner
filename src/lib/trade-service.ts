import { createClient } from '@/lib/supabase/client'
import { Trade, CreateTradeInput } from '@/types/trade'

const supabase = createClient()

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
            direction: input.direction,
            entry_price: input.entryPrice,
            entry_time: input.entryTime || new Date().toISOString(),
            exit_price: input.exitPrice,
            exit_time: input.exitTime,
            stop_loss: input.stopLoss,
            take_profit: input.takeProfit,
            lot_size: input.lotSize,
            pnl: input.pnl,
            notes: input.notes,
            tags: input.tags,
            is_verified: input.isVerified,
            verification_source: input.verificationSource,
            broker: input.broker,
            original_email_id: input.originalEmailId
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
        const dbUpdates: any = {}
        if (updates.pair) dbUpdates.pair = updates.pair
        if (updates.direction) dbUpdates.direction = updates.direction
        if (updates.entryPrice) dbUpdates.entry_price = updates.entryPrice
        if (updates.entryTime) dbUpdates.entry_time = updates.entryTime
        if (updates.exitPrice) dbUpdates.exit_price = updates.exitPrice
        if (updates.exitTime) dbUpdates.exit_time = updates.exitTime
        if (updates.stopLoss) dbUpdates.stop_loss = updates.stopLoss
        if (updates.takeProfit) dbUpdates.take_profit = updates.takeProfit
        if (updates.lotSize) dbUpdates.lot_size = updates.lotSize
        if (updates.pnl) dbUpdates.pnl = updates.pnl
        if (updates.notes) dbUpdates.notes = updates.notes
        if (updates.tags) dbUpdates.tags = updates.tags
        // Note: Verification fields usually shouldn't be updated manually, but adding for completeness if needed
        if (updates.isVerified !== undefined) dbUpdates.is_verified = updates.isVerified

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
        pair: dbTrade.pair,
        direction: dbTrade.direction,
        entryPrice: Number(dbTrade.entry_price),
        entryTime: dbTrade.entry_time,
        exitPrice: dbTrade.exit_price ? Number(dbTrade.exit_price) : undefined,
        exitTime: dbTrade.exit_time,
        stopLoss: dbTrade.stop_loss ? Number(dbTrade.stop_loss) : undefined,
        takeProfit: dbTrade.take_profit ? Number(dbTrade.take_profit) : undefined,
        lotSize: dbTrade.lot_size ? Number(dbTrade.lot_size) : undefined,
        pnl: dbTrade.pnl ? Number(dbTrade.pnl) : undefined,
        notes: dbTrade.notes,
        tags: dbTrade.tags,
        isVerified: dbTrade.is_verified,
        verificationSource: dbTrade.verification_source,
        broker: dbTrade.broker,
        originalEmailId: dbTrade.original_email_id
    }
}
