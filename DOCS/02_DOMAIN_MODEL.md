# 02_DOMAIN_MODEL.md – Complete Data Model Specification

**Dog Trainers Directory (DTD) — Domain Model & Schema**

**Last Updated:** 2025-12-25  
**Status:** Complete specification, production-ready  
**Audience:** Architects, database engineers, backend developers, QA

---

## Table of Contents

1. [Overview & Design Philosophy](#overview--design-philosophy)
2. [Core Entities & CREATE TABLE Statements](#core-entities--create-table-statements)
3. [Complete Enum Definitions](#complete-enum-definitions)
4. [Geography: 28 Melbourne Councils & 200+ Suburbs](#geography-28-melbourne-councils--200-suburbs)
5. [Relationships & Foreign Keys](#relationships--foreign-keys)
6. [Data Integrity Rules (Invariants)](#data-integrity-rules-invariants)
7. [Performance Considerations](#performance-considerations)
8. [Migration & Seed Strategy](#migration--seed-strategy)

---

## Overview & Design Philosophy

### Core Principles

**1. Enum-Driven Taxonomy**
- All categories (age, behavior, service type) are **locked enums**, never free text
- Prevents data drift, enables type-safe search filtering
- Related decision: **D-004** (Taxonomy locked to 5 ages, 13 issues, 5 services)

**2. Geography as Derived Data**
- Suburb is user-facing input; Council and Region auto-derived
- One suburb → exactly one council (deterministic)
- Enables suburb-first UX ("search Fitzroy") without exposing LGA/Region terminology
- Related decision: **D-003** (28 councils, suburb auto-assignment)

**3. Soft Delete + Audit Trail**
- All business records soft-deleted (never hard-deleted)
- Enables recovery, audit compliance, historical analysis
- Payment data (Stripe) is source of truth (immutable)

**4. Verification Orthogonal to Listing**
- ABN verification is **metadata** (boolean flag), not a separate entity
- Verification status auto-computed from ABN check result
- Decouples trainer registration from verification workflow

**5. Featured Placement as Time-Based State**
- Featured status is a **timestamp** (`featured_until`), not an enum
- Enables deterministic queue promotion (cron job at 2am daily)
- Payment → webhook → featured_until updated → search ranking changes

---

## Core Entities & CREATE TABLE Statements

### 1. `councils` – Melbourne Metropolitan Councils (Reference Data)

**Purpose:** Lookup table for council metadata. Immutable, populated once at launch.

```sql
CREATE TABLE councils (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,           -- e.g., "City of Yarra"
  region VARCHAR(50) NOT NULL,                 -- e.g., "Inner City", "Northern", "Eastern"
  postcode_primary VARCHAR(10),                -- e.g., "3065" (CBD postcode if applicable)
  postcode_range VARCHAR(50),                  -- e.g., "3065-3068" (rough range, informational)
  shire BOOLEAN DEFAULT FALSE,                 -- TRUE if Shire, FALSE if City
  population INT,                              -- Informational (2024 ABS estimate)
  characteristics TEXT,                        -- e.g., "Cultural heritage, creative precinct"
  ux_label VARCHAR(100),                       -- e.g., "Inner North Creative"
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT council_valid_region CHECK (region IN ('Inner City', 'Northern', 'Eastern', 'South Eastern', 'Western'))
);

CREATE INDEX idx_councils_region ON councils(region);
CREATE INDEX idx_councils_name ON councils(name);
```

**Notes:**
- `id` is immutable primary key (used in all FKs)
- `region` must be one of 5 predefined values (related to D-003)
- `shire` boolean distinguishes "Shire of X" from "City of X" (for UI labeling)
- `ux_label` drives UI grouping ("Brighton Bayside", "Hawthorn Eastern Prestige")

**28 Councils (Full List):**

| Region | Council | Shire | Example UX Label |
|--------|---------|-------|-----------------|
| Inner City | City of Melbourne | False | Melbourne CBD |
| Inner City | City of Port Phillip | False | St Kilda Beachside |
| Inner City | City of Yarra | False | Inner North Creative |
| Northern | City of Banyule | False | Heidelberg Foothills |
| Northern | City of Darebin | False | Preston Inner North |
| Northern | City of Hume | False | Broadmeadows Outer North |
| Northern | City of Merri-bek | False | Brunswick Inner West |
| Northern | City of Whittlesea | False | Epping Growth Corridor |
| Northern | Shire of Nillumbik | True | Eltham Dandenong Hills |
| Eastern | City of Boroondara | False | Hawthorn Eastern Prestige |
| Eastern | City of Knox | False | Boronia Mountain Suburbs |
| Eastern | City of Manningham | False | Doncaster Eastern Leafy |
| Eastern | City of Maroondah | False | Ringwood Eastern Corridor |
| Eastern | City of Whitehorse | False | Box Hill Eastern Residential |
| Eastern | Shire of Yarra Ranges | True | Lilydale Dandenong Ranges |
| South Eastern | City of Bayside | False | Brighton Bayside |
| South Eastern | City of Glen Eira | False | Caulfield Southeastern |
| South Eastern | City of Kingston | False | Mentone Bayside |
| South Eastern | City of Casey | False | Narre Warren Outer South |
| South Eastern | City of Frankston | False | Frankston Peninsula |
| South Eastern | Shire of Cardinia | True | Pakenham Outer Southeast |
| South Eastern | Mornington Peninsula Shire | True | Mornington Peninsula |
| Western | City of Brimbank | False | Sunshine Western Industrial |
| Western | City of Hobsons Bay | False | Williamstown Western Coastal |
| Western | City of Maribyrnong | False | Footscray Inner West |
| Western | City of Melton | False | Melton Western Growth |
| Western | City of Moonee Valley | False | Essendon Northern West |
| Western | City of Wyndham | False | Werribee Southwest Growth |

---

### 2. `localities` – Melbourne Suburbs (Reference Data)

**Purpose:** Suburb lookup, populated from `suburbs_councils_mapping.csv`. Maps each suburb to exactly one council.

```sql
CREATE TABLE localities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,           -- e.g., "Fitzroy"
  council_id INT NOT NULL,                     -- FK to councils.id
  region VARCHAR(50) NOT NULL,                 -- Denormalized from council (for faster access)
  postcode VARCHAR(10),                        -- e.g., "3065"
  latitude DECIMAL(9, 6),                      -- e.g., -37.8010382
  longitude DECIMAL(9, 6),                     -- e.g., 144.9792611
  characteristics TEXT,                        -- e.g., "Cultural heritage, creative precinct"
  ux_label VARCHAR(100),                       -- e.g., "Inner North Creative"
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (council_id) REFERENCES councils(id) ON DELETE RESTRICT,
  CONSTRAINT locality_valid_region CHECK (region IN ('Inner City', 'Northern', 'Eastern', 'South Eastern', 'Western'))
);

CREATE INDEX idx_localities_council_id ON localities(council_id);
CREATE INDEX idx_localities_name ON localities(name);
CREATE INDEX idx_localities_region ON localities(region);
CREATE INDEX idx_localities_postcode ON localities(postcode);
```

**Notes:**
- 200+ suburbs (one per row)
- `council_id` FK enforces referential integrity
- `region` denormalized for faster filtering (avoid JOIN on every search)
- Lat/Long used for distance calculations (but coarse, suburb centroid)

**Sample Data (20 suburbs shown):**

```sql
INSERT INTO localities (name, council_id, region, postcode, latitude, longitude, characteristics, ux_label) VALUES
('Carlton', 1, 'Inner City', '3053', -37.8004228, 144.9684343, 'CBD, cultural institutions', 'Melbourne CBD'),
('Fitzroy', 3, 'Inner City', '3065', -37.8010382, 144.9792611, 'Cultural heritage, creative', 'Inner North Creative'),
('Richmond', 3, 'Inner City', '3121', -37.8074500, 144.9907213, 'Cultural heritage, creative', 'Inner North Creative'),
('Heidelberg', 4, 'Northern', '3084', -37.7524788, 145.0701284, 'Foothills, residential', 'Heidelberg Foothills'),
('Preston', 5, 'Northern', '3072', -37.7418658, 145.0078205, 'Inner north, diverse', 'Preston Inner North'),
('Camberwell', 10, 'Eastern', '3124', -37.8384623, 145.0740767, 'Prestigious, affluent', 'Hawthorn Eastern Prestige'),
('Ringwood', 13, 'Eastern', '3134', -37.8158726, 145.2291113, 'Eastern corridor', 'Ringwood Eastern Corridor'),
('Brighton', 16, 'South Eastern', '3186', -37.9081962, 144.9957991, 'Bayside, affluent', 'Brighton Bayside'),
('Frankston', 20, 'South Eastern', '3199', -38.1457064, 145.1263742, 'Southern peninsula', 'Frankston Peninsula'),
('Sunshine', 23, 'Western', '3020', -37.7887617, 144.8331303, 'Western industrial', 'Sunshine Western Industrial'),
('Williamstown', 24, 'Western', '3016', -37.8611788, 144.8898569, 'Western coastal', 'Williamstown Western Coastal'),
('Footscray', 25, 'Western', '3011', -37.7981339, 144.8973450, 'Inner west, cultural', 'Footscray Inner West'),
('Werribee', 28, 'Western', '3030', -37.9079840, 144.6416748, 'Southwest growth', 'Werribee Southwest Growth'),
-- ... (remaining 187 suburbs from suburbs_councils_mapping.csv)
```

---

### 3. `users` – Trainer Accounts (Authentication)

**Purpose:** Human accounts that claim and manage businesses. Not the same as dog owners (who are anonymous).

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,          -- e.g., "alice@looseleadtraining.com"
  password_hash VARCHAR(255),                  -- Nullable (not used in MVP, replaced by OTP)
  email_verified BOOLEAN DEFAULT FALSE,        -- Set by email OTP confirmation
  email_verified_at TIMESTAMP,                 -- When email was verified
  last_login TIMESTAMP,                        -- Informational, for UI "last active"
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT email_valid CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_email_verified ON users(email_verified);
```

**Notes:**
- `password_hash` nullable: MVP uses email OTP (no passwords)
- `email_verified` ensures two-factor gate (OTP before claiming business)
- `last_login` for UI display, not for security SLA
- Email regex validates format (basic RFC compliance)

---

### 4. `businesses` – Trainer Listings (Core Table)

**Purpose:** Represents a dog trainer, behavior consultant, emergency vet, or animal shelter.

```sql
CREATE TABLE businesses (
  id SERIAL PRIMARY KEY,
  user_id INT,                                 -- FK to users.id (nullable = unclaimed listing)
  name VARCHAR(255) NOT NULL,                  -- e.g., "Loose Lead Training"
  resource_type dog_business_resource_type NOT NULL,  -- See enums below
  locality_id INT NOT NULL,                    -- FK to localities.id (suburb)
  council_id INT NOT NULL,                     -- FK to councils.id (denormalized from locality)
  
  -- Contact Information
  phone VARCHAR(20),                           -- e.g., "+61 3 9876 5432"
  email VARCHAR(255),                          -- e.g., "alice@looseleadtraining.com"
  website VARCHAR(255),                        -- e.g., "https://looseleadtraining.com.au"
  description TEXT,                            -- Bio/about section (max 500 chars advised)
  
  -- For Trainers/Consultants Only
  age_specialties dog_age_group[] DEFAULT '{}', -- e.g., '{"Puppy", "Adolescent"}'
  behavior_issues dog_behavior_issue[] DEFAULT '{}', -- e.g., '{"Pulling on the lead", "Separation anxiety"}'
  service_type_primary dog_service_type,      -- REQUIRED for trainers
  service_type_secondary dog_service_type[] DEFAULT '{}', -- Optional
  formats_offered TEXT[],                      -- e.g., '{"In-home", "Training centre"}'
  pricing_notes TEXT,                          -- e.g., "First consultation $50, then $80/hour"
  
  -- For Emergency Resources Only
  emergency_hours VARCHAR(100),                -- e.g., "24/7" or "6pm–midnight"
  emergency_phone VARCHAR(20),                 -- Distinct from regular phone
  emergency_services TEXT[],                   -- e.g., '{"Emergency surgery", "Poison control"}'
  capacity_notes TEXT,                         -- e.g., "50–100 dogs/night"
  specialty_animals TEXT[],                    -- e.g., '{"Dogs", "Cats"}'
  
  -- Verification & Status
  abr_abn VARCHAR(11),                         -- ABN (11 digits) for verification
  verified BOOLEAN DEFAULT FALSE,              -- Set by admin after ABN check (Phase 2+)
  verified_at TIMESTAMP,                       -- When verification occurred
  claimed BOOLEAN DEFAULT FALSE,               -- Whether user has claimed this listing
  claimed_at TIMESTAMP,                        -- When user claimed
  scaffolded BOOLEAN DEFAULT TRUE,             -- TRUE = auto-created from scraping/manual form
  data_source VARCHAR(50),                     -- e.g., "web_scrape", "manual_form", "admin_added"
  
  -- Featured Placement (Monetisation)
  featured_until TIMESTAMP,                    -- NULL = not featured; datetime = featured until this time
  featured_tier VARCHAR(20),                   -- e.g., "basic", "pro" (Phase 5+)
  
  -- Soft Delete & Audit
  deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_scraped_at TIMESTAMP,                   -- When web scraper last updated this record
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (locality_id) REFERENCES localities(id) ON DELETE RESTRICT,
  FOREIGN KEY (council_id) REFERENCES councils(id) ON DELETE RESTRICT,
  
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
  
  CONSTRAINT abr_abn_format CHECK (abr_abn IS NULL OR abr_abn ~ '^\d{11}$'),
  CONSTRAINT name_not_empty CHECK (name <> '')
);

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
```

**Notes:**

- **`user_id`** nullable: Unclaimed listings exist (from scraping or admin seed)
- **`age_specialties`** array: Enforced NOT EMPTY for trainers (CHECK constraint)
- **`council_id`** denormalized: Avoids JOIN on every search, updated via trigger
- **`featured_until`** TIMESTAMP: Cron job checks `featured_until > NOW()` at 2am
- **`verified`** boolean: Auto-set by admin or Phase 2 ABN automation
- **`abr_abn`** regex: Validates 11-digit format (doesn't validate checksum, admin does that)
- **`deleted`** soft-delete: Record remains for audit/recovery

**Validation Examples:**

```sql
-- Valid trainer registration:
INSERT INTO businesses (name, resource_type, locality_id, council_id, age_specialties, service_type_primary)
VALUES ('Loose Lead Training', 'trainer', 13, 3, '{"Puppy", "Adolescent"}', 'Obedience training');

-- Invalid: Trainer without age specialties
INSERT INTO businesses (name, resource_type, locality_id, council_id, service_type_primary)
VALUES ('Trainer X', 'trainer', 13, 3, 'Obedience training');  -- ERROR: age_specialties empty

-- Valid emergency vet:
INSERT INTO businesses (name, resource_type, locality_id, council_id, emergency_phone, emergency_hours)
VALUES ('MASH Ringwood', 'emergency_vet', 13, 13, '+61 3 9876 5600', '24/7');

-- Invalid: Emergency resource without emergency_phone
INSERT INTO businesses (name, resource_type, locality_id, council_id, emergency_hours)
VALUES ('Vet X', 'emergency_vet', 13, 13, '24/7');  -- ERROR: emergency_phone required
```

---

### 5. `reviews` – User Reviews (Social Proof)

**Purpose:** Dog owner feedback on trainer listings. Moderated, approved/rejected by AI or admin.

```sql
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  business_id INT NOT NULL,                    -- FK to businesses.id
  reviewer_name VARCHAR(100),                  -- Optional: e.g., "John D." (privacy)
  rating INT NOT NULL,                         -- 1–5 stars
  text TEXT,                                   -- Review content (max 500 chars advised)
  verified BOOLEAN DEFAULT FALSE,              -- Admin-set: "This reviewer actually used this trainer"
  moderation_status review_moderation_status DEFAULT 'pending', -- pending, approved, rejected
  moderation_reason TEXT,                      -- Why rejected (if applicable)
  rejected_at TIMESTAMP,                       -- When rejection occurred
  approved_at TIMESTAMP,                       -- When approval occurred
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
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

CREATE INDEX idx_reviews_business_id ON reviews(business_id);
CREATE INDEX idx_reviews_moderation_status ON reviews(moderation_status);
CREATE INDEX idx_reviews_approved_at ON reviews(approved_at) WHERE moderation_status = 'approved';
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
```

**Notes:**

- **`moderation_status`** enum: pending (awaiting AI/admin review), approved (visible), rejected (spam)
- **`verified`** boolean: Admin sets if they confirm reviewer actually used trainer
- **`rejected_at`/`approved_at`**: Timestamps track moderation decision time
- **Constraint**: If rejected, must have rejected_at; if approved, must have approved_at
- **Cascade delete**: If business deleted, reviews deleted (acceptable for soft-delete lifecycle)

---

### 6. `featured_placements` – Monetisation Audit Log

**Purpose:** Track all featured placement purchases, refunds, and queue state. Immutable.

```sql
CREATE TABLE featured_placements (
  id SERIAL PRIMARY KEY,
  business_id INT NOT NULL,                    -- FK to businesses.id
  council_id INT NOT NULL,                     -- FK to councils.id (denormalized, for queue scoping)
  stripe_payment_id VARCHAR(255) NOT NULL UNIQUE, -- Stripe charge/payment ID
  amount_cents INT NOT NULL,                   -- e.g., 2000 (means $20.00 AUD)
  currency VARCHAR(3) DEFAULT 'AUD',
  
  start_date DATE NOT NULL,                    -- When featured placement begins
  end_date DATE NOT NULL,                      -- When featured placement expires
  duration_days INT GENERATED ALWAYS AS (end_date - start_date) STORED,
  
  status featured_placement_status NOT NULL,   -- active, expired, refunded, cancelled
  tier VARCHAR(20) DEFAULT 'basic',            -- Phase 5+: could be "pro"
  
  refunded_at TIMESTAMP,                       -- When refund issued (if status = refunded)
  refund_reason TEXT,                          -- e.g., "Customer requested (3-day window)"
  refund_amount_cents INT,                     -- Refund amount (may be partial)
  
  queue_position INT,                          -- Position in FIFO queue (if awaiting slot)
  queue_activated_at TIMESTAMP,                -- When promoted from queue to active
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE RESTRICT,
  FOREIGN KEY (council_id) REFERENCES councils(id) ON DELETE RESTRICT,
  
  CONSTRAINT amount_positive CHECK (amount_cents > 0),
  CONSTRAINT dates_valid CHECK (end_date > start_date),
  CONSTRAINT refund_consistency CHECK (
    CASE
      WHEN status = 'refunded' THEN refund_reason IS NOT NULL AND refund_amount_cents > 0 AND refunded_at IS NOT NULL
      ELSE TRUE
    END
  )
);

CREATE INDEX idx_featured_placements_business_id ON featured_placements(business_id);
CREATE INDEX idx_featured_placements_council_id ON featured_placements(council_id);
CREATE INDEX idx_featured_placements_status ON featured_placements(status);
CREATE INDEX idx_featured_placements_stripe_payment_id ON featured_placements(stripe_payment_id);
CREATE INDEX idx_featured_placements_end_date ON featured_placements(end_date) WHERE status = 'active';
CREATE INDEX idx_featured_placements_queue ON featured_placements(council_id, queue_position) 
  WHERE status IN ('active', 'queued');
```

**Notes:**

- **Immutable audit log**: Records never updated, only inserted (append-only)
- **`stripe_payment_id`** UNIQUE: Links to Stripe webhook events
- **`queue_position`** INT: FIFO queue per council (1–20 typical)
- **`duration_days`** GENERATED: Auto-calculated (always 30 for MVP)
- **Refund window**: 3 days only; after expiry, no refunds
- **Webhook idempotency**: If Stripe webhook replayed, UNIQUE constraint prevents double-insert

---

### 7. `payment_audit` – Stripe Webhook Event Log

**Purpose:** Immutable log of all payment events. Source of truth for DR and financial reconciliation.

```sql
CREATE TABLE payment_audit (
  id SERIAL PRIMARY KEY,
  stripe_event_id VARCHAR(255) NOT NULL UNIQUE,   -- Stripe event ID (for idempotency)
  stripe_event_type VARCHAR(100) NOT NULL,        -- e.g., "charge.succeeded", "charge.refunded"
  business_id INT,                                -- FK (nullable for events not tied to business)
  council_id INT,                                 -- FK (informational)
  
  payment_intent_id VARCHAR(255),                 -- Stripe payment intent ID
  charge_id VARCHAR(255),                         -- Stripe charge ID
  customer_id VARCHAR(255),                       -- Stripe customer ID (if applicable)
  
  amount_cents INT,                               -- Payment amount
  currency VARCHAR(3) DEFAULT 'AUD',
  status VARCHAR(50),                             -- e.g., "succeeded", "failed", "refunded"
  
  webhook_received_at TIMESTAMP NOT NULL,         -- When Vercel received webhook from Stripe
  processed_at TIMESTAMP,                         -- When we processed it
  processing_success BOOLEAN,                     -- TRUE = successfully processed, FALSE = error
  processing_error TEXT,                          -- Error message (if applicable)
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL,
  FOREIGN KEY (council_id) REFERENCES councils(id) ON DELETE SET NULL,
  
  CONSTRAINT stripe_event_id_not_empty CHECK (stripe_event_id <> '')
);

CREATE INDEX idx_payment_audit_stripe_event_id ON payment_audit(stripe_event_id);
CREATE INDEX idx_payment_audit_business_id ON payment_audit(business_id);
CREATE INDEX idx_payment_audit_status ON payment_audit(status);
CREATE INDEX idx_payment_audit_webhook_received_at ON payment_audit(webhook_received_at);
```

**Notes:**

- **Append-only**: Never updated or deleted (7-year ATO retention required)
- **Webhook idempotency**: UNIQUE constraint on `stripe_event_id`
- **Disaster recovery**: If `featured_placements` table corrupted, rebuild from this log
- **Reconciliation**: Stripe reports matched against this log

---

### 8. `emergency_contacts` – Cached Emergency Resources

**Purpose:** Quick lookup for emergency vet/shelter contacts. Denormalized from `businesses`.

```sql
CREATE TABLE emergency_contacts (
  id SERIAL PRIMARY KEY,
  business_id INT NOT NULL,                    -- FK to businesses.id (resource_type = emergency_*)
  resource_type dog_business_resource_type NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  locality_id INT,
  council_id INT,
  phone VARCHAR(20) NOT NULL,
  emergency_hours VARCHAR(100),
  
  availability_status VARCHAR(50) DEFAULT 'active', -- active, closed_temporarily, closed_permanent
  last_verified TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (locality_id) REFERENCES localities(id) ON DELETE SET NULL,
  FOREIGN KEY (council_id) REFERENCES councils(id) ON DELETE SET NULL,
  
  CONSTRAINT resource_type_emergency CHECK (resource_type IN ('emergency_vet', 'urgent_care', 'emergency_shelter'))
);

CREATE INDEX idx_emergency_contacts_resource_type ON emergency_contacts(resource_type);
CREATE INDEX idx_emergency_contacts_council_id ON emergency_contacts(council_id);
CREATE INDEX idx_emergency_contacts_availability ON emergency_contacts(availability_status);
```

**Notes:**

- **Denormalized cache**: Duplicates data from `businesses` for read performance
- **Soft status updates**: `availability_status` lets admin mark "temporarily closed"
- **Quarterly verification**: `last_verified` tracked for data freshness SLA

---

### 9. `triage_logs` – Emergency Triage Audit

**Purpose:** Audit trail of emergency triage calls. Used for analytics and incident investigation.

```sql
CREATE TABLE triage_logs (
  id SERIAL PRIMARY KEY,
  owner_message TEXT NOT NULL,                 -- Raw user input (e.g., "My dog is bleeding")
  
  -- Triage Classification
  classification dog_triage_classification NOT NULL,  -- medical, crisis, stray, normal
  confidence_score DECIMAL(3, 2),              -- 0.00–1.00 (AI confidence)
  ai_model_used VARCHAR(50),                   -- "z_ai", "openai", "deterministic"
  
  -- Recommended Actions
  recommended_actions TEXT[],                  -- e.g., '{"Call 24h emergency vet", "Police 000"}'
  
  -- User Follow-up
  action_taken VARCHAR(100),                   -- e.g., "called_vet", "called_trainer", "no_action"
  action_timestamp TIMESTAMP,                  -- When user took action (if tracked)
  
  -- Metadata
  ip_address INET,                             -- User's IP (for abuse detection)
  user_agent TEXT,                             -- Browser info
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT confidence_valid CHECK (confidence_score >= 0 AND confidence_score <= 1)
);

CREATE INDEX idx_triage_logs_classification ON triage_logs(classification);
CREATE INDEX idx_triage_logs_created_at ON triage_logs(created_at);
CREATE INDEX idx_triage_logs_ai_model ON triage_logs(ai_model_used);
```

**Notes:**

- **Non-PII**: Doesn't store dog owner identity (anonymous)
- **Audit trail**: Used for AI performance monitoring and incident investigation
- **Action tracking**: Helps measure safety pathway effectiveness

---

### 10. `cron_jobs` – Scheduled Task Audit

**Purpose:** Track execution of cron jobs (featured queue promotion, expiry cleanup).

```sql
CREATE TABLE cron_jobs (
  id SERIAL PRIMARY KEY,
  job_name VARCHAR(100) NOT NULL,              -- e.g., "featured_expiry_and_promotion"
  scheduled_run_time TIMESTAMP NOT NULL,       -- When job was scheduled (2am AEDT)
  actual_run_time TIMESTAMP,                   -- When job actually ran
  status VARCHAR(50),                          -- scheduled, running, succeeded, failed
  
  records_processed INT,                       -- How many featured placements updated
  error_message TEXT,                          -- If failed, error details
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_cron_jobs_job_name ON cron_jobs(job_name);
CREATE INDEX idx_cron_jobs_scheduled_run_time ON cron_jobs(scheduled_run_time);
CREATE INDEX idx_cron_jobs_status ON cron_jobs(status);
```

**Notes:**

- **Auditability**: Every cron execution logged (for SLA verification)
- **Error tracking**: Failed jobs captured for operator alert

---

## Complete Enum Definitions

### Enum: `dog_age_group`

**Usage:** `businesses.age_specialties` (array), search filters

```sql
CREATE TYPE dog_age_group AS ENUM (
  'Puppy (0–6 months)',
  'Adolescent (6–18 months)',
  'Adult (1.5–7 years)',
  'Senior (7+ years)',
  'Any age'
);
```

**Definitions:**

| Value | Age Range | Characteristics | Common Issues |
|-------|-----------|-----------------|---------------|
| Puppy (0–6 months) | Newborn to 6 months | Teething, rapid growth, first interactions | Toilet training, bite inhibition, socialization |
| Adolescent (6–18 months) | 6 to 18 months | Teenage phase, independence, impulse testing | Impulse control, recall, boundary setting |
| Adult (1.5–7 years) | 1.5 to 7 years | Young adult to prime adult, stable | Behavioral issues, retraining, maintenance |
| Senior (7+ years) | 7+ years | Age signs, mobility/cognitive changes | Gentle methods, pain awareness, enrichment |
| Any age | All ages | Trainer accepts all ages | Variable |

**Constraint:** Trainer MUST select at least one (enforced in `businesses` CHECK).

---

### Enum: `dog_behavior_issue`

**Usage:** `businesses.behavior_issues` (array), search filters

```sql
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
```

**Definitions:**

| Value | Category | Description | Severity |
|-------|----------|-------------|----------|
| Pulling on the lead | Training | Dog pulls excessively on walks | Low–Med |
| Separation anxiety | Behavioral | Excessive anxiety when owner absent | Med–High |
| Excessive barking | Behavioral | Uncontrolled/excessive vocalization | Low–Med |
| Dog aggression | Medical/Behavior | Aggression toward other dogs | **High** |
| Leash reactivity | Training | Over-threshold response on-leash | Med |
| Jumping up on people | Training | Jumping/mouthing during greetings | Low |
| Destructive behaviour | Behavioral | Chewing, digging, property damage | Low–Med |
| Recall issues | Training | Dog won't return when called off-leash | Med |
| Anxiety (general or fear-based) | Medical/Behavior | Generalized fear, environmental triggers | Med–High |
| Resource guarding | Medical/Behavior | Possessiveness over food/toys | Med–High |
| Mouthing, nipping, biting | Training/Medical | Oral behavior (often young dogs) | Low–Med |
| Rescue dog support | Behavioral | Decompression, trust-building for shelter dogs | Med–High |
| Socialisation | Training | Under-exposure to stimuli, people, dogs | Low–Med |

**Notes:**
- Can select 0 or more (optional)
- "Dog aggression" and "Anxiety" flagged as high-severity (may require vet screening)

---

### Enum: `dog_service_type`

**Usage:** `businesses.service_type_primary` (single), `service_type_secondary` (array)

```sql
CREATE TYPE dog_service_type AS ENUM (
  'Puppy training',
  'Obedience training',
  'Behaviour consultations',
  'Group classes',
  'Private training'
);
```

**Definitions:**

| Value | Description | Format | Typical Cost |
|-------|-------------|--------|--------------|
| Puppy training | Puppy socialization, basics | Group or private | $50–150/session |
| Obedience training | Basic commands, control, manners | Private or group | $60–100/session |
| Behaviour consultations | Behavioral assessment, plan | 1-on-1 consultation | $80–200/hour |
| Group classes | Structured group classes | Group (5–15 dogs) | $30–60/dog/week |
| Private training | 1-on-1 tailored to dog | Private | $80–150/session |

**Notes:**
- **Primary** (single): Trainer's main offering
- **Secondary** (array): Additional services offered

---

### Enum: `dog_business_resource_type`

**Usage:** `businesses.resource_type` (single-select)

```sql
CREATE TYPE dog_business_resource_type AS ENUM (
  'trainer',
  'behaviour_consultant',
  'emergency_vet',
  'urgent_care',
  'emergency_shelter'
);
```

**Definitions:**

| Value | Description | Fields Required | Emergency? |
|-------|-------------|-----------------|-----------|
| trainer | Dog trainer, general services | age_specialties, service_type | No |
| behaviour_consultant | Specializes in behavior modification | age_specialties, behavior_issues | No |
| emergency_vet | 24/7 emergency vet hospital | emergency_phone, emergency_hours | **Yes** |
| urgent_care | After-hours or urgent care vet | emergency_phone, emergency_hours | **Yes** |
| emergency_shelter | Animal shelter, pound, rescue | emergency_phone, emergency_hours | **Yes** |

**Notes:**
- Determines which fields are active in UI (related to D-001, D-005)
- Emergency resources never mixed with trainers in normal search

---

### Enum: `review_moderation_status`

**Usage:** `reviews.moderation_status`

```sql
CREATE TYPE review_moderation_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);
```

**Definitions:**

| Value | Meaning | Visible to Public? | When |
|-------|---------|------------------|------|
| pending | Awaiting AI/admin review | No | Newly created, not yet moderated |
| approved | AI/admin approved, legitimate | Yes | Auto-approved ≥0.85 confidence OR admin reviewed |
| rejected | Spam, abuse, or off-topic | No | AI flagged <0.70 confidence OR admin rejected |

---

### Enum: `featured_placement_status`

**Usage:** `featured_placements.status`

```sql
CREATE TYPE featured_placement_status AS ENUM (
  'queued',
  'active',
  'expired',
  'refunded',
  'cancelled'
);
```

**Definitions:**

| Value | Meaning | Visible in Search? |
|-------|---------|------------------|
| queued | Waiting for slot in council queue | No |
| active | Currently featured (within `featured_until`) | **Yes** (#1–5) |
| expired | `featured_until` has passed | No |
| refunded | Refund issued (within 3-day window) | No |
| cancelled | Trainer cancelled mid-placement | No |

---

### Enum: `dog_triage_classification`

**Usage:** `triage_logs.classification`

```sql
CREATE TYPE dog_triage_classification AS ENUM (
  'medical',
  'crisis',
  'stray',
  'normal'
);
```

**Definitions (Related to D-001, D-005):**

| Value | Triggers | Recommended Actions | Response Time |
|-------|----------|-------------------|----------------|
| medical | Bleeding, injury, poisoning, collapse, breathing distress | Call 24h emergency vet | Immediate |
| crisis | Active attack, immediate human safety risk, aggressive loose | Call 000 (police), animal control | Immediate |
| stray | Lost dog, found dog, wandering unknown | Call RSPCA, local council, Lost Dogs Home | ASAP |
| normal | Behavior question, training inquiry, general advice | Recommend matched trainers | Non-urgent |

---

## Geography: 28 Melbourne Councils & 200+ Suburbs

### Full Council Reference (28 Total)

**Rationale (D-003):**
- Councils are stable admin boundaries (don't change often)
- Users think in suburbs (not LGA terminology)
- Suburb → Council mapping is 1:1 (deterministic)
- 28 metro councils is official count (not 31)

**Seed Script:**

```sql
-- Inner City (3 councils)
INSERT INTO councils (name, region, shire, ux_label) VALUES
('City of Melbourne', 'Inner City', FALSE, 'Melbourne CBD'),
('City of Port Phillip', 'Inner City', FALSE, 'St Kilda Beachside'),
('City of Yarra', 'Inner City', FALSE, 'Inner North Creative');

-- Northern (6 councils)
INSERT INTO councils (name, region, shire, ux_label) VALUES
('City of Banyule', 'Northern', FALSE, 'Heidelberg Foothills'),
('City of Darebin', 'Northern', FALSE, 'Preston Inner North'),
('City of Hume', 'Northern', FALSE, 'Broadmeadows Outer North'),
('City of Merri-bek', 'Northern', FALSE, 'Brunswick Inner West'),
('City of Whittlesea', 'Northern', FALSE, 'Epping Growth Corridor'),
('Shire of Nillumbik', 'Northern', TRUE, 'Eltham Dandenong Hills');

-- Eastern (5 councils)
INSERT INTO councils (name, region, shire, ux_label) VALUES
('City of Boroondara', 'Eastern', FALSE, 'Hawthorn Eastern Prestige'),
('City of Knox', 'Eastern', FALSE, 'Boronia Mountain Suburbs'),
('City of Manningham', 'Eastern', FALSE, 'Doncaster Eastern Leafy'),
('City of Maroondah', 'Eastern', FALSE, 'Ringwood Eastern Corridor'),
('City of Whitehorse', 'Eastern', FALSE, 'Box Hill Eastern Residential'),
('Shire of Yarra Ranges', 'Eastern', TRUE, 'Lilydale Dandenong Ranges');

-- South Eastern (7 councils)
INSERT INTO councils (name, region, shire, ux_label) VALUES
('City of Bayside', 'South Eastern', FALSE, 'Brighton Bayside'),
('City of Glen Eira', 'South Eastern', FALSE, 'Caulfield Southeastern'),
('City of Kingston', 'South Eastern', FALSE, 'Mentone Bayside'),
('City of Casey', 'South Eastern', FALSE, 'Narre Warren Outer South'),
('City of Frankston', 'South Eastern', FALSE, 'Frankston Peninsula'),
('Shire of Cardinia', 'South Eastern', TRUE, 'Pakenham Outer Southeast'),
('Mornington Peninsula Shire', 'South Eastern', TRUE, 'Mornington Peninsula');

-- Western (7 councils)
INSERT INTO councils (name, region, shire, ux_label) VALUES
('City of Brimbank', 'Western', FALSE, 'Sunshine Western Industrial'),
('City of Hobsons Bay', 'Western', FALSE, 'Williamstown Western Coastal'),
('City of Maribyrnong', 'Western', FALSE, 'Footscray Inner West'),
('City of Melton', 'Western', FALSE, 'Melton Western Growth'),
('City of Moonee Valley', 'Western', FALSE, 'Essendon Northern West'),
('City of Wyndham', 'Western', FALSE, 'Werribee Southwest Growth');
```

### Sample Suburbs (20 shown, 200+ total from CSV)

**All suburbs loaded from `suburbs_councils_mapping.csv`:**

```sql
INSERT INTO localities (name, council_id, region, postcode, latitude, longitude, ux_label) VALUES
('Carlton', 1, 'Inner City', '3053', -37.8004228, 144.9684343, 'Melbourne CBD'),
('Docklands', 1, 'Inner City', '3008', -37.8175423, 144.9394923, 'Melbourne CBD'),
('Parkville', 1, 'Inner City', '3052', -37.7871148, 144.9515533, 'Melbourne CBD'),
('Kensington', 1, 'Inner City', '3031', -37.7939378, 144.9305645, 'Melbourne CBD'),
('North Melbourne', 1, 'Inner City', '3003', -37.8076092, 144.9423514, 'Melbourne CBD'),
('Albert Park', 2, 'Inner City', '3206', -37.8452062, 144.9571050, 'St Kilda Beachside'),
('Balaclava', 2, 'Inner City', '3183', -37.8695430, 144.9934871, 'St Kilda Beachside'),
('Elwood', 2, 'Inner City', '3184', -37.8788568, 144.9855487, 'St Kilda Beachside'),
('St Kilda', 2, 'Inner City', '3182', -37.8638261, 144.9816370, 'St Kilda Beachside'),
('South Melbourne', 2, 'Inner City', '3205', -37.8334400, 144.9570533, 'St Kilda Beachside'),
('Abbotsford', 3, 'Inner City', '3067', -37.8045508, 144.9988542, 'Inner North Creative'),
('Collingwood', 3, 'Inner City', '3066', -37.8021040, 144.9881387, 'Inner North Creative'),
('Fitzroy', 3, 'Inner City', '3065', -37.8010382, 144.9792611, 'Inner North Creative'),
('Richmond', 3, 'Inner City', '3121', -37.8074500, 144.9907213, 'Inner North Creative'),
('Heidelberg', 4, 'Northern', '3084', -37.7524788, 145.0701284, 'Heidelberg Foothills'),
('Preston', 5, 'Northern', '3072', -37.7418658, 145.0078205, 'Preston Inner North'),
('Camberwell', 10, 'Eastern', '3124', -37.8384623, 145.0740767, 'Hawthorn Eastern Prestige'),
('Ringwood', 13, 'Eastern', '3134', -37.8158726, 145.2291113, 'Ringwood Eastern Corridor'),
('Brighton', 16, 'South Eastern', '3186', -37.9081962, 144.9957991, 'Brighton Bayside'),
('Frankston', 20, 'South Eastern', '3199', -38.1457064, 145.1263742, 'Frankston Peninsula'),
-- ... (180+ more suburbs from CSV)
```

---

## Relationships & Foreign Keys

### Entity Relationship Diagram (Conceptual)

```
councils (28)
  ├─ localities (200+)  [FK: council_id]
  │   ├─ businesses (trainers/vets)  [FK: locality_id, council_id]
  │   │   ├─ users (1 per trainer account)  [FK: user_id]
  │   │   ├─ reviews (many)  [FK: business_id]
  │   │   ├─ featured_placements (0..1 active at a time)  [FK: business_id, council_id]
  │   │   └─ emergency_contacts (if resource_type = emergency_*)
  │   │
  │   └─ emergency_contacts (mirror from businesses)  [FK: locality_id, council_id]
  │
  ├─ featured_placements (audit)
  │   └─ payment_audit (Stripe webhook events)
  │
  └─ triage_logs (emergency audit, no FK)
  
  cron_jobs (scheduled tasks, no FK)
```

### Constraint Summary

| From | To | Type | Cascade? |
|------|----|----|---------|
| localities.council_id | councils.id | FK | NO (RESTRICT) |
| businesses.user_id | users.id | FK | YES (SET NULL) |
| businesses.locality_id | localities.id | FK | NO (RESTRICT) |
| businesses.council_id | councils.id | FK | NO (RESTRICT) |
| reviews.business_id | businesses.id | FK | YES (CASCADE) |
| featured_placements.business_id | businesses.id | FK | NO (RESTRICT) |
| featured_placements.council_id | councils.id | FK | NO (RESTRICT) |
| emergency_contacts.business_id | businesses.id | FK | YES (CASCADE) |
| payment_audit.business_id | businesses.id | FK | NO (SET NULL) |

---

## Data Integrity Rules (Invariants)

### Rule 1: Suburb-Council Immutability

**Rule:** Once a suburb is inserted into `localities`, its council_id must never change.

**Enforcement:**
- Database: Treat council_id as immutable (no UPDATE triggers allowed)
- Application: Never change council_id (only on rare data correction, logged)
- Validation: Suburb name unique (can't have Fitzroy in two councils)

**Why:** Master data integrity; geography is fundamental.

---

### Rule 2: Trainer Age Specialties Required

**Rule:** All trainers and behaviour consultants MUST select at least one age group.

**Enforcement:**
```sql
ALTER TABLE businesses
ADD CONSTRAINT trainer_age_required CHECK (
  CASE 
    WHEN resource_type IN ('trainer', 'behaviour_consultant')
      THEN (age_specialties IS NOT NULL AND array_length(age_specialties, 1) > 0)
    ELSE TRUE
  END
);
```

**Why:** Age-first search (D-003) requires all trainers to have age data.

---

### Rule 3: Emergency Resources Require Emergency Phone

**Rule:** If resource_type is emergency_vet, urgent_care, or emergency_shelter, emergency_phone is mandatory.

**Enforcement:**
```sql
ALTER TABLE businesses
ADD CONSTRAINT emergency_phone_required CHECK (
  CASE
    WHEN resource_type IN ('emergency_vet', 'urgent_care', 'emergency_shelter')
      THEN emergency_phone IS NOT NULL AND emergency_phone <> ''
    ELSE TRUE
  END
);
```

**Why:** Safety-critical; must always have a valid phone number.

---

### Rule 4: Featured Placement Auto-Expiry

**Rule:** Featured placement expires when current_timestamp > featured_until.

**Enforcement:**
- Cron job (daily at 2am): Updates `featured_until` to NULL for expired records
- Search query: Filters `featured_until IS NOT NULL AND featured_until > NOW()`
- No application logic needed (time-based state)

**Why:** Deterministic, no operator intervention needed.

---

### Rule 5: Review Moderation Dates

**Rule:** If review status is 'rejected', rejected_at must be set; if 'approved', approved_at must be set.

**Enforcement:**
```sql
ALTER TABLE reviews
ADD CONSTRAINT moderation_dates_required CHECK (
  CASE 
    WHEN moderation_status = 'rejected' THEN rejected_at IS NOT NULL
    WHEN moderation_status = 'approved' THEN approved_at IS NOT NULL
    ELSE TRUE
  END
);
```

**Why:** Audit trail; every moderation decision timestamped.

---

### Rule 6: ABN Format Validation

**Rule:** If abr_abn is provided, it must be exactly 11 digits.

**Enforcement:**
```sql
ALTER TABLE businesses
ADD CONSTRAINT abr_abn_format CHECK (abr_abn IS NULL OR abr_abn ~ '^\d{11}$');
```

**Why:** Basic format validation (doesn't check checksum; that's admin's job).

---

### Rule 7: Soft Delete + Audit

**Rule:** Deleted records remain in database with deleted=TRUE and deleted_at timestamp.

**Enforcement:**
- Search queries: Always filter `WHERE deleted = FALSE`
- Hard delete never used (except in manual data correction)
- deleted_at auto-set via trigger

**Why:** Disaster recovery, audit trail, financial reconciliation.

```sql
CREATE TRIGGER set_deleted_at BEFORE UPDATE ON businesses
FOR EACH ROW
WHEN (NEW.deleted = TRUE AND OLD.deleted = FALSE)
DO UPDATE SET deleted_at = CURRENT_TIMESTAMP;
```

---

### Rule 8: Trainer Names Not Empty

**Rule:** Business name must be non-empty string.

**Enforcement:**
```sql
ALTER TABLE businesses
ADD CONSTRAINT name_not_empty CHECK (name <> '');
```

**Why:** Prevent null/empty names in directory.

---

### Rule 9: Refund Window (3 Days)

**Rule:** Refunds only allowed within 3 days of purchase.

**Enforcement:**
- Application layer: Check (created_at + 3 days) > NOW()
- No database constraint (timestamp math complex in SQL)

**Example:**
```sql
-- Check if refund allowed
SELECT (created_at + INTERVAL '3 days') > NOW() AS refund_allowed
FROM featured_placements
WHERE id = ?;
```

**Why:** Business rule; enforced at API level.

---

### Rule 10: Stripe Event Idempotency

**Rule:** Each Stripe webhook event (stripe_event_id) processed at most once.

**Enforcement:**
```sql
CREATE UNIQUE INDEX idx_payment_audit_stripe_event_id 
ON payment_audit(stripe_event_id);
```

**Why:** Prevent double-charging if webhook replayed.

---

### Rule 11: Council Capacity Limits

**Rule:** Max 5 featured placements per council can be active simultaneously.

**Enforcement:**
- Application layer: Enforce when processing featured_placement creation
- No database constraint (complex GROUP BY)

**Example:**
```sql
-- Check if council has room for new featured placement
SELECT COUNT(*) AS active_count
FROM featured_placements
WHERE council_id = ? AND status = 'active';
-- If active_count < 5, allow new placement; else queue
```

**Why:** Business rule for scarcity/pricing.

---

### Rule 12: User Email Uniqueness

**Rule:** Email addresses must be globally unique across all users.

**Enforcement:**
```sql
CREATE UNIQUE INDEX idx_users_email ON users(email);
```

**Why:** Authentication boundary; one account per email.

---

## Performance Considerations

### Index Strategy

**High-traffic queries:**

1. **Search trainers by council + age + issue:**
   ```sql
   SELECT * FROM businesses
   WHERE council_id = ? AND deleted = FALSE
     AND 'Adult' = ANY(age_specialties)
     AND 'Pulling on the lead' && behavior_issues
   ORDER BY featured_until DESC NULLS LAST, verified DESC, rating DESC
   LIMIT 20;
   ```
   **Index:** `(council_id, deleted)` with GIN on `age_specialties`, `behavior_issues`

2. **Emergency contact lookup by council:**
   ```sql
   SELECT * FROM emergency_contacts
   WHERE council_id = ? AND resource_type = 'emergency_vet';
   ```
   **Index:** `(council_id, resource_type)`

3. **Featured expiry cleanup (cron):**
   ```sql
   UPDATE businesses
   SET featured_until = NULL
   WHERE featured_until < NOW() AND featured_until IS NOT NULL;
   ```
   **Index:** `(featured_until)` with partial predicate `WHERE featured_until IS NOT NULL`

4. **Review moderation queue:**
   ```sql
   SELECT * FROM reviews
   WHERE moderation_status = 'pending'
   ORDER BY created_at ASC
   LIMIT 20;
   ```
   **Index:** `(moderation_status, created_at)`

### Estimated Row Counts (At Scale)

| Table | Rows (Phase 1) | Rows (Phase 3) | Growth Factor |
|-------|---|---|---|
| councils | 28 | 28 | 1x (static) |
| localities | 200 | 200 | 1x (static) |
| users | 100 | 500 | 5x |
| businesses | 200 | 2,000 | 10x |
| reviews | 200 | 10,000 | 50x |
| featured_placements | 50 | 2,000 | 40x |
| payment_audit | 150 | 3,000 | 20x |
| triage_logs | 500 | 50,000 | 100x |

**Optimization:** Partition `triage_logs` by month once >1M rows (Phase 3+).

---

## Migration & Seed Strategy

### Phase 1: Initial Schema Setup

```bash
# 1. Create all types
npx supabase db push --schema sql/01_enums.sql

# 2. Create all tables
npx supabase db push --schema sql/02_tables.sql

# 3. Seed reference data (councils, suburbs)
npx supabase db push --schema sql/03_seed_councils_and_suburbs.sql

# 4. Create indexes
npx supabase db push --schema sql/04_indexes.sql

# 5. Create triggers
npx supabase db push --schema sql/05_triggers.sql
```

### Seed Data: Councils (SQL)

```sql
-- File: sql/03_seed_councils_and_suburbs.sql
TRUNCATE councils CASCADE;

INSERT INTO councils (name, region, shire, ux_label) VALUES
-- Inner City (3)
('City of Melbourne', 'Inner City', FALSE, 'Melbourne CBD'),
('City of Port Phillip', 'Inner City', FALSE, 'St Kilda Beachside'),
('City of Yarra', 'Inner City', FALSE, 'Inner North Creative'),
-- Northern (6)
('City of Banyule', 'Northern', FALSE, 'Heidelberg Foothills'),
('City of Darebin', 'Northern', FALSE, 'Preston Inner North'),
('City of Hume', 'Northern', FALSE, 'Broadmeadows Outer North'),
('City of Merri-bek', 'Northern', FALSE, 'Brunswick Inner West'),
('City of Whittlesea', 'Northern', FALSE, 'Epping Growth Corridor'),
('Shire of Nillumbik', 'Northern', TRUE, 'Eltham Dandenong Hills'),
-- Eastern (5)
('City of Boroondara', 'Eastern', FALSE, 'Hawthorn Eastern Prestige'),
('City of Knox', 'Eastern', FALSE, 'Boronia Mountain Suburbs'),
('City of Manningham', 'Eastern', FALSE, 'Doncaster Eastern Leafy'),
('City of Maroondah', 'Eastern', FALSE, 'Ringwood Eastern Corridor'),
('City of Whitehorse', 'Eastern', FALSE, 'Box Hill Eastern Residential'),
('Shire of Yarra Ranges', 'Eastern', TRUE, 'Lilydale Dandenong Ranges'),
-- South Eastern (7)
('City of Bayside', 'South Eastern', FALSE, 'Brighton Bayside'),
('City of Glen Eira', 'South Eastern', FALSE, 'Caulfield Southeastern'),
('City of Kingston', 'South Eastern', FALSE, 'Mentone Bayside'),
('City of Casey', 'South Eastern', FALSE, 'Narre Warren Outer South'),
('City of Frankston', 'South Eastern', FALSE, 'Frankston Peninsula'),
('Shire of Cardinia', 'South Eastern', TRUE, 'Pakenham Outer Southeast'),
('Mornington Peninsula Shire', 'South Eastern', TRUE, 'Mornington Peninsula'),
-- Western (7)
('City of Brimbank', 'Western', FALSE, 'Sunshine Western Industrial'),
('City of Hobsons Bay', 'Western', FALSE, 'Williamstown Western Coastal'),
('City of Maribyrnong', 'Western', FALSE, 'Footscray Inner West'),
('City of Melton', 'Western', FALSE, 'Melton Western Growth'),
('City of Moonee Valley', 'Western', FALSE, 'Essendon Northern West'),
('City of Wyndham', 'Western', FALSE, 'Werribee Southwest Growth');

-- Load 200+ suburbs from CSV (via application script or psql COPY)
-- See suburbs_councils_mapping.csv for full list
\COPY localities FROM 'suburbs_councils_mapping.csv' WITH (FORMAT csv, HEADER true);
```

### Migration Triggers

```sql
-- File: sql/05_triggers.sql

-- Set updated_at on every UPDATE
CREATE TRIGGER update_businesses_updated_at
BEFORE UPDATE ON businesses
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Set deleted_at when soft-deleted
CREATE TRIGGER set_businesses_deleted_at
BEFORE UPDATE ON businesses
FOR EACH ROW
WHEN (NEW.deleted = TRUE AND OLD.deleted = FALSE)
EXECUTE FUNCTION set_deleted_at_timestamp();

-- Helper functions
CREATE OR REPLACE FUNCTION update_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_deleted_at_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.deleted_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Summary: Key Decisions Implemented

| Decision | Implementation |
|----------|---|
| **D-003** (28 councils) | `councils` table with 28 rows, `region` enum (5 values) |
| **D-004** (Taxonomy locked) | Enum types: `dog_age_group`, `dog_behavior_issue`, `dog_service_type` |
| **D-002** (Featured placement) | `featured_placements` table with immutable audit log, `featured_until` timestamp |
| **D-001** (Triage classification) | `triage_logs` table with `dog_triage_classification` enum |
| **D-006** (Search ranking) | Indexes on `featured_until`, `verified`, distance, rating |
| **Soft delete** (General best practice) | `deleted` boolean, `deleted_at` timestamp on all core tables |
| **Stripe safety** | `payment_audit` immutable append-only table (7-year retention) |

---

**Document Status:** ✅ Complete, production-ready  
**Last Updated:** 2025-12-25  
**Owner:** Database architect  
**Next Steps:** Migrate to Supabase, seed reference data, run integration tests
