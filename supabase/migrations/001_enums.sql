-- ============================================================================
-- DTD Phase 1: Database Schema - Enum Types
-- File: 001_enums.sql
-- Description: All enum types for the Dog Trainers Directory
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enum: dog_age_group
-- Usage: businesses.age_specialties (array), search filters
-- ----------------------------------------------------------------------------
CREATE TYPE dog_age_group AS ENUM (
  'Puppy (0–6 months)',
  'Adolescent (6–18 months)',
  'Adult (1.5–7 years)',
  'Senior (7+ years)',
  'Any age'
);

-- ----------------------------------------------------------------------------
-- Enum: dog_behavior_issue
-- Usage: businesses.behavior_issues (array), search filters
-- ----------------------------------------------------------------------------
CREATE TYPE dog_behavior_issue AS ENUM (
  'Pulling on the lead',
  'Separation anxiety',
  'Excessive barking',
  'Dog aggression',
  'Leash reactivity',
  'Jumping up on people',
  'Destructive behaviour',
  'Recall issues',
  'Anxiety (general or fear-based)',
  'Resource guarding',
  'Mouthing, nipping, biting',
  'Rescue dog support',
  'Socialisation'
);

-- ----------------------------------------------------------------------------
-- Enum: dog_service_type
-- Usage: businesses.service_type_primary (single), service_type_secondary (array)
-- ----------------------------------------------------------------------------
CREATE TYPE dog_service_type AS ENUM (
  'Puppy training',
  'Obedience training',
  'Behaviour consultations',
  'Group classes',
  'Private training'
);

-- ----------------------------------------------------------------------------
-- Enum: dog_business_resource_type
-- Usage: businesses.resource_type (single-select)
-- ----------------------------------------------------------------------------
CREATE TYPE dog_business_resource_type AS ENUM (
  'trainer',
  'behaviour_consultant',
  'emergency_vet',
  'urgent_care',
  'emergency_shelter'
);

-- ----------------------------------------------------------------------------
-- Enum: review_moderation_status
-- Usage: reviews.moderation_status
-- ----------------------------------------------------------------------------
CREATE TYPE review_moderation_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

-- ----------------------------------------------------------------------------
-- Enum: featured_placement_status
-- Usage: featured_placements.status
-- ----------------------------------------------------------------------------
CREATE TYPE featured_placement_status AS ENUM (
  'queued',
  'active',
  'expired',
  'refunded',
  'cancelled'
);

-- ----------------------------------------------------------------------------
-- Enum: dog_triage_classification
-- Usage: triage_logs.classification
-- ----------------------------------------------------------------------------
CREATE TYPE dog_triage_classification AS ENUM (
  'medical',
  'crisis',
  'stray',
  'normal'
);

-- ============================================================================
-- Comments:
-- - All enums are locked (no free text) to prevent data drift
-- - Enables type-safe search filtering
-- - Related to D-004 (Taxonomy locked to 5 ages, 13 issues, 5 services)
-- ============================================================================
