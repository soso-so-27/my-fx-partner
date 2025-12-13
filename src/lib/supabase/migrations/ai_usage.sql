-- Phase 2: AI Usage Limits
-- Run this in Supabase SQL Editor

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
