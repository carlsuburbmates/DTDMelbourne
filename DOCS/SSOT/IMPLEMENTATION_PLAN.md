# Implementation Plan — SSOT-Aligned

**Project:** Dog Trainers Directory (DTD)  
**Status:** Docs-first execution plan (SSOT_FINAL authoritative)

---

## Source of Truth and Compliance

**SSOT:** `SSOT_FINAL.md` (authoritative). This plan must align to SSOT_FINAL.md at all times.

**Reference files (derived, non-authoritative):**

- `DOCS/01_PRODUCT_OVERVIEW_COMPREHENSIVE.md`
- `DOCS/02_DOMAIN_MODEL.md`
- `DOCS/03_USER_JOURNEYS.md`
- `DOCS/04_ROUTES_AND_NAVIGATION.md`
- `DOCS/05_DATA_AND_API_CONTRACTS.md`
- `DOCS/06_MONETISATION_AND_FEATURED.md`
- `DOCS/07_AI_AUTOMATION_AND_MODES.md`
- `DOCS/08_OPERATIONS_AND_HEALTH.md`
- `DOCS/09_SECURITY_AND_PRIVACY.md`
- `DOCS/10_VALIDATION_AND_HANDOFF.md`

If any plan item conflicts with SSOT_FINAL, SSOT wins and this plan must be updated before execution.

---

## Global Constraints (Apply to All Workstreams)

- **Admin panel and AI automation** are **OUT OF SCOPE** for the current implementation cycle and must **not** be implemented until explicitly reintroduced via an SSOT update.
- **Australian English** in all user/admin copy
- **Mobile-first** UI/UX
- **Suburb-first geography** (no “LGA” in UI)
- **Emergency isolation** from monetisation

---

## Implementation Workstreams

### Workstream A — Foundation

**Goal:** Establish data models and basic infrastructure aligned to SSOT_FINAL

- Implement enum-locked taxonomies
- Implement suburb → council → region derivation
- Implement soft-delete only (no orphan data)

**SSOT References:** §3 Domain Model, §4 Canonical Taxonomies, §5 Invariant Rules

---

### Workstream B — Core Directory & Journeys

**Goal:** Deliver the primary directory and emergency flows.

- Age-first matching flow
- Suburb-only selection
- Emergency routing (medical/stray/behaviour crisis) separated from monetisation

**SSOT References:** §1 Purpose & User Outcomes, §6 Journeys & System Processes, §7 Information Architecture

---

### Workstream C — Monetisation

**Goal:** Implement canonical pricing and ordering rules.

- Basic (Free)
- Pro (Gold Card) — $20 AUD / 30 days auto-renew
- Featured add-on — $15 AUD / 30 days non-recurring, FIFO, max 5 per council
- Ordering after compatibility: Featured → Pro → Basic
- Refund policy: no refunds (Pro cancels end-of-cycle; Featured non-refundable after activation)

**SSOT References:** §9 Monetisation

---

### Workstream D — Verification

**Goal:** Implement ABN verification rules (optional, Active status = badge).

- ABN is optional for all listings/business owners
- Verified badge only if ABN exists and status is Active
- ABN lookup credentials/GUID are server-only

**SSOT References:** §5 Invariant Rules

---

### Workstream E — Governance & Compliance

**Goal:** Ensure SSOT compliance in documentation and delivery.

- SSOT_FINAL is authoritative
- Deprecated docs must not be referenced
- Builders must not invent behaviour

**SSOT References:** §10 Governance & Versioning

---

## Execution Order (Docs-First → Code-Second) [MANDATORY]

### Gate 0 — Documentation Freeze (NO code changes allowed)

1. Reconcile **all Markdown documentation** to `SSOT_FINAL.md`.
2. Ensure these canonical locks appear consistently across docs:
   - Prices are **AUD** and **GST-inclusive (where GST applies)**
   - **No refunds** (Pro cancels end-of-cycle; Featured non-refundable after activation)
   - **Pro:** $20 / 30 days, auto-renew, Gold Card, landing page builder **Pro-only**
   - **Featured:** $15 / 30 days, non-recurring, manual re-purchase, FIFO, **max 5 per council**
   - **Ordering after compatibility:** Featured → Pro → Basic
   - **ABN verification:** optional; ✅ badge only if ABN exists and status is **Active**; otherwise no badge (neutral)
   - **Admin panel + AI automation:** OUT OF SCOPE / non-canonical for now
3. Run a repo-wide docs verification search to confirm **no contradictions remain** (e.g., no stale pricing or refund windows).
   **Exit criteria:** Docs are internally consistent and `SSOT_FINAL.md` is the only canonical reference.

### Gate 1 — Plan Lock

4. Update this `IMPLEMENTATION_PLAN.md` to reflect the frozen documentation state.
5. Commit docs-only changes.

**Exit criteria:** Implementation plan contains no version drift and no contradictions.

### Gate 2 — Codebase Alignment (Begin implementation)

6. Only after Gate 0 and Gate 1, start updating the codebase to match canonical docs exactly.
7. Implement in workstream order (A → B → C → D → E). If you discover a conflict, stop and update docs first.

--

## Implementation Locks (Code Changes Allowed Only After Docs Freeze)

### 1) API Contracts (paths + payload shapes)

**Decision:** Implement server-side contracts as the canonical interface; client must not re-implement business rules (ordering, caps).

- `GET /api/public/search`

  - **Input (query):** `suburb` (string, required), `age_stage` (enum|`all`, required), `behaviour_issue` (enum|null), `radius_km` (number|null)
  - **Output:** `{ results: BusinessCard[], meta: { applied_filters, council, region } }`
  - **Rule:** Apply compatibility + ordering server-side (Featured → Pro → Basic after age/issue filters)

- `POST /api/auth/register` + `POST /api/auth/login`

  - Use provider defaults (see Auth section) — no custom auth payloads beyond provider

- `POST /api/trainer/business/claim`

  - **Input:** `{ business_id, verification_method: "sms", code }`
  - **Output:** `{ success: true } | { error_code, message }`
  - **Rule:** Claim binds trainer_id to business_id (ownership)

- `POST /api/trainer/business/create`

  - **Input:** `{ name, phone, email?, address, suburb, website? }`
  - **Output:** `{ business_id }`
  - **Rule:** Reject if suburb not in 28 councils mapping

- `PATCH /api/trainer/business/:id`

  - **Input:** Only locked enums for categories; reject any non-enum value
  - **Rule:** Trainers can only update businesses they own (enforced by RLS)

- `POST /api/trainer/abn/verify`

  - **Input:** `{ business_id, abn }`
  - **Output:** `{ verified: boolean, status: "Active" | other | "NotFound" }`
  - **Rule:** Verified badge only if ABN exists + status Active; ABN lookup is server-only

- `POST /api/billing/pro/subscribe`

  - **Rule:** Pro = $20 AUD / 30 days auto-renew; no refunds; cancel end-of-cycle

- `POST /api/billing/featured/purchase`

  - **Input:** `{ business_id, council_id }`
  - **Rule:** Featured = $15 AUD / 30 days non-recurring; FIFO; max 5 per council; reject purchase if cap reached

---

### 2) Database Schema (tables + invariants)

**Decision:** Enforce SSOT invariants at the DB level wherever possible.

Required tables (minimum):

- `businesses`

  - invariants: `resource_type` (enum), `suburb_id` (FK required), `council_id` (derived), `region` (derived), `abn_verified` (bool), `tier` (basic|pro), `is_deleted`/`deleted_at`

- `trainers` (accounts)
- `trainer_businesses` OR `businesses.trainer_id` (ownership)
- `suburbs` (authoritative mapping) + `councils` (+ optional `regions`)

  - invariant: suburb must map to exactly one council/region

- `abn_verifications`

  - fields: `business_id`, `abn`, `status`, `verified`, `matched_json`, `checked_at`

- `featured_placements`

  - fields: `business_id`, `council_id`, `starts_at`, `ends_at`, `created_at`
  - invariants: only 5 active rows per `council_id`; FIFO order = `created_at`

- `subscriptions` (or `business_subscription_status`)

  - fields: `business_id`, `tier`, `current_period_end`, `status`

Hard constraints (must be enforced):

- No orphan businesses: `suburb_id` required; derived council/region must exist
- Enum-only categories: reject non-canonical taxonomies at insert/update
- Soft delete only (no hard deletes)
- Featured cap: max 5 active featured per council
- Featured expiry: 30 days; Pro period: 30 days

---

### 3) Auth/Security (provider + ownership + RLS stance)

**Decision:** Use managed auth and database-enforced access control.

- **Auth provider:** Supabase Auth (email/password)
- **Roles:** anonymous dog owner (public read), authenticated trainer (write own listings)
- **Ownership rule:** trainer may edit only businesses they own/claimed (businesses.trainer_id or join table)
- **RLS stance (mandatory):**

  - Public read: `businesses` (non-deleted), `suburbs`, `councils` (read-only)
  - Trainer write: only owned businesses; cannot change locked taxonomy values outside enums
  - Server-only operations (service role): ABN verification writebacks; subscription/featured state updates

- **Secrets:** ABN lookup GUID/credentials must never be exposed client-side; ABN verification is server-only
- **Abuse controls:** rate-limit ABN verify + claim attempts per account/IP
