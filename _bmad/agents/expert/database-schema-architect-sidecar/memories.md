# Database Schema Architect Memory Bank

## User Preferences

- **Greeting Name:** DTD Developer
- **Communication Style:** Technical (detailed SQL and schema analysis)
- **Performance Focus:** Query Speed (sub-200ms search performance)

## Session History

### 2025-12-24 - Initial Agent Creation
- Created Database Schema Architect Expert agent for DTD project
- Specialization: 10 core tables, 12 enums, RLS policies, indexes, triggers, seed data
- Reference documents: DOCS/02_DOMAIN_MODEL.md, DOCS/05_DATA_AND_API_CONTRACTS.md

## Schema Design Decisions

### Core Tables (10 total)
1. **councils** - 28 Melbourne metropolitan councils (reference data)
2. **localities** - 200+ suburbs with council mapping (reference data)
3. **users** - Trainer accounts with email OTP authentication
4. **businesses** - Trainer listings with featured placement support
5. **reviews** - User reviews with AI moderation
6. **featured_placements** - Monetisation audit log (immutable)
7. **payment_audit** - Stripe webhook event log (immutable, 7-year retention)
8. **emergency_contacts** - Cached emergency resources
9. **triage_logs** - Emergency triage audit trail
10. **cron_jobs** - Scheduled task audit

### Enum Types (12 total)
1. **dog_age_group** - Puppy, Adolescent, Adult, Senior, Any age
2. **dog_behavior_issue** - 13 behavior issues (Pulling, Anxiety, Barking, etc.)
3. **dog_service_type** - Puppy training, Obedience, Behavior consultations, Group classes, Private training
4. **dog_business_resource_type** - trainer, behaviour_consultant, emergency_vet, urgent_care, emergency_shelter
5. **review_moderation_status** - pending, approved, rejected
6. **featured_placement_status** - queued, active, expired, refunded, cancelled
7. **dog_triage_classification** - medical, crisis, stray, normal

### Key Design Principles
- Enum-driven taxonomy prevents data drift
- Geography as derived data (suburb → council auto-assignment)
- Soft delete + audit trail for all business records
- Verification orthogonal to listing (ABN as metadata flag)
- Featured placement as time-based state (featured_until timestamp)
- Performance-first indexing strategy (GIN for arrays, B-tree for lookups)
- Immutable audit logs for financial reconciliation

### Performance Targets
- Search queries: <200ms
- Emergency contact lookup: <100ms
- Featured expiry cleanup: <5 seconds
- Review moderation queue: <500ms

## Personal Notes

- Always reference DOCS/02_DOMAIN_MODEL.md for complete schema specification
- Use GIN indexes for array columns (age_specialties, behavior_issues)
- Use B-tree indexes for foreign keys and lookup columns
- Implement RLS policies for multi-tenant data isolation
- Create triggers for updated_at and deleted_at timestamps
- Seed data: 28 councils, 200+ suburbs from suburbs_councils_mapping.csv
