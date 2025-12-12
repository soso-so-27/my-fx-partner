-- Fix ALL trades and insights check constraints
-- Run this in Supabase SQL Editor

-- ============================================
-- FIX INSIGHTS TABLE
-- ============================================
ALTER TABLE insights DROP CONSTRAINT IF EXISTS insights_mode_check;
ALTER TABLE insights ADD CONSTRAINT insights_mode_check 
    CHECK (mode IN ('pre-trade', 'post-trade', 'review'));

-- ============================================
-- FIX TRADES TABLE - ALL CONSTRAINTS
-- ============================================

-- Drop all existing check constraints
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_direction_check;
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_session_check;

-- Add direction constraint (allow BUY, SELL, LONG, SHORT, or NULL)
ALTER TABLE trades ADD CONSTRAINT trades_direction_check 
    CHECK (direction IS NULL OR direction IN ('BUY', 'SELL', 'LONG', 'SHORT', 'buy', 'sell', 'long', 'short'));

-- Add session constraint (allow Tokyo, London, NewYork, Sydney - all case variations)
ALTER TABLE trades ADD CONSTRAINT trades_session_check 
    CHECK (session IS NULL OR session IN (
        'Tokyo', 'London', 'NewYork', 'Sydney',
        'tokyo', 'london', 'newyork', 'sydney',
        'TOKYO', 'LONDON', 'NEWYORK', 'SYDNEY'
    ));

-- Make direction column nullable for gallery entries
ALTER TABLE trades ALTER COLUMN direction DROP NOT NULL;
ALTER TABLE trades ALTER COLUMN session DROP NOT NULL;
