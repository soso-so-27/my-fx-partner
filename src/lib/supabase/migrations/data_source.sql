-- Migration: Add data_source and was_modified columns to trades table
-- Purpose: Enable data isolation between Gmail sync, manual entry, and demo data

-- 1. Add data_source column
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual'
CHECK (data_source IN ('gmail_sync', 'manual', 'demo'));

-- 2. Add was_modified column (for tracking edits to Gmail-imported data)
ALTER TABLE trades 
ADD COLUMN IF NOT EXISTS was_modified BOOLEAN DEFAULT false;

-- 3. Migrate existing data based on current markers
-- Gmail imported data
UPDATE trades 
SET data_source = 'gmail_sync' 
WHERE verification_source = 'gmail_import' 
  AND data_source = 'manual';

-- Demo data (identified by MarketingSeed tag)
UPDATE trades 
SET data_source = 'demo' 
WHERE 'MarketingSeed' = ANY(tags) 
  AND data_source = 'manual';

-- 4. Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_trades_data_source ON trades(data_source);
CREATE INDEX IF NOT EXISTS idx_trades_user_data_source ON trades(user_id, data_source);

-- 5. Comment for documentation
COMMENT ON COLUMN trades.data_source IS 'Source of trade data: gmail_sync (broker email), manual (user input), demo (sample data)';
COMMENT ON COLUMN trades.was_modified IS 'Whether Gmail-imported data was manually edited';
