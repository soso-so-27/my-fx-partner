-- Add profile customization columns
-- Run this in Supabase SQL Editor

-- Add display_name column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Add bio column  
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add avatar_url column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add updated_at column if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Verify columns were added
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
