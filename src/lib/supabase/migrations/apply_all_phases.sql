-- All Phases Migration Script
-- Run this in Supabase SQL Editor to apply all changes for Phase 1 & 2

-- Phase 1: PMF Analytics (User Events)
CREATE TABLE IF NOT EXISTS user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'login', 'weekly_review', 'rule_check', 'ai_chat', 'trade_log', 'ai_limit_reached'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_events_user ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_type ON user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_date ON user_events(created_at);

-- Phase 2: AI Usage Limits
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ DEFAULT NOW(),
  period_end TIMESTAMPTZ, -- monthly reset date
  count_high_quality INT DEFAULT 0,
  count_lightweight INT DEFAULT 0,
  tier TEXT DEFAULT 'free', -- 'free', 'pro'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage(user_id);
