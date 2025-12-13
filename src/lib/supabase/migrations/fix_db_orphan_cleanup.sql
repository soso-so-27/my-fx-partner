-- Orphan Data Cleanup and Schema Fix
-- Run this in Supabase SQL Editor

-- 1. Clean up "orphan" trades (trades referencing a user that doesn't exist in profiles)
-- This fixes the "violates foreign key constraint" error.
DELETE FROM trades
WHERE user_id NOT IN (SELECT id FROM profiles);

-- 2. Make 'notes' column optional (nullable)
ALTER TABLE trades ALTER COLUMN notes DROP NOT NULL;

-- 3. Update the foreign key to officially point to the 'profiles' table
-- First, drop the old constraint if it exists
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_user_id_fkey;

-- Then add the new correct constraint
ALTER TABLE trades
    ADD CONSTRAINT trades_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;
