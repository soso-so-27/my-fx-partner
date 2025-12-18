-- Migration: Create pending_verifications table
-- This table stores Gmail forwarding verification emails for easy access

CREATE TABLE IF NOT EXISTS pending_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL DEFAULT 'gmail_forwarding',
    confirmation_url TEXT NOT NULL,
    raw_email_subject TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    UNIQUE(user_id, verification_type)
);

-- Enable RLS
ALTER TABLE pending_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own pending verifications
CREATE POLICY "Users can view own pending verifications"
    ON pending_verifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pending verifications"
    ON pending_verifications FOR DELETE
    USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_verifications_user_id 
    ON pending_verifications(user_id);

-- Grant access to service role for API operations
GRANT ALL ON pending_verifications TO service_role;
