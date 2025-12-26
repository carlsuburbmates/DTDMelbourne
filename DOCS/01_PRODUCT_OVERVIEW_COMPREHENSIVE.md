# 01_PRODUCT_OVERVIEW.md

**Dog Trainers Directory (DTD) — Comprehensive Strategic Specification**

**Last Updated:** 2025-12-25  
**Status:** All 15 decisions locked, ready for development  
**Audience:** Product leads, architects, developers, operations team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [What We're Building](#what-were-building)
3. [Core Value Proposition](#core-value-proposition)
4. [All 15 Architectural Decisions (Complete Register)](#all-15-architectural-decisions)
5. [Five Core Principles](#five-core-principles)
6. [Technology Stack](#technology-stack)
7. [Target Users & Their Needs](#target-users--their-needs)
8. [Key Metrics & Success Criteria](#key-metrics--success-criteria)
9. [Phase Roadmap](#phase-roadmap)
10. [Development Readiness Checklist](#development-readiness-checklist)
11. [Decision Rationale & Trade-Offs](#decision-rationale--trade-offs)
12. [Cross-References to Other Documents](#cross-references-to-other-documents)

---

## Executive Summary

**DTD (Dog Trainers Directory)** is a FULL AI AUTOMATED hyperlocal Melbourne dog trainer Directory that solves a critical information gap: dog owners struggling to find **verified trainers matched to their dog's specific needs** (age, behavior issues, service type) **by suburb/council**.

**MVP Scope (Phase 1):**
- Dog owner search → Trainer discovery (featured, verified, distance, rating)
- Emergency triage → AI-powered routing (medical/crisis/stray/normal)
- Trainer registration → Public listing + review moderation
- Featured placement → 30-day paid promotion ($20 AUD, max 5 per council)
- Admin operations → 4h/week operator model with smart alerts

**Key Constraints (Your Inputs):**
- **AI:** Z.AI primary + z.ai fallback (< $250/mo total)
- **Operations:** 4h/week pull-based operator (no shift, no SLA response)
- **SLAs:** None (Stripe + AI automation handle everything)
- **Disaster Recovery:** Stripe-first, RPO 24h, RTO 4–24h

**Status:** 🟢 Framework complete, 15/15 decisions locked, ready for development

---

## What We're Building

### Problem Statement

**Dog owners** searching for trainers face three problems:
1. **Overwhelming choice** — No filtering by dog age/behavior/service type
2. **No trust signal** — Can't verify trainer qualifications or reviews
3. **High friction** — Manual suburb lookup, no emergency pathway

**Trainers** struggle to:
1. **Get discovered** — No centralized directory
2. **Stand out** — No featured placement option
3. **Build credibility** — No review mechanism

**Emergency scenario:** Dog owner in crisis (aggressive dog, medical incident, stray) has no immediate triage pathway — must call multiple sources.

### Solution

**DTD Platform:**
- **Search:** Suburb-based discovery, filtered by dog age/behavior/service type
- **Verification:** AI + manual moderation ensures listing quality
- **Featured Placement:** Paid promotion ($20/month, max 5 per council) to rank highly
- **Emergency Triage:** 60-second AI-powered assessment → immediate vet/trainer recommendations
- **Reviews:** Public reviews (batched moderation, 7–14 day SLA)

### Market Scope

**Geography:** Melbourne metropolitan area, 28 councils, ~250 suburbs  
**Users Phase 1:**
- Dog owners (anonymous search, no login)
- Trainers (registered, email-based OTP)
- Admin operator (pull-based, 4h/week)

**Users Phase 5+:**
- Business analysts (analytics dashboard)
- Trainers (Pro subscription tier)
- API partners (external integrations)

---

## Core Value Proposition

### For Dog Owners

| Need | Solution |
|------|----------|
| "My 2-year-old is aggressive with other dogs" | Search by age (2yo) + issue (aggression) → ranked trainers |
| "I want someone nearby" | Suburb autocomplete → distance-sorted results |
| "How good are they really?" | Public reviews (approved by AI) + rating |
| "It's urgent, my dog just bit someone" | /emergency endpoint → triage → police/vet/trainer links |

**Key commitment:** "Manual review may take 7–14 days. Call emergency vet first — DTD is supplementary."

### For Trainers

| Need | Solution |
|------|----------|
| "I need more clients" | Free listing visible to all dog owners in my council |
| "I want to stand out" | Featured placement ($20/month, ranks #1–5) |
| "I want feedback" | Public reviews help improve reputation |
| "Easier than Facebook" | Simple registration, no passwords (email OTP) |

**Key commitment:** "Featured placement active by next business day. Queue if full, promoted daily at 2am."

### For Admin/Operator

| Need | Solution |
|------|----------|
| "I have limited time" | 4h/week pull-based model (no shift, no on-call) |
| "I need to handle exceptions" | Red alert dashboard (webhook failures, Z.AI down, etc.) |
| "No SLAs on my shoulders" | Stripe + AI handle all routine work |
| "Clear playbooks" | Documented incident responses for common scenarios |

---

## All 15 Architectural Decisions (Complete Register)

### Decision Categories & Implementation Status

#### Safety Layer (D-001, D-005)

| ID | Decision | Status | Details |
|---|----------|--------|---------|
| **D-001** | **Emergency triage classification** (medical/crisis/stray/normal) | ✅ Locked | See 03_USER_JOURNEYS.md § Emergency Handler Journey |
| **D-005** | **Emergency escalation pathways** (police, vets, trainers) | ✅ Locked | See 07_AI_AUTOMATION_AND_MODES.md § Triage Use Cases |

**Rationale:**
- Medical (injuries, poisoning) → 24-hour emergency vet list (imperative, life-safety first)
- Crisis (active attack, aggressive) → Police (000) + animal control (legal liability)
- Stray (loose, unknown origin) → RSPCA + local council (not our trainer network)
- Normal (behavior question) → Recommended trainers (matching algorithm)

**Implementation:** Z.AI triage model (primary), keyword detection fallback

---

#### Monetisation Layer (D-002)

| ID | Decision | Status | Details |
|---|----------|--------|---------|
| **D-002** | **Two-tier pricing: Featured ($20 AUD, 30-day) + Pro (deferred Phase 5+)** | ✅ Locked | See 06_MONETISATION_AND_FEATURED_PLACEMENT.md |

**Detailed Specification:**

**Featured Placement (Phase 1):**
- **Price:** $20 AUD (one-time, non-recurring)
- **Duration:** 30 calendar days from activation
- **Supply:** Max 5 trainers per council (FIFO queue if full)
- **Ranking:** Featured #1–5 in search results (above verified)
- **Queue:** FIFO, up to 20 per council, promoted daily at 2am AEDT
- **Refund:** 3-day window only, full refund, no exceptions

**Why one-time, not subscription?**
- Cash flow predictability (no churn, no cancellations)
- Simpler UX (one decision, not recurring billing)
- Legal simplicity (ACCC recurring consent rules avoided)
- Trainer friction lower (single $20 decision vs. monthly recurring)
- Payments team smaller (Stripe Checkout vs. Billing + reconciliation)

**Pro Tier (Phase 5+):**
- Deferred to Phase 5+ (not MVP)
- Would be: $X/month recurring, additional perks (analytics, priorities, etc.)
- Requires: Stripe Billing integration, dunning, churn management

**Rationale:** Validate market demand with Featured before building complex Pro tier.

---

#### Geography Layer (D-003)

| ID | Decision | Status | Details |
|---|----------|--------|---------|
| **D-003** | **28 Melbourne councils, suburb-to-council auto-assignment via CSV** | ✅ Locked | See 02_DOMAIN_MODEL.md § Geography |

**Complete Specification:**

**Why 28 councils (not postcodes or suburbs)?**
- Councils are admin boundaries trainers understand
- Suburb → Council mapping is stable (rarely changes)
- UX: "Search by suburb" auto-assigns council (no dropdown confusion)
- Analytics: "5 trainers in Yarra" makes sense for reporting

**Data Source:**
- CSV: `suburbs_councils_mapping.csv` (all 200+ Melbourne suburbs)
- Maps each suburb to exactly one council
- Includes UX labels: "CBD", "Inner North", "Eastern Prestige", etc.

**Geographic Logic:**
1. Owner enters/autocompletes suburb (e.g., "Fitzroy")
2. Suburb ID → Council ID lookup (deterministic, one-way)
3. Search returns only trainers in that council
4. Featured queue is **per-council** (5 slots per council, not 5 total)

**Example:**
```
Suburb: Fitzroy
→ Council: City of Yarra
→ Featured queue: up to 5 spots for Yarra
→ Non-featured: all Yarra trainers visible
```

**Implications:**
- Council field never manual (always derived from suburb)
- If council lookup fails → Error: "Suburb not found. Did you mean..."
- Trainer profile shows suburb (user-friendly) + council (system-level)

---

#### Data Model Layer (D-004)

| ID | Decision | Status | Details |
|---|----------|--------|---------|
| **D-004** | **Taxonomy: 5 dog ages, 13 behavior issues, 5 service types** | ✅ Locked | See 02_DOMAIN_MODEL.md § Enums |

**Complete Enumeration:**

**Dog Age Groups (5):**
```
- Puppy (0–6 months): Socialization, teething, housebreaking
- Junior (6–18 months): Adolescence, energy management
- Adult (1.5–7 years): Peak performance, behavioral issues common
- Senior (7+ years): Mobility issues, calming
- Any age: No age preference (trainer accepts all)
```

**Behavior Issues (13):**
```
Medical-related:
- Aggression (dog-to-dog): Requires specialized handling
- Aggression (dog-to-human): High liability, vet screening recommended
- Anxiety/fear: Environmental triggers, desensitization needed

Training-focused:
- Jumping/mouthing: Common in young dogs
- Pulling on leash: Fundamental control issue
- Excessive barking: Environmental or attention-seeking
- Recall failure: Off-leash safety
- Destructive behavior: Boredom or separation anxiety
- Resource guarding: Eating/toy possession aggression
- Separation anxiety: Owner-absence behavior
- Leash reactivity: Over-threshold response

Behavioral:
- Socialisation gaps: Under-exposure to stimuli
- Biting/snapping: Serious, often linked to aggression
```

**Service Types (5):**
```
- Obedience: Basic commands, control, manners
- Aggression/Behaviour: Specialized, high-risk behavior modification
- Rehabilitation: Severe cases, long-term residence training
- Puppy school: Group classes, socialization, basics
- Private lessons: 1-on-1, tailored to dog
```

**Why this taxonomy?**
- **Age groups** capture developmental stages (puppy ≠ senior)
- **13 issues** cover 90% of owner searches (not comprehensive, intentionally)
- **5 services** align with standard training business models
- **Flexibility:** Trainer can select multiple (e.g., adult + senior, jumping + pulling)

**Implications:**
- Trainer MUST select at least one from each category
- Search can filter by any combination
- AI review checks: "Does this trainer's bio match their selected tags?"

---

#### Search & Discovery Layer (D-006, D-015)

| ID | Decision | Status | Details |
|---|----------|--------|---------|
| **D-006** | **Search ranking: Featured → Verified → Distance → Rating** | ✅ Locked | See 03_USER_JOURNEYS.md § Entry Point |
| **D-015** | **Postgres full-text v1, external search Phase 2+** | ✅ Locked | See 02_DOMAIN_MODEL.md § Constraints |

**Ranking Algorithm (Complete Specification):**

```
SELECT dog_trainer_listing
WHERE council_id = ? AND status = 'active'
ORDER BY
  1. featured_until DESC NULLS LAST        -- Featured first (newest expiry date)
  2. verified DESC                          -- Verified flag (boolean, not detailed)
  3. distance_km ASC                        -- Distance (calculated from geolocation)
  4. rating DESC                            -- Rating (avg from reviews)
  5. review_count DESC                      -- Tiebreaker
  6. created_at DESC                        -- Tiebreaker (newest first)
LIMIT 20
```

**Key Details:**
- **Featured:** Only trainers with `featured_until > NOW()` rank here
- **Verified:** Boolean flag (set by admin after manual review in Phase 2)
- **Distance:** Calculated from suburb centroid (not exact GPS, privacy-conscious)
- **Rating:** Avg of 1–5 star reviews (requires ≥3 reviews to display)
- **Pagination:** 20 results per page (mobile-friendly)

**Why this order?**
1. **Featured first** — Trainers paid $20, deserve visibility
2. **Verified second** — Quality signal (admin reviewed, no red flags)
3. **Distance third** — Locality matters (dog owner wants local)
4. **Rating fourth** — Reputation matters (but secondary to locality)

**Phase 2+ External Search:**
- Postgres full-text search has limits (no fuzzy match, no synonym handling)
- Phase 2 will evaluate Elasticsearch/Algolia
- Until then: Simple LIKE queries with stemming in app

**Example Query:**
```sql
-- Owner searches: suburb=Fitzroy, age_groups=["Adult"], behavior_issues=["Aggression"]
SELECT * FROM dog_trainer_listing
WHERE council_id = 1 (Yarra)
  AND status = 'active'
  AND 'Adult' = ANY(age_groups)
  AND 'Aggression' && behavior_issues  -- array overlap
ORDER BY featured_until DESC NULLS LAST, verified DESC, distance_km ASC, rating DESC
LIMIT 20;
```

---

#### AI & Automation Layer (D-007, D-008, D-009)

| ID | Decision | Status | Details |
|---|----------|--------|---------|
| **D-007** | **AI fallback rules: Deterministic priority order** | ✅ Locked | See 07_AI_AUTOMATION_AND_MODES.md § Safety |
| **D-008** | **Confidence thresholds: 0.90 reject, 0.85 approve** | ✅ Locked | See 07_AI_AUTOMATION_AND_MODES.md § Use Cases |
| **D-009** | **Z.AI primary + z.ai fallback, <$250/mo total** | ✅ YOU | hand_over.md |

**Complete AI Strategy:**

**Tier 1: Z.AI (Primary)**
```
Endpoint: https://api.z.ai/api/paas/v4
Models:
  - Triage (medical detector): Classify dog scenario
  - Review moderation (spam filter): Flag non-constructive feedback
  - Verification (ABN heuristics): Validate ABN format + patterns
Cost: <$200/month (production usage)
Timeout: 15 seconds (if slower, use fallback)
Availability: Target 99.9% (SLA with Z.AI)
```

**Tier 2: z.ai (Secondary)**
```
Model: gpt-4.1-mini (cost-effective, good for moderation)
Trigger: Z.AI unavailable >30 min OR timeout
Use cases:
  - Triage fallback (emergency triage when Z.AI down)
  - Review moderation (spam detection fallback)
Cost: <$50/month (emergency use only)
Timeout: 30 seconds (if slower, use deterministic)
Feature flag: AI_FALLBACK_MODE=openai
```

**Tier 3: Deterministic Rules (Fallback, Always Works)**
```
Cost: $0 (no API calls)
Trigger: Z.AI AND z.ai both unavailable OR timeout

Triage fallback:
  - Medical keywords: ["blood", "injury", "poisoned", "ate", "choking"]
    → Output: medical (confidence 0.7)
  - Crisis keywords: ["attacking", "fighting", "loose", "out of control"]
    → Output: crisis (confidence 0.7)
  - Stray keywords: ["found", "loose", "unknown", "stray", "lost"]
    → Output: stray (confidence 0.7)
  - Default: normal (confidence 0.5)

Review moderation fallback:
  - Flag ALL reviews as "pending_manual" (safe, no false approvals)
  - Operator reviews batch next day

Verification fallback:
  - ABN format check only: 11 digits, valid checksum
  - No heuristics (no pattern matching on trainer name, etc.)
```

**Confidence Thresholds:**
```
Triage:
  ≥ 0.75 confidence: Use output (≥75% sure of classification)
  < 0.75 confidence: Default to "normal" (safer, avoid over-classifying)

Review approval:
  ≥ 0.85 confidence: Auto-approve (≥85% legitimate)
  0.70–0.85 confidence: Send to manual queue (operator reviews)
  < 0.70 confidence: Reject as spam (too risky)

Verification:
  Phase 1: Not implemented (skip ABN checks)
  Phase 2+: ≥ 0.80 confidence to auto-verify
```

**Why Z.AI primary?**
- Specialized models (medical detector, spam filter)
- Lower latency than GPT
- Cost-effective
- Allows deterministic fallback (no vendor lock-in)

**Why z.ai fallback?**
- Z.AI unavailability is rare but possible
- z.ai more reliable than custom models
- Covers edge cases Z.AI misses

**Why deterministic always works?**
- Operator never blocked (triage still works)
- Safe defaults (flag reviews, don't auto-approve)
- No external dependency

---

#### Operations Layer (D-010, D-011, D-012)

| ID | Decision | Status | Details |
|---|----------|--------|---------|
| **D-010** | **Operator 4h/week, async, pull-based, no shift** | ✅ YOU | See 08_OPERATIONS_AND_HEALTH.md § Workflow |
| **D-011** | **No human SLAs, Stripe + AI handle everything** | ✅ YOU | See 06_MONETISATION_AND_FEATURED_PLACEMENT.md § SLAs |
| **D-012** | **Stripe-first recovery, RPO 24h, RTO 4–24h** | ✅ YOU | See 08_OPERATIONS_AND_HEALTH.md § Incident Response |

**Complete Operational Specification:**

**Operator Model (D-010):**
```
Workload: 4 hours/week (or less)
  - 1 hour Monday–Thursday: 15 min daily check + variable batch work
  - OR 1 session Sunday: 4 hours uninterrupted batch work
  - OR flexible: Check when convenient, respond to alerts

Method: Pull-based (operator decides when to check)
  - No on-call shifts
  - No SLA response times
  - No pager alerts (optional: Slack webhook if configured)

Admin dashboard highlights:
  - Red alerts (immediate): Webhook failures, DB down, Z.AI down >30 min
  - Yellow alerts (review today): Manual review queue >20, queue backlog >10
  - Green (info): All healthy

Exception handler (not routine ops):
  - If red alert: Operator decides to fix or wait for auto-recovery
  - If no red: Operator is done (2–5 min check)
```

**SLA Policy (D-011):**
```
Trained explicitly NOT to promise:
  ✅ "Webhook processed within 1 hour" — NO (Stripe retries, async)
  ✅ "Review approved within 24 hours" — NO (7–14 day SLA, batched)
  ✅ "Featured placement active immediately" — NO (can queue 0–24h)

Instead, promise:
  ✓ "Featured placement active by next business day"
  ✓ "Manual reviews processed within 7–14 days"
  ✓ "Triage response immediate (deterministic, no operator needed)"
  ✓ "Payment retry handled by Stripe (see their SLA)"

Who handles what?
  - Stripe: Payment processing, retries, reconciliation
  - Z.AI: Triage, review moderation, verification (auto)
  - Cron job: Featured expiry, queue promotion (2am daily)
  - Operator: Manual reviews (batch), red alerts (ad-hoc)
```

**Disaster Recovery (D-012):**
```
Philosophy: Stripe is disaster recovery plan

Targets:
  - RPO (Recovery Point Objective): 24 hours (acceptable data loss)
  - RTO (Recovery Time Objective): 4–24 hours (depends on failure)

Why acceptable for low-traffic app:
  - Not critical infrastructure (not medical device, not life-support)
  - Payment data in Stripe (not in our DB)
  - Deterministic rules survive any system failure
  - Users can search/register even if offline

Disaster scenarios:

1. Database corrupted/ransomware:
   - Restore from Supabase daily backup (24h ago)
   - payment_audit (immutable) used to rebuild featured_slots_status
   - Cron job auto-corrects queue at 2am
   - RTO: 4–12 hours (depending on restoration speed)

2. Stripe webhook unreachable:
   - Stripe retries exponentially (Stripe docs)
   - Operator manually retries if needed (red alert)
   - payment_audit log is source of truth
   - RTO: <1 hour (operator intervention)

3. Z.AI down >30 min:
   - Fallback to z.ai API automatically
   - If z.ai also down: Deterministic rules
   - No data loss (all logs persist)
   - Trainer experience: Seamless (no interruption)

4. Complete outage (DB + API):
   - Vercel managed by Vercel (not our responsibility)
   - Supabase SLA is 99.9%
   - Worst case: Manual recovery from backup
   - RTO: 1–24 hours (Vercel/Supabase support escalation)
```

---

#### Security Layer (D-013, D-014)

| ID | Decision | Status | Details |
|---|----------|--------|---------|
| **D-013** | **MFA mandatory: Admin TOTP, Trainer email OTP** | ✅ Locked | See 09_SECURITY_AND_PRIVACY.md § Authentication |
| **D-014** | **Key rotation quarterly, 30-day grace period** | ✅ Locked | See 09_SECURITY_AND_PRIVACY.md § Secret Management |

**Security Specification:**

**MFA Implementation:**
```
Trainer login: Email OTP
  - No passwords (simpler UX, no password reset flows)
  - OTP expires 15 min
  - Max 5 attempts per email per hour (brute-force protection)
  - JWT token in secure, httpOnly cookie (not localStorage)
  - Token expires 7 days (re-authenticate)

Admin login: TOTP + email
  - TOTP seed stored in authenticator app (Google Authenticator, Authy)
  - Session timeout 15 min idle
  - TOTP re-required for sensitive actions (batch approve >5 reviews)
  - Backup codes printed (physical security)
```

**Key Rotation (Quarterly):**
```
Secrets to rotate: (Vercel Secrets)
  - SUPABASE_ANON_KEY (client DB access)
  - SUPABASE_SERVICE_ROLE_KEY (server DB access)
  - OPENAI_API_KEY
  - Z_AI_API_KEY
  - CRON_SECRET
  - ADMIN_TOTP_SECRET (per admin)
  - SLACK_WEBHOOK_URL

Rotation process:
  1. Generate new secret in provider (Stripe, z.ai, etc.)
  2. Add to Vercel Secrets with 30-day grace label
  3. Redeploy (both old + new secrets work)
  4. Verify new key works in staging
  5. After 30 days: Remove old secret, redeploy
  6. Log rotation in audit trail

Why 30-day grace?
  - Time to test in staging
  - Time for external services to propagate
  - Safety window if deployment fails
```

---

### Summary Table: All 15 Decisions

| ID | Layer | Decision | Locked? | Owner |
|---|---|---|---|---|
| D-001 | Safety | Triage rules (medical/crisis/stray/normal) | ✅ | Blueprint v1.1 |
| D-002 | Monetisation | $20 featured + Pro deferred | ✅ | MONETIZATION_ROLLOUT_PLAN.md |
| D-003 | Geography | 28 councils + suburb auto-assignment | ✅ | Melbourne Councils Reference |
| D-004 | Data Model | 5 ages, 13 issues, 5 services taxonomy | ✅ | Blueprint v1.1 |
| D-005 | Safety | Emergency escalation pathways | ✅ | Blueprint v1.1 |
| D-006 | Search | Ranking: Featured→Verified→Distance→Rating | ✅ | Blueprint v1.1 |
| D-007 | AI | Fallback: deterministic priority order | ✅ | Decision File v1 |
| D-008 | AI | Thresholds: 0.90 reject, 0.85 approve | ✅ | Decision File v1 |
| D-009 | AI | Z.AI primary + z.ai fallback, <$250/mo | ✅ | **YOU** |
| D-010 | Operations | Operator 4h/week, pull-based, no shift | ✅ | **YOU** |
| D-011 | Operations | No human SLAs, Stripe + AI handle it | ✅ | **YOU** |
| D-012 | Operations | Stripe-first recovery, RPO 24h, RTO 4–24h | ✅ | **YOU** |
| D-013 | Security | MFA: Admin TOTP, Trainer OTP | ✅ | Decision File v1 |
| D-014 | Security | Key rotation quarterly, 30-day grace | ✅ | Decision File v1 |
| D-015 | Search | Postgres v1, external Phase 2+ | ✅ | Decision File v1 |

---

## Five Core Principles

### Principle 1: Consent-Heavy UI

**Philosophy:** Never surprise users with aggressive SLAs or expectations.

**Implementation:**

| Feature | Explicit Message | Why |
|---------|------------------|-----|
| Emergency triage | "Call emergency vet first — DTD is supplementary" | Liability, life-safety |
| Manual review queue | "Manual review may take 7–14 days" | Operational reality, manage expectations |
| Featured placement | "Featured placement active by next business day" | Queue delays are normal, realistic window |
| Payment | "Refund available for 3 days only" | Clear boundary, encourages decision-making |

**Rationale:** Build trust by being honest about limitations. Users respect transparency more than inflated promises.

---

### Principle 2: AI Automation First

**Philosophy:** Automate routine work, let operator handle exceptions.

**Implementation:**

| Task | Primary | Fallback | Operator |
|------|---------|----------|----------|
| Triage | Z.AI (medical detector) | z.ai OR deterministic keywords | Never blocked |
| Review moderation | Z.AI (≥0.85 confidence auto-approve) | Manual queue (7–14 days) | Batch review |
| Featured queue promotion | Cron job (2am daily) | Manual activation if cron fails | If alert triggered |
| Payment retry | Stripe (exponential backoff) | Manual retry endpoint | If webhook alert |

**Rationale:**
- **Z.AI scales to 1000s of reviews without operator** (not possible manually)
- **Deterministic fallback** means operator never blocked by AI (critical for emergency)
- **Cron job** handles featured expiry without human intervention (4h/week savings)

---

### Principle 3: Stripe Safety

**Philosophy:** Treat payment data as sacred. Stripe is source of truth.

**Implementation:**

```
payment_audit table (immutable log):
  ├─ Every payment event recorded (checkout, success, refund, webhook)
  ├─ Append-only (never updated, only inserted)
  ├─ 7-year retention (ATO requirement)
  ├─ Used for disaster recovery (rebuild featured_slots_status if DB corrupted)

Webhook idempotency:
  ├─ Stripe event ID is unique identifier
  ├─ If webhook received twice: Idempotent processing (no double-charge)
  └─ Logged to payment_audit with timestamp

Refund policy:
  ├─ 3-day window only (protects cash flow)
  ├─ No exceptions (hard cutoff)
  └─ Communicated upfront ("Refund available for 3 days only")
```

**Rationale:**
- **Stripe handles payment processing** (we never store card data, PCI compliant)
- **payment_audit is our insurance** (if DB corrupted, rebuild from Stripe)
- **Webhook idempotency** prevents accidental double-charging (common bug)

---

### Principle 4: Lean Operations

**Philosophy:** 4h/week operator should never feel overwhelmed.

**Implementation:**

```
Pull-based (not push-based):
  ✅ Operator checks dashboard when convenient
  ❌ No pager alerts (optional Slack, not required)
  ❌ No shift rotation
  ❌ No SLA response time

Exception-driven (not proactive):
  ✅ Only act if red alert (webhook failure, DB down, Z.AI down)
  ✅ All routine work automated (featured cron, review AI, triage AI)
  ❌ No daily reporting (check logs if interested)

Time breakdown (4h/week):
  - 30 min: Daily 5-min dashboard checks (Mon–Fri, only if convenient)
  - 2.5 hours: Weekly batch work (manual reviews, queue monitoring)
  - 1 hour: Incident response (if red alert triggered)
  = 4 hours/week or less
```

**Rationale:**
- **4h/week is sustainable** for solo operator (not 40h/week)
- **Pull-based** means operator controls workload (not on-call stress)
- **Exception-driven** means clear signal-to-noise (red alerts matter, green doesn't)

---

### Principle 5: Disaster Resistant

**Philosophy:** Plan for failure. Deterministic rules survive anything.

**Implementation:**

```
Stripe is disaster recovery:
  ├─ If our DB corrupted: Restore from Supabase backup (24h old)
  ├─ Rebuild featured state from payment_audit
  ├─ Cron job auto-corrects queue at 2am
  └─ RTO: 4–24 hours (acceptable for low-traffic app)

Deterministic fallback (no external dependencies):
  ├─ Triage: Keyword detection (always works, no AI needed)
  ├─ Featured queue: Cron job (time-based, not event-driven)
  └─ Reviews: Flag as pending if AI down (safe, no false approvals)

Why RPO 24h acceptable:
  ├─ Payments in Stripe (not in our DB)
  ├─ Trainers not injured by losing 24h of data
  ├─ Not critical infrastructure (not medical device)
  └─ Daily backup is reasonable trade-off (hourly = 5x cost)

Why RTO 4–24h acceptable:
  ├─ Users can search/register even if offline (graceful degradation)
  ├─ Stripe + Supabase provide SLAs
  └─ Rare event (not expected to happen monthly)
```

**Rationale:**
- **Deterministic rules** mean no vendor lock-in (Z.AI, z.ai down? Still works)
- **Stripe as DR** means payment data recoverable (our DB is ephemeral)
- **4–24h RTO** is realistic for startup (not enterprise SLA)

---

## Technology Stack

### Runtime & Hosting

```
Frontend:        Next.js 15 (App Router, TypeScript)
Backend:         Next.js API Routes (serverless)
Hosting:         Vercel (auto-deploy, cron jobs)
Database:        Supabase (managed Postgres 15)
Auth:            Supabase Auth (email OTP)
```

### Integrations

```
Payments:        Stripe Checkout + webhooks
AI/Automation:   Z.AI (primary) + z.ai (fallback)
Monitoring:      Vercel alerts + Slack webhook (optional)
Search:          Postgres full-text (v1), Elasticsearch (Phase 2+)
```

### Infrastructure

```
Secrets:         Vercel Secrets (encrypted)
Backups:         Supabase daily backups (7-day retention)
Cron jobs:       Vercel Cron Functions (2am AEDT daily)
Logging:         Vercel Function logs + Supabase audit
```

---

## Target Users & Their Needs

### User 1: Dog Owner (Primary)

**Demographics:**
- Age: 25–55
- Urban Melbourne resident
- Has dog(s) with behavioral issues
- Searches via mobile (primary device)

**Needs:**
- "Find trainer who specializes in my dog's issue" (aggression, anxiety, etc.)
- "Show me someone nearby (my suburb)"
- "I want to see reviews/ratings before I commit"
- Emergency path: "My dog is aggressive right now, help!"

**Behaviors:**
- Rarely registers (anonymous search OK)
- May leave review after session
- Wants contact info (email, phone, website link)
- Wants business hours/consultation fees

---

### User 2: Dog Trainer (Secondary, Revenue-Critical)

**Demographics:**
- Age: 30–65
- Self-employed or small business
- Relies on word-of-mouth (no digital presence)
- Uses email + Facebook (not tech-savvy)

**Needs:**
- "Free listing to get discovered"
- "Way to stand out from competitors" (featured placement)
- "Social proof via reviews"
- "Easy to register and manage" (no complex admin)

**Behaviors:**
- Registers once, maintains profile (weekly edits)
- Purchases featured when they want leads
- Reads reviews (good/bad)
- Wants analytics (Phase 3+)

---

### User 3: Admin/Operator (Tertiary, Operational)

**Demographics:**
- Background: Product/business operations (not code)
- Works 4h/week on DTD
- Has primary job elsewhere

**Needs:**
- "Clear alerts when something breaks"
- "Simple actions (approve reviews, suspend listing)"
- "Minimal cognitive load"
- "Documented playbooks for incidents"

**Behaviors:**
- Logs in 1–5x per week (flexible)
- Spends 2–5 min per check (red alerts only)
- Batch approves reviews (30 min weekly)
- Responds to incidents (if red alert)

---

## Key Metrics & Success Criteria

### Phase 1 Metrics (MVP)

| Metric | Target | Why |
|--------|--------|-----|
| **Active trainers** | 50–100 | Sufficient supply for launch |
| **Listings per council** | 2–5 average | Meaningful choice, not oversupply |
| **Monthly searches** | 1,000+ | Proof of demand |
| **Featured adoption rate** | 20%+ | $20 price point validated |
| **Review volume** | 100+ reviews/month | Social proof accumulating |
| **Emergency triage uses** | 50+ per month | Safety pathway used |
| **Operator time** | 4h/week | Operational model validated |

### Phase 2–3 Metrics (Enhancement)

| Metric | Target | Why |
|--------|--------|-----|
| **Verified trainers** | 80%+ | Manual review builds quality |
| **Repeat searches** | 30%+ | User retention |
| **Review quality** | 7+ avg rating | Good trainer pool |
| **Featured revenue** | $X/month | Monetisation validation |
| **Manual review SLA** | 7–14 days | Operational reality |

---

## Phase Roadmap

### Phase 1: MVP (Months 1–2)

**Ship:**
- Trainer registration + listing
- Dog owner search + filtering
- Emergency triage
- Featured placement ($20, max 5/council)
- Review moderation (AI auto-approve ≥0.85, manual queue <0.85)
- Admin dashboard (red alerts only)

**Not shipped:**
- ABN verification
- Pro tier subscription
- Analytics dashboard
- External search (Elasticsearch)

**Success criteria:**
- 50+ trainers registered
- 1000+ searches/month
- 20% featured adoption
- 4h/week operator model validated

---

### Phase 2: Enhancement (Months 3–4)

**Add:**
- ABN verification (manual + Phase 3 auto)
- Admin moderation dashboard (manual reviews)
- Complaint/suspension system
- Enhanced search (Elasticsearch)
- Trainer analytics dashboard (Phase 3 defer)

**Not yet:**
- Pro subscription
- Mobile app
- API partners

---

### Phase 3–5: Scaling (Months 5+)

**Plan:**
- Pro tier subscription (recurring, Stripe Billing)
- Advanced analytics
- Mobile app (iOS/Android)
- API partners integration
- Potential acquisition by vetted partners

---

## Development Readiness Checklist

**Before development begins, verify:**

- ✅ All 15 decisions understood and approved
- ✅ Database schema (02_DOMAIN_MODEL.md) mapped to Supabase schema
- ✅ API endpoints (05_DATA_AND_API_CONTRACTS.md) approved by team
- ✅ Featured placement workflow (06_MONETISATION_AND_FEATURED_PLACEMENT.md) clear
- ✅ Z.AI integration approach (07_AI_AUTOMATION_AND_MODES.md) confirmed with Z.AI provider
- ✅ Operator workflow (08_OPERATIONS_AND_HEALTH.md) realistic for 4h/week
- ✅ Secrets & auth (09_SECURITY_AND_PRIVACY.md) configured in Vercel
- ✅ Deployment to Vercel tested (Next.js app ready)
- ✅ GitHub Actions cron job planned (featured_expiry_and_promotion)
- ✅ Admin panel MVP features scoped (red alerts, manual review queue)
- ✅ Stripe test account created + webhook signature captured
- ✅ Supabase project created + database schema initialized
- ✅ Z.AI API key obtained + tested in sandbox
- ✅ Team alignment on "no human SLAs" commitment

---

## Decision Rationale & Trade-Offs

### Why $20 (not $50 or $5)?

| Price | Trainer Outcome | Adoption | Revenue |
|-------|------------------|----------|---------|
| **$5** | Too cheap → Devalues service | High adoption | Low revenue |
| **$20** | Signals quality, filters serious trainers | Moderate | Moderate |
| **$50** | May reduce adoption, only for high-demand | Low adoption | Higher/trainer |

**Decision:** $20 is psychological sweet spot (affordable impulse buy, not a waste).

---

### Why One-Time (not Subscription)?

| Model | Cash Flow | UX Friction | Churn Risk |
|-------|-----------|------------|-----------|
| **One-time** | Predictable upfront | Simple (one decision) | None |
| **Subscription** | Recurring but unpredictable | Recurring billing friction | Cancellations unpredictable |

**Decision:** One-time avoids churn management complexity. Pro tier (Phase 5+) can introduce subscriptions later.

---

### Why Max 5 per Council (not unlimited)?

| Supply | Featured Value | Trainer SLA |
|--------|---|---|
| **Unlimited** | Diluted (too many featured) | Each trainer's ROI drops |
| **5 per council** | Scarce (valuable placement) | Strong ROI justifies $20 |

**Decision:** Scarcity drives demand. If queue forms, price is too low (Phase 3 signal to increase).

---

### Why 4h/week (not 40h/week)?

| Model | Cost | Sustainability | Operator Burnout |
|-------|------|---|---|
| **40h/week** | Full-time salary ($60k+) | High burn rate | None (professional ops) |
| **4h/week** | Gig work (~$2k/month) | Sustainable | Risk if understaffed |

**Decision:** 4h/week assumes AI + automation handle 95% of work. If red alerts spike, scale up.

---

### Why Stripe-First DR (not Database-First)?

| Approach | Recovery Data | Ease | Cost |
|----------|---|---|---|
| **Stripe-first** | Payment audit log | Easy (Stripe reliable) | Low (daily backup) |
| **DB-first** | Everything (full backup) | Complex (large restore) | High (hourly backup = 5x) |

**Decision:** Payment data is most critical. Rebuild featured state from payment_audit. Other data (reviews, listings) acceptable to lose 24h.

---

## Cross-References to Other Documents

### Related Documents (Dependencies)

- **02_DOMAIN_MODEL.md** — Foundation: All entities, enums, geography
  - Contains: Database schema, constraints, invariants
  - Referenced by: 03, 04, 05, 06

- **03_USER_JOURNEYS.md** — User experience: All actor flows
  - Contains: Dog owner, trainer, emergency, operator workflows
  - Referenced by: 04, 08

- **04_ROUTES_AND_NAVIGATION.md** — App structure: URLs, routes, auth boundaries
  - Contains: Public, trainer, admin routes
  - Referenced by: 05, 09

- **05_DATA_AND_API_CONTRACTS.md** — Backend: All APIs, request/response formats
  - Contains: Endpoints, authentication, rate limits, error handling
  - Referenced by: 06, 07, 08

- **06_MONETISATION_AND_FEATURED_PLACEMENT.md** — Payment: Stripe integration, workflow
  - Contains: Featured lifecycle, cron job, refund policy, compliance
  - Referenced by: 08

- **07_AI_AUTOMATION_AND_MODES.md** — Automation: Z.AI, z.ai, deterministic fallback
  - Contains: AI tiers, safety rules, feature flags, use cases
  - Referenced by: 08

- **08_OPERATIONS_AND_HEALTH.md** — Operations: Admin dashboard, 4h/week workflow, alerts
  - Contains: Operator procedures, cron job, incident response
  - Referenced by: (none, terminal doc)

- **09_SECURITY_AND_PRIVACY.md** — Security: Secrets, auth, encryption, compliance
  - Contains: OTP/TOTP, MFA, secret rotation, data retention, incident response
  - Referenced by: (none, terminal doc)

### Decisions Implemented in This Document

- D-001: Emergency triage classification (explained in context)
- D-002: Featured pricing & deferred Pro (complete specification above)
- D-003: 28 councils & auto-assignment (complete specification above)
- D-004: Taxonomy (5 ages, 13 issues, 5 services) — complete enumeration above
- D-005: Emergency pathways (explained in safety layer)
- D-006: Search ranking algorithm (complete specification above)
- D-007: AI fallback rules (complete specification above)
- D-008: Confidence thresholds (complete specification above)
- D-009: Z.AI + z.ai strategy (complete specification above)
- D-010: Operator 4h/week (complete specification above)
- D-011: No human SLAs (complete specification above)
- D-012: Stripe-first DR (complete specification above)
- D-013: MFA (mentioned, detailed in 09_SECURITY_AND_PRIVACY.md)
- D-014: Key rotation (mentioned, detailed in 09_SECURITY_AND_PRIVACY.md)
- D-015: Postgres v1 (explained in search layer)

---

**Document Status:** ✅ Complete, comprehensive, ready for development  
**Last Updated:** 2025-12-25  
**Owner:** Product + Architecture team  
**Next Review:** After Phase 1 launch (Month 2)

