-- ============================================================================
-- DTD P2 Phase 1: Analytics Integration - Database Migration
-- File: src/db/migrations/002_analytics_events.sql
-- Description: Analytics events table with performance indexes
-- ============================================================================

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('page_view', 'user_action', 'search', 'booking', 'emergency')),
  properties JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp_event_type ON analytics_events(timestamp DESC, event_type);

-- Comments for documentation
COMMENT ON TABLE analytics_events IS 'Analytics events for tracking user behavior, searches, bookings, and emergencies';
COMMENT ON COLUMN analytics_events.id IS 'Unique identifier for the event';
COMMENT ON COLUMN analytics_events.user_id IS 'User ID who triggered the event (nullable)';
COMMENT ON COLUMN analytics_events.session_id IS 'Session ID for tracking user sessions';
COMMENT ON COLUMN analytics_events.event_type IS 'Type of event (page_view, user_action, search, booking, emergency)';
COMMENT ON COLUMN analytics_events.properties IS 'Event properties as JSONB';
COMMENT ON COLUMN analytics_events.timestamp IS 'Event timestamp';
COMMENT ON COLUMN analytics_events.created_at IS 'Record creation timestamp';

COMMENT ON INDEX idx_analytics_events_timestamp IS 'Index for querying events by timestamp (descending)';
COMMENT ON INDEX idx_analytics_events_user_id IS 'Index for querying events by user ID';
COMMENT ON INDEX idx_analytics_events_session_id IS 'Index for querying events by session ID';
COMMENT ON INDEX idx_analytics_events_event_type IS 'Index for querying events by event type';
COMMENT ON INDEX idx_analytics_events_timestamp_event_type IS 'Composite index for querying events by timestamp and event type';

-- ============================================================================
-- COMMENTS
-- ============================================================================
-- 1. Analytics events table with proper schema
-- 2. Performance indexes on timestamp, user_id, session_id, event_type
-- 3. Composite index for common queries (timestamp + event_type)
-- 4. Foreign key reference to users table
-- 5. JSONB properties for flexible event data
-- 6. Based on DOCS/P2-architectural-plan.md Section 1.6
-- ============================================================================
