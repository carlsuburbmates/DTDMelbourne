/**
 * Initial Schema Migration
 * 
 * Creates the base database schema for Dog Trainers Directory
 * Based on the existing schema defined in types/database.ts
 */

import { createMigration } from './migrate';

export const initialSchema = createMigration(
  '001_initial_schema',
  `
  -- Councils table
  CREATE TABLE IF NOT EXISTS councils (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    region VARCHAR(50) NOT NULL CHECK (region IN ('Inner City', 'Northern', 'Eastern', 'South Eastern', 'Western')),
    shire BOOLEAN DEFAULT FALSE,
    ux_label VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Suburbs table
  CREATE TABLE IF NOT EXISTS suburbs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    council_id UUID NOT NULL REFERENCES councils(id) ON DELETE CASCADE,
    region VARCHAR(50) NOT NULL CHECK (region IN ('Inner City', 'Northern', 'Eastern', 'South Eastern', 'Western')),
    postcode VARCHAR(4) NOT NULL CHECK (postcode ~ '^\\d{4}$'),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    ux_label VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Businesses (trainers) table
  CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('trainer', 'behaviour_consultant', 'emergency_vet', 'urgent_care', 'emergency_shelter')),
    suburb_id UUID NOT NULL REFERENCES suburbs(id) ON DELETE CASCADE,
    council_id UUID NOT NULL REFERENCES councils(id) ON DELETE CASCADE,
    region VARCHAR(50) NOT NULL CHECK (region IN ('Inner City', 'Northern', 'Eastern', 'South Eastern', 'Western')),
    address VARCHAR(255),
    phone VARCHAR(20) NOT NULL CHECK (phone ~ '^(\\+61|0)?[4]\\d{8}$'),
    email VARCHAR(255),
    website TEXT,
    description TEXT,
    age_specialties TEXT[] CHECK (array_length(age_specialties, 1) BETWEEN 1 AND 5),
    behavior_issues TEXT[] CHECK (array_length(behavior_issues, 1) BETWEEN 1 AND 10),
    service_type_primary VARCHAR(100),
    service_type_secondary TEXT[] CHECK (array_length(service_type_secondary, 1) <= 4),
    abn VARCHAR(11) CHECK (abn ~ '^\\d{11}$'),
    abn_verified BOOLEAN DEFAULT FALSE,
    emergency_phone VARCHAR(20),
    emergency_hours VARCHAR(200),
    emergency_services TEXT[] CHECK (array_length(emergency_services, 1) <= 5),
    claimed BOOLEAN DEFAULT FALSE,
    data_source VARCHAR(50) DEFAULT 'manual_form' CHECK (data_source IN ('manual_form', 'scraped', 'api_import', 'admin_entry')),
    tier VARCHAR(20) DEFAULT 'basic' CHECK (tier IN ('basic', 'pro')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Reviews table
  CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    moderation_status VARCHAR(20) DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Featured placements table
  CREATE TABLE IF NOT EXISTS featured_placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    council_id UUID NOT NULL REFERENCES councils(id) ON DELETE CASCADE,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'active', 'expired', 'cancelled')),
    queue_position INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- ABN verifications table
  CREATE TABLE IF NOT EXISTS abn_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    abn VARCHAR(11) NOT NULL CHECK (abn ~ '^\\d{11}$'),
    status VARCHAR(50) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    matched_json JSONB,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Subscriptions table
  CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('basic', 'pro')),
    status VARCHAR(50) NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Emergency triage logs table
  CREATE TABLE IF NOT EXISTS emergency_triage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_message TEXT NOT NULL,
    classification VARCHAR(20) NOT NULL CHECK (classification IN ('medical', 'crisis', 'stray', 'normal')),
    council_id UUID REFERENCES councils(id) ON DELETE SET NULL,
    suburb_id UUID REFERENCES suburbs(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL CHECK (phone ~ '^(\\+61|0)?[4]\\d{8}$'),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'trainer', 'user')),
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_method VARCHAR(10) CHECK (mfa_method IN ('totp', 'otp')),
    mfa_secret VARCHAR(255),
    backup_codes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Refresh tokens table
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Payment audit logs table
  CREATE TABLE IF NOT EXISTS payment_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_businesses_suburb ON businesses(suburb_id);
  CREATE INDEX IF NOT EXISTS idx_businesses_council ON businesses(council_id);
  CREATE INDEX IF NOT EXISTS idx_businesses_abn_verified ON businesses(abn_verified);
  CREATE INDEX IF NOT EXISTS idx_businesses_claimed ON businesses(claimed);
  CREATE INDEX IF NOT EXISTS idx_businesses_resource_type ON businesses(resource_type);
  CREATE INDEX IF NOT EXISTS idx_reviews_business ON reviews(business_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_moderation ON reviews(moderation_status);
  CREATE INDEX IF NOT EXISTS idx_featured_council ON featured_placements(council_id);
  CREATE INDEX IF NOT EXISTS idx_featured_status ON featured_placements(status);
  CREATE INDEX IF NOT EXISTS idx_featured_dates ON featured_placements(start_date, end_date);
  CREATE INDEX IF NOT EXISTS idx_triage_classification ON emergency_triage_logs(classification);
  CREATE INDEX IF NOT EXISTS idx_triage_created ON emergency_triage_logs(created_at);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);
  CREATE INDEX IF NOT EXISTS idx_payment_audit_event ON payment_audit_logs(stripe_event_id);

  -- Create updated_at trigger function
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Create updated_at triggers for tables with updated_at
  CREATE TRIGGER update_councils_updated_at BEFORE UPDATE ON councils
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_suburbs_updated_at BEFORE UPDATE ON suburbs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_featured_updated_at BEFORE UPDATE ON featured_placements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `,
  `
  -- Drop all tables in reverse order of creation
  DROP TRIGGER IF EXISTS update_users_updated_at ON users;
  DROP TRIGGER IF EXISTS update_featured_updated_at ON featured_placements;
  DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
  DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
  DROP TRIGGER IF EXISTS update_suburbs_updated_at ON suburbs;
  DROP TRIGGER IF EXISTS update_councils_updated_at ON councils;
  
  DROP FUNCTION IF EXISTS update_updated_at_column();
  
  DROP INDEX IF EXISTS idx_payment_audit_event;
  DROP INDEX IF EXISTS idx_refresh_tokens_expires;
  DROP INDEX IF EXISTS idx_refresh_tokens_user;
  DROP INDEX IF EXISTS idx_users_email;
  DROP INDEX IF EXISTS idx_triage_created;
  DROP INDEX IF EXISTS idx_triage_classification;
  DROP INDEX IF EXISTS idx_featured_dates;
  DROP INDEX IF EXISTS idx_featured_status;
  DROP INDEX IF EXISTS idx_featured_council;
  DROP INDEX IF EXISTS idx_reviews_moderation;
  DROP INDEX IF EXISTS idx_reviews_business;
  DROP INDEX IF EXISTS idx_businesses_resource_type;
  DROP INDEX IF EXISTS idx_businesses_claimed;
  DROP INDEX IF EXISTS idx_businesses_abn_verified;
  DROP INDEX IF EXISTS idx_businesses_council;
  DROP INDEX IF EXISTS idx_businesses_suburb;
  
  DROP TABLE IF EXISTS subscriptions;
  DROP TABLE IF EXISTS abn_verifications;
  DROP TABLE IF EXISTS payment_audit_logs;
  DROP TABLE IF EXISTS refresh_tokens;
  DROP TABLE IF EXISTS users;
  DROP TABLE IF EXISTS emergency_triage_logs;
  DROP TABLE IF EXISTS featured_placements;
  DROP TABLE IF EXISTS reviews;
  DROP TABLE IF EXISTS businesses;
  DROP TABLE IF EXISTS suburbs;
  DROP TABLE IF EXISTS councils;
  `
);
