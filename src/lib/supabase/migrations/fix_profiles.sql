-- Fix profiles table for NextAuth integration
-- Run this in Supabase SQL Editor

-- ============================================
-- FIX PROFILES TABLE
-- ============================================

-- Add email column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Verify the profiles table has the required columns
-- If error occurs, this shows current structure:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';

-- ============================================
-- ALSO DROP FOREIGN KEY IF CAUSING ISSUES
-- ============================================
-- Temporarily drop and recreate foreign key to allow profile creation

-- First check if constraint exists and drop it
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_user_id_fkey;

-- Recreate with ON DELETE CASCADE option
-- Note: This assumes profiles.id is UUID type. Adjust if needed.
ALTER TABLE trades ADD CONSTRAINT trades_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
