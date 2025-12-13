-- SOLO: Pattern Alert & Knowledge Clip Database Schema
-- Created: 2025-12-14
-- Purpose: Tables for Pattern Alert (chart pattern detection) and Knowledge Clip (content bookmarking) features

-- ============================================
-- 1. PATTERNS TABLE (Pattern Alert)
-- ============================================
-- Stores user's registered chart patterns for similarity detection

CREATE TABLE IF NOT EXISTS patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Pattern metadata
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,  -- Supabase storage URL
    
    -- Chart context
    currency_pair TEXT NOT NULL,  -- e.g., 'USDJPY', 'EURUSD'
    timeframe TEXT NOT NULL,       -- e.g., '5m', '15m', '1h', '4h'
    direction TEXT,                -- 'long', 'short', or null
    
    -- Pattern matching (for future ML integration)
    feature_vector BYTEA,          -- Stored as binary for now, can use pgvector later
    
    -- Organization
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_patterns_user_id ON patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_patterns_currency_pair ON patterns(currency_pair);

-- ============================================
-- 2. CLIPS TABLE (Knowledge Clip)
-- ============================================
-- Stores user's saved content (X posts, YouTube, blogs, etc.)

CREATE TABLE IF NOT EXISTS clips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Content information
    url TEXT NOT NULL,
    title TEXT,
    content_type TEXT NOT NULL,  -- 'x', 'youtube', 'blog', 'note', 'other'
    thumbnail_url TEXT,
    
    -- User additions
    memo TEXT,
    tags TEXT[] DEFAULT '{}',
    importance INTEGER DEFAULT 1 CHECK (importance >= 1 AND importance <= 5),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_clips_user_id ON clips(user_id);
CREATE INDEX IF NOT EXISTS idx_clips_content_type ON clips(content_type);

-- ============================================
-- 3. ALERTS TABLE (Pattern Alert Notifications)
-- ============================================
-- Stores pattern similarity alerts sent to users

CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    pattern_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
    
    -- Alert details
    similarity DECIMAL(5,4) NOT NULL,  -- 0.0000 to 0.9999
    chart_snapshot_url TEXT,           -- Screenshot of detected chart
    
    -- User interaction
    status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'acted', 'dismissed')),
    user_feedback TEXT CHECK (user_feedback IN ('thumbs_up', 'thumbs_down', null)),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    acted_at TIMESTAMPTZ
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_pattern_id ON alerts(pattern_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(user_id, created_at DESC);

-- ============================================
-- 4. PATTERN_CLIPS TABLE (Many-to-Many)
-- ============================================
-- Links patterns to related clips

CREATE TABLE IF NOT EXISTS pattern_clips (
    pattern_id UUID REFERENCES patterns(id) ON DELETE CASCADE,
    clip_id UUID REFERENCES clips(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (pattern_id, clip_id)
);

-- ============================================
-- 5. TRADE_CLIPS TABLE (Many-to-Many)
-- ============================================
-- Links trades to related clips (for future use)

CREATE TABLE IF NOT EXISTS trade_clips (
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    clip_id UUID REFERENCES clips(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (trade_id, clip_id)
);

-- ============================================
-- 6. ALTER EXISTING TRADES TABLE
-- ============================================
-- Add pattern relationship to trades

-- Check if column exists before adding
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trades' AND column_name = 'pattern_id'
    ) THEN
        ALTER TABLE trades ADD COLUMN pattern_id UUID REFERENCES patterns(id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'trades' AND column_name = 'from_alert'
    ) THEN
        ALTER TABLE trades ADD COLUMN from_alert BOOLEAN DEFAULT false;
    END IF;
END $$;

-- ============================================
-- 7. RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_clips ENABLE ROW LEVEL SECURITY;

-- Patterns: Users can only access their own patterns
CREATE POLICY patterns_select ON patterns FOR SELECT USING (user_id = auth.uid());
CREATE POLICY patterns_insert ON patterns FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY patterns_update ON patterns FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY patterns_delete ON patterns FOR DELETE USING (user_id = auth.uid());

-- Clips: Users can only access their own clips
CREATE POLICY clips_select ON clips FOR SELECT USING (user_id = auth.uid());
CREATE POLICY clips_insert ON clips FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY clips_update ON clips FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY clips_delete ON clips FOR DELETE USING (user_id = auth.uid());

-- Alerts: Users can only access their own alerts
CREATE POLICY alerts_select ON alerts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY alerts_insert ON alerts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY alerts_update ON alerts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY alerts_delete ON alerts FOR DELETE USING (user_id = auth.uid());

-- Pattern_clips: Users can only link their own patterns and clips
CREATE POLICY pattern_clips_select ON pattern_clips FOR SELECT 
    USING (EXISTS (SELECT 1 FROM patterns WHERE patterns.id = pattern_clips.pattern_id AND patterns.user_id = auth.uid()));
CREATE POLICY pattern_clips_insert ON pattern_clips FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM patterns WHERE patterns.id = pattern_clips.pattern_id AND patterns.user_id = auth.uid()));
CREATE POLICY pattern_clips_delete ON pattern_clips FOR DELETE 
    USING (EXISTS (SELECT 1 FROM patterns WHERE patterns.id = pattern_clips.pattern_id AND patterns.user_id = auth.uid()));

-- Trade_clips: Users can only link their own trades and clips
CREATE POLICY trade_clips_select ON trade_clips FOR SELECT 
    USING (EXISTS (SELECT 1 FROM trades WHERE trades.id = trade_clips.trade_id AND trades.user_id = auth.uid()));
CREATE POLICY trade_clips_insert ON trade_clips FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM trades WHERE trades.id = trade_clips.trade_id AND trades.user_id = auth.uid()));
CREATE POLICY trade_clips_delete ON trade_clips FOR DELETE 
    USING (EXISTS (SELECT 1 FROM trades WHERE trades.id = trade_clips.trade_id AND trades.user_id = auth.uid()));

-- ============================================
-- 8. UPDATED_AT TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patterns_updated_at BEFORE UPDATE ON patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clips_updated_at BEFORE UPDATE ON clips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
