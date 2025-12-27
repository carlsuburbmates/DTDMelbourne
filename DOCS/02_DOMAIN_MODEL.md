# Domain Model (SSOT Final Aligned)

> **SSOT Alignment:** This document is a derived reference. Canonical requirements live in `DOCS/SSOT/SSOT_FINAL.md`. This file contains only SSOT-aligned content.

---

## Canonical Entities
- Business
- Trainer (Account)
- Dog Owner (anonymous)
- Suburb → Council → Region
- Review
- Featured Placement

Relationships enforce age/issue compatibility, suburb-first geography, and soft deletes only.

---

## Canonical Taxonomies (Locked)

### Age/Stage
Puppies (0–6m); Adolescent (6–18m); Adult (18m–7y); Senior (7y+); Rescue (orthogonal)

### Behaviour Issues (13)
Pulling on lead; Separation anxiety; Excessive barking; Dog aggression; Leash reactivity; Jumping up; Destructive behaviour; Recall issues; Anxiety; Resource guarding; Mouthing/nipping/biting; Rescue dog support; Socialisation

### Service Types (5)
Puppy training; Obedience training; Behaviour consultations; Group classes; Private training

### Resource Types (5)
trainer; behaviour_consultant; emergency_vet; urgent_care; emergency_shelter

### Regions
Inner City; Northern; Eastern; South Eastern; Western

---

## Canonical Invariant Rules
- Age selected first in all flows
- Enum-only categories
- Suburb-only user selection
- Council/Region auto-derived
- ABN verification is optional for all listings and business owners
- ✅ Verified badge is shown if ABN lookup confirms the ABN exists and status is Active
- ABN lookup credentials/GUID are server-only and must never be exposed client-side
- Emergency flows isolated from monetisation
- Soft delete only; no orphan data

---

## DECISION REQUIRED (Not in SSOT)
- **Database schema details:** Table/column definitions, constraints, and indexes are not specified in SSOT_FINAL and require confirmation before implementation.
- **ABN storage fields:** SSOT defines verification behaviour but does not specify storage schema for ABN values.
