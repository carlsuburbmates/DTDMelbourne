# Dog Trainers Directory — Product Overview (SSOT Final Aligned)

> **SSOT Alignment:** This document is a derived reference. Canonical requirements live in `DOCS/SSOT/SSOT_FINAL.md`. This file contains only SSOT-aligned content.

---

## Executive Summary
Dog Trainers Directory Melbourne is a **mobile-first directory and triage platform** for dog owners in Melbourne. The admin side is **AI-automated** with minimal manual oversight. The product connects dog owners with qualified trainers and behavioural consultants, while providing emergency veterinary and shelter pathways.

---

## Product Definition

### What the Product Is
A **hyperlocal matching directory** that prioritises **age-first matching**, suburb-first discovery, and trust signals via **ABN verification**.

### Who It Is For
- Dog owners (Melbourne metro)
- Trainers and behaviour consultants
- Emergency vets and shelters
- Council/pound referral use

### Core Goals (Canonical)
- Reduce mismatch via **age-first matching**
- Trust-first discovery (ABN verification)
- Clear emergency escalation
- Suburb-first UX with council/region derived
- Locked taxonomies (enum-only)

### Non-Goals (Canonical)
- No DIY training content
- No booking or payments processing
- No reviews-first ranking
- No interstate coverage

---

## Invariant Rules (Canonical)
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

## Geography (Canonical)
- Melbourne metropolitan area only
- Users select **suburb** only
- Council and region are **auto-derived**
- UI avoids “LGA” terminology

---

## Information Architecture (Canonical)
**Primary:** Home/Triage, Results, Trainer Profile, Emergency Help, Directory Browse, Trainer Portal

**Secondary:** About, How It Works, For Trainers, FAQs, Contact

---

## Monetisation (Final)

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

**Featured Placement (Optional Add-On)**
- $15 AUD per 30 days
- Non-recurring, manual re-purchase
- Council-based only
- FIFO allocation
- Max 5 featured listings per council
- Visually labelled as “Featured by the platform”

**Pricing**
- All advertised prices are in **AUD** and are **GST-inclusive (where GST applies)**.

**Ordering (After Compatibility Filters)**
1. Featured (FIFO)
2. Pro (Gold Card)
3. Basic (Free)

**Refunds**
- Pro: No refunds; cancel anytime; access until end of cycle
- Featured: No refunds after activation

**Emergency flows never evaluate monetisation.**

---

## Governance & Versioning
- `SSOT_FINAL.md` is authoritative
- Changes require RFC + version bump
- Deprecated docs must not be referenced
- Builders must not invent behaviour
