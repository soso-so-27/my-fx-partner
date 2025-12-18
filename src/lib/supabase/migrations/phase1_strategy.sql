-- ============================================
-- Phase 1 Refinement: Weekly Strategy Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.weekly_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    
    -- Week definition (Monday start)
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,

    -- Flexible Data (JSONB)
    -- plan: { mode, busyness, limits, rules, theme, focus_pairs, ignored_pairs, event_settings, ... }
    plan JSONB DEFAULT '{}'::jsonb,
    
    -- review: { score, badges, survey, ai_feedback, ... }
    review JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique Constraint: One strategy per user per week
    UNIQUE (user_id, start_date)
);

-- Enable RLS
ALTER TABLE public.weekly_strategies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own strategies"
    ON public.weekly_strategies FOR SELECT
    USING (user_id = auth.jwt() ->> 'email');

CREATE POLICY "Users can insert their own strategies"
    ON public.weekly_strategies FOR INSERT
    WITH CHECK (user_id = auth.jwt() ->> 'email');

CREATE POLICY "Users can update their own strategies"
    ON public.weekly_strategies FOR UPDATE
    USING (user_id = auth.jwt() ->> 'email');

CREATE POLICY "Users can delete their own strategies"
    ON public.weekly_strategies FOR DELETE
    USING (user_id = auth.jwt() ->> 'email');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_weekly_strategies_user_date ON public.weekly_strategies(user_id, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_strategies_plan_gin ON public.weekly_strategies USING gin (plan);

-- Trigger for updated_at
-- Assuming 'update_updated_at_column' function exists from previous migrations
CREATE TRIGGER weekly_strategies_updated_at
    BEFORE UPDATE ON public.weekly_strategies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
