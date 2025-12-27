# Data & API Contracts (SSOT Final Aligned)

> **SSOT Alignment:** This document is a derived reference. Canonical requirements live in `DOCS/SSOT/SSOT_FINAL.md`. This file contains only SSOT-aligned content.

---

## Canonical Data Resources
- Business
- Trainer (Account)
- Dog Owner (anonymous)
- Suburb → Council → Region
- Review
- Featured Placement

---

## Canonical Constraints
- Enum-only categories (locked taxonomies)
- Suburb-only user selection; council/region auto-derived
- Age selected first in all flows
- ABN verification optional; Verified badge only if ABN is Active
- ABN lookup credentials/GUID are server-only and must never be exposed client-side
- Emergency flows isolated from monetisation
- Soft delete only; no orphan data

---

## DECISION REQUIRED (Not in SSOT)
- API endpoints, request/response schemas, auth mechanisms, and error contracts are not specified in SSOT.
