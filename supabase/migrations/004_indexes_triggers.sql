-- ============================================================================
-- DTD Phase 1: Database Schema - Indexes and Triggers
-- File: 004_indexes_triggers.sql
-- Description: Performance indexes and triggers for featured placement queue
-- ============================================================================

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- councils indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_councils_region ON councils(region);
CREATE INDEX idx_councils_name ON councils(name);

-- ----------------------------------------------------------------------------
-- localities indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_localities_council_id ON localities(council_id);
CREATE INDEX idx_localities_name ON localities(name);
CREATE INDEX idx_localities_region ON localities(region);
CREATE INDEX idx_localities_postcode ON localities(postcode);

-- ----------------------------------------------------------------------------
-- users indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_email_verified ON users(email_verified);

-- ----------------------------------------------------------------------------
-- businesses indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_businesses_user_id ON businesses(user_id);
CREATE INDEX idx_businesses_council_id ON businesses(council_id);
CREATE INDEX idx_businesses_locality_id ON businesses(locality_id);
CREATE INDEX idx_businesses_resource_type ON businesses(resource_type);
CREATE INDEX idx_businesses_verified ON businesses(verified);
CREATE INDEX idx_businesses_claimed ON businesses(claimed);
CREATE INDEX idx_businesses_featured_until ON businesses(featured_until);
CREATE INDEX idx_businesses_deleted ON businesses(deleted);
CREATE INDEX idx_businesses_age_specialties ON businesses USING GIN (age_specialties);
CREATE INDEX idx_businesses_behavior_issues ON businesses USING GIN (behavior_issues);
CREATE INDEX idx_businesses_search ON businesses(name, council_id) WHERE deleted = FALSE;

-- ----------------------------------------------------------------------------
-- reviews indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_reviews_business_id ON reviews(business_id);
CREATE INDEX idx_reviews_moderation_status ON reviews(moderation_status);
CREATE INDEX idx_reviews_approved_at ON reviews(approved_at) WHERE moderation_status = 'approved';
CREATE INDEX idx_reviews_created_at ON reviews(created_at);

-- ----------------------------------------------------------------------------
-- featured_placements indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_featured_placements_business_id ON featured_placements(business_id);
CREATE INDEX idx_featured_placements_council_id ON featured_placements(council_id);
CREATE INDEX idx_featured_placements_status ON featured_placements(status);
CREATE INDEX idx_featured_placements_stripe_payment_id ON featured_placements(stripe_payment_id);
CREATE INDEX idx_featured_placements_end_date ON featured_placements(end_date) WHERE status = 'active';
CREATE INDEX idx_featured_placements_queue ON featured_placements(council_id, queue_position) 
  WHERE status IN ('active', 'queued');

-- ----------------------------------------------------------------------------
-- payment_audit indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_payment_audit_stripe_event_id ON payment_audit(stripe_event_id);
CREATE INDEX idx_payment_audit_business_id ON payment_audit(business_id);
CREATE INDEX idx_payment_audit_status ON payment_audit(status);
CREATE INDEX idx_payment_audit_webhook_received_at ON payment_audit(webhook_received_at);

-- ----------------------------------------------------------------------------
-- emergency_contacts indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_emergency_contacts_resource_type ON emergency_contacts(resource_type);
CREATE INDEX idx_emergency_contacts_council_id ON emergency_contacts(council_id);
CREATE INDEX idx_emergency_contacts_availability ON emergency_contacts(availability_status);

-- ----------------------------------------------------------------------------
-- triage_logs indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_triage_logs_classification ON triage_logs(classification);
CREATE INDEX idx_triage_logs_created_at ON triage_logs(created_at);
CREATE INDEX idx_triage_logs_ai_model ON triage_logs(ai_model_used);

-- ----------------------------------------------------------------------------
-- cron_jobs indexes
-- ----------------------------------------------------------------------------
CREATE INDEX idx_cron_jobs_job_name ON cron_jobs(job_name);
CREATE INDEX idx_cron_jobs_scheduled_run_time ON cron_jobs(scheduled_run_time);
CREATE INDEX idx_cron_jobs_status ON cron_jobs(status);

-- ============================================================================
-- TRIGGER FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: update_timestamp()
-- Purpose: Auto-update updated_at timestamp on UPDATE
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Function: set_deleted_at_timestamp()
-- Purpose: Auto-set deleted_at when soft-deleting
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_deleted_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.deleted_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Function: manage_featured_placement_queue()
-- Purpose: Auto-assign queue positions and promote from queue
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION manage_featured_placement_queue()
RETURNS TRIGGER AS $$
DECLARE
  active_count INT;
  max_queue_position INT;
BEGIN
  -- If this is a new featured placement
  IF TG_OP = 'INSERT' THEN
    -- Count active placements for this council
    SELECT COUNT(*) INTO active_count
    FROM featured_placements
    WHERE council_id = NEW.council_id 
      AND status = 'active';
    
    -- If less than 5 active, make this one active immediately
    IF active_count < 5 THEN
      NEW.status = 'active';
      NEW.queue_position = NULL;
      NEW.queue_activated_at = CURRENT_TIMESTAMP;
    ELSE
      -- Otherwise, add to queue
      NEW.status = 'queued';
      SELECT COALESCE(MAX(queue_position), 0) + 1 INTO max_queue_position
      FROM featured_placements
      WHERE council_id = NEW.council_id 
        AND status = 'queued';
      NEW.queue_position = max_queue_position;
      NEW.queue_activated_at = NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Function: promote_featured_from_queue()
-- Purpose: Promote queued placements when slots become available
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION promote_featured_from_queue()
RETURNS VOID AS $$
DECLARE
  council_record RECORD;
  active_count INT;
  queued_record RECORD;
BEGIN
  -- Iterate through all councils
  FOR council_record IN SELECT id FROM councils LOOP
    -- Count active placements for this council
    SELECT COUNT(*) INTO active_count
    FROM featured_placements
    WHERE council_id = council_record.id 
      AND status = 'active';
    
    -- If less than 5 active, promote from queue
    IF active_count < 5 THEN
      -- Get the first queued placement
      SELECT * INTO queued_record
      FROM featured_placements
      WHERE council_id = council_record.id 
        AND status = 'queued'
      ORDER BY queue_position ASC
      LIMIT 1;
      
      -- If a queued placement exists, promote it
      IF FOUND THEN
        UPDATE featured_placements
        SET status = 'active',
            queue_position = NULL,
            queue_activated_at = CURRENT_TIMESTAMP
        WHERE id = queued_record.id;
        
        -- Reorder remaining queue positions
        UPDATE featured_placements
        SET queue_position = queue_position - 1
        WHERE council_id = council_record.id 
          AND status = 'queued'
          AND queue_position > queued_record.queue_position;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Trigger: update_businesses_updated_at
-- Purpose: Auto-update updated_at on businesses
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_businesses_updated_at
BEFORE UPDATE ON businesses
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ----------------------------------------------------------------------------
-- Trigger: update_users_updated_at
-- Purpose: Auto-update updated_at on users
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ----------------------------------------------------------------------------
-- Trigger: update_reviews_updated_at
-- Purpose: Auto-update updated_at on reviews
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ----------------------------------------------------------------------------
-- Trigger: update_featured_placements_updated_at
-- Purpose: Auto-update updated_at on featured_placements
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_featured_placements_updated_at
BEFORE UPDATE ON featured_placements
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ----------------------------------------------------------------------------
-- Trigger: update_emergency_contacts_updated_at
-- Purpose: Auto-update updated_at on emergency_contacts
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_emergency_contacts_updated_at
BEFORE UPDATE ON emergency_contacts
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- ----------------------------------------------------------------------------
-- Trigger: set_businesses_deleted_at
-- Purpose: Auto-set deleted_at when soft-deleting
-- ----------------------------------------------------------------------------
CREATE TRIGGER set_businesses_deleted_at
BEFORE UPDATE ON businesses
FOR EACH ROW
WHEN (NEW.deleted = TRUE AND OLD.deleted = FALSE)
EXECUTE FUNCTION set_deleted_at_timestamp();

-- ----------------------------------------------------------------------------
-- Trigger: manage_featured_placement_queue
-- Purpose: Auto-assign queue positions on INSERT
-- ----------------------------------------------------------------------------
CREATE TRIGGER manage_featured_placement_queue
BEFORE INSERT ON featured_placements
FOR EACH ROW
EXECUTE FUNCTION manage_featured_placement_queue();

-- ============================================================================
-- COMMENTS
-- ============================================================================
-- 1. All indexes are optimized for high-traffic queries
-- 2. GIN indexes on array columns (age_specialties, behavior_issues)
-- 3. Partial indexes on frequently filtered columns (deleted, status)
-- 4. Featured placement queue managed by trigger (max 5 per council)
-- 5. Auto-update triggers on all tables with updated_at
-- 6. Soft delete trigger sets deleted_at timestamp
-- ============================================================================
