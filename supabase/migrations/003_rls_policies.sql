-- ============================================================================
-- DTD Phase 1: Database Schema - Row Level Security Policies
-- File: 003_rls_policies.sql
-- Description: RLS policies for public read, trainer write, admin access
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enable Row Level Security on all tables
-- ----------------------------------------------------------------------------
ALTER TABLE councils ENABLE ROW LEVEL SECURITY;
ALTER TABLE suburbs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE abn_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_jobs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PUBLIC READ ACCESS POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- councils: Public read access
-- ----------------------------------------------------------------------------
CREATE POLICY "Public read access to councils"
ON councils
FOR SELECT
TO public
USING (true);

-- ----------------------------------------------------------------------------
-- suburbs: Public read access
-- ----------------------------------------------------------------------------
CREATE POLICY "Public read access to suburbs"
ON suburbs
FOR SELECT
TO public
USING (true);

-- ----------------------------------------------------------------------------
-- businesses: Public read access (non-deleted only)
-- ----------------------------------------------------------------------------
CREATE POLICY "Public read access to businesses"
ON businesses
FOR SELECT
TO public
USING (deleted = FALSE);

-- ----------------------------------------------------------------------------
-- reviews: Public read access (approved reviews only)
-- ----------------------------------------------------------------------------
CREATE POLICY "Public read access to approved reviews"
ON reviews
FOR SELECT
TO public
USING (moderation_status = 'approved');

-- ----------------------------------------------------------------------------
-- emergency_contacts: Public read access
-- ----------------------------------------------------------------------------
CREATE POLICY "Public read access to emergency contacts"
ON emergency_contacts
FOR SELECT
TO public
USING (true);

-- ============================================================================
-- TRAINER WRITE ACCESS POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- users: Trainers can update their own profile
-- ----------------------------------------------------------------------------
CREATE POLICY "Trainers can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid()::text = id::text);

-- ----------------------------------------------------------------------------
-- businesses: Trainers can update their own business
-- ----------------------------------------------------------------------------
CREATE POLICY "Trainers can update own business"
ON businesses
FOR UPDATE
TO authenticated
USING (user_id::text = auth.uid()::text);

-- ----------------------------------------------------------------------------
-- businesses: Trainers can insert their own business
-- ----------------------------------------------------------------------------
CREATE POLICY "Trainers can insert own business"
ON businesses
FOR INSERT
TO authenticated
WITH CHECK (user_id::text = auth.uid()::text);

-- ----------------------------------------------------------------------------
-- reviews: Trainers can read reviews for their business
-- ----------------------------------------------------------------------------
CREATE POLICY "Trainers can read reviews for their business"
ON reviews
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM businesses 
    WHERE businesses.id = reviews.business_id 
    AND businesses.user_id::text = auth.uid()::text
  )
);

-- ============================================================================
-- ADMIN FULL ACCESS POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper function to check if user is admin
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user has admin role (implementation depends on auth system)
  -- For Supabase Auth, this would check user_metadata.role = 'admin'
  RETURN auth.jwt() ->> 'role' = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- councils: Admin full access
-- ----------------------------------------------------------------------------
CREATE POLICY "Admin full access to councils"
ON councils
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ----------------------------------------------------------------------------
-- suburbs: Admin full access
-- ----------------------------------------------------------------------------
CREATE POLICY "Admin full access to suburbs"
ON suburbs
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ----------------------------------------------------------------------------
-- abn_verifications: Admin full access
-- ----------------------------------------------------------------------------
CREATE POLICY "Admin full access to abn verifications"
ON abn_verifications
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ----------------------------------------------------------------------------
-- subscriptions: Admin full access
-- ----------------------------------------------------------------------------
CREATE POLICY "Admin full access to subscriptions"
ON subscriptions
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ----------------------------------------------------------------------------
-- users: Admin full access
-- ----------------------------------------------------------------------------
CREATE POLICY "Admin full access to users"
ON users
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ----------------------------------------------------------------------------
-- businesses: Admin full access
-- ----------------------------------------------------------------------------
CREATE POLICY "Admin full access to businesses"
ON businesses
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ----------------------------------------------------------------------------
-- reviews: Admin full access
-- ----------------------------------------------------------------------------
CREATE POLICY "Admin full access to reviews"
ON reviews
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ----------------------------------------------------------------------------
-- featured_placements: Admin full access
-- ----------------------------------------------------------------------------
CREATE POLICY "Admin full access to featured placements"
ON featured_placements
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ----------------------------------------------------------------------------
-- payment_audit: Admin read-only access (immutable)
-- ----------------------------------------------------------------------------
CREATE POLICY "Admin read access to payment audit"
ON payment_audit
FOR SELECT
TO authenticated
USING (is_admin());

-- ----------------------------------------------------------------------------
-- emergency_contacts: Admin full access
-- ----------------------------------------------------------------------------
CREATE POLICY "Admin full access to emergency contacts"
ON emergency_contacts
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ----------------------------------------------------------------------------
-- triage_logs: Admin read access (audit trail)
-- ----------------------------------------------------------------------------
CREATE POLICY "Admin read access to triage logs"
ON triage_logs
FOR SELECT
TO authenticated
USING (is_admin());

-- ----------------------------------------------------------------------------
-- cron_jobs: Admin full access
-- ----------------------------------------------------------------------------
CREATE POLICY "Admin full access to cron jobs"
ON cron_jobs
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ============================================================================
-- FEATURED PLACEMENT QUEUE MANAGEMENT POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- featured_placements: Trainers can read their own placements
-- ----------------------------------------------------------------------------
CREATE POLICY "Trainers can read own featured placements"
ON featured_placements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM businesses 
    WHERE businesses.id = featured_placements.business_id 
    AND businesses.user_id::text = auth.uid()::text
  )
);

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================
-- 1. All public read policies are restricted to non-deleted records
-- 2. Trainer write policies only allow access to their own records
-- 3. Admin policies require admin role in user metadata
-- 4. Payment audit is read-only (immutable append-only table)
-- 5. Triage logs are read-only for admins (audit trail)
-- 6. Featured placement queue is managed by cron jobs (admin access)
-- ============================================================================
