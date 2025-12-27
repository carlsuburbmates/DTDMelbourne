-- ============================================================================
-- DTD P2 Phase 3: Advanced Search - Saved Searches Migration
-- File: src/db/migrations/003_saved_searches.sql
-- Description: Create saved_searches table with indexes
-- ============================================================================

-- Saved searches table
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  filters JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_timestamp ON saved_searches(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_timestamp ON saved_searches(user_id, timestamp DESC);

-- Add comments
COMMENT ON TABLE saved_searches IS 'Stores user-saved search filters for quick access';
COMMENT ON COLUMN saved_searches.id IS 'Unique identifier for the saved search';
COMMENT ON COLUMN saved_searches.user_id IS 'Reference to the user who saved the search';
COMMENT ON COLUMN saved_searches.name IS 'User-provided name for the saved search';
COMMENT ON COLUMN saved_searches.filters IS 'JSONB object containing search filters';
COMMENT ON COLUMN saved_searches.timestamp IS 'When the search was saved';
COMMENT ON COLUMN saved_searches.created_at IS 'Record creation timestamp';
