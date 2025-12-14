-- Pattern Alert Feature Vector Migration
-- Adds feature_vector column and pattern settings to patterns table

-- Add feature vector column (array of floats)
ALTER TABLE patterns ADD COLUMN IF NOT EXISTS feature_vector FLOAT8[];

-- Add similarity threshold (0-100)
ALTER TABLE patterns ADD COLUMN IF NOT EXISTS similarity_threshold INTEGER DEFAULT 70;

-- Add check frequency
ALTER TABLE patterns ADD COLUMN IF NOT EXISTS check_frequency VARCHAR(20) DEFAULT 'realtime';

-- Add last checked timestamp
ALTER TABLE patterns ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ;

-- Add matched image URL to alerts for storing the detected pattern image
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS matched_image_url TEXT;

-- Create index for faster lookup of active patterns
CREATE INDEX IF NOT EXISTS idx_patterns_active ON patterns(is_active) WHERE is_active = true;

-- Create index for patterns by user
CREATE INDEX IF NOT EXISTS idx_patterns_user_active ON patterns(user_id, is_active) WHERE is_active = true;

-- Update alerts table to include feedback
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS feedback VARCHAR(20);

COMMENT ON COLUMN patterns.feature_vector IS 'Normalized feature vector for pattern similarity matching';
COMMENT ON COLUMN patterns.similarity_threshold IS 'Minimum similarity percentage to trigger alert (0-100)';
COMMENT ON COLUMN patterns.check_frequency IS 'How often to check: realtime, hourly, daily';
COMMENT ON COLUMN patterns.last_checked_at IS 'Last time this pattern was checked for matches';
COMMENT ON COLUMN alerts.matched_image_url IS 'URL of the chart image that matched the pattern';
COMMENT ON COLUMN alerts.feedback IS 'User feedback: positive, negative, or null';
