-- Final database fix
-- Run this in Supabase SQL Editor

-- 1. Check/Fix 'notes' column constraint
ALTER TABLE trades ALTER COLUMN notes DROP NOT NULL;

-- 2. Update foreign key to point to 'profiles' table instead of 'auth.users'
-- First, drop the valid existing constraint
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_user_id_fkey;

-- Then add the new constraint referencing profiles
ALTER TABLE trades
    ADD CONSTRAINT trades_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;

-- 3. Ensure profiles table has the necessary index (optional but good)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
