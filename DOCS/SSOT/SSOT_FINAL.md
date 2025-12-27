# Dog Trainers Directory Melbourne

## Single Source of Truth (SSOT) — Canonical Blueprint FINAL

> **Status:** FINAL, LOCKED, AUTHORITATIVE  
> **Scope:** Melbourne metropolitan area (28 councils)  
> **Operating model:** Fully AI-automated, minimal manual oversight  
> **Change control:** Versioned updates only via explicit RFC and version bump

---

## 1. Purpose & User Outcomes

Dog Trainers Directory Melbourne is a **mobile-first directory and triage platform** for dog owners.
The platform is **AI-automated on the admin side** with minimal manual oversight post-launch.

### Outcome Routes (Canonical)

- **Route 1 — Emergency / Guidance Layer (Contextual)**
  - Emergency resources, council guidance, shelters, crisis escalation.
  - May surface directory entities with urgent framing.
- **Route 2 — Directory & Matching (Primary Backbone)**
  - Trainer, consultant, and vet listings surfaced via age-first matching.

Route 1 is a contextual overlay; Route 2 remains the structural backbone.

---

## 2. Product Overview

### What the Product Is

A **hyperlocal matching directory** connecting Melbourne dog owners with qualified trainers and behavioural consultants, prioritising **verified providers** and integrating **emergency veterinary and shelter pathways**.

### Who It Is For

- Dog owners (Melbourne metro)
- Trainers and behaviour consultants
- Emergency vets and shelters
- Council/pound referral use

### Core Goals

- Reduce mismatch via **age-first matching**
- Trust-first discovery (ABN verification)
- Clear emergency escalation
- Suburb-first UX with council/region derived
- Locked taxonomies; no free-text drift

### Non-Goals

- No DIY training content
- No booking or payments processing
- No reviews-first ranking
- No interstate coverage

---

## 3. Domain Model (Conceptual)

Entities:

- Business
- Trainer (Account)
- Dog Owner (anonymous)
- Suburb → Council → Region
- Review
- Featured Placement

Relationships enforce age/issue compatibility, suburb-first geography, and soft deletes only.

---

## 4. Canonical Taxonomies (LOCKED)

### Age/Stage

Puppies (0–6m); Adolescent (6–18m); Adult (18m–7y); Senior (7y+); Rescue (orthogonal)

### Behaviour Issues (13)

Pulling on lead; Separation anxiety; Excessive barking; Dog aggression; Leash reactivity;
Jumping up; Destructive behaviour; Recall issues; Anxiety; Resource guarding;
Mouthing/nipping/biting; Rescue dog support; Socialisation.

### Service Types (5)

Puppy training; Obedience training; Behaviour consultations; Group classes; Private training.

### Resource Types (5)

trainer; behaviour_consultant; emergency_vet; urgent_care; emergency_shelter.

### Regions

Inner City; Northern; Eastern; South Eastern; Western.

---

## 5. Invariant Rules (NON-NEGOTIABLE)

- ABN lookup credentials/GUID are server-only and must never be exposed client-side.
- Age selected first in all flows
- Enum-only categories
- Suburb-only user selection
- Council/Region auto-derived
- ABN verification is optional for all listings and business owners.
- ✅ Verified badge is shown if ABN lookup confirms the ABN exists and status is Active.
- Emergency flows isolated from monetisation
- Soft delete only; no orphan data

---

## 6. Journeys & System Processes

### Trainer Onboarding

Create account → Claim/Create business → Configure profile → Optional ABN → Publish → Dashboard.

### Emergency Help

Medical emergencies → vets; Stray dogs → shelters/council; Behaviour crisis → rescue/aggression trainers.

### Web Scraper

Weekly automated ingestion; enum mapping only; safe defaults; scaffolded listings.

---

## 7. Information Architecture

Primary: Home/Triage, Results, Trainer Profile, Emergency Help, Directory Browse, Trainer Portal.  
Secondary: About, How It Works, For Trainers, FAQs, Contact.

---

## 8. Non-Functional Expectations

- Fast search and triage (<1s)
- Emergency prioritisation
- Data correctness via authoritative suburb-council mapping
- Scalable to 5,000+ listings
- Immutable SSOT assets with CI enforcement

---

## 9. Monetisation (FINAL, LOCKED)

- **Pricing:** All advertised prices are in **AUD** and are **GST-inclusive (where GST applies)**.

### Listing Tiers

**Basic (Free)**

- Directory and council visibility
- Standard profile
- Lowest ordering priority

**Pro — Gold Card**

- $20 AUD per 30 days
- Auto-renewing subscription
- Gold Card badge
- Top suggested listings within council
- Enhanced profile cards
- Access to built-in landing page builder

### Featured Placement (Optional Add-On)

- $15 AUD per 30 days
- Non-recurring, manual re-purchase
- Council-based only
- FIFO allocation
- Max 5 featured listings per council
- Visually labelled as “Featured by the platform”

### Ordering (After Compatibility Filters)

1. Featured (FIFO)
2. Pro (Gold Card)
3. Basic (Free)

### Refunds

- **No refunds** for Pro or Featured.
- **Pro:** Cancel anytime; access remains until the end of the current 30-day billing period.
- **Featured:** Non-refundable after activation.

Emergency flows never evaluate monetisation.

---

## 10. Governance & Versioning

- Admin panel and AI automation specifications are **out-of-scope** and **non-canonical** until explicitly reintroduced via SSOT update.
- **SSOT FINAL** is authoritative
- Changes require RFC + version bump
- Deprecated docs must not be referenced
- Builders must not invent behaviour

---

## Appendices

- Conceptual ERD
- Example Profiles
- Glossary

---
