-- Fix insights mode check constraint
-- Run this in Supabase SQL Editor

-- Drop existing constraint
ALTER TABLE insights DROP CONSTRAINT IF EXISTS insights_mode_check;

-- Add new constraint with all valid modes
ALTER TABLE insights ADD CONSTRAINT insights_mode_check 
    CHECK (mode IN ('pre-trade', 'post-trade', 'review'));

-- Fix trades direction check constraint
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_direction_check;

-- Add new constraint with valid directions (BUY, SELL, LONG, SHORT)
ALTER TABLE trades ADD CONSTRAINT trades_direction_check 
    CHECK (direction IN ('BUY', 'SELL', 'LONG', 'SHORT'));

-- Also ensure 'direction' column allows NULL for gallery entries
ALTER TABLE trades ALTER COLUMN direction DROP NOT NULL;
