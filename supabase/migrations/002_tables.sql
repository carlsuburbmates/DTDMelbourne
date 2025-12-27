-- ============================================================================
-- DTD Phase 1: Database Schema - Core Tables
-- File: 002_tables.sql
-- Description: All 10 core tables with foreign keys and constraints
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: councils
-- Purpose: Melbourne Metropolitan Councils (Reference Data)
-- ----------------------------------------------------------------------------
CREATE TABLE councils (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  region VARCHAR(50) NOT NULL,
  postcode_primary VARCHAR(10),
  postcode_range VARCHAR(50),
  shire BOOLEAN DEFAULT FALSE,
  population INT,
  characteristics TEXT,
  ux_label VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT council_valid_region CHECK (region IN ('Inner City', 'Northern', 'Eastern', 'South Eastern', 'Western'))
);

-- ----------------------------------------------------------------------------
-- Table: suburbs
-- Purpose: Melbourne Suburbs (Reference Data)
-- ----------------------------------------------------------------------------
CREATE TABLE suburbs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  council_id INT NOT NULL,
  region VARCHAR(50) NOT NULL,
  postcode VARCHAR(10),
  latitude DECIMAL(9, 6),
  longitude DECIMAL(9, 6),
  characteristics TEXT,
  ux_label VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (council_id) REFERENCES councils(id) ON DELETE RESTRICT,
  CONSTRAINT suburb_valid_region CHECK (region IN ('Inner City', 'Northern', 'Eastern', 'South Eastern', 'Western'))
);

-- ----------------------------------------------------------------------------
-- Table: users
-- Purpose: Trainer Accounts (Authentication)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT email_valid CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$')
);

-- ----------------------------------------------------------------------------
-- Table: businesses
-- Purpose: Trainer Listings (Core Table)
-- ----------------------------------------------------------------------------
CREATE TABLE businesses (
  id SERIAL PRIMARY KEY,
  user_id INT,
  name VARCHAR(255) NOT NULL,
  resource_type dog_business_resource_type NOT NULL,
  suburb_id INT NOT NULL,
  council_id INT NOT NULL,
  region VARCHAR(50) NOT NULL,
  
  -- Contact Information
  address VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  description TEXT,
  
  -- For Trainers/Consultants Only
  age_specialties dog_age_group[] DEFAULT '{}',
  behavior_issues dog_behavior_issue[] DEFAULT '{}',
  service_type_primary dog_service_type,
  service_type_secondary dog_service_type[] DEFAULT '{}',
  formats_offered TEXT[],
  pricing_notes TEXT,
  
  -- For Emergency Resources Only
  emergency_hours VARCHAR(100),
  emergency_phone VARCHAR(20),
  emergency_services TEXT[],
  capacity_notes TEXT,
  specialty_animals TEXT[],
  
  -- Verification & Status
  abn VARCHAR(11),
  abn_verified BOOLEAN DEFAULT FALSE,
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP,
  scaffolded BOOLEAN DEFAULT TRUE,
  data_source VARCHAR(50),
  
  -- Monetisation Tier
  tier business_tier NOT NULL DEFAULT 'basic',
  
  -- Soft Delete & Audit
  deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_scraped_at TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (suburb_id) REFERENCES suburbs(id) ON DELETE RESTRICT,
  FOREIGN KEY (council_id) REFERENCES councils(id) ON DELETE RESTRICT,
  
  CONSTRAINT business_valid_region CHECK (region IN ('Inner City', 'Northern', 'Eastern', 'South Eastern', 'Western')),
  
  CONSTRAINT business_type_specific CHECK (
    CASE 
      WHEN resource_type IN ('trainer', 'behaviour_consultant') 
        THEN (age_specialties IS NOT NULL AND array_length(age_specialties, 1) > 0)
      ELSE TRUE
    END
  ),
  
  CONSTRAINT business_emergency_check CHECK (
    CASE
      WHEN resource_type IN ('emergency_vet', 'urgent_care', 'emergency_shelter')
        THEN (emergency_phone IS NOT NULL AND emergency_hours IS NOT NULL)
      ELSE TRUE
    END
  ),
  
  CONSTRAINT abn_format CHECK (abn IS NULL OR abn ~ '^\d{11}$'),
  CONSTRAINT name_not_empty CHECK (name <> '')
);

-- ----------------------------------------------------------------------------
-- Table: abn_verifications
-- Purpose: ABN verification audit (optional, Active status = badge)
-- ----------------------------------------------------------------------------
CREATE TABLE abn_verifications (
  id SERIAL PRIMARY KEY,
  business_id INT NOT NULL,
  abn VARCHAR(11) NOT NULL,
  status VARCHAR(50) NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  matched_json JSONB,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  CONSTRAINT abn_verification_format CHECK (abn ~ '^\d{11}$')
);

-- ----------------------------------------------------------------------------
-- Table: subscriptions
-- Purpose: Pro (Gold Card) subscription status
-- ----------------------------------------------------------------------------
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  business_id INT NOT NULL,
  tier business_tier NOT NULL,
  status VARCHAR(50) NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- Table: reviews
-- Purpose: User Reviews (Social Proof)
-- ----------------------------------------------------------------------------
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  business_id INT NOT NULL,
  reviewer_name VARCHAR(100),
  rating INT NOT NULL,
  text TEXT,
  verified BOOLEAN DEFAULT FALSE,
  moderation_status review_moderation_status DEFAULT 'pending',
  moderation_reason TEXT,
  rejected_at TIMESTAMP,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  CONSTRAINT rating_valid CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT text_not_empty CHECK (text <> ''),
  CONSTRAINT moderation_dates CHECK (
    CASE 
      WHEN moderation_status = 'rejected' THEN rejected_at IS NOT NULL
      WHEN moderation_status = 'approved' THEN approved_at IS NOT NULL
      ELSE TRUE
    END
  )
);

-- ----------------------------------------------------------------------------
-- Table: featured_placements
-- Purpose: Monetisation Audit Log
-- ----------------------------------------------------------------------------
CREATE TABLE featured_placements (
  id SERIAL PRIMARY KEY,
  business_id INT NOT NULL,
  council_id INT NOT NULL,
  stripe_payment_id VARCHAR(255) NOT NULL UNIQUE,
  amount_cents INT NOT NULL,
  currency VARCHAR(3) DEFAULT 'AUD',
  
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL,
  
  status featured_placement_status NOT NULL DEFAULT 'queued',
  
  queue_position INT,
  queue_activated_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE RESTRICT,
  FOREIGN KEY (council_id) REFERENCES councils(id) ON DELETE RESTRICT,
  
  CONSTRAINT amount_positive CHECK (amount_cents > 0),
  CONSTRAINT dates_valid CHECK (ends_at > starts_at)
);

-- ----------------------------------------------------------------------------
-- Table: payment_audit
-- Purpose: Stripe Webhook Event Log
-- ----------------------------------------------------------------------------
CREATE TABLE payment_audit (
  id SERIAL PRIMARY KEY,
  stripe_event_id VARCHAR(255) NOT NULL UNIQUE,
  stripe_event_type VARCHAR(100) NOT NULL,
  business_id INT,
  council_id INT,
  
  payment_intent_id VARCHAR(255),
  charge_id VARCHAR(255),
  customer_id VARCHAR(255),
  
  amount_cents INT,
  currency VARCHAR(3) DEFAULT 'AUD',
  status VARCHAR(50),
  
  webhook_received_at TIMESTAMP NOT NULL,
  processed_at TIMESTAMP,
  processing_success BOOLEAN,
  processing_error TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL,
  FOREIGN KEY (council_id) REFERENCES councils(id) ON DELETE SET NULL,
  
  CONSTRAINT stripe_event_id_not_empty CHECK (stripe_event_id <> '')
);

-- ----------------------------------------------------------------------------
-- Table: emergency_contacts
-- Purpose: Cached Emergency Resources
-- ----------------------------------------------------------------------------
CREATE TABLE emergency_contacts (
  id SERIAL PRIMARY KEY,
  business_id INT NOT NULL,
  resource_type dog_business_resource_type NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  suburb_id INT,
  council_id INT,
  phone VARCHAR(20) NOT NULL,
  emergency_hours VARCHAR(100),
  
  availability_status VARCHAR(50) DEFAULT 'active',
  last_verified TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (suburb_id) REFERENCES suburbs(id) ON DELETE SET NULL,
  FOREIGN KEY (council_id) REFERENCES councils(id) ON DELETE SET NULL,
  
  CONSTRAINT resource_type_emergency CHECK (resource_type IN ('emergency_vet', 'urgent_care', 'emergency_shelter'))
);

-- ----------------------------------------------------------------------------
-- Table: triage_logs
-- Purpose: Emergency Triage Audit
-- ----------------------------------------------------------------------------
CREATE TABLE triage_logs (
  id SERIAL PRIMARY KEY,
  owner_message TEXT NOT NULL,
  
  -- Triage Classification
  classification dog_triage_classification NOT NULL,
  
  -- Recommended Actions
  recommended_actions TEXT[],
  
  -- User Follow-up
  action_taken VARCHAR(100),
  action_timestamp TIMESTAMP,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- Table: cron_jobs
-- Purpose: Scheduled Task Audit
-- ----------------------------------------------------------------------------
CREATE TABLE cron_jobs (
  id SERIAL PRIMARY KEY,
  job_name VARCHAR(100) NOT NULL,
  scheduled_run_time TIMESTAMP NOT NULL,
  actual_run_time TIMESTAMP,
  status VARCHAR(50),
  
  records_processed INT,
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- ============================================================================
-- Comments:
-- - All foreign key relationships use CASCADE rules as specified
-- - Soft delete implemented on businesses table (deleted, deleted_at)
-- - CHECK constraints enforce data integrity rules
-- - Related to D-003 (28 councils, suburb auto-assignment)
-- - Related to D-004 (Taxonomy locked to enums)
-- ============================================================================
