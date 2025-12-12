-- Make notes column nullable in trades table
-- Run this in Supabase SQL Editor

ALTER TABLE trades ALTER COLUMN notes DROP NOT NULL;
