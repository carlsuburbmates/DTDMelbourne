# User Journeys (SSOT Final Aligned)

> **SSOT Alignment:** This document is a derived reference. Canonical requirements live in `DOCS/SSOT/SSOT_FINAL.md`. This file contains only SSOT-aligned content.

---

## Journey 1: Dog Owner Directory Search
1. User lands on Home/Triage.
2. Selects **age/stage** first.
3. Enters suburb (suburb-first selection).
4. Filters by behaviour issues and service types (enum-only).
5. Views results ordered by compatibility, then monetisation ordering (Featured → Pro → Basic).
6. Opens a trainer profile for contact details.

---

## Journey 2: Emergency Help
- **Medical emergencies:** Route to emergency vets/urgent care.
- **Stray dogs:** Route to shelters/council guidance.
- **Behaviour crisis:** Route to rescue/aggression trainers with urgent framing.

Emergency flows are **isolated from monetisation**.

---

## Journey 3: Trainer Onboarding
Create account → Claim/Create business → Configure profile → **Optional ABN** → Publish → Dashboard.

Verified badge appears only when ABN lookup confirms **Active** status.

---

## Journey 4: Web Scraper Ingestion
Weekly automated ingestion; enum mapping only; safe defaults; scaffolded listings.

---

## Journey 5: Trainer Monetisation
1. Trainer chooses tier: **Basic (Free)** or **Pro (Gold Card)**.
2. Optional **Featured add-on** purchase (FIFO, max 5 per council).
3. Pricing is **AUD** and **GST-inclusive where GST applies**.
4. **No refunds** (Pro cancels end-of-cycle; Featured non-refundable after activation).

---

## DECISION REQUIRED (Not in SSOT)
- Detailed UI copy, interaction micro-flows, and error handling are not specified in SSOT.
