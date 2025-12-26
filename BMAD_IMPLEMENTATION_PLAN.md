# BMAD Implementation Plan - Phase 4: Project Execution

**Project:** Dog Trainers Directory (DTD)  
**BMAD-METHOD Version:** 6.0.0-alpha.15  
**DTD Documentation Status:** All 15 architectural decisions locked, ready for development  
**Date:** 2025-12-25  
**Status:** Ready for Execution

---

## Executive Summary

This document provides the comprehensive implementation plan for **Phase 4: Project Execution** of the BMAD-METHOD integration into the Dog Trainers Directory (DTD) project. Phases 1-3 (BMAD Configuration, Custom Agent Creation, Workflow Development) are complete. Phase 4 involves executing the 5 DTD project phases using the custom agents and workflows created.

### Phase 4 Scope

Phase 4 is the **largest implementation phase** that involves actual code generation across all 5 DTD project phases:

1. **DTD Phase 1: Foundation** - Database schema, authentication
2. **DTD Phase 2: Core Features** - API contracts, trainer profiles, search
3. **DTD Phase 3: Monetisation** - Stripe integration, featured placements
4. **DTD Phase 4: Emergency Triage** - AI integration, triage workflow
5. **DTD Phase 5: Operations** - Admin dashboard, monitoring

### Implementation Approach

- **Step-by-step execution** using BMAD workflows
- **Agent-driven development** with appropriate agent types for each task
- **Collaborative dialogue model** ensuring user control throughout
- **Scale-adaptive intelligence** matching effort to phase complexity

---

## Table of Contents

1. [Phases 1-3 Completion Summary](#phases-1-3-completion-summary)
2. [Phase 4 Execution Overview](#phase-4-execution-overview)
3. [DTD Phase 1: Foundation Implementation](#dtd-phase-1-foundation-implementation)
4. [DTD Phase 2: Core Features Implementation](#dtd-phase-2-core-features-implementation)
5. [DTD Phase 3: Monetisation Implementation](#dtd-phase-3-monetisation-implementation)
6. [DTD Phase 4: Emergency Triage Implementation](#dtd-phase-4-emergency-triage-implementation)
7. [DTD Phase 5: Operations Implementation](#dtd-phase-5-operations-implementation)
8. [Execution Order and Dependencies](#execution-order-and-dependencies)
9. [Success Criteria](#success-criteria)
10. [Risk Mitigation During Execution](#risk-mitigation-during-execution)
11. [Next Steps](#next-steps)

---

## Phases 1-3 Completion Summary

### Phase 1: BMAD Configuration ✅ COMPLETED

**Status:** Complete  
**Duration:** Completed  
**Outcomes:**

| Component                    | Status      | Location                               |
| ---------------------------- | ----------- | -------------------------------------- |
| BMAD-METHOD Installation     | ✅ Complete | Global NPX installation                |
| `.bmad/` Directory Structure | ✅ Complete | `.bmad/` folder created                |
| `.kilocodemodes/` Mode Files | ✅ Complete | Mode definitions generated             |
| BMAD Configuration           | ✅ Complete | `.bmad/config.yaml` configured         |
| Agent Sidecar Folder         | ✅ Complete | `.bmad-user-memory/` configured        |
| Output Folder                | ✅ Complete | `docs/` configured                     |
| BMB Module                   | ✅ Complete | BMAD Builder installed                 |
| BMM Module                   | ✅ Complete | Business Method & Management installed |

**Key Configuration Settings:**

- User Name: DTD Developer
- Communication Language: English
- Agent Sidecar Folder: `.bmad-user-memory/`
- Output Folder: `docs/`
- DTD Documentation Path: `DOCS/`
- Technology Stack: Next.js 15, TypeScript, Tailwind CSS, Supabase, Stripe, Z.AI, z.ai, Vercel

---

### Phase 2: Custom Agent Creation ✅ COMPLETED

**Status:** Complete  
**Duration:** Completed  
**Outcomes:**

| Agent                     | Type                       | Status      | Location                                                   |
| ------------------------- | -------------------------- | ----------- | ---------------------------------------------------------- |
| Database Schema Architect | Expert (Persistent Memory) | ✅ Complete | `.bmad/agents/expert/database-schema-architect.agent.yaml` |
| API Contract Designer     | Expert (Persistent Memory) | ✅ Complete | `.bmad/agents/expert/api-contract-designer.agent.yaml`     |
| AI Integration Specialist | Expert (Persistent Memory) | ✅ Complete | `.bmad/agents/expert/ai-integration-specialist.agent.yaml` |

**Agent Sidecar Folders Created:**

- `.bmad-user-memory/database-schema-architect-sidecar/`
- `.bmad-user-memory/api-contract-designer-sidecar/`
- `.bmad-user-memory/ai-integration-specialist-sidecar/`

**Kilocode Mode Files Generated:**

- `dtd-database-schema-architect.md`
- `dtd-api-contract-designer.md`
- `dtd-ai-integration-specialist.md`

**Agent Capabilities:**

1. **Database Schema Architect**

   - Specializes in [`02_DOMAIN_MODEL.md`](DOCS/02_DOMAIN_MODEL.md:1) implementation
   - Creates migration files for 10 core tables
   - Implements 12 enum types
   - Sets up foreign keys, RLS policies, indexes
   - Seeds reference data (28 councils, 200+ suburbs)

2. **API Contract Designer**

   - Specializes in [`05_DATA_AND_API_CONTRACTS.md`](DOCS/05_DATA_AND_API_CONTRACTS.md:1) implementation
   - Designs REST API endpoints (25+ endpoints)
   - Creates TypeScript types for all DTOs
   - Implements validation schemas (Zod)
   - Sets up authentication middleware (D-013: MFA)

3. **AI Integration Specialist**
   - Specializes in [`07_AI_AUTOMATION_AND_MODES.md`](DOCS/07_AI_AUTOMATION_AND_MODES.md:1) implementation
   - Implements Z.AI integration (primary tier)
   - Implements z.ai fallback (secondary tier)
   - Implements deterministic keyword matching (final fallback)
   - Sets up feature flags and health monitoring

---

### Phase 3: Workflow Development ✅ COMPLETED

**Status:** Complete  
**Duration:** Completed  
**Outcomes:**

| Workflow                       | Status      | Location                                          | Agent                     |
| ------------------------------ | ----------- | ------------------------------------------------- | ------------------------- |
| Database Schema Implementation | ✅ Complete | `.bmad/workflows/database-schema-implementation/` | Database Schema Architect |
| API Contract Implementation    | ✅ Complete | `.bmad/workflows/api-contract-implementation/`    | API Contract Designer     |
| AI Integration Setup           | ✅ Complete | `.bmad/workflows/ai-integration-setup/`           | AI Integration Specialist |

**Workflow Step Files Created:**

1. **Database Schema Implementation Workflow** (9 steps)

   - `step-01-enums-creation.md`
   - `step-02-core-tables-creation.md`
   - `step-03-foreign-keys-constraints.md`
   - `step-04-indexes-creation.md`
   - `step-05-rls-policies.md`
   - `step-06-triggers-creation.md`
   - `step-07-seed-councils.md`
   - `step-08-seed-suburbs.md`
   - `step-09-verification.md`

2. **API Contract Implementation Workflow** (7 steps)

   - `step-01-endpoint-design.md`
   - `step-02-typescript-types.md`
   - `step-03-validation-schemas.md`
   - `step-04-authentication-middleware.md`
   - `step-05-error-handling.md`
   - `step-06-rate-limiting.md`
   - `step-07-documentation.md`

3. **AI Integration Setup Workflow** (8 steps)
   - `step-01-z-ai-client.md`
   - `step-02-openai-fallback.md`
   - `step-03-deterministic-rules.md`
   - `step-04-cascade-logic.md`
   - `step-05-feature-flags.md`
   - `step-06-health-monitoring.md`
   - `step-07-audit-logging.md`
   - `step-08-testing-validation.md`

**Workflow Mandatory Rules Enforced:**

- 🛑 NEVER generate code without user input
- 📋 AI acts as FACILITATOR, not code generator
- ⏸️ ALWAYS halt at menus and wait for input
- 📖 Reference DTD documentation for all decisions
- 🔒 Enforce all architectural decisions

---

## Phase 4 Execution Overview

### Execution Strategy

Phase 4 will execute the 5 DTD project phases sequentially, using the custom agents and workflows created in Phases 1-3.

**Execution Model:**

```
DTD Phase 1 (Foundation)
    ↓
    Use: Database Schema Architect (Expert)
    Workflow: Database Schema Implementation
    ↓
DTD Phase 2 (Core Features)
    ↓
    Use: API Contract Designer (Expert)
    Workflow: API Contract Implementation
    ↓
DTD Phase 3 (Monetisation)
    ↓
    Use: Custom Monetisation Implementation
    ↓
DTD Phase 4 (Emergency Triage)
    ↓
    Use: AI Integration Specialist (Expert)
    Workflow: AI Integration Setup
    ↓
DTD Phase 5 (Operations)
    ↓
    Use: Custom Operations Implementation
```

### Execution Timeline

| DTD Phase                 | Duration     | Agent                     | Workflow                       | Estimated Effort |
| ------------------------- | ------------ | ------------------------- | ------------------------------ | ---------------- |
| Phase 1: Foundation       | 2 weeks      | Database Schema Architect | Database Schema Implementation | 80 hours         |
| Phase 2: Core Features    | 2 weeks      | API Contract Designer     | API Contract Implementation    | 80 hours         |
| Phase 3: Monetisation     | 2 weeks      | Custom Implementation     | Monetisation Workflow          | 60 hours         |
| Phase 4: Emergency Triage | 2 weeks      | AI Integration Specialist | AI Integration Setup           | 80 hours         |
| Phase 5: Operations       | 2 weeks      | Custom Implementation     | Operations Workflow            | 40 hours         |
| **Total**                 | **10 weeks** | -                         | -                              | **340 hours**    |

### Execution Principles

1. **Step-by-Step Execution**: Each workflow step is executed sequentially with user confirmation
2. **Collaborative Dialogue**: AI facilitates, user decides at each menu
3. **Context Management**: Only current step context loaded, preventing overflow
4. **Agent Memory**: Expert agents retain decisions across sessions
5. **Scale-Adaptive**: Effort matches phase complexity

---

## DTD Phase 1: Foundation Implementation

### Overview

**DTD Phase 1:** Foundation  
**Duration:** 2 weeks  
**BMAD Agent:** Database Schema Architect (Expert)  
**Workflow:** Database Schema Implementation  
**Documentation Reference:** [`02_DOMAIN_MODEL.md`](DOCS/02_DOMAIN_MODEL.md:1)

### Objectives

1. Create all 12 enum types
2. Create all 10 core tables
3. Implement foreign key relationships
4. Implement RLS policies
5. Create indexes and triggers
6. Seed reference data (28 councils, 200+ suburbs)
7. Verify data integrity

### Detailed Implementation Steps

#### Step 1: Enums Creation

**Workflow Step:** `step-01-enums-creation.md`  
**Agent:** Database Schema Architect (Expert)  
**Estimated Time:** 2 hours

**Enums to Create:**

| Enum Name                    | Values                                                                                                                       | Purpose                     |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `dog_age_group`              | puppy, adolescent, adult, senior, geriatric                                                                                  | Dog age classification      |
| `dog_behavior_issue`         | aggression, anxiety, fear, reactivity, separation, barking, biting, chewing, digging, jumping, pulling, housebreaking, other | Behavior issue types        |
| `dog_service_type`           | training, behavior_modification, puppy_training, socialization, other                                                        | Service offerings           |
| `dog_business_resource_type` | website, social_media, video, article, other                                                                                 | Business resource types     |
| `review_moderation_status`   | pending, approved, rejected                                                                                                  | Review moderation states    |
| `featured_placement_status`  | active, expired, pending, cancelled, refunded                                                                                | Featured placement states   |
| `dog_triage_classification`  | medical, crisis, stray, normal                                                                                               | Emergency triage categories |

**Success Criteria:**

- ✅ All 7 enum types created in Supabase
- ✅ Enum values match [`02_DOMAIN_MODEL.md`](DOCS/02_DOMAIN_MODEL.md:1) specification
- ✅ Migration file committed to `supabase/migrations/`
- ✅ No SQL errors during migration

**Dependencies:** None

---

#### Step 2: Core Tables Creation

**Workflow Step:** `step-02-core-tables-creation.md`  
**Agent:** Database Schema Architect (Expert)  
**Estimated Time:** 4 hours

**Tables to Create:**

| Table Name            | Purpose                    | Key Columns                                               |
| --------------------- | -------------------------- | --------------------------------------------------------- |
| `councils`            | Local government areas     | id, name, state, region                                   |
| `localities`          | Suburbs/locations          | id, name, council_id, postcode                            |
| `users`               | Trainer accounts           | id, email, phone, mfa_enabled                             |
| `businesses`          | Trainer listings           | id, user_id, name, abn, locality_id, council_id           |
| `reviews`             | User reviews               | id, business_id, rating, comment, moderation_status       |
| `featured_placements` | Monetisation audit         | id, business_id, council_id, status, start_date, end_date |
| `payment_audit`       | Stripe webhook log         | id, business_id, stripe_event_id, amount, status          |
| `emergency_contacts`  | Cached emergency resources | id, business_id, council_id, contact_type, phone          |
| `triage_logs`         | Emergency triage audit     | id, classification, confidence, ai_provider, timestamp    |
| `cron_jobs`           | Scheduled task audit       | id, job_type, status, last_run, next_run                  |

**Success Criteria:**

- ✅ All 10 tables created in Supabase
- ✅ Table structures match [`02_DOMAIN_MODEL.md`](DOCS/02_DOMAIN_MODEL.md:1) specification
- ✅ Migration file committed to `supabase/migrations/`
- ✅ No SQL errors during migration

**Dependencies:** Step 1 (Enums) complete

---

#### Step 3: Foreign Keys & Constraints

**Workflow Step:** `step-03-foreign-keys-constraints.md`  
**Agent:** Database Schema Architect (Expert)  
**Estimated Time:** 3 hours

**Foreign Keys to Define:**

| From Table                        | To Table        | Cascade Behavior |
| --------------------------------- | --------------- | ---------------- |
| `localities.council_id`           | `councils.id`   | RESTRICT         |
| `businesses.user_id`              | `users.id`      | CASCADE          |
| `businesses.locality_id`          | `localities.id` | RESTRICT         |
| `businesses.council_id`           | `councils.id`   | RESTRICT         |
| `reviews.business_id`             | `businesses.id` | CASCADE          |
| `featured_placements.business_id` | `businesses.id` | CASCADE          |
| `featured_placements.council_id`  | `councils.id`   | RESTRICT         |
| `emergency_contacts.business_id`  | `businesses.id` | CASCADE          |
| `payment_audit.business_id`       | `businesses.id` | CASCADE          |

**Constraints to Enforce:**

| Constraint              | Rule                             | Reference                                           |
| ----------------------- | -------------------------------- | --------------------------------------------------- |
| Trainer age specialties | Required (Rule 2)                | [`02_DOMAIN_MODEL.md`](DOCS/02_DOMAIN_MODEL.md:939) |
| Emergency resources     | Require emergency phone (Rule 3) | [`02_DOMAIN_MODEL.md`](DOCS/02_DOMAIN_MODEL.md:939) |
| ABN format              | 11-digit validation (Rule 6)     | [`02_DOMAIN_MODEL.md`](DOCS/02_DOMAIN_MODEL.md:939) |
| Trainer names           | Not empty (Rule 8)               | [`02_DOMAIN_MODEL.md`](DOCS/02_DOMAIN_MODEL.md:939) |

**Success Criteria:**

- ✅ All foreign keys defined with correct cascade behavior
- ✅ All constraints enforced
- ✅ Migration file committed to `supabase/migrations/`
- ✅ No SQL errors during migration

**Dependencies:** Step 2 (Core Tables) complete

---

#### Step 4: Indexes Creation

**Workflow Step:** `step-04-indexes-creation.md`  
**Agent:** Database Schema Architect (Expert)  
**Estimated Time:** 2 hours

**Indexes to Create:**

| Table                 | Index Columns                        | Purpose                             |
| --------------------- | ------------------------------------ | ----------------------------------- |
| `localities`          | council_id, name                     | Fast council/suburb lookup          |
| `businesses`          | council_id, locality_id, is_verified | Search by location and verification |
| `businesses`          | featured_until                       | Featured placement queries          |
| `reviews`             | business_id, created_at              | Review listing and sorting          |
| `featured_placements` | council_id, status, start_date       | FIFO queue management               |
| `payment_audit`       | stripe_event_id                      | Idempotency check                   |
| `triage_logs`         | timestamp, classification            | Audit trail queries                 |
| `emergency_contacts`  | council_id, contact_type             | Emergency resource lookup           |

**Success Criteria:**

- ✅ All indexes created
- ✅ Indexes optimized for query patterns
- ✅ Migration file committed to `supabase/migrations/`
- ✅ No SQL errors during migration

**Dependencies:** Step 3 (Foreign Keys) complete

---

#### Step 5: RLS Policies

**Workflow Step:** `step-05-rls-policies.md`  
**Agent:** Database Schema Architect (Expert)  
**Estimated Time:** 4 hours

**RLS Policies to Implement:**

| Table                 | Policy              | Access Rule                      |
| --------------------- | ------------------- | -------------------------------- |
| `users`               | Trainer-only access | `auth.uid() = id`                |
| `businesses`          | Trainer-only access | `auth.uid() = user_id`           |
| `businesses`          | Public read         | `is_verified = true`             |
| `reviews`             | Public read         | `moderation_status = 'approved'` |
| `featured_placements` | Admin-only access   | `is_admin()`                     |
| `payment_audit`       | Admin-only access   | `is_admin()`                     |
| `triage_logs`         | Admin-only access   | `is_admin()`                     |
| `emergency_contacts`  | Public read         | Always accessible                |

**Success Criteria:**

- ✅ All RLS policies defined
- ✅ Trainer-only access enforced for their data
- ✅ Admin-only access enforced for sensitive operations
- ✅ Public read access for verified data
- ✅ Migration file committed to `supabase/migrations/`

**Dependencies:** Step 4 (Indexes) complete

---

#### Step 6: Triggers Creation

**Workflow Step:** `step-06-triggers-creation.md`  
**Agent:** Database Schema Architect (Expert)  
**Estimated Time:** 3 hours

**Triggers to Implement:**

| Trigger                 | Event                                         | Purpose                        |
| ----------------------- | --------------------------------------------- | ------------------------------ |
| `update_featured_until` | BEFORE INSERT/UPDATE on `featured_placements` | Auto-calculate expiry date     |
| `audit_payment`         | AFTER INSERT on `payment_audit`               | Log payment events             |
| `audit_triage`          | AFTER INSERT on `triage_logs`                 | Log triage events              |
| `update_business_stats` | AFTER INSERT/UPDATE on `reviews`              | Update business rating average |

**Success Criteria:**

- ✅ All triggers created
- ✅ Triggers execute correctly on events
- ✅ Migration file committed to `supabase/migrations/`
- ✅ No SQL errors during migration

**Dependencies:** Step 5 (RLS Policies) complete

---

#### Step 7: Seed Councils

**Workflow Step:** `step-07-seed-councils.md`  
**Agent:** Database Schema Architect (Expert)  
**Estimated Time:** 2 hours

**Councils to Seed:**

28 councils across Victoria, Australia (from [`02_DOMAIN_MODEL.md`](DOCS/02_DOMAIN_MODEL.md:1)):

- Melbourne City Council
- Port Phillip City Council
- Stonnington City Council
- Boroondara City Council
- Whitehorse City Council
- Manningham City Council
- Monash City Council
- Glen Eira City Council
- Bayside City Council
- Kingston City Council
- Greater Dandenong City Council
- Casey City Council
- Frankston City Council
- Mornington Peninsula Shire
- Wyndham City Council
- Hobsons Bay City Council
- Maribyrnong City Council
- Moonee Valley City Council
- Brimbank City Council
- Melton City Council
- Hume City Council
- Whittlesea City Council
- Darebin City Council
- Moreland City Council
- Yarra City Council
- Nillumbik Shire
- Banyule City Council
- Knox City Council

**Success Criteria:**

- ✅ All 28 councils seeded
- ✅ Council data matches specification
- ✅ Migration file committed to `supabase/migrations/`
- ✅ No SQL errors during migration

**Dependencies:** Step 6 (Triggers) complete

---

#### Step 8: Seed Suburbs

**Workflow Step:** `step-08-seed-suburbs.md`  
**Agent:** Database Schema Architect (Expert)  
**Estimated Time:** 3 hours

**Suburbs to Seed:**

200+ suburbs across all 28 councils (from CSV file in [`02_DOMAIN_MODEL.md`](DOCS/02_DOMAIN_MODEL.md:1))

**Success Criteria:**

- ✅ All 200+ suburbs seeded
- ✅ Suburbs linked to correct councils
- ✅ Migration file committed to `supabase/migrations/`
- ✅ No SQL errors during migration

**Dependencies:** Step 7 (Seed Councils) complete

---

#### Step 9: Verification

**Workflow Step:** `step-09-verification.md`  
**Agent:** Database Schema Architect (Expert)  
**Estimated Time:** 2 hours

**Verification Checks:**

| Check                 | Method                                       | Expected Result     |
| --------------------- | -------------------------------------------- | ------------------- |
| Enum types exist      | Query `pg_enum`                              | 7 enum types        |
| Tables exist          | Query `information_schema.tables`            | 10 tables           |
| Foreign keys exist    | Query `information_schema.table_constraints` | 9 foreign keys      |
| Indexes exist         | Query `pg_indexes`                           | 8+ indexes          |
| RLS policies exist    | Query `pg_policies`                          | 8+ policies         |
| Triggers exist        | Query `pg_trigger`                           | 4 triggers          |
| Councils seeded       | Query `councils` table                       | 28 rows             |
| Suburbs seeded        | Query `localities` table                     | 200+ rows           |
| Referential integrity | Test foreign key constraints                 | No orphaned records |

**Success Criteria:**

- ✅ All verification checks pass
- ✅ Data integrity verified
- ✅ No orphaned records
- ✅ Database ready for Phase 2

**Dependencies:** Step 8 (Seed Suburbs) complete

---

### Phase 1 Success Criteria

| Criterion                | Target | Measurement                       |
| ------------------------ | ------ | --------------------------------- |
| Database Schema Complete | 100%   | All 10 tables, 12 enums created   |
| Foreign Keys             | 9/9    | All relationships defined         |
| RLS Policies             | 8/8    | All access controls implemented   |
| Indexes                  | 8+     | Performance optimization complete |
| Seed Data                | 100%   | 28 councils, 200+ suburbs seeded  |
| Data Integrity           | 100%   | No orphaned records               |
| Migration Files          | 9/9    | All migrations committed          |

---

## DTD Phase 2: Core Features Implementation

### Overview

**DTD Phase 2:** Core Features  
**Duration:** 2 weeks  
**BMAD Agent:** API Contract Designer (Expert)  
**Workflow:** API Contract Implementation  
**Documentation Reference:** [`05_DATA_AND_API_CONTRACTS.md`](DOCS/05_DATA_AND_API_CONTRACTS.md:1)

### Objectives

1. Design 25+ REST endpoints (public/trainer/admin)
2. Create TypeScript type definitions
3. Implement Zod validation schemas
4. Implement MFA authentication (D-013)
5. Generate OpenAPI documentation
6. Implement rate limiting strategies
7. Implement error handling

### Detailed Implementation Steps

#### Step 1: Endpoint Design

**Workflow Step:** `step-01-endpoint-design.md`  
**Agent:** API Contract Designer (Expert)  
**Estimated Time:** 6 hours

**Endpoint Categories:**

**Public Endpoints (Dog Owner Access):**

| Method | Path                        | Purpose                | Auth Required |
| ------ | --------------------------- | ---------------------- | ------------- |
| GET    | `/api/trainers`             | Search trainers        | No            |
| GET    | `/api/trainers/:id`         | Get trainer details    | No            |
| GET    | `/api/trainers/:id/reviews` | Get trainer reviews    | No            |
| POST   | `/api/triage`               | Emergency triage       | No            |
| GET    | `/api/emergency/:councilId` | Get emergency contacts | No            |

**Trainer Endpoints (Trainer Access):**

| Method | Path                            | Purpose                     | Auth Required |
| ------ | ------------------------------- | --------------------------- | ------------- |
| POST   | `/api/trainers/register`        | Register trainer            | Email OTP     |
| POST   | `/api/trainers/verify-otp`      | Verify email OTP            | No            |
| POST   | `/api/trainers/login`           | Login                       | Email OTP     |
| POST   | `/api/trainers/profile`         | Create/update profile       | JWT + TOTP    |
| PUT    | `/api/trainers/profile`         | Update profile              | JWT + TOTP    |
| POST   | `/api/trainers/featured`        | Purchase featured placement | JWT + TOTP    |
| GET    | `/api/trainers/featured/status` | Get featured status         | JWT + TOTP    |

**Admin Endpoints (Admin Access):**

| Method | Path                             | Purpose             | Auth Required |
| ------ | -------------------------------- | ------------------- | ------------- |
| POST   | `/api/admin/login`               | Admin login         | TOTP          |
| GET    | `/api/admin/dashboard`           | Get dashboard data  | TOTP          |
| GET    | `/api/admin/reviews/pending`     | Get pending reviews | TOTP          |
| POST   | `/api/admin/reviews/:id/approve` | Approve review      | TOTP          |
| POST   | `/api/admin/reviews/:id/reject`  | Reject review       | TOTP          |
| GET    | `/api/admin/alerts`              | Get red alerts      | TOTP          |
| POST   | `/api/admin/refunds/:id`         | Process refund      | TOTP          |
| GET    | `/api/admin/health`              | Get system health   | TOTP          |

**Success Criteria:**

- ✅ All 25+ endpoints designed
- ✅ HTTP methods and paths defined
- ✅ Authentication requirements specified
- ✅ Endpoint documentation generated

**Dependencies:** DTD Phase 1 complete

---

#### Step 2: TypeScript Types

**Workflow Step:** `step-02-typescript-types.md`  
**Agent:** API Contract Designer (Expert)  
**Estimated Time:** 8 hours

**Type Categories:**

**Request DTOs:**

```typescript
// Public Requests
interface SearchTrainersRequest {
  councilId?: string;
  localityId?: string;
  dogAgeGroup?: DogAgeGroup;
  behaviorIssue?: DogBehaviorIssue;
  serviceType?: DogServiceType;
  page?: number;
  limit?: number;
}

interface TriageRequest {
  message: string;
  councilId: string;
  contactInfo?: string;
}

// Trainer Requests
interface RegisterTrainerRequest {
  email: string;
  phone: string;
  abn: string;
}

interface CreateProfileRequest {
  name: string;
  abn: string;
  localityId: string;
  councilId: string;
  ageGroups: DogAgeGroup[];
  behaviorIssues: DogBehaviorIssue[];
  serviceTypes: DogServiceType[];
  description: string;
  website?: string;
  socialMedia?: string;
  emergencyPhone?: string;
}

interface PurchaseFeaturedRequest {
  councilId: string;
  duration: number; // days
}

// Admin Requests
interface ApproveReviewRequest {
  reviewId: string;
}

interface ProcessRefundRequest {
  paymentAuditId: string;
  reason: string;
}
```

**Response DTOs:**

```typescript
interface TrainerResponse {
  id: string;
  name: string;
  locality: string;
  council: string;
  isVerified: boolean;
  featuredUntil?: string;
  rating: number;
  reviewCount: number;
  ageGroups: DogAgeGroup[];
  behaviorIssues: DogBehaviorIssue[];
  serviceTypes: DogServiceType[];
  description: string;
}

interface SearchTrainersResponse {
  trainers: TrainerResponse[];
  total: number;
  page: number;
  limit: number;
}

interface TriageResponse {
  classification: DogTriageClassification;
  confidence: number;
  aiProvider: string;
  emergencyContacts?: EmergencyContact[];
  message: string;
}

interface DashboardResponse {
  pendingReviews: number;
  redAlerts: number;
  activeFeatured: number;
  revenueThisMonth: number;
  triageCountToday: number;
}
```

**Domain Types:**

```typescript
enum DogAgeGroup {
  PUPPY = "puppy",
  ADOLESCENT = "adolescent",
  ADULT = "adult",
  SENIOR = "senior",
  GERIATRIC = "geriatric",
}

enum DogBehaviorIssue {
  AGGRESSION = "aggression",
  ANXIETY = "anxiety",
  FEAR = "fear",
  REACTIVITY = "reactivity",
  SEPARATION = "separation",
  BARKING = "barking",
  BITING = "biting",
  CHEWING = "chewing",
  DIGGING = "digging",
  JUMPING = "jumping",
  PULLING = "pulling",
  HOUSEBREAKING = "housebreaking",
  OTHER = "other",
}

enum DogServiceType {
  TRAINING = "training",
  BEHAVIOR_MODIFICATION = "behavior_modification",
  PUPPY_TRAINING = "puppy_training",
  SOCIALIZATION = "socialization",
  OTHER = "other",
}

enum DogTriageClassification {
  MEDICAL = "medical",
  CRISIS = "crisis",
  STRAY = "stray",
  NORMAL = "normal",
}

enum ReviewModerationStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

enum FeaturedPlacementStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  PENDING = "pending",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}
```

**Error Types:**

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: any;
}

interface ValidationError extends ApiError {
  code: "VALIDATION_ERROR";
  fields: Record<string, string>;
}

interface AuthenticationError extends ApiError {
  code: "AUTHENTICATION_ERROR";
}

interface AuthorizationError extends ApiError {
  code: "AUTHORIZATION_ERROR";
}

interface NotFoundError extends ApiError {
  code: "NOT_FOUND";
}
```

**Success Criteria:**

- ✅ All request DTOs created
- ✅ All response DTOs created
- ✅ All domain types defined
- ✅ All error types defined
- ✅ Types saved to `src/types/`

**Dependencies:** Step 1 (Endpoint Design) complete

---

#### Step 3: Validation Schemas

**Workflow Step:** `step-03-validation-schemas.md`  
**Agent:** API Contract Designer (Expert)  
**Estimated Time:** 6 hours

**Zod Schemas:**

```typescript
import { z } from "zod";

// Public Request Schemas
export const searchTrainersSchema = z.object({
  councilId: z.string().uuid().optional(),
  localityId: z.string().uuid().optional(),
  dogAgeGroup: z.nativeEnum(DogAgeGroup).optional(),
  behaviorIssue: z.nativeEnum(DogBehaviorIssue).optional(),
  serviceType: z.nativeEnum(DogServiceType).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const triageSchema = z.object({
  message: z.string().min(10).max(1000),
  councilId: z.string().uuid(),
  contactInfo: z.string().optional(),
});

// Trainer Request Schemas
export const registerTrainerSchema = z.object({
  email: z.string().email(),
  phone: z.string().regex(/^04\d{8}$/), // Australian mobile
  abn: z.string().regex(/^\d{11}$/), // 11-digit ABN
});

export const createProfileSchema = z.object({
  name: z.string().min(1).max(100),
  abn: z.string().regex(/^\d{11}$/),
  localityId: z.string().uuid(),
  councilId: z.string().uuid(),
  ageGroups: z.array(z.nativeEnum(DogAgeGroup)).min(1),
  behaviorIssues: z.array(z.nativeEnum(DogBehaviorIssue)).min(1),
  serviceTypes: z.array(z.nativeEnum(DogServiceType)).min(1),
  description: z.string().min(50).max(2000),
  website: z.string().url().optional(),
  socialMedia: z.string().url().optional(),
  emergencyPhone: z
    .string()
    .regex(/^04\d{8}$/)
    .optional(),
});

export const purchaseFeaturedSchema = z.object({
  councilId: z.string().uuid(),
  duration: z.number().int().positive().max(30), // max 30 days
});

// Admin Request Schemas
export const approveReviewSchema = z.object({
  reviewId: z.string().uuid(),
});

export const processRefundSchema = z.object({
  paymentAuditId: z.string().uuid(),
  reason: z.string().min(10).max(500),
});
```

**Success Criteria:**

- ✅ All request schemas created with Zod
- ✅ Validation rules match business requirements
- ✅ Custom validators implemented (ABN, phone)
- ✅ Schemas saved to `src/lib/validation/`

**Dependencies:** Step 2 (TypeScript Types) complete

---

#### Step 4: Authentication Middleware

**Workflow Step:** `step-04-authentication-middleware.md`  
**Agent:** API Contract Designer (Expert)  
**Estimated Time:** 8 hours

**Authentication Implementation (D-013: MFA):**

**Email OTP Flow:**

```typescript
// Generate and send OTP
export async function generateEmailOTP(email: string): Promise<string> {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await supabase.from("otps").insert({
    email,
    otp: await hashOTP(otp),
    expiresAt,
  });

  await sendEmailOTP(email, otp);
  return otp;
}

// Verify OTP
export async function verifyEmailOTP(
  email: string,
  otp: string
): Promise<boolean> {
  const result = await supabase
    .from("otps")
    .select("*")
    .eq("email", email)
    .eq("otp", await hashOTP(otp))
    .gt("expiresAt", new Date())
    .single();

  if (!result) return false;

  // Delete used OTP
  await supabase.from("otps").delete().eq("id", result.id);
  return true;
}
```

**JWT + TOTP Flow:**

```typescript
// Generate JWT
export function generateJWT(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

// Verify JWT
export function verifyJWT(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

// Generate TOTP secret
export function generateTOTPSecret(): string {
  return authenticator.generateSecret();
}

// Verify TOTP
export function verifyTOTP(token: string, secret: string): boolean {
  return authenticator.verify({
    token,
    secret,
  });
}
```

**Middleware Implementation:**

```typescript
// Public access (no auth)
export const publicAccess = async (req: NextRequest) => {
  return req;
};

// Email OTP required
export const emailOTPRequired = async (req: NextRequest) => {
  const otp = req.headers.get("x-otp");
  const email = req.headers.get("x-email");

  if (!otp || !email) {
    throw new AuthenticationError("OTP and email required");
  }

  const isValid = await verifyEmailOTP(email, otp);
  if (!isValid) {
    throw new AuthenticationError("Invalid or expired OTP");
  }

  return req;
};

// JWT + TOTP required (trainer routes)
export const trainerAuthRequired = async (req: NextRequest) => {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new AuthenticationError("JWT token required");
  }

  const payload = verifyJWT(token);
  if (!payload) {
    throw new AuthenticationError("Invalid or expired JWT");
  }

  const totp = req.headers.get("x-totp");
  if (!totp) {
    throw new AuthenticationError("TOTP token required");
  }

  const user = await supabase
    .from("users")
    .select("*")
    .eq("id", payload.userId)
    .single();
  if (!user) {
    throw new AuthenticationError("User not found");
  }

  const isValid = verifyTOTP(totp, user.totpSecret);
  if (!isValid) {
    throw new AuthenticationError("Invalid TOTP token");
  }

  req.userId = payload.userId;
  return req;
};

// TOTP required (admin routes)
export const adminAuthRequired = async (req: NextRequest) => {
  const totp = req.headers.get("x-totp");

  if (!totp) {
    throw new AuthenticationError("TOTP token required");
  }

  const isValid = verifyTOTP(totp, process.env.ADMIN_TOTP_SECRET);
  if (!isValid) {
    throw new AuthenticationError("Invalid TOTP token");
  }

  return req;
};
```

**Success Criteria:**

- ✅ Email OTP flow implemented
- ✅ JWT + TOTP flow implemented
- ✅ Middleware functions created
- ✅ D-013 (MFA) requirements met
- ✅ Authentication saved to `src/lib/auth/`

**Dependencies:** Step 3 (Validation Schemas) complete

---

#### Step 5: Error Handling

**Workflow Step:** `step-05-error-handling.md`  
**Agent:** API Contract Designer (Expert)  
**Estimated Time:** 4 hours

**Error Handling Implementation:**

```typescript
// Error classes
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationError extends ApiError {
  constructor(public fields: Record<string, string>) {
    super("VALIDATION_ERROR", "Validation failed", 400, { fields });
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = "Authentication failed") {
    super("AUTHENTICATION_ERROR", message, 401);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = "Authorization failed") {
    super("AUTHORIZATION_ERROR", message, 403);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = "Resource") {
    super("NOT_FOUND", `${resource} not found`, 404);
    this.name = "NotFoundError";
  }
}

// Error handler middleware
export function errorHandler(err: Error, req: NextRequest, res: NextResponse) {
  console.error("Error:", err);

  if (err instanceof ApiError) {
    return NextResponse.json(
      {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      { status: err.statusCode }
    );
  }

  // Unknown error
  return NextResponse.json(
    {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
    { status: 500 }
  );
}

// Async handler wrapper
export function asyncHandler(fn: Function) {
  return async (req: NextRequest, res: NextResponse, next: Function) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      errorHandler(err, req, res);
    }
  };
}
```

**Success Criteria:**

- ✅ Error classes defined
- ✅ Error handler middleware implemented
- ✅ Async handler wrapper created
- ✅ Error handling saved to `src/lib/errors/`

**Dependencies:** Step 4 (Authentication Middleware) complete

---

#### Step 6: Rate Limiting

**Workflow Step:** `step-06-rate-limiting.md`  
**Agent:** API Contract Designer (Expert)  
**Estimated Time:** 4 hours

**Rate Limiting Implementation:**

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create rate limiter
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
  analytics: true,
});

// Rate limiting middleware
export async function rateLimit(
  req: NextRequest,
  identifier: string
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const result = await ratelimit.limit(identifier);

  if (!result.success) {
    throw new ApiError(
      "RATE_LIMIT_EXCEEDED",
      "Too many requests. Please try again later.",
      429,
      {
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      }
    );
  }

  return result;
}

// Apply rate limiting by endpoint type
export const publicRateLimit = async (req: NextRequest) => {
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return rateLimit(req, `public:${ip}`);
};

export const trainerRateLimit = async (req: NextRequest) => {
  const userId = req.userId;
  return rateLimit(req, `trainer:${userId}`);
};

export const adminRateLimit = async (req: NextRequest) => {
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return rateLimit(req, `admin:${ip}`);
};
```

**Rate Limiting Strategy:**

| Endpoint Type               | Limit       | Window     | Rationale                           |
| --------------------------- | ----------- | ---------- | ----------------------------------- |
| Public (search, triage)     | 10 requests | 10 seconds | Prevent abuse, allow legitimate use |
| Trainer (profile, featured) | 20 requests | 1 minute   | Allow normal operations             |
| Admin (dashboard, reviews)  | 30 requests | 1 minute   | Allow efficient operations          |

**Success Criteria:**

- ✅ Rate limiting middleware implemented
- ✅ Different limits for endpoint types
- ✅ Rate limiting saved to `src/lib/rate-limit/`

**Dependencies:** Step 5 (Error Handling) complete

---

#### Step 7: Documentation

**Workflow Step:** `step-07-documentation.md`  
**Agent:** API Contract Designer (Expert)  
**Estimated Time:** 6 hours

**OpenAPI Documentation:**

```typescript
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";

const registry = new OpenAPIRegistry();

// Register schemas
registry.registerComponent(
  "schemas",
  "SearchTrainersRequest",
  searchTrainersSchema
);
registry.registerComponent("schemas", "TriageRequest", triageSchema);
registry.registerComponent("schemas", "TrainerResponse", trainerResponseSchema);
// ... more schemas

// Register endpoints
registry.registerPath({
  method: "get",
  path: "/api/trainers",
  tags: ["Public"],
  summary: "Search trainers",
  description:
    "Search for dog trainers by location, dog age, behavior issue, or service type",
  request: {
    query: searchTrainersSchema,
  },
  responses: {
    200: {
      description: "Search results",
      content: {
        "application/json": {
          schema: searchTrainersResponseSchema,
        },
      },
    },
  },
});

// ... more endpoints

// Generate OpenAPI spec
const generator = new OpenApiGeneratorV3(registry.definitions);
const openApiSpec = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    title: "Dog Trainers Directory API",
    version: "1.0.0",
    description: "API for the Dog Trainers Directory platform",
  },
  servers: [
    {
      url: "https://api.dogtrainersdirectory.com",
      description: "Production server",
    },
    {
      url: "https://api-staging.dogtrainersdirectory.com",
      description: "Staging server",
    },
  ],
});

// Save OpenAPI spec
fs.writeFileSync("docs/api/openapi.json", JSON.stringify(openApiSpec, null, 2));
```

**Success Criteria:**

- ✅ OpenAPI spec generated
- ✅ All endpoints documented
- ✅ All schemas documented
- ✅ OpenAPI spec saved to `docs/api/openapi.json`

**Dependencies:** Step 6 (Rate Limiting) complete

---

### Phase 2 Success Criteria

| Criterion          | Target          | Measurement                          |
| ------------------ | --------------- | ------------------------------------ |
| Endpoints Designed | 25+             | All public, trainer, admin endpoints |
| TypeScript Types   | 100%            | All DTOs, domain types, error types  |
| Validation Schemas | 100%            | All requests validated with Zod      |
| Authentication     | D-013 compliant | Email OTP + JWT + TOTP implemented   |
| Error Handling     | 100%            | All error cases handled              |
| Rate Limiting      | 100%            | All endpoints rate-limited           |
| Documentation      | 100%            | OpenAPI spec generated               |

---

## DTD Phase 3: Monetisation Implementation

### Overview

**DTD Phase 3:** Monetisation  
**Duration:** 2 weeks  
**BMAD Agent:** Custom Monetisation Implementation  
**Documentation Reference:** [`06_MONETISATION_AND_FEATURED_PLACEMENT.md`](DOCS/06_MONETISATION_AND_FEATURED_PLACEMENT.md:1)

### Objectives

1. Integrate Stripe Checkout
2. Implement webhook handlers
3. Implement featured placement FIFO queue
4. Implement refund handling
5. Implement payment audit logging
6. Implement cron job for queue processing

### Detailed Implementation Steps

#### Step 1: Stripe Checkout Integration

**Estimated Time:** 8 hours

**Implementation:**

```typescript
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Stripe Checkout session
export async function createCheckoutSession(
  businessId: string,
  councilId: string,
  duration: number
): Promise<string> {
  const price = duration * 10; // $10 per day

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "aud",
          product_data: {
            name: `Featured Placement - ${duration} days`,
            description: "Featured placement in Dog Trainers Directory",
          },
          unit_amount: price * 100, // cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/featured/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/featured/cancel`,
    metadata: {
      businessId,
      councilId,
      duration: duration.toString(),
    },
  });

  // Log payment initiation
  await supabase.from("payment_audit").insert({
    businessId,
    councilId,
    stripeEventId: session.id,
    amount: price,
    status: "pending",
    metadata: {
      duration,
      checkoutUrl: session.url,
    },
  });

  return session.url;
}
```

**Success Criteria:**

- ✅ Stripe Checkout session creation implemented
- ✅ Payment initiation logged to `payment_audit`
- ✅ Checkout URL returned to client

**Dependencies:** DTD Phase 2 complete

---

#### Step 2: Webhook Handlers

**Estimated Time:** 6 hours

**Implementation:**

```typescript
// Webhook endpoint
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(
        event.data.object as Stripe.Checkout.Session
      );
      break;
    case "charge.succeeded":
      await handleChargeSucceeded(event.data.object as Stripe.Charge);
      break;
    case "charge.refunded":
      await handleChargeRefunded(event.data.object as Stripe.Charge);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

// Handle checkout session completed
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { businessId, councilId, duration } = session.metadata;

  // Update payment audit
  await supabase
    .from("payment_audit")
    .update({
      status: "completed",
      stripeEventId: session.payment_intent as string,
    })
    .eq("stripeEventId", session.id);

  // Add to featured placement queue
  await supabase.from("featured_placements").insert({
    businessId,
    councilId,
    status: "pending",
    duration: parseInt(duration),
    amount: session.amount_total / 100,
    stripeEventId: session.payment_intent as string,
  });
}

// Handle charge succeeded
async function handleChargeSucceeded(charge: Stripe.Charge) {
  // Update payment audit
  await supabase
    .from("payment_audit")
    .update({
      status: "succeeded",
    })
    .eq("stripeEventId", charge.id);
}

// Handle charge refunded
async function handleChargeRefunded(charge: Stripe.Charge) {
  // Update payment audit
  await supabase
    .from("payment_audit")
    .update({
      status: "refunded",
      refundAmount: charge.amount_refunded / 100,
    })
    .eq("stripeEventId", charge.id);

  // Update featured placement
  await supabase
    .from("featured_placements")
    .update({
      status: "refunded",
    })
    .eq("stripeEventId", charge.id);
}
```

**Success Criteria:**

- ✅ Webhook endpoint implemented
- ✅ `checkout.session.completed` handler implemented
- ✅ `charge.succeeded` handler implemented
- ✅ `charge.refunded` handler implemented
- ✅ Idempotency ensured via `stripeEventId`

**Dependencies:** Step 1 (Stripe Checkout) complete

---

#### Step 3: Featured Placement FIFO Queue

**Estimated Time:** 6 hours

**Implementation:**

```typescript
// Add to queue
export async function addToFeaturedQueue(
  businessId: string,
  councilId: string,
  duration: number
): Promise<void> {
  // Check if council has max 5 active featured placements
  const { count } = await supabase
    .from("featured_placements")
    .select("*", { count: "exact", head: true })
    .eq("councilId", councilId)
    .eq("status", "active");

  if (count >= 5) {
    // Add to queue
    await supabase.from("featured_placements").insert({
      businessId,
      councilId,
      status: "pending",
      duration,
      queuedAt: new Date(),
    });
  } else {
    // Activate immediately
    await activateFeaturedPlacement(businessId, councilId, duration);
  }
}

// Activate featured placement
async function activateFeaturedPlacement(
  businessId: string,
  councilId: string,
  duration: number
): Promise<void> {
  const startDate = new Date();
  const endDate = new Date(
    startDate.getTime() + duration * 24 * 60 * 60 * 1000
  );

  await supabase.from("featured_placements").insert({
    businessId,
    councilId,
    status: "active",
    startDate,
    endDate,
    duration,
  });

  // Update business featured_until
  await supabase
    .from("businesses")
    .update({
      featuredUntil: endDate,
    })
    .eq("id", businessId);
}

// Process queue (cron job)
export async function processFeaturedQueue(): Promise<void> {
  // Expire featured placements
  await supabase
    .from("featured_placements")
    .update({
      status: "expired",
    })
    .lt("endDate", new Date())
    .eq("status", "active");

  // Reset business featured_until
  await supabase
    .from("businesses")
    .update({
      featuredUntil: null,
    })
    .lt("featuredUntil", new Date());

  // Promote from queue (FIFO)
  const { data: pendingPlacements } = await supabase
    .from("featured_placements")
    .select("*")
    .eq("status", "pending")
    .order("queuedAt", { ascending: true });

  for (const placement of pendingPlacements) {
    const { count } = await supabase
      .from("featured_placements")
      .select("*", { count: "exact", head: true })
      .eq("councilId", placement.councilId)
      .eq("status", "active");

    if (count < 5) {
      await activateFeaturedPlacement(
        placement.businessId,
        placement.councilId,
        placement.duration
      );

      await supabase
        .from("featured_placements")
        .update({
          status: "active",
          startDate: new Date(),
          endDate: new Date(
            Date.now() + placement.duration * 24 * 60 * 60 * 1000
          ),
        })
        .eq("id", placement.id);
    }
  }
}
```

**Success Criteria:**

- ✅ FIFO queue implemented
- ✅ Max 5 active per council enforced
- ✅ Queue processing implemented
- ✅ Expiry handling implemented

**Dependencies:** Step 2 (Webhook Handlers) complete

---

#### Step 4: Refund Handling

**Estimated Time:** 4 hours

**Implementation:**

```typescript
// Process refund (admin endpoint)
export async function processRefund(
  paymentAuditId: string,
  reason: string
): Promise<void> {
  // Get payment audit
  const { data: payment } = await supabase
    .from("payment_audit")
    .select("*")
    .eq("id", paymentAuditId)
    .single();

  if (!payment) {
    throw new NotFoundError("Payment not found");
  }

  // Check 3-day refund window (D-011)
  const paymentDate = new Date(payment.createdAt);
  const now = new Date();
  const daysSincePayment =
    (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSincePayment > 3) {
    throw new ApiError(
      "REFUND_WINDOW_EXPIRED",
      "Refund window expired (3 days)",
      400
    );
  }

  // Process Stripe refund
  const refund = await stripe.refunds.create({
    payment_intent: payment.stripeEventId,
    reason: "requested_by_customer",
    metadata: {
      reason,
    },
  });

  // Update payment audit
  await supabase
    .from("payment_audit")
    .update({
      status: "refunded",
      refundAmount: refund.amount / 100,
      refundReason: reason,
      refundedAt: new Date(),
    })
    .eq("id", paymentAuditId);

  // Update featured placement
  await supabase
    .from("featured_placements")
    .update({
      status: "refunded",
    })
    .eq("stripeEventId", payment.stripeEventId);

  // Reset business featured_until
  await supabase
    .from("businesses")
    .update({
      featuredUntil: null,
    })
    .eq("id", payment.businessId);
}
```

**Success Criteria:**

- ✅ Refund processing implemented
- ✅ 3-day refund window enforced (D-011)
- ✅ Stripe refund API called
- ✅ Payment audit updated
- ✅ Featured placement cancelled

**Dependencies:** Step 3 (FIFO Queue) complete

---

#### Step 5: Payment Audit Logging

**Estimated Time:** 4 hours

**Implementation:**

```typescript
// Payment audit table structure (already created in Phase 1)
// - id (UUID, primary key)
// - businessId (UUID, foreign key)
// - councilId (UUID, foreign key)
// - stripeEventId (string, unique, idempotency)
// - amount (decimal)
// - status (enum: pending, completed, succeeded, refunded)
// - refundAmount (decimal, nullable)
// - refundReason (text, nullable)
// - refundedAt (timestamp, nullable)
// - metadata (jsonb)
// - createdAt (timestamp)

// Audit logging functions
export async function logPaymentInitiation(
  businessId: string,
  councilId: string,
  stripeEventId: string,
  amount: number,
  metadata: any
): Promise<void> {
  await supabase.from("payment_audit").insert({
    businessId,
    councilId,
    stripeEventId,
    amount,
    status: "pending",
    metadata,
  });
}

export async function logPaymentCompletion(
  stripeEventId: string
): Promise<void> {
  await supabase
    .from("payment_audit")
    .update({
      status: "completed",
    })
    .eq("stripeEventId", stripeEventId);
}

export async function logPaymentSuccess(stripeEventId: string): Promise<void> {
  await supabase
    .from("payment_audit")
    .update({
      status: "succeeded",
    })
    .eq("stripeEventId", stripeEventId);
}

export async function logPaymentRefund(
  stripeEventId: string,
  refundAmount: number,
  reason: string
): Promise<void> {
  await supabase
    .from("payment_audit")
    .update({
      status: "refunded",
      refundAmount,
      refundReason: reason,
      refundedAt: new Date(),
    })
    .eq("stripeEventId", stripeEventId);
}
```

**Success Criteria:**

- ✅ Payment audit logging implemented
- ✅ Idempotency ensured via `stripeEventId`
- ✅ All payment events logged
- ✅ Immutable audit trail (D-012)

**Dependencies:** Step 4 (Refund Handling) complete

---

#### Step 6: Cron Job for Queue Processing

**Estimated Time:** 4 hours

**Implementation:**

```typescript
// Cron job endpoint (Vercel Cron)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  // Verify cron job secret
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Process featured queue
    await processFeaturedQueue();

    // Log cron job execution
    await supabase.from('cron_jobs').insert({
      jobType: 'featured_queue_processing',
      status: 'success',
      lastRun: new Date(),
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    // Log cron job failure
    await supabase.from('cron_jobs').insert({
      jobType: 'featured_queue_processing',
      status: 'failed',
      lastRun: new Date(),
      error: err.message
    });

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Vercel cron configuration (vercel.json)
{
  "crons": [
    {
      "path": "/api/cron/featured-queue",
      "schedule": "0 2 * * *" // 2am daily
    }
  ]
}
```

**Success Criteria:**

- ✅ Cron job endpoint implemented
- ✅ Queue processing at 2am daily
- ✅ Cron job execution logged
- ✅ Error handling implemented

**Dependencies:** Step 5 (Payment Audit Logging) complete

---

### Phase 3 Success Criteria

| Criterion        | Target | Measurement                           |
| ---------------- | ------ | ------------------------------------- |
| Stripe Checkout  | 100%   | Checkout session creation implemented |
| Webhook Handlers | 100%   | All webhook events handled            |
| FIFO Queue       | 100%   | Max 5 per council, queue processing   |
| Refund Handling  | 100%   | 3-day window enforced (D-011)         |
| Payment Audit    | 100%   | Immutable audit trail (D-012)         |
| Cron Job         | 100%   | Queue processing at 2am daily         |

---

## DTD Phase 4: Emergency Triage Implementation

### Overview

**DTD Phase 4:** Emergency Triage  
**Duration:** 2 weeks  
**BMAD Agent:** AI Integration Specialist (Expert)  
**Workflow:** AI Integration Setup  
**Documentation Reference:** [`07_AI_AUTOMATION_AND_MODES.md`](DOCS/07_AI_AUTOMATION_AND_MODES.md:1)

### Objectives

1. Configure Z.AI client
2. Configure z.ai fallback
3. Implement deterministic keyword matching
4. Implement cascade logic
5. Implement feature flags
6. Implement health monitoring
7. Implement audit logging
8. Validate 80+ test scenarios

### Detailed Implementation Steps

#### Step 1: Z.AI Client Configuration

**Workflow Step:** `step-01-z-ai-client.md`  
**Agent:** AI Integration Specialist (Expert)  
**Estimated Time:** 6 hours

**Implementation:**

```typescript
// Z.AI client configuration
const Z_AI_CONFIG = {
  endpoint: "https://api.z.ai/v1/classify",
  model: "dog-behavior-classifier-v1",
  apiKey: process.env.Z_AI_API_KEY,
  timeout: 5000, // 5 seconds
  confidenceThreshold: 0.85,
};

// Z.AI client
class ZAIClient {
  async classify(message: string): Promise<{
    classification: DogTriageClassification;
    confidence: number;
  }> {
    const response = await fetch(Z_AI_CONFIG.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Z_AI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: Z_AI_CONFIG.model,
        messages: [
          {
            role: "system",
            content:
              "Classify dog emergency messages as medical, crisis, stray, or normal.",
          },
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 10,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(Z_AI_CONFIG.timeout),
    });

    if (!response.ok) {
      throw new Error(`Z.AI API error: ${response.status}`);
    }

    const data = await response.json();
    const classification = data.choices[0].message.content.toLowerCase();
    const confidence = data.confidence || 0.85;

    return {
      classification: this.mapClassification(classification),
      confidence,
    };
  }

  private mapClassification(raw: string): DogTriageClassification {
    if (raw.includes("medical")) return DogTriageClassification.MEDICAL;
    if (raw.includes("crisis")) return DogTriageClassification.CRISIS;
    if (raw.includes("stray")) return DogTriageClassification.STRAY;
    return DogTriageClassification.NORMAL;
  }
}

export const zaiClient = new ZAIClient();
```

**Success Criteria:**

- ✅ Z.AI client configured
- ✅ Classification endpoint implemented
- ✅ Timeout and retry logic implemented
- ✅ Confidence threshold enforced (D-008)

**Dependencies:** DTD Phase 3 complete

---

#### Step 2: z.ai Fallback Configuration

**Workflow Step:** `step-02-openai-fallback.md`  
**Agent:** AI Integration Specialist (Expert)  
**Estimated Time:** 4 hours

**Implementation:**

```typescript
import z.ai from "openai";

// z.ai client configuration
const OPENAI_CONFIG = {
  model: "gpt-4-turbo",
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 10000, // 10 seconds
  costBudget: 50, // $50/month
};

// z.ai client
class z.aiClient {
  private openai: z.ai;
  private monthlyCost: number = 0;

  constructor() {
    this.openai = new z.ai({
      apiKey: OPENAI_CONFIG.apiKey,
    });
  }

  async classify(message: string): Promise<{
    classification: DogTriageClassification;
    confidence: number;
  }> {
    // Check cost budget
    if (this.monthlyCost >= OPENAI_CONFIG.costBudget) {
      throw new Error("z.ai cost budget exceeded");
    }

    const response = await this.openai.chat.completions.create({
      model: OPENAI_CONFIG.model,
      messages: [
        {
          role: "system",
          content:
            "Classify dog emergency messages as medical, crisis, stray, or normal. Respond with only the classification.",
        },
        {
          role: "user",
          content: message,
        },
      ],
      max_tokens: 10,
      temperature: 0,
    });

    // Track cost
    const cost = this.calculateCost(response.usage);
    this.monthlyCost += cost;

    const classification = response.choices[0].message.content.toLowerCase();

    return {
      classification: this.mapClassification(classification),
      confidence: 0.8, // z.ai fallback has lower confidence
    };
  }

  private calculateCost(usage: any): number {
    // gpt-4-turbo pricing: $0.01/1K input, $0.03/1K output
    const inputCost = (usage.prompt_tokens / 1000) * 0.01;
    const outputCost = (usage.completion_tokens / 1000) * 0.03;
    return inputCost + outputCost;
  }

  private mapClassification(raw: string): DogTriageClassification {
    if (raw.includes("medical")) return DogTriageClassification.MEDICAL;
    if (raw.includes("crisis")) return DogTriageClassification.CRISIS;
    if (raw.includes("stray")) return DogTriageClassification.STRAY;
    return DogTriageClassification.NORMAL;
  }

  resetMonthlyCost(): void {
    this.monthlyCost = 0;
  }
}

export const openaiClient = new z.aiClient();
```

**Success Criteria:**

- ✅ z.ai client configured
- ✅ Cost budget tracking implemented
- ✅ Classification endpoint implemented
- ✅ Timeout and retry logic implemented

**Dependencies:** Step 1 (Z.AI Client) complete

---

#### Step 3: Deterministic Keyword Matching

**Workflow Step:** `step-03-deterministic-rules.md`  
**Agent:** AI Integration Specialist (Expert)  
**Estimated Time:** 4 hours

**Implementation:**

```typescript
// Deterministic keyword rules
const KEYWORD_RULES = {
  medical: [
    "bleeding",
    "blood",
    "injury",
    "poisoned",
    "choking",
    "seizure",
    "collapse",
    "unconscious",
    "difficulty breathing",
    "swallowing",
    "vomiting",
    "diarrhea",
    "pain",
    "broken",
    "fracture",
    "burn",
    "heatstroke",
    "hypothermia",
  ],
  crisis: [
    "attacking",
    "fighting",
    "loose",
    "out of control",
    "aggressive",
    "biting",
    "dangerous",
    "emergency",
    "help",
    "urgent",
    "immediately",
  ],
  stray: [
    "found",
    "loose",
    "unknown",
    "stray",
    "lost",
    "wandering",
    "no collar",
    "no owner",
  ],
};

// Deterministic classifier
class DeterministicClassifier {
  classify(message: string): {
    classification: DogTriageClassification;
    confidence: number;
  } {
    const lowerMessage = message.toLowerCase();

    // Check medical keywords
    if (
      KEYWORD_RULES.medical.some((keyword) => lowerMessage.includes(keyword))
    ) {
      return {
        classification: DogTriageClassification.MEDICAL,
        confidence: 0.95,
      };
    }

    // Check crisis keywords
    if (
      KEYWORD_RULES.crisis.some((keyword) => lowerMessage.includes(keyword))
    ) {
      return {
        classification: DogTriageClassification.CRISIS,
        confidence: 0.95,
      };
    }

    // Check stray keywords
    if (KEYWORD_RULES.stray.some((keyword) => lowerMessage.includes(keyword))) {
      return {
        classification: DogTriageClassification.STRAY,
        confidence: 0.95,
      };
    }

    // Default to normal
    return {
      classification: DogTriageClassification.NORMAL,
      confidence: 0.8,
    };
  }
}

export const deterministicClassifier = new DeterministicClassifier();
```

**Success Criteria:**

- ✅ Keyword rules defined
- ✅ Deterministic classifier implemented
- ✅ Confidence scores assigned
- ✅ Default to normal classification

**Dependencies:** Step 2 (z.ai Fallback) complete

---

#### Step 4: Cascade Logic Implementation

**Workflow Step:** `step-04-cascade-logic.md`  
**Agent:** AI Integration Specialist (Expert)  
**Estimated Time:** 6 hours

**Implementation:**

```typescript
// Cascade logic (D-007)
class TriageClassifier {
  private zaiFailureCount: number = 0;
  private zaiFailureStartTime: Date | null = null;

  async classify(message: string): Promise<{
    classification: DogTriageClassification;
    confidence: number;
    provider: string;
  }> {
    // Check if Z.AI has been failing >5 minutes
    if (this.zaiFailureStartTime) {
      const failureDuration = Date.now() - this.zaiFailureStartTime.getTime();
      if (failureDuration > 5 * 60 * 1000) {
        // Skip Z.AI, go to z.ai
        return this.classifyWithz.ai(message);
      }
    }

    // Try Z.AI (primary tier)
    try {
      const result = await zaiClient.classify(message);

      // Check confidence threshold (D-008)
      if (result.confidence >= 0.85) {
        this.zaiFailureCount = 0;
        this.zaiFailureStartTime = null;
        return {
          ...result,
          provider: "zai",
        };
      }
    } catch (err) {
      this.zaiFailureCount++;
      if (!this.zaiFailureStartTime) {
        this.zaiFailureStartTime = new Date();
      }
    }

    // Try z.ai (secondary tier)
    try {
      const result = await openaiClient.classify(message);
      return {
        ...result,
        provider: "openai",
      };
    } catch (err) {
      // Fall through to deterministic
    }

    // Use deterministic rules (final fallback)
    const result = deterministicClassifier.classify(message);
    return {
      ...result,
      provider: "deterministic",
    };
  }

  private async classifyWithz.ai(message: string): Promise<{
    classification: DogTriageClassification;
    confidence: number;
    provider: string;
  }> {
    try {
      const result = await openaiClient.classify(message);
      return {
        ...result,
        provider: "openai",
      };
    } catch (err) {
      const result = deterministicClassifier.classify(message);
      return {
        ...result,
        provider: "deterministic",
      };
    }
  }
}

export const triageClassifier = new TriageClassifier();
```

**Success Criteria:**

- ✅ Cascade logic implemented (Z.AI → z.ai → Deterministic)
- ✅ Z.AI failure tracking implemented
- ✅ 5-minute failure threshold enforced (D-007)
- ✅ Confidence threshold enforced (D-008)

**Dependencies:** Step 3 (Deterministic Rules) complete

---

#### Step 5: Feature Flags Configuration

**Workflow Step:** `step-05-feature-flags.md`  
**Agent:** AI Integration Specialist (Expert)  
**Estimated Time:** 4 hours

**Implementation:**

```typescript
// Feature flags configuration
const FEATURE_FLAGS = {
  AI_ENABLED: process.env.AI_ENABLED === "true",
  AI_MODE: process.env.AI_MODE || "cascade", // 'zai', 'openai', 'deterministic', 'cascade'
  Z_AI_ENABLED: process.env.Z_AI_ENABLED === "true",
  OPENAI_ENABLED: process.env.OPENAI_ENABLED === "true",
  CONFIDENCE_THRESHOLD: parseFloat(process.env.CONFIDENCE_THRESHOLD || "0.85"),
  Z_AI_FAILURE_THRESHOLD: parseInt(process.env.Z_AI_FAILURE_THRESHOLD || "5"), // minutes
};

// Feature flag checker
class FeatureFlags {
  isAIEnabled(): boolean {
    return FEATURE_FLAGS.AI_ENABLED;
  }

  getAIMode(): string {
    return FEATURE_FLAGS.AI_MODE;
  }

  isZAIEnabled(): boolean {
    return FEATURE_FLAGS.Z_AI_ENABLED;
  }

  isz.aiEnabled(): boolean {
    return FEATURE_FLAGS.OPENAI_ENABLED;
  }

  getConfidenceThreshold(): number {
    return FEATURE_FLAGS.CONFIDENCE_THRESHOLD;
  }

  getZAIFailureThreshold(): number {
    return FEATURE_FLAGS.Z_AI_FAILURE_THRESHOLD;
  }
}

export const featureFlags = new FeatureFlags();

// Updated triage classifier with feature flags
class TriageClassifierWithFlags {
  async classify(message: string): Promise<{
    classification: DogTriageClassification;
    confidence: number;
    provider: string;
  }> {
    // Check if AI is enabled
    if (!featureFlags.isAIEnabled()) {
      const result = deterministicClassifier.classify(message);
      return {
        ...result,
        provider: "deterministic",
      };
    }

    // Check AI mode
    const mode = featureFlags.getAIMode();

    switch (mode) {
      case "zai":
        if (featureFlags.isZAIEnabled()) {
          const result = await zaiClient.classify(message);
          return { ...result, provider: "zai" };
        }
        break;
      case "openai":
        if (featureFlags.isz.aiEnabled()) {
          const result = await openaiClient.classify(message);
          return { ...result, provider: "openai" };
        }
        break;
      case "deterministic":
        const result = deterministicClassifier.classify(message);
        return { ...result, provider: "deterministic" };
      case "cascade":
        return triageClassifier.classify(message);
    }

    // Default to deterministic
    const result = deterministicClassifier.classify(message);
    return { ...result, provider: "deterministic" };
  }
}

export const triageClassifierWithFlags = new TriageClassifierWithFlags();
```

**Success Criteria:**

- ✅ Feature flags implemented
- ✅ AI mode switching supported
- ✅ Provider-specific flags implemented
- ✅ Confidence threshold configurable

**Dependencies:** Step 4 (Cascade Logic) complete

---

#### Step 6: Health Monitoring

**Workflow Step:** `step-06-health-monitoring.md`  
**Agent:** AI Integration Specialist (Expert)  
**Estimated Time:** 6 hours

**Implementation:**

```typescript
// Health monitoring
class AIHealthMonitor {
  private zaiHealth: {
    status: "healthy" | "degraded" | "down";
    lastCheck: Date;
    failureCount: number;
    responseTime: number;
  } = {
    status: "healthy",
    lastCheck: new Date(),
    failureCount: 0,
    responseTime: 0,
  };

  private openaiHealth: {
    status: "healthy" | "degraded" | "down";
    lastCheck: Date;
    failureCount: number;
    responseTime: number;
  } = {
    status: "healthy",
    lastCheck: new Date(),
    failureCount: 0,
    responseTime: 0,
  };

  async checkZAIHealth(): Promise<void> {
    const startTime = Date.now();

    try {
      await zaiClient.classify("health check");
      const responseTime = Date.now() - startTime;

      this.zaiHealth = {
        status: responseTime > 3000 ? "degraded" : "healthy",
        lastCheck: new Date(),
        failureCount: 0,
        responseTime,
      };
    } catch (err) {
      this.zaiHealth.failureCount++;
      this.zaiHealth.lastCheck = new Date();

      if (this.zaiHealth.failureCount >= 3) {
        this.zaiHealth.status = "down";
      }
    }
  }

  async checkz.aiHealth(): Promise<void> {
    const startTime = Date.now();

    try {
      await openaiClient.classify("health check");
      const responseTime = Date.now() - startTime;

      this.openaiHealth = {
        status: responseTime > 5000 ? "degraded" : "healthy",
        lastCheck: new Date(),
        failureCount: 0,
        responseTime,
      };
    } catch (err) {
      this.openaiHealth.failureCount++;
      this.openaiHealth.lastCheck = new Date();

      if (this.openaiHealth.failureCount >= 3) {
        this.openaiHealth.status = "down";
      }
    }
  }

  async checkAllHealth(): Promise<{
    zai: typeof this.zaiHealth;
    openai: typeof this.openaiHealth;
  }> {
    await Promise.all([this.checkZAIHealth(), this.checkz.aiHealth()]);

    return {
      zai: this.zaiHealth,
      openai: this.openaiHealth,
    };
  }

  getHealthStatus(): {
    zai: typeof this.zaiHealth;
    openai: typeof this.openaiHealth;
  } {
    return {
      zai: this.zaiHealth,
      openai: this.openaiHealth,
    };
  }

  shouldAlertOperator(): boolean {
    // Alert if Z.AI down >30 minutes
    if (this.zaiHealth.status === "down") {
      const downDuration = Date.now() - this.zaiHealth.lastCheck.getTime();
      if (downDuration > 30 * 60 * 1000) {
        return true;
      }
    }

    return false;
  }
}

export const aiHealthMonitor = new AIHealthMonitor();

// Health check endpoint
export async function GET(req: NextRequest) {
  const health = await aiHealthMonitor.checkAllHealth();

  return NextResponse.json({
    status: "ok",
    health,
    timestamp: new Date(),
  });
}
```

**Success Criteria:**

- ✅ Health monitoring implemented
- ✅ Provider health checks implemented
- ✅ Alert operator if Z.AI down >30 minutes
- ✅ Health check endpoint implemented

**Dependencies:** Step 5 (Feature Flags) complete

---

#### Step 7: Audit Logging

**Workflow Step:** `step-07-audit-logging.md`  
**Agent:** AI Integration Specialist (Expert)  
**Estimated Time:** 4 hours

**Implementation:**

```typescript
// Audit logging for triage
export async function logTriage(
  message: string,
  classification: DogTriageClassification,
  confidence: number,
  provider: string,
  councilId: string
): Promise<void> {
  await supabase.from("triage_logs").insert({
    message,
    classification,
    confidence,
    aiProvider: provider,
    councilId,
    timestamp: new Date(),
  });
}

// Audit logging for review moderation
export async function logReviewModeration(
  reviewId: string,
  classification: "spam" | "not_spam",
  confidence: number,
  provider: string
): Promise<void> {
  await supabase.from("review_moderation_logs").insert({
    reviewId,
    classification,
    confidence,
    aiProvider: provider,
    timestamp: new Date(),
  });
}

// Triage endpoint with audit logging
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message, councilId } = body;

  // Validate request
  const validated = triageSchema.parse(body);

  // Classify
  const result = await triageClassifierWithFlags.classify(message);

  // Log audit
  await logTriage(
    message,
    result.classification,
    result.confidence,
    result.provider,
    councilId
  );

  // Get emergency contacts if medical/crisis
  let emergencyContacts: EmergencyContact[] | undefined;
  if (
    result.classification === DogTriageClassification.MEDICAL ||
    result.classification === DogTriageClassification.CRISIS
  ) {
    const { data } = await supabase
      .from("emergency_contacts")
      .select("*")
      .eq("councilId", councilId);

    emergencyContacts = data;
  }

  return NextResponse.json({
    classification: result.classification,
    confidence: result.confidence,
    provider: result.provider,
    emergencyContacts,
    message: getTriageMessage(result.classification),
  });
}

function getTriageMessage(classification: DogTriageClassification): string {
  switch (classification) {
    case DogTriageClassification.MEDICAL:
      return "This appears to be a medical emergency. Please contact your nearest emergency vet immediately.";
    case DogTriageClassification.CRISIS:
      return "This appears to be a crisis situation. Please contact emergency services or a professional dog trainer immediately.";
    case DogTriageClassification.STRAY:
      return "This appears to be a stray dog. Please contact your local council or animal shelter.";
    case DogTriageClassification.NORMAL:
      return "This does not appear to be an emergency. Please search for a dog trainer in your area.";
  }
}
```

**Success Criteria:**

- ✅ Triage audit logging implemented
- ✅ Review moderation audit logging implemented
- ✅ All AI decisions logged
- ✅ Audit trail immutable

**Dependencies:** Step 6 (Health Monitoring) complete

---

#### Step 8: Testing and Validation

**Workflow Step:** `step-08-testing-validation.md`  
**Agent:** AI Integration Specialist (Expert)  
**Estimated Time:** 12 hours

**Test Scenarios (80+ total):**

**Medical Classification (20 scenarios):**

| Scenario                     | Expected Classification | Expected Confidence |
| ---------------------------- | ----------------------- | ------------------- |
| "My dog is bleeding heavily" | medical                 | 0.95+               |
| "My dog swallowed poison"    | medical                 | 0.95+               |
| "My dog is choking"          | medical                 | 0.95+               |
| "My dog had a seizure"       | medical                 | 0.95+               |
| "My dog collapsed"           | medical                 | 0.95+               |
| ... (15 more scenarios)      | medical                 | 0.95+               |

**Crisis Classification (20 scenarios):**

| Scenario                             | Expected Classification | Expected Confidence |
| ------------------------------------ | ----------------------- | ------------------- |
| "My dog is attacking another dog"    | crisis                  | 0.95+               |
| "My dog is fighting"                 | crisis                  | 0.95+               |
| "My dog is loose and out of control" | crisis                  | 0.95+               |
| "Emergency! My dog is dangerous"     | crisis                  | 0.95+               |
| ... (16 more scenarios)              | crisis                  | 0.95+               |

**Stray Classification (20 scenarios):**

| Scenario                         | Expected Classification | Expected Confidence |
| -------------------------------- | ----------------------- | ------------------- |
| "I found a loose dog"            | stray                   | 0.95+               |
| "There's a stray dog in my yard" | stray                   | 0.95+               |
| "Unknown dog wandering"          | stray                   | 0.95+               |
| "Lost dog with no collar"        | stray                   | 0.95+               |
| ... (16 more scenarios)          | stray                   | 0.95+               |

**Normal Classification (20 scenarios):**

| Scenario                            | Expected Classification | Expected Confidence |
| ----------------------------------- | ----------------------- | ------------------- |
| "I need a dog trainer for my puppy" | normal                  | 0.80+               |
| "Looking for obedience training"    | normal                  | 0.80+               |
| "My dog barks too much"             | normal                  | 0.80+               |
| "Need help with separation anxiety" | normal                  | 0.80+               |
| ... (16 more scenarios)             | normal                  | 0.80+               |

**Test Implementation:**

```typescript
// Test suite
describe('TriageClassifier', () => {
  describe('Medical Classification', () => {
    const medicalScenarios = [
      { message: 'My dog is bleeding heavily', expected: 'medical' },
      { message: 'My dog swallowed poison', expected: 'medical' },
      { message: 'My dog is choking', expected: 'medical' },
      // ... 17 more scenarios
    ];

    medicalScenarios.forEach(({ message, expected }) => {
      it(`should classify "${message}" as ${expected}`, async () => {
        const result = await triageClassifierWithFlags.classify(message);
        expect(result.classification).toBe(expected);
        expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      });
    });
  });

  describe('Crisis Classification', () => {
    const crisisScenarios = [
      { message: 'My dog is attacking another dog', expected: 'crisis' },
      { message: 'My dog is fighting', expected: 'crisis' },
      // ... 18 more scenarios
    ];

    crisisScenarios.forEach(({ message, expected }) => {
      it(`should classify "${message}" as ${expected}`, async () => {
        const result = await triageClassifierWithFlags.classify(message);
        expect(result.classification).toBe(expected);
        expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      });
    });
  });

  // ... Stray and Normal classification tests
});

// Run tests
npm test
```

**Success Criteria:**

- ✅ 80+ test scenarios implemented
- ✅ All tests pass
- ✅ Confidence thresholds met
- ✅ Cascade logic validated
- ✅ Fallback logic validated

**Dependencies:** Step 7 (Audit Logging) complete

---

### Phase 4 Success Criteria

| Criterion           | Target | Measurement                               |
| ------------------- | ------ | ----------------------------------------- |
| Z.AI Integration    | 100%   | Client configured, classification working |
| z.ai Fallback     | 100%   | Fallback implemented, cost tracking       |
| Deterministic Rules | 100%   | Keyword matching implemented              |
| Cascade Logic       | 100%   | Z.AI → z.ai → Deterministic             |
| Feature Flags       | 100%   | AI mode switching supported               |
| Health Monitoring   | 100%   | Provider health checks, alerts            |
| Audit Logging       | 100%   | All AI decisions logged                   |
| Test Scenarios      | 80+    | All scenarios validated                   |

---

## DTD Phase 5: Operations Implementation

### Overview

**DTD Phase 5:** Operations  
**Duration:** 2 weeks  
**BMAD Agent:** Custom Operations Implementation  
**Documentation Reference:** [`08_OPERATIONS_AND_HEALTH.md`](DOCS/08_OPERATIONS_AND_HEALTH.md:1)

### Objectives

1. Implement admin dashboard UI
2. Implement 4h/week operator workflow
3. Implement health monitoring dashboard
4. Document incident response playbooks
5. Implement cron health checks

### Detailed Implementation Steps

#### Step 1: Admin Dashboard UI

**Estimated Time:** 12 hours

**Implementation:**

```typescript
// Admin dashboard page
export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    const response = await fetch("/api/admin/dashboard", {
      headers: {
        Authorization: `Bearer ${getJWT()}`,
        "x-totp": getTOTP(),
      },
    });

    const data = await response.json();
    setDashboardData(data);
    setLoading(false);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      {/* Red Alerts */}
      <section className="red-alerts">
        <h2>Red Alerts ({dashboardData.redAlerts})</h2>
        <RedAlertList />
      </section>

      {/* Pending Reviews */}
      <section className="pending-reviews">
        <h2>Pending Reviews ({dashboardData.pendingReviews})</h2>
        <PendingReviewList />
      </section>

      {/* Active Featured Placements */}
      <section className="active-featured">
        <h2>Active Featured ({dashboardData.activeFeatured})</h2>
        <ActiveFeaturedList />
      </section>

      {/* Revenue */}
      <section className="revenue">
        <h2>Revenue This Month</h2>
        <p>${dashboardData.revenueThisMonth}</p>
      </section>

      {/* Triage Count */}
      <section className="triage-count">
        <h2>Triage Count Today</h2>
        <p>{dashboardData.triageCountToday}</p>
      </section>
    </div>
  );
}

// Red Alerts component
function RedAlertList() {
  const [alerts, setAlerts] = useState<RedAlert[]>([]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    const response = await fetch("/api/admin/alerts", {
      headers: {
        Authorization: `Bearer ${getJWT()}`,
        "x-totp": getTOTP(),
      },
    });

    const data = await response.json();
    setAlerts(data.alerts);
  }

  return (
    <ul>
      {alerts.map((alert) => (
        <li key={alert.id} className="alert-item">
          <span className="alert-type">{alert.type}</span>
          <span className="alert-message">{alert.message}</span>
          <span className="alert-time">{formatTime(alert.timestamp)}</span>
        </li>
      ))}
    </ul>
  );
}

// Pending Reviews component
function PendingReviewList() {
  const [reviews, setReviews] = useState<PendingReview[]>([]);

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    const response = await fetch("/api/admin/reviews/pending", {
      headers: {
        Authorization: `Bearer ${getJWT()}`,
        "x-totp": getTOTP(),
      },
    });

    const data = await response.json();
    setReviews(data.reviews);
  }

  async function approveReview(reviewId: string) {
    await fetch(`/api/admin/reviews/${reviewId}/approve`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getJWT()}`,
        "x-totp": getTOTP(),
      },
    });

    setReviews(reviews.filter((r) => r.id !== reviewId));
  }

  async function rejectReview(reviewId: string) {
    await fetch(`/api/admin/reviews/${reviewId}/reject`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getJWT()}`,
        "x-totp": getTOTP(),
      },
    });

    setReviews(reviews.filter((r) => r.id !== reviewId));
  }

  return (
    <ul>
      {reviews.map((review) => (
        <li key={review.id} className="review-item">
          <div className="review-content">
            <p>{review.comment}</p>
            <p className="review-rating">Rating: {review.rating}/5</p>
          </div>
          <div className="review-actions">
            <button onClick={() => approveReview(review.id)}>Approve</button>
            <button onClick={() => rejectReview(review.id)}>Reject</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
```

**Success Criteria:**

- ✅ Admin dashboard UI implemented
- ✅ Red alerts displayed
- ✅ Pending reviews displayed
- ✅ Active featured placements displayed
- ✅ Revenue and triage count displayed

**Dependencies:** DTD Phase 4 complete

---

#### Step 2: 4h/Week Operator Workflow

**Estimated Time:** 8 hours

**Implementation:**

```typescript
// Operator workflow page
export default function OperatorWorkflow() {
  const [step, setStep] = useState<OperatorStep>("check-alerts");
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="operator-workflow">
      <header>
        <h1>Operator Workflow</h1>
        <p>Time spent: {formatTime(timeSpent)}</p>
        <p>Weekly budget: 4 hours</p>
      </header>

      <WorkflowStep step={step} setStep={setStep} />
    </div>
  );
}

function WorkflowStep({
  step,
  setStep,
}: {
  step: OperatorStep;
  setStep: (step: OperatorStep) => void;
}) {
  switch (step) {
    case "check-alerts":
      return <CheckAlertsStep onComplete={() => setStep("review-queue")} />;
    case "review-queue":
      return <ReviewQueueStep onComplete={() => setStep("health-check")} />;
    case "health-check":
      return <HealthCheckStep onComplete={() => setStep("complete")} />;
    case "complete":
      return <CompleteStep />;
  }
}

// Step 1: Check Alerts
function CheckAlertsStep({ onComplete }: { onComplete: () => void }) {
  const [alerts, setAlerts] = useState<RedAlert[]>([]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    const response = await fetch("/api/admin/alerts");
    const data = await response.json();
    setAlerts(data.alerts);
  }

  return (
    <section className="workflow-step">
      <h2>Step 1: Check Red Alerts</h2>
      <p>Review and address any red alerts before proceeding.</p>

      {alerts.length === 0 ? (
        <p className="no-alerts">No red alerts. Good to proceed!</p>
      ) : (
        <ul>
          {alerts.map((alert) => (
            <li key={alert.id}>
              <span className="alert-type">{alert.type}</span>
              <span className="alert-message">{alert.message}</span>
              <button onClick={() => acknowledgeAlert(alert.id)}>
                Acknowledge
              </button>
            </li>
          ))}
        </ul>
      )}

      <button onClick={onComplete} disabled={alerts.length > 0}>
        Proceed to Review Queue
      </button>
    </section>
  );
}

// Step 2: Review Queue
function ReviewQueueStep({ onComplete }: { onComplete: () => void }) {
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [batchSize, setBatchSize] = useState(10);

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    const response = await fetch("/api/admin/reviews/pending");
    const data = await response.json();
    setReviews(data.reviews);
  }

  async function batchApprove() {
    const toApprove = reviews.slice(0, batchSize);

    await Promise.all(
      toApprove.map((review) =>
        fetch(`/api/admin/reviews/${review.id}/approve`, { method: "POST" })
      )
    );

    setReviews(reviews.slice(batchSize));
  }

  return (
    <section className="workflow-step">
      <h2>Step 2: Review Queue</h2>
      <p>Review and approve pending reviews.</p>

      <div className="batch-controls">
        <label>Batch size:</label>
        <select
          value={batchSize}
          onChange={(e) => setBatchSize(parseInt(e.target.value))}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
        <button onClick={batchApprove}>Batch Approve {batchSize}</button>
      </div>

      <ul>
        {reviews.map((review) => (
          <li key={review.id}>
            <p>{review.comment}</p>
            <p>Rating: {review.rating}/5</p>
            <button onClick={() => approveReview(review.id)}>Approve</button>
            <button onClick={() => rejectReview(review.id)}>Reject</button>
          </li>
        ))}
      </ul>

      <button onClick={onComplete}>Proceed to Health Check</button>
    </section>
  );
}

// Step 3: Health Check
function HealthCheckStep({ onComplete }: { onComplete: () => void }) {
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    fetchHealth();
  }, []);

  async function fetchHealth() {
    const response = await fetch("/api/admin/health");
    const data = await response.json();
    setHealth(data.health);
  }

  return (
    <section className="workflow-step">
      <h2>Step 3: Health Check</h2>
      <p>Review system health status.</p>

      {health && (
        <div className="health-status">
          <div className="health-item">
            <h3>Z.AI</h3>
            <p>Status: {health.zai.status}</p>
            <p>Response Time: {health.zai.responseTime}ms</p>
          </div>

          <div className="health-item">
            <h3>z.ai</h3>
            <p>Status: {health.openai.status}</p>
            <p>Response Time: {health.openai.responseTime}ms</p>
          </div>

          <div className="health-item">
            <h3>Database</h3>
            <p>Status: healthy</p>
          </div>

          <div className="health-item">
            <h3>Stripe</h3>
            <p>Status: healthy</p>
          </div>
        </div>
      )}

      <button onClick={onComplete}>Complete Workflow</button>
    </section>
  );
}

// Complete Step
function CompleteStep() {
  return (
    <section className="workflow-step complete">
      <h2>Workflow Complete!</h2>
      <p>All tasks completed. See you next week!</p>
    </section>
  );
}
```

**Success Criteria:**

- ✅ 4h/week operator workflow implemented
- ✅ Pull-based workflow (no SLAs)
- ✅ Step-by-step process
- ✅ Time tracking implemented

**Dependencies:** Step 1 (Admin Dashboard) complete

---

#### Step 3: Health Monitoring Dashboard

**Estimated Time:** 6 hours

**Implementation:**

```typescript
// Health monitoring dashboard
export default function HealthMonitoringDashboard() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [history, setHistory] = useState<HealthHistory[]>([]);

  useEffect(() => {
    fetchHealth();
    fetchHealthHistory();

    const interval = setInterval(() => {
      fetchHealth();
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  async function fetchHealth() {
    const response = await fetch("/api/admin/health");
    const data = await response.json();
    setHealth(data.health);
  }

  async function fetchHealthHistory() {
    const response = await fetch("/api/admin/health/history");
    const data = await response.json();
    setHistory(data.history);
  }

  return (
    <div className="health-dashboard">
      <h1>Health Monitoring</h1>

      {/* Current Health */}
      <section className="current-health">
        <h2>Current Health</h2>
        {health && (
          <div className="health-grid">
            <HealthCard
              name="Z.AI"
              status={health.zai.status}
              responseTime={health.zai.responseTime}
              lastCheck={health.zai.lastCheck}
            />
            <HealthCard
              name="z.ai"
              status={health.openai.status}
              responseTime={health.openai.responseTime}
              lastCheck={health.openai.lastCheck}
            />
            <HealthCard
              name="Database"
              status="healthy"
              responseTime={50}
              lastCheck={new Date()}
            />
            <HealthCard
              name="Stripe"
              status="healthy"
              responseTime={100}
              lastCheck={new Date()}
            />
          </div>
        )}
      </section>

      {/* Health History */}
      <section className="health-history">
        <h2>Health History (24h)</h2>
        <HealthChart data={history} />
      </section>
    </div>
  );
}

function HealthCard({
  name,
  status,
  responseTime,
  lastCheck,
}: HealthCardProps) {
  const statusColor = {
    healthy: "green",
    degraded: "yellow",
    down: "red",
  }[status];

  return (
    <div className={`health-card ${statusColor}`}>
      <h3>{name}</h3>
      <p>Status: {status}</p>
      <p>Response Time: {responseTime}ms</p>
      <p>Last Check: {formatTime(lastCheck)}</p>
    </div>
  );
}

function HealthChart({ data }: { data: HealthHistory[] }) {
  // Use a charting library like Recharts or Chart.js
  return (
    <div className="health-chart">
      <LineChart width={800} height={400} data={data}>
        <XAxis dataKey="timestamp" />
        <YAxis />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="zaiResponseTime"
          stroke="#8884d8"
          name="Z.AI"
        />
        <Line
          type="monotone"
          dataKey="openaiResponseTime"
          stroke="#82ca9d"
          name="z.ai"
        />
      </LineChart>
    </div>
  );
}
```

**Success Criteria:**

- ✅ Health monitoring dashboard implemented
- ✅ Real-time health status displayed
- ✅ Health history chart implemented
- ✅ 24-hour history tracked

**Dependencies:** Step 2 (Operator Workflow) complete

---

#### Step 4: Incident Response Playbooks

**Estimated Time:** 8 hours

**Implementation:**

```markdown
# Incident Response Playbooks

## Incident: Z.AI Down

### Detection

- Health check shows Z.AI status as "down"
- Triage classifications falling back to z.ai or deterministic

### Severity

- **Medium**: Z.AI down <30 minutes
- **High**: Z.AI down >30 minutes

### Response Steps

1. **Verify Z.AI Status**

   - Check Z.AI status page: https://status.z.ai
   - Check Z.AI API health endpoint
   - Review error logs

2. **Assess Impact**

   - Check triage logs for increased z.ai/deterministic usage
   - Monitor classification accuracy
   - Check cost budget for z.ai

3. **Mitigation Actions**

   - If Z.AI down <30 minutes: Monitor, no action needed
   - If Z.AI down >30 minutes:
     - Consider switching AI mode to z.ai via feature flags
     - Monitor z.ai cost budget
     - Alert stakeholders if cost budget at risk

4. **Recovery**

   - When Z.AI recovers:
     - Verify health checks pass
     - Monitor classification accuracy
     - Reset failure counters
     - Switch back to cascade mode if needed

5. **Post-Incident**
   - Document incident details
   - Review root cause
   - Update playbooks if needed

### Escalation

- If Z.AI down >1 hour: Escalate to technical lead
- If z.ai cost budget at risk: Escalate to product lead

---

## Incident: z.ai Cost Budget Exceeded

### Detection

- z.ai monthly cost >= $50
- Health check shows cost budget warning

### Severity

- **High**: Cost budget exceeded

### Response Steps

1. **Verify Cost**

   - Check z.ai usage dashboard
   - Review cost breakdown by endpoint

2. **Assess Impact**

   - Determine remaining budget for month
   - Estimate remaining days in month

3. **Mitigation Actions**

   - Switch AI mode to deterministic only
   - Monitor classification accuracy
   - Alert stakeholders of degraded service

4. **Recovery**
   - At month start:
     - Reset cost tracking
     - Switch back to cascade mode
     - Monitor cost accumulation

### Escalation

- If cost budget exceeded mid-month: Escalate to product lead

---

## Incident: Stripe Webhook Failures

### Detection

- Payment audit shows webhook failures
- Featured placements not activating

### Severity

- **High**: Webhooks failing >10 minutes

### Response Steps

1. **Verify Stripe Status**

   - Check Stripe status page: https://status.stripe.com
   - Review webhook delivery logs

2. **Assess Impact**

   - Count failed webhooks
   - Identify affected payments

3. **Mitigation Actions**

   - Manually process failed webhooks
   - Contact Stripe support if needed
   - Alert affected trainers

4. **Recovery**
   - When webhooks recover:
     - Verify webhook delivery
     - Process queued payments
     - Monitor for new failures

### Escalation

- If webhooks failing >1 hour: Escalate to technical lead

---

## Incident: Database Performance Degradation

### Detection

- Health check shows database response time >500ms
- Slow query alerts

### Severity

- **Medium**: Response time 500-1000ms
- **High**: Response time >1000ms

### Response Steps

1. **Verify Database Status**

   - Check Supabase status page
   - Review database metrics
   - Identify slow queries

2. **Assess Impact**

   - Monitor API response times
   - Check error rates

3. **Mitigation Actions**

   - Kill long-running queries
   - Restart database if needed
   - Scale database resources

4. **Recovery**
   - Monitor performance metrics
   - Review query optimization
   - Update indexes if needed

### Escalation

- If response time >1000ms: Escalate to technical lead
```

**Success Criteria:**

- ✅ Incident response playbooks documented
- ✅ Z.AI down playbook documented
- ✅ z.ai cost budget playbook documented
- ✅ Stripe webhook failure playbook documented
- ✅ Database performance playbook documented

**Dependencies:** Step 3 (Health Monitoring) complete

---

#### Step 5: Cron Health Checks

**Estimated Time:** 4 hours

**Implementation:**

```typescript
// Cron job for health checks
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  // Verify cron job secret
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check all health
    const health = await aiHealthMonitor.checkAllHealth();

    // Check database health
    const dbHealth = await checkDatabaseHealth();

    // Check Stripe health
    const stripeHealth = await checkStripeHealth();

    // Log health check
    await supabase.from('cron_jobs').insert({
      jobType: 'health_check',
      status: 'success',
      lastRun: new Date(),
      nextRun: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      metadata: {
        zai: health.zai.status,
        openai: health.openai.status,
        database: dbHealth.status,
        stripe: stripeHealth.status
      }
    });

    // Alert operator if needed
    if (aiHealthMonitor.shouldAlertOperator()) {
      await sendOperatorAlert({
        type: 'zai_down',
        message: 'Z.AI has been down for >30 minutes',
        severity: 'high'
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    // Log cron job failure
    await supabase.from('cron_jobs').insert({
      jobType: 'health_check',
      status: 'failed',
      lastRun: new Date(),
      error: err.message
    });

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function checkDatabaseHealth(): Promise<{ status: string; responseTime: number }> {
  const startTime = Date.now();

  try {
    await supabase.from('councils').select('id').limit(1);
    const responseTime = Date.now() - startTime;

    return {
      status: responseTime > 500 ? 'degraded' : 'healthy',
      responseTime
    };
  } catch (err) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime
    };
  }
}

async function checkStripeHealth(): Promise<{ status: string; responseTime: number }> {
  const startTime = Date.now();

  try {
    await stripe.paymentIntents.list({ limit: 1 });
    const responseTime = Date.now() - startTime;

    return {
      status: responseTime > 1000 ? 'degraded' : 'healthy',
      responseTime
    };
  } catch (err) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime
    };
  }
}

async function sendOperatorAlert(alert: OperatorAlert): Promise<void> {
  // Send email or notification to operator
  await sendEmail({
    to: process.env.OPERATOR_EMAIL,
    subject: `[${alert.severity.toUpperCase()}] ${alert.type}`,
    body: alert.message
  });
}

// Vercel cron configuration (vercel.json)
{
  "crons": [
    {
      "path": "/api/cron/health-check",
      "schedule": "*/5 * * * *" // Every 5 minutes
    }
  ]
}
```

**Success Criteria:**

- ✅ Cron health check implemented
- ✅ All services checked (Z.AI, z.ai, DB, Stripe)
- ✅ Operator alerts implemented
- ✅ Health checks every 5 minutes

**Dependencies:** Step 4 (Incident Response Playbooks) complete

---

### Phase 5 Success Criteria

| Criterion          | Target | Measurement                     |
| ------------------ | ------ | ------------------------------- |
| Admin Dashboard    | 100%   | All components implemented      |
| Operator Workflow  | 100%   | 4h/week workflow implemented    |
| Health Monitoring  | 100%   | Real-time dashboard implemented |
| Incident Playbooks | 100%   | All playbooks documented        |
| Cron Health Checks | 100%   | All services checked            |

---

## Execution Order and Dependencies

### Overall Execution Flow

```
Phase 1: Foundation (2 weeks)
    ↓
    Step 1: Enums Creation
    ↓
    Step 2: Core Tables Creation
    ↓
    Step 3: Foreign Keys & Constraints
    ↓
    Step 4: Indexes Creation
    ↓
    Step 5: RLS Policies
    ↓
    Step 6: Triggers Creation
    ↓
    Step 7: Seed Councils
    ↓
    Step 8: Seed Suburbs
    ↓
    Step 9: Verification
    ↓
Phase 2: Core Features (2 weeks)
    ↓
    Step 1: Endpoint Design
    ↓
    Step 2: TypeScript Types
    ↓
    Step 3: Validation Schemas
    ↓
    Step 4: Authentication Middleware
    ↓
    Step 5: Error Handling
    ↓
    Step 6: Rate Limiting
    ↓
    Step 7: Documentation
    ↓
Phase 3: Monetisation (2 weeks)
    ↓
    Step 1: Stripe Checkout Integration
    ↓
    Step 2: Webhook Handlers
    ↓
    Step 3: Featured Placement FIFO Queue
    ↓
    Step 4: Refund Handling
    ↓
    Step 5: Payment Audit Logging
    ↓
    Step 6: Cron Job for Queue Processing
    ↓
Phase 4: Emergency Triage (2 weeks)
    ↓
    Step 1: Z.AI Client Configuration
    ↓
    Step 2: z.ai Fallback Configuration
    ↓
    Step 3: Deterministic Keyword Matching
    ↓
    Step 4: Cascade Logic Implementation
    ↓
    Step 5: Feature Flags Configuration
    ↓
    Step 6: Health Monitoring
    ↓
    Step 7: Audit Logging
    ↓
    Step 8: Testing and Validation
    ↓
Phase 5: Operations (2 weeks)
    ↓
    Step 1: Admin Dashboard UI
    ↓
    Step 2: 4h/Week Operator Workflow
    ↓
    Step 3: Health Monitoring Dashboard
    ↓
    Step 4: Incident Response Playbooks
    ↓
    Step 5: Cron Health Checks
    ↓
Phase 5: Validation and Handoff
```

### Critical Dependencies

| Dependency        | Required For           | Type |
| ----------------- | ---------------------- | ---- |
| Phase 1 Complete  | Phase 2                | Hard |
| Phase 2 Complete  | Phase 3                | Hard |
| Phase 3 Complete  | Phase 4                | Hard |
| Step 3 (FKs)      | Step 4 (Indexes)       | Hard |
| Step 4 (Indexes)  | Step 5 (RLS)           | Hard |
| Step 5 (RLS)      | Step 6 (Triggers)      | Hard |
| Step 6 (Triggers) | Step 7 (Seed Councils) | Hard |
| Step 7 (Councils) | Step 8 (Seed Suburbs)  | Hard |
| Step 8 (Suburbs)  | Step 9 (Verification)  | Hard |

### Parallel Execution Opportunities

| Phase   | Parallel Tasks                          | Notes                   |
| ------- | --------------------------------------- | ----------------------- |
| Phase 2 | Steps 2-3 (Types, Validation)           | Can be done in parallel |
| Phase 2 | Steps 4-6 (Auth, Errors, Rate Limiting) | Can be done in parallel |
| Phase 3 | Steps 1-2 (Checkout, Webhooks)          | Can be done in parallel |
| Phase 4 | Steps 1-3 (Z.AI, z.ai, Deterministic) | Can be done in parallel |
| Phase 5 | Steps 1-3 (Dashboard, Workflow, Health) | Can be done in parallel |

---

## Success Criteria

### Overall Success Criteria

| Criterion               | Target | Measurement                          |
| ----------------------- | ------ | ------------------------------------ |
| All DTD Phases Complete | 5/5    | All phases executed                  |
| Database Schema         | 100%   | 10 tables, 12 enums, RLS, indexes    |
| API Contracts           | 100%   | 25+ endpoints, types, validation     |
| Monetisation            | 100%   | Stripe, FIFO queue, refunds          |
| AI Integration          | 100%   | Z.AI, z.ai, deterministic, cascade |
| Operations              | 100%   | Dashboard, workflow, monitoring      |
| Documentation           | 100%   | All artifacts generated              |
| Tests                   | 80+    | All test scenarios validated         |

### Phase-Specific Success Criteria

**Phase 1: Foundation**

- ✅ All 12 enum types created
- ✅ All 10 core tables created
- ✅ All 9 foreign keys defined
- ✅ All 8+ indexes created
- ✅ All 8 RLS policies implemented
- ✅ All 4 triggers created
- ✅ All 28 councils seeded
- ✅ All 200+ suburbs seeded
- ✅ Data integrity verified

**Phase 2: Core Features**

- ✅ All 25+ endpoints designed
- ✅ All TypeScript types created
- ✅ All validation schemas implemented
- ✅ MFA authentication implemented (D-013)
- ✅ Error handling implemented
- ✅ Rate limiting implemented
- ✅ OpenAPI documentation generated

**Phase 3: Monetisation**

- ✅ Stripe Checkout integrated
- ✅ All webhook handlers implemented
- ✅ FIFO queue implemented (max 5 per council)
- ✅ Refund handling implemented (3-day window, D-011)
- ✅ Payment audit logging implemented (D-012)
- ✅ Cron job for queue processing implemented

**Phase 4: Emergency Triage**

- ✅ Z.AI client configured
- ✅ z.ai fallback configured
- ✅ Deterministic keyword matching implemented
- ✅ Cascade logic implemented (D-007)
- ✅ Feature flags implemented
- ✅ Health monitoring implemented
- ✅ Audit logging implemented
- ✅ 80+ test scenarios validated

**Phase 5: Operations**

- ✅ Admin dashboard UI implemented
- ✅ 4h/week operator workflow implemented
- ✅ Health monitoring dashboard implemented
- ✅ Incident response playbooks documented
- ✅ Cron health checks implemented

---

## Risk Mitigation During Execution

### Risk 1: Context Overflow During Implementation

**Risk:** Large codebase may cause AI context overflow during implementation.

**Mitigation:**

- Use BMAD step-file workflows to load only current step context
- Break large tasks into smaller steps
- Use Expert agents with persistent memory for complex tasks

**Owner:** Development Team  
**Timeline:** Ongoing

---

### Risk 2: Agent Memory Bloat

**Risk:** Expert agents accumulate large memory, reducing effectiveness.

**Mitigation:**

- Organize sidecar content by phase/topic
- Periodically review and archive old memory
- Create summaries of key decisions
- Set reasonable limits on sidecar folder size

**Owner:** Development Team  
**Timeline:** Monthly review

---

### Risk 3: Integration Issues with Next.js 15 and Supabase

**Risk:** BMAD workflows may not align perfectly with Next.js 15 App Router and Supabase patterns.

**Mitigation:**

- Reference Next.js 15 and Supabase documentation in agent instructions
- Validate workflows with small proof-of-concept
- Use custom workflows for technology-specific patterns

**Owner:** Technical Lead  
**Timeline:** Phase 1, Week 2

---

### Risk 4: AI Provider Dependency

**Risk:** Z.AI or z.ai outages may impact triage functionality.

**Mitigation:**

- Implement 3-tier fallback (Z.AI → z.ai → Deterministic)
- Monitor provider health continuously
- Alert operator if Z.AI down >30 minutes
- Document incident response procedures

**Owner:** Technical Lead  
**Timeline:** Ongoing

---

### Risk 5: Stripe Webhook Reliability

**Risk:** Stripe webhook failures may impact payment processing.

**Mitigation:**

- Implement idempotency via `stripeEventId`
- Log all webhook events to `payment_audit`
- Monitor webhook delivery logs
- Document incident response procedures

**Owner:** Technical Lead  
**Timeline:** Ongoing

---

### Risk 6: Operator Capacity Constraints

**Risk:** 4h/week operator capacity may be insufficient during incidents.

**Mitigation:**

- Implement pull-based workflow (no SLAs)
- Prioritize red alerts and critical issues
- Document incident response procedures
- Consider temporary capacity increase during major incidents

**Owner:** Product Lead  
**Timeline:** Ongoing

---

## Next Steps

### Immediate Actions

1. **Review Implementation Plan**

   - Review this document with team
   - Confirm execution order and dependencies
   - Identify any gaps or concerns

2. **Set Up Development Environment**

   - Ensure Next.js 15 project initialized
   - Configure Supabase project
   - Set up Stripe account
   - Configure Z.AI and z.ai API keys

3. **Begin Phase 1 Execution**
   - Activate Database Schema Architect agent
   - Start Database Schema Implementation workflow
   - Execute Step 1: Enums Creation

### Execution Checklist

- [ ] Review implementation plan with team
- [ ] Set up development environment
- [ ] Configure all API keys (Supabase, Stripe, Z.AI, z.ai)
- [ ] Activate Database Schema Architect agent
- [ ] Execute Phase 1: Foundation
- [ ] Activate API Contract Designer agent
- [ ] Execute Phase 2: Core Features
- [ ] Execute Phase 3: Monetisation
- [ ] Activate AI Integration Specialist agent
- [ ] Execute Phase 4: Emergency Triage
- [ ] Execute Phase 5: Operations
- [ ] Validate all DTD decisions
- [ ] Generate final documentation
- [ ] Complete Phase 5: Validation and Handoff

### Contact Information

**Technical Lead:** [Name]  
**Product Lead:** [Name]  
**Development Team:** [Team]  
**Operator:** [Name]

---

**Document Status:** ✅ Complete, ready for execution  
**Last Updated:** 2025-12-25  
**Owner:** Architecture Team  
**Next Steps:** Review with team, begin Phase 1 execution
