-- ============================================
-- PUSH SUBSCRIPTIONS TABLE
-- ============================================
-- Stores Web Push notification subscriptions

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    keys JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id 
    ON push_subscriptions(user_id);

-- Index for endpoint lookup
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint 
    ON push_subscriptions(endpoint);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own subscriptions"
    ON push_subscriptions
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Allow service role full access
CREATE POLICY "Service role can manage all subscriptions"
    ON push_subscriptions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
