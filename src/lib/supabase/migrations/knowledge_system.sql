-- ============================================
-- Knowledge System Migration
-- Phase 2: SOLO Journal Restructure
-- ============================================

-- ============================================
-- 1. Knowledge Table
-- Unified storage for X links, notes, memos, rules
-- ============================================
CREATE TABLE IF NOT EXISTS public.knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    
    -- Content
    title TEXT NOT NULL,
    content TEXT,  -- メモ、学びの内容
    url TEXT,      -- 外部リンク（X, YouTube, note等）
    
    -- Categorization
    content_type TEXT NOT NULL DEFAULT 'memo' CHECK (content_type IN ('x', 'youtube', 'blog', 'note', 'memo', 'rule', 'other')),
    category TEXT CHECK (category IN ('technique', 'rule', 'mistake', 'learning', 'analysis', 'other')),
    tags TEXT[] DEFAULT '{}',
    
    -- Organization
    is_pinned BOOLEAN DEFAULT FALSE,
    is_processed BOOLEAN DEFAULT FALSE,  -- 未整理 vs 整理済み
    importance INTEGER DEFAULT 1 CHECK (importance >= 1 AND importance <= 5),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.knowledge ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own knowledge"
    ON public.knowledge FOR SELECT
    USING (user_id = auth.jwt() ->> 'email');

CREATE POLICY "Users can insert their own knowledge"
    ON public.knowledge FOR INSERT
    WITH CHECK (user_id = auth.jwt() ->> 'email');

CREATE POLICY "Users can update their own knowledge"
    ON public.knowledge FOR UPDATE
    USING (user_id = auth.jwt() ->> 'email');

CREATE POLICY "Users can delete their own knowledge"
    ON public.knowledge FOR DELETE
    USING (user_id = auth.jwt() ->> 'email');

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_knowledge_user_id ON public.knowledge(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_is_pinned ON public.knowledge(user_id, is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_knowledge_is_processed ON public.knowledge(user_id, is_processed);
CREATE INDEX IF NOT EXISTS idx_knowledge_created_at ON public.knowledge(user_id, created_at DESC);

-- ============================================
-- 2. Trade-Knowledge Link Table
-- Many-to-many relationship
-- ============================================
CREATE TABLE IF NOT EXISTS public.trade_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
    knowledge_id UUID NOT NULL REFERENCES public.knowledge(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    
    -- Link metadata
    link_type TEXT DEFAULT 'manual' CHECK (link_type IN ('manual', 'suggested', 'auto')),
    relevance_score FLOAT,  -- For auto-suggestions
    
    -- Timestamps
    linked_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint
    UNIQUE (trade_id, knowledge_id)
);

-- Enable RLS
ALTER TABLE public.trade_knowledge ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own trade_knowledge"
    ON public.trade_knowledge FOR SELECT
    USING (user_id = auth.jwt() ->> 'email');

CREATE POLICY "Users can insert their own trade_knowledge"
    ON public.trade_knowledge FOR INSERT
    WITH CHECK (user_id = auth.jwt() ->> 'email');

CREATE POLICY "Users can delete their own trade_knowledge"
    ON public.trade_knowledge FOR DELETE
    USING (user_id = auth.jwt() ->> 'email');

-- Index for faster joins
CREATE INDEX IF NOT EXISTS idx_trade_knowledge_trade_id ON public.trade_knowledge(trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_knowledge_knowledge_id ON public.trade_knowledge(knowledge_id);
CREATE INDEX IF NOT EXISTS idx_trade_knowledge_user_id ON public.trade_knowledge(user_id);

-- ============================================
-- 3. Daily Reflection Table
-- For 30-second reflection data
-- ============================================
CREATE TABLE IF NOT EXISTS public.daily_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    
    -- Reflection answers
    biggest_mistake TEXT,  -- 'late_stoploss', 'chasing', 'overtrading', 'ignored_rule', 'none'
    tomorrow_focus TEXT,   -- 'no_chasing', 'follow_stoploss', 'check_calendar', 'less_trades', 'keep_going'
    note TEXT,             -- 任意のひとこと
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique per user per day
    UNIQUE (user_id, date)
);

-- Enable RLS
ALTER TABLE public.daily_reflections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own reflections"
    ON public.daily_reflections FOR SELECT
    USING (user_id = auth.jwt() ->> 'email');

CREATE POLICY "Users can insert their own reflections"
    ON public.daily_reflections FOR INSERT
    WITH CHECK (user_id = auth.jwt() ->> 'email');

CREATE POLICY "Users can update their own reflections"
    ON public.daily_reflections FOR UPDATE
    USING (user_id = auth.jwt() ->> 'email');

-- Index
CREATE INDEX IF NOT EXISTS idx_daily_reflections_user_date ON public.daily_reflections(user_id, date DESC);

-- ============================================
-- 4. Updated at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER knowledge_updated_at
    BEFORE UPDATE ON public.knowledge
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER daily_reflections_updated_at
    BEFORE UPDATE ON public.daily_reflections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
