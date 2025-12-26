# Database Schema Architect Knowledge Base

## Domain Model Reference

Primary reference document: [`DOCS/02_DOMAIN_MODEL.md`](../../DOCS/02_DOMAIN_MODEL.md:1)

### Core Tables (10 total)

| Table | Purpose | Key Features |
|--------|---------|---------------|
| councils | 28 Melbourne metropolitan councils | Reference data, immutable |
| localities | 200+ suburbs with council mapping | Reference data, suburb → council 1:1 |
| users | Trainer accounts with email OTP | Authentication, email_verified flag |
| businesses | Trainer listings with featured placement | Core table, soft delete, featured_until timestamp |
| reviews | User reviews with AI moderation | Moderation status, Z.AI confidence scores |
| featured_placements | Monetisation audit log | Immutable, stripe_payment_id UNIQUE |
| payment_audit | Stripe webhook event log | Immutable, 7-year retention, idempotent |
| emergency_contacts | Cached emergency resources | Denormalized from businesses |
| triage_logs | Emergency triage audit trail | Non-PII, classification confidence |
| cron_jobs | Scheduled task audit | Featured expiry and promotion tracking |

### Enum Types (12 total)

| Enum | Values | Usage |
|-------|---------|--------|
| dog_age_group | Puppy, Adolescent, Adult, Senior, Any age | businesses.age_specialties |
| dog_behavior_issue | 13 behavior issues | businesses.behavior_issues |
| dog_service_type | Puppy training, Obedience, Behavior consultations, Group classes, Private training | businesses.service_type_primary/secondary |
| dog_business_resource_type | trainer, behaviour_consultant, emergency_vet, urgent_care, emergency_shelter | businesses.resource_type |
| review_moderation_status | pending, approved, rejected | reviews.moderation_status |
| featured_placement_status | queued, active, expired, refunded, cancelled | featured_placements.status |
| dog_triage_classification | medical, crisis, stray, normal | triage_logs.classification |

## API Contract Reference

Secondary reference document: [`DOCS/05_DATA_AND_API_CONTRACTS.md`](../../DOCS/05_DATA_AND_API_CONTRACTS.md:1)

### Key Query Patterns

1. **Search trainers by council + age + issue**
   - Target: <200ms
   - Indexes: (council_id, deleted), GIN on age_specialties, behavior_issues

2. **Emergency contact lookup by council**
   - Target: <100ms
   - Indexes: (council_id, resource_type)

3. **Featured expiry cleanup (cron)**
   - Target: <5 seconds
   - Indexes: (featured_until) with partial predicate

4. **Review moderation queue**
   - Target: <500ms
   - Indexes: (moderation_status, created_at)

## Architectural Decisions

| Decision | Implementation |
|----------|----------------|
| D-003 (28 councils) | councils table with 28 rows, region enum (5 values) |
| D-004 (Taxonomy locked) | Enum types: dog_age_group, dog_behavior_issue, dog_service_type |
| D-002 (Featured placement) | featured_placements table with immutable audit log, featured_until timestamp |
| D-001 (Triage classification) | triage_logs table with dog_triage_classification enum |
| D-006 (Search ranking) | Indexes on featured_until, verified, distance, rating |
| Soft delete | deleted boolean, deleted_at timestamp on all core tables |
| Stripe safety | payment_audit immutable append-only table (7-year retention) |

## Performance Targets

- Search queries: <200ms
- Emergency contact lookup: <100ms
- Featured expiry cleanup: <5 seconds
- Review moderation queue: <500ms
- Database connection pool: 10-20 connections
- Query cache hit rate: >80%

## Migration Strategy

Phase 1: Initial Schema Setup
1. Create all types (enums)
2. Create all tables
3. Seed reference data (councils, suburbs)
4. Create indexes
5. Create triggers

Seed Data Sources
- 28 councils: From DOCS/02_DOMAIN_MODEL.md specification
- 200+ suburbs: From suburbs_councils_mapping.csv
- Validation: Suburb → council mapping is 1:1
