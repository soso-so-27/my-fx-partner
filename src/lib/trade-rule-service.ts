import { createClient } from '@/lib/supabase/client'
import { TradeRule, CreateRuleInput } from '@/types/trade-rule'

const supabase = createClient()

export const tradeRuleService = {
    async getRules(userId?: string): Promise<TradeRule[]> {
        if (!userId) return []

        const { data, error } = await supabase
            .from('trade_rules')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching rules:', error)
            return []
        }

        return (data || []).map(mapDbRuleToRule)
    },

    async createRule(input: CreateRuleInput, userId: string): Promise<TradeRule> {
        const dbInput = {
            user_id: userId,
            title: input.title,
            category: input.category,
            description: input.description,
            is_active: input.isActive ?? true
        }

        const { data, error } = await supabase
            .from('trade_rules')
            .insert(dbInput)
            .select()
            .single()

        if (error) throw error
        return mapDbRuleToRule(data)
    },

    async updateRule(id: string, updates: Partial<CreateRuleInput>): Promise<TradeRule | null> {
        const dbUpdates: any = {}
        if (updates.title) dbUpdates.title = updates.title
        if (updates.category) dbUpdates.category = updates.category
        if (updates.description) dbUpdates.description = updates.description
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive

        const { data, error } = await supabase
            .from('trade_rules')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single()

        if (error) return null
        return mapDbRuleToRule(data)
    },

    async toggleRuleActive(id: string): Promise<boolean> {
        const { data: current } = await supabase
            .from('trade_rules')
            .select('is_active')
            .eq('id', id)
            .single()

        if (!current) return false

        const { error } = await supabase
            .from('trade_rules')
            .update({ is_active: !current.is_active })
            .eq('id', id)

        return !error
    },

    async deleteRule(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('trade_rules')
            .delete()
            .eq('id', id)

        return !error
    }
}

function mapDbRuleToRule(dbRule: any): TradeRule {
    return {
        id: dbRule.id,
        userId: dbRule.user_id,
        title: dbRule.title,
        category: dbRule.category,
        description: dbRule.description,
        isActive: dbRule.is_active,
        createdAt: dbRule.created_at,
        updatedAt: dbRule.updated_at
    }
}
