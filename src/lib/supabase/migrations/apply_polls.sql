-- Poll Feature Migration
-- Run this in Supabase SQL Editor

-- 1. Poll definitions
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'direction', 'indicator', 'action'
  title TEXT NOT NULL,
  description TEXT,
  target TEXT, -- 'USDJPY', 'CPI', etc
  time_window TEXT, -- '1h', '4h', 'post_60m'
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  result_visibility TEXT DEFAULT 'after_close', -- 'after_vote', 'after_close'
  created_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'active', -- 'draft', 'active', 'closed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Poll Votes
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  choice TEXT NOT NULL, -- 'up', 'down', 'flat', etc
  confidence TEXT, -- 'low', 'mid', 'high'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- 3. Poll Results (Actual outcome)
CREATE TABLE IF NOT EXISTS poll_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  actual_result TEXT, -- 'up', 'down', etc
  start_value DECIMAL,
  end_value DECIMAL,
  determined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user ON poll_votes(user_id);
