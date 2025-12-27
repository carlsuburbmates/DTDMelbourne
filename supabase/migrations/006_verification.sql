-- ============================================================================
-- DTD Phase 1: Database Schema - Data Integrity Verification
-- File: 006_verification.sql
-- Description: SQL scripts to verify all constraints and test queries
-- ============================================================================

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Verify Enum Types
-- ----------------------------------------------------------------------------
-- Check all enum types exist
SELECT 
  typname AS enum_name,
  enumlabel AS enum_values
FROM pg_type 
WHERE typtype = 'e'
  AND typname IN (
    'dog_age_group',
    'dog_behavior_issue',
    'dog_service_type',
    'dog_business_resource_type',
    'review_moderation_status',
    'featured_placement_status',
    'dog_triage_classification'
  )
ORDER BY typname;

-- ----------------------------------------------------------------------------
-- Verify Tables Exist
-- ----------------------------------------------------------------------------
SELECT 
  tablename AS table_name,
  schemaname AS schema_name
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'councils',
    'suburbs',
    'users',
    'businesses',
    'reviews',
    'featured_placements',
    'payment_audit',
    'emergency_contacts',
    'triage_logs',
    'cron_jobs'
  )
ORDER BY tablename;

-- ----------------------------------------------------------------------------
-- Verify Foreign Key Constraints
-- ----------------------------------------------------------------------------
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name AS fk_column,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, tc.constraint_name;

-- ----------------------------------------------------------------------------
-- Verify Check Constraints
-- ----------------------------------------------------------------------------
SELECT
  tc.table_name,
  tc.constraint_name,
  ccu.column_name AS column_name,
  cc.check_clause AS check_definition
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name, tc.constraint_name;

-- ----------------------------------------------------------------------------
-- Verify Indexes
-- ----------------------------------------------------------------------------
SELECT
  schemaname AS schema_name,
  tablename AS table_name,
  indexname AS index_name,
  indexdef AS index_definition
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'councils',
    'suburbs',
    'users',
    'businesses',
    'reviews',
    'featured_placements',
    'payment_audit',
    'emergency_contacts',
    'triage_logs',
    'cron_jobs'
  )
ORDER BY tablename, indexname;

-- ----------------------------------------------------------------------------
-- Verify RLS Policies
-- ----------------------------------------------------------------------------
SELECT
  schemaname AS schema_name,
  tablename AS table_name,
  policyname AS policy_name,
  permissive AS permissions,
  roles AS applicable_roles,
  cmd AS command_type,
  qual AS with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- DATA INTEGRITY TESTS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Test 1: Verify Council Count (should be 28)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  council_count INT;
BEGIN
  SELECT COUNT(*) INTO council_count FROM councils;
  
  IF council_count = 28 THEN
    RAISE NOTICE '✓ Council count verification PASSED: 28 councils found';
  ELSE
    RAISE NOTICE '✗ Council count verification FAILED: Expected 28, found %', council_count;
  END IF;
END $$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Test 2: Verify Suburb Count (should be 200+)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  suburb_count INT;
BEGIN
  SELECT COUNT(*) INTO suburb_count FROM suburbs;
  
  IF suburb_count >= 200 THEN
    RAISE NOTICE '✓ Suburb count verification PASSED: % suburbs found', suburb_count;
  ELSE
    RAISE NOTICE '✗ Suburb count verification FAILED: Expected 200+, found %', suburb_count;
  END IF;
END $$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Test 3: Verify All Councils Have Suburbs
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  council_without_suburbs RECORD;
BEGIN
  FOR council_without_suburbs IN 
    SELECT id, name FROM councils c
    WHERE NOT EXISTS (
      SELECT 1 FROM suburbs l WHERE l.council_id = c.id
    )
  LOOP
    RAISE NOTICE '✗ Council without suburbs: % (%)', council_without_suburbs.id, council_without_suburbs.name;
  END LOOP;
  
  RAISE NOTICE '✓ Council-suburb mapping verification completed';
END $$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Test 4: Verify Suburb-Council Mapping Integrity
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  invalid_mapping RECORD;
BEGIN
  FOR invalid_mapping IN 
    SELECT l.id, l.name, l.council_id, c.name AS council_name
    FROM suburbs l
    LEFT JOIN councils c ON l.council_id = c.id
    WHERE c.id IS NULL
  LOOP
    RAISE NOTICE '✗ Invalid suburb-council mapping: Suburb % (ID: %) has invalid council_id', 
      invalid_mapping.name, invalid_mapping.id;
  END LOOP;
  
  RAISE NOTICE '✓ Suburb-council mapping integrity verification completed';
END $$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Test 5: Verify Trainer Age Specialties Constraint
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  invalid_trainer RECORD;
BEGIN
  FOR invalid_trainer IN 
    SELECT b.id, b.name
    FROM businesses b
    WHERE b.resource_type IN ('trainer', 'behaviour_consultant')
      AND (b.age_specialties IS NULL OR array_length(b.age_specialties, 1) = 0)
  LOOP
    RAISE NOTICE '✗ Trainer without age specialties: % (ID: %)', invalid_trainer.name, invalid_trainer.id;
  END LOOP;
  
  RAISE NOTICE '✓ Trainer age specialties constraint verification completed';
END $$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Test 6: Verify Emergency Phone Constraint
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  invalid_emergency RECORD;
BEGIN
  FOR invalid_emergency IN 
    SELECT b.id, b.name
    FROM businesses b
    WHERE b.resource_type IN ('emergency_vet', 'urgent_care', 'emergency_shelter')
      AND (b.emergency_phone IS NULL OR b.emergency_phone = '')
  LOOP
    RAISE NOTICE '✗ Emergency resource without phone: % (ID: %)', invalid_emergency.name, invalid_emergency.id;
  END LOOP;
  
  RAISE NOTICE '✓ Emergency phone constraint verification completed';
END $$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Test 7: Verify ABN Format Constraint
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  invalid_abn RECORD;
BEGIN
  FOR invalid_abn IN 
    SELECT b.id, b.name, b.abr_abn
    FROM businesses b
    WHERE b.abr_abn IS NOT NULL 
      AND b.abr_abn !~ '^\d{11}$'
  LOOP
    RAISE NOTICE '✗ Invalid ABN format: % (ID: %) - ABN: %', 
      invalid_abn.name, invalid_abn.id, invalid_abn.abr_abn;
  END LOOP;
  
  RAISE NOTICE '✓ ABN format constraint verification completed';
END $$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Test 8: Verify Review Rating Constraint
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  invalid_rating RECORD;
BEGIN
  FOR invalid_rating IN 
    SELECT r.id, r.rating
    FROM reviews r
    WHERE r.rating < 1 OR r.rating > 5
  LOOP
    RAISE NOTICE '✗ Invalid review rating: Review ID % - Rating: %', invalid_rating.id, invalid_rating.rating;
  END LOOP;
  
  RAISE NOTICE '✓ Review rating constraint verification completed';
END $$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Test 9: Verify Review Moderation Date Consistency
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  inconsistent_review RECORD;
BEGIN
  FOR inconsistent_review IN 
    SELECT r.id, r.moderation_status, r.approved_at, r.rejected_at
    FROM reviews r
    WHERE (
      (r.moderation_status = 'rejected' AND r.rejected_at IS NULL)
      OR (r.moderation_status = 'approved' AND r.approved_at IS NULL)
    )
  LOOP
    RAISE NOTICE '✗ Inconsistent review moderation: Review ID % - Status: %', 
      inconsistent_review.id, inconsistent_review.moderation_status;
  END LOOP;
  
  RAISE NOTICE '✓ Review moderation date consistency verification completed';
END $$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Test 10: Verify Featured Placement Date Consistency
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  invalid_dates RECORD;
BEGIN
  FOR invalid_dates IN 
    SELECT fp.id, fp.starts_at, fp.ends_at
    FROM featured_placements fp
    WHERE fp.ends_at <= fp.starts_at
  LOOP
    RAISE NOTICE '✗ Invalid featured placement dates: ID % - Start: %, End: %', 
      invalid_dates.id, invalid_dates.starts_at, invalid_dates.ends_at;
  END LOOP;
  
  RAISE NOTICE '✓ Featured placement date consistency verification completed';
END $$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Test 13: Verify Emergency Contact Resource Type
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  invalid_emergency_type RECORD;
BEGIN
  FOR invalid_emergency_type IN 
    SELECT ec.id, ec.resource_type
    FROM emergency_contacts ec
    WHERE ec.resource_type NOT IN ('emergency_vet', 'urgent_care', 'emergency_shelter')
  LOOP
    RAISE NOTICE '✗ Invalid emergency contact type: ID % - Type: %', 
      invalid_emergency_type.id, invalid_emergency_type.resource_type;
  END LOOP;
  
  RAISE NOTICE '✓ Emergency contact resource type verification completed';
END $$ LANGUAGE plpgsql;

-- ============================================================================
-- SUMMARY REPORT
-- ============================================================================

-- Generate comprehensive verification summary
DO $$
DECLARE
  total_tables INT;
  total_indexes INT;
  total_policies INT;
  total_constraints INT;
BEGIN
  SELECT COUNT(*) INTO total_tables FROM pg_tables WHERE schemaname = 'public';
  SELECT COUNT(*) INTO total_indexes FROM pg_indexes WHERE schemaname = 'public';
  SELECT COUNT(*) INTO total_policies FROM pg_policies WHERE schemaname = 'public';
  SELECT COUNT(*) INTO total_constraints FROM information_schema.table_constraints WHERE table_schema = 'public';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DATABASE SCHEMA VERIFICATION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total Tables: %', total_tables;
  RAISE NOTICE 'Total Indexes: %', total_indexes;
  RAISE NOTICE 'Total RLS Policies: %', total_policies;
  RAISE NOTICE 'Total Constraints: %', total_constraints;
  RAISE NOTICE '========================================';
END $$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================
-- 1. All verification queries check schema integrity
-- 2. Data integrity tests enforce business rules
-- 3. Tests cover: enum types, tables, FKs, constraints, indexes, RLS policies
-- 4. Related to D-003 (28 councils, suburb auto-assignment)
-- 5. Related to D-004 (Taxonomy locked to enums)
-- 6. All tests use RAISE NOTICE for non-blocking verification
-- ============================================================================
