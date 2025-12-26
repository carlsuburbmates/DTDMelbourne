# 03_USER_JOURNEYS.md – Complete Actor Workflows & State Transitions

**Dog Trainers Directory (DTD) — User Journeys & Scenarios**

**Last Updated:** 2025-12-25  
**Status:** Complete specification, production-ready  
**Audience:** Product managers, UX designers, frontend developers, QA engineers

---

## Table of Contents

1. [Overview & State Machine](#overview--state-machine)
2. [Journey 1: Dog Owner (Search & Discovery)](#journey-1-dog-owner-search--discovery)
3. [Journey 2: Trainer (Registration & Management)](#journey-2-trainer-registration--management)
4. [Journey 3: Emergency Handler (Triage & Escalation)](#journey-3-emergency-handler-triage--escalation)
5. [Journey 4: Admin Operator (4h/week Workflow)](#journey-4-admin-operator-4hweek-workflow)
6. [State Transitions & Lifecycle](#state-transitions--lifecycle)
7. [Error Flows & Edge Cases](#error-flows--edge-cases)
8. [Accessibility & Compliance Notes](#accessibility--compliance-notes)

---

## Overview & State Machine

### Core Principle: Age-First, No Login (Owner) vs. Email-OTP (Trainer)

**Dog Owner:**
- Anonymous, no login required
- Age-first filtering (mandatory entry point)
- Optional: Leave review (no account needed)
- Optional: Register after emergency triage (future enhancement)

**Trainer:**
- Email OTP authentication (no passwords)
- Must select ≥1 age group + service type
- Optional: Purchase featured placement
- Required: Verify email before claiming business

**Admin Operator:**
- TOTP 2FA (admin-only)
- 4h/week pull-based (no on-call SLA)
- Batch processing (reviews, alerts)

**Related Decisions:** D-013 (MFA), D-003 (age-first), D-010 (lean ops)

---

## Journey 1: Dog Owner (Search & Discovery)

### Entry Points

**Scenario A: Homepage (Cold Start)**
```
User arrives: dogtrainersdirectory.com.au
↓ Geolocation prompt: "Use your location?" [Allow] [Decline]
↓ Age-first triage: "How old is your dog?"
```

**Scenario B: Deep Link (Direct Entry)**
```
User clicks link: dogtrainersdirectory.com.au/?suburb=Fitzroy&age=Adolescent
↓ App loads directly to results (skip homepage)
```

**Scenario C: Emergency First (Critical Path)**
```
User in crisis: dogtrainersdirectory.com.au/emergency
↓ Emergency form (60-second entry)
↓ Z.AI triage → Results (vets/trainers/escalation)
```

---

### Step 1: Age Selection (Mandatory Gate)

**UI Element:** Radio buttons or segmented control

```
"How old is your dog?"

○ Puppy (0–6 months)
○ Adolescent (6–18 months)
○ Adult (1.5–7 years)
○ Senior (7+ years)
○ Rescue/rehomed (any age)
○ I'm not sure (all ages)
```

**Logic:**
```
IF age selected → Proceed to Step 2
IF "I'm not sure" → Default to all ages in filtering (no trainer excluded)
IF cancel/back → Show help text: "Age helps us find the right trainer for your dog"
```

**Related Decision:** D-004 (5 ages locked, mandatory first)

**Example Query:**
```sql
-- If age = "Adult" selected
SELECT * FROM businesses 
WHERE 'Adult' = ANY(age_specialties) AND deleted = FALSE
```

---

### Step 2: Rescue Status (Optional)

**UI Element:** Checkbox

```
☐ My dog is a rescue/rehomed dog

(This doesn't eliminate trainers—just helps us find specialists)
```

**Logic:**
```
IF checked → Add tag "rescue" to filters (advisory, not filtering)
IF not checked → No rescue filter applied
```

**Why Optional:** Rescue is orthogonal to age (a 2-year-old shelter dog is adolescent + rescue).

---

### Step 3: Behavior Issue Selection (Optional)

**UI Element:** Multi-select buttons or checkboxes

```
"Does your dog have any of these issues? (optional)"

[Pulling on the lead] [Separation anxiety] [Excessive barking]
[Dog aggression] [Leash reactivity] [Jumping up]
[Destructive behaviour] [Recall issues] [Anxiety (general)]
[Resource guarding] [Mouthing/nipping/biting] [Rescue dog support]
[Socialisation]

[Browse all trainers (skip issue selection)]
```

**Logic:**
```
IF issue selected → Filter trainers by that issue
IF multiple issues selected → AND logic (all issues must match OR any)
IF "Browse all" → No issue filter
```

**Related Decision:** D-004 (13 behavior issues, optional multi-select)

**Example Query:**
```sql
-- If issues = ["Pulling on the lead", "Excessive barking"] selected
SELECT * FROM businesses 
WHERE council_id = ? AND deleted = FALSE
  AND age_specialties && '{"Adult"}'::dog_age_group[]
  AND (behavior_issues @> '{"Pulling on the lead"}' OR behavior_issues @> '{"Excessive barking"}')
```

---

### Step 4: Suburb/Location Selection (Required)

**UI Element:** Autocomplete input

```
"Enter your suburb (or nearby)"

┌─────────────────────────┐
│ Fitzroy                 │
├─────────────────────────┤
│ Fitzroy (City of Yarra) │ ← Preferred format
│ Fitzroy North (...)     │ (if exists)
│ Fitzroy Park (...)      │ (if exists)
└─────────────────────────┘
```

**Autocomplete Logic:**
```
1. User types "Fit" → Server returns suburbs matching "Fit%"
2. Group by UX label: "Inner North Creative"
3. Show "Fitzroy (City of Yarra)" + "Fitzroy Park (Shire of Yarra Ranges)"
4. User selects "Fitzroy"
5. System auto-assigns: council_id = 3 (City of Yarra)
```

**Error Handling:**
```
IF user enters invalid suburb (not in localities table):
  → Show: "Suburb not found. Did you mean..."
  → Suggest similar matches (Levenshtein distance)
  → Example: "Fitsroy" → "Did you mean Fitzroy?"
```

**Distance Filter (Optional):**
```
After suburb selected, show:
  
"Distance from [Fitzroy]?"
○ Show all in council
○ 0–5 km radius
○ 5–15 km radius
○ 15–30 km radius
○ Greater Melbourne
```

**Related Decision:** D-003 (suburb auto-assigns council)

---

### Step 5: View Results

**Query Logic (Complete):**

```sql
SELECT businesses.* 
FROM businesses
WHERE council_id = ? 
  AND deleted = FALSE
  AND status = 'active'
  AND age_specialties && '{"Adult"}'::dog_age_group[]
  AND (
    behavior_issues IS NULL 
    OR behavior_issues @> '{"Pulling on the lead"}'::dog_behavior_issue[]
  )
ORDER BY
  featured_until DESC NULLS LAST,    -- Featured #1–5
  verified DESC,                      -- Verified next
  CASE 
    WHEN distance_km IS NOT NULL 
      THEN distance_km 
    ELSE 999 
  END ASC,                            -- Closest first
  rating DESC,                        -- Highest rated
  review_count DESC,                  -- Tiebreaker
  created_at DESC                     -- Newest first
LIMIT 20;
```

**Related Decision:** D-006 (search ranking algorithm)

**UI: Results Card**

```
┌─────────────────────────────────┐
│ ⭐ FEATURED (expires 2025-12-31)│
├─────────────────────────────────┤
│ Loose Lead Training              │
│ ✓ Verified | ⭐ 4.8 (23 reviews)│
│                                 │
│ Fitzroy, City of Yarra          │
│ 0.3 km away                     │
│                                 │
│ Primary: Obedience training     │
│ Issues: Pulling, jumping, recall│
│ Format: In-home, group classes  │
│                                 │
│ [CALL] [EMAIL] [WEBSITE]        │
│ [View Profile] [Write Review]   │
└─────────────────────────────────┘
```

**Pagination:**
```
Results 1–20 of 47 trainers
[Previous] 1 2 3 [Next]
```

---

### Step 6: View Profile & Contact

**UI: Full Profile Page**

```
┌─────────────────────────────────────────────────┐
│ Loose Lead Training                             │
│ ✓ Verified (ABN checked 2025-11-15)             │
│ ⭐ 4.8 / 5 (23 reviews)                         │
│ Fitzroy, VIC 3065                              │
├─────────────────────────────────────────────────┤
│ About                                           │
│ "Specializing in reactive dogs and anxious     │
│  puppies. 10+ years experience. Force-free     │
│  methods."                                     │
├─────────────────────────────────────────────────┤
│ Services                                       │
│ Primary: Obedience training                    │
│ Also: Puppy training, Group classes            │
│                                                │
│ Issues addressed: Pulling on lead, Jumping up, │
│ Excessive barking, Recall issues               │
│                                                │
│ Formats: In-home, Training centre, Group      │
│                                                │
│ Ages: Puppy, Adolescent, Adult                │
├─────────────────────────────────────────────────┤
│ Contact                                         │
│ 📞 (03) 9876 5432                              │
│ 📧 alice@looseleadtraining.com.au              │
│ 🌐 looseleadtraining.com.au                    │
│                                                │
│ [CALL NOW] [EMAIL] [VISIT WEBSITE]             │
├─────────────────────────────────────────────────┤
│ Reviews (Showing 5 of 23)                      │
│                                                │
│ ⭐⭐⭐⭐⭐ (5 stars)                              │
│ "Transformed my reactive puppy in 6 weeks!"   │
│ — John D., Dec 2025                           │
│ ✓ Verified review                              │
│                                                │
│ ⭐⭐⭐⭐ (4 stars)                                │
│ "Great trainer, bit pricey"                    │
│ — Sarah M., Nov 2025                          │
│                                                │
│ [Load more reviews]                            │
├─────────────────────────────────────────────────┤
│ [WRITE REVIEW] [BACK TO RESULTS]                │
└─────────────────────────────────────────────────┘
```

---

### Step 7: Leave Review (Optional, No Login)

**UI: Review Form**

```
"Share your experience with Loose Lead Training"

Your name (or initials):
[__________________________] (required, max 100 chars)

Rating:
⭐ ⭐ ⭐ ⭐ ⭐ (click to select, 1–5 stars required)

Review (optional):
[____________________________________
 ____________________________________
 ____________________________________] (max 500 chars)

[✓] I used this trainer for my dog

[SUBMIT]
```

**Validation:**
```
IF name is empty → Error: "Please enter your name or initials"
IF rating not selected → Error: "Please select a rating (1–5 stars)"
IF review > 500 chars → Error: "Review must be 500 chars or less (X remaining)"
IF submitted → Show: "Thanks! Your review is pending moderation (7–14 days)"
```

**Backend Processing:**
```
1. Create reviews row with moderation_status = 'pending'
2. Send to Z.AI review moderation (confidence score)
   IF confidence >= 0.85:
     → Set moderation_status = 'approved'
   ELSE IF confidence >= 0.70:
     → moderation_status = 'pending' (manual queue)
   ELSE:
     → moderation_status = 'rejected' (spam detected)
3. Return: "Your review will appear once approved (typically 1–2 days)"
```

**Related Decision:** D-008 (confidence thresholds: 0.85 auto-approve, 0.70 manual queue)

---

### Edge Case: No Results

**Scenario:** Owner searches for "Puppies" in "Croydon" but no trainers have Puppy specialty.

**UI:**

```
┌─────────────────────────────────┐
│ No trainers found in Croydon    │
│ for Puppy (0–6 months) training │
├─────────────────────────────────┤
│ Try:                            │
│ • Expand to nearby councils:    │
│   - City of Boroondara (4 km)   │
│   - City of Whitehorse (6 km)   │
│                                 │
│ • Broaden age range             │
│   (many trainers cover puppies) │
│                                 │
│ • Check specific issues:        │
│   - Socialisation               │
│   - Puppy basics                │
│                                 │
│ [Show nearby results] [Reset]   │
└─────────────────────────────────┘
```

**Logic:**
```
IF results.count == 0:
  → Query adjacent councils (same region)
  → Show "Expand search to nearby areas"
  → Offer toggle: "Show results within 10 km"
```

---

### Edge Case: Suburb Not Found

**Scenario:** Owner types "Fitzwilliam" (fictional suburb).

**UI & Logic:**

```
┌──────────────────────────────────┐
│ "Fitzwilliam" not found          │
├──────────────────────────────────┤
│ Did you mean:                    │
│ • Fitzroy (City of Yarra)        │
│ • Fitzroy Park (Shire of Y.R.)   │
│ • South Fitzroy (City of Yarra)  │
│                                  │
│ [Can't find it? Browse by region]│
└──────────────────────────────────┘
```

**Implementation:**
```javascript
// Fuzzy match on locality.name
const suggestions = localities
  .filter(loc => 
    levenshteinDistance(userInput, loc.name) <= 2
  )
  .slice(0, 3);
```

---

## Journey 2: Trainer (Registration & Management)

### Entry Point: Sign Up

**UI: Signup Page**

```
"Register Your Dog Training Business"

Email address:
[_____________________________@example.com] (required)

Confirm email:
[_____________________________@example.com] (required, must match)

[REGISTER]

(No password needed. We'll send you a secure link.)
```

**Backend:**
```
1. Validate email format (RFC 5322 basic)
2. Check if email already in users table
   IF exists → Show: "Email already registered. [Forgot password?]"
   ELSE → Create users row, email_verified = FALSE
3. Send OTP email:
   "Verify your email for Dog Trainers Directory
    Click here to confirm: [VERIFY LINK]
    Link expires in 15 minutes"
4. Redirect to: "Check your email!"
```

**Related Decision:** D-013 (trainer uses email OTP, no passwords)

---

### Step 1: Email Verification

**OTP Flow:**

```
User clicks email link → Verifies OTP code
↓
SELECT users WHERE email = ? AND otp_code = ? AND otp_expires > NOW()
↓
IF valid:
  → Set email_verified = TRUE, email_verified_at = NOW()
  → Create session (7-day JWT token, httpOnly cookie)
  → Redirect to /onboarding
ELSE:
  → Show: "Link expired or invalid. [Resend OTP]"
```

---

### Step 2: Business Lookup or Creation

**UI: "Find Your Business"**

```
"Is your business already listed?"

Search by name:
[____________________________] 

[Search]

Results:
• Loose Lead Training (Fitzroy) - Claimed by you
• Loose Lead Training (Williamstown) - Unclaimed
  [CLAIM THIS]
• Loose Lead Training Pro - Not in directory
  [CREATE NEW]

Or create a new business:
[CREATE NEW BUSINESS]
```

**Logic:**
```
1. User searches business name (like "Loose Lead")
2. Return exact + fuzzy matches
3. Show claimed (user_id = current user), unclaimed (user_id = NULL)
4. User clicks [CLAIM] or [CREATE NEW]
```

**Claim Verification (SMS or Email):**
```
IF claiming existing business:
  → Send SMS to business phone (masked): "Code: 1234"
  → Ask user to enter code (TOTP-style verification)
  → IF code correct → Claim complete
```

---

### Step 3a: Create New Business

**UI: Business Registration Form**

```
"Create Your Business Profile"

Business Name: *
[_____________________] (required, max 255 chars)

Phone: *
[(03) 9876 5432] (required)

Email:
[alice@looseleadtraining.com] (optional)

Website:
[looseleadtraining.com.au] (optional, with http/https validation)

Address:
[10 Training Lane, Fitzroy VIC 3065] (optional for display)

Suburb: *
[Fitzroy ▼] (autocomplete, required)

About Your Business:
[Short bio, max 500 chars...] (optional)

[NEXT]
```

**Backend:**
```
1. Validate inputs (required fields, format)
2. Suburb lookup → Auto-assign council_id
3. Create businesses row:
   user_id = current_user_id
   resource_type = 'trainer' (default for signup flow)
   locality_id = suburb.id
   council_id = suburb.council_id
   claimed = TRUE
   claimed_at = NOW()
   scaffolded = FALSE (user-entered, not scraped)
   data_source = 'trainer_provided'
   status = 'pending_review' (until AI check passes)
```

---

### Step 3b: Claim Existing Business

**After SMS verification:**

```
Business: Loose Lead Training (Fitzroy)
Current info: Phone (03) 9876 5432, no email

Update any fields:
Phone: [(03) 9876 5432] (can edit)
Email: [alice@...] (new)
Website: [looseleadtraining.com.au]
About: [Edit description]

[CONFIRM CLAIM]
```

---

### Step 4: Age Specialties (Mandatory)

**UI: Checkbox list**

```
"What age groups do you work with?" *

☑ Puppy (0–6 months)
☑ Adolescent (6–18 months)
☑ Adult (1.5–7 years)
☐ Senior (7+ years)
☑ Rescue/rehomed dogs (any age)

(Minimum 1 required)
```

**Validation:**
```
IF no checkboxes selected → Error: "Select at least one age group"
IF valid → Save to businesses.age_specialties (array)
```

**Related Decision:** D-004 (age groups mandatory for trainers)

---

### Step 5: Primary Service Type (Required)

**UI: Radio buttons**

```
"What's your main service?" *

○ Puppy training
○ Obedience training
○ Behaviour consultations
○ Group classes
○ Private training

(Select exactly one)
```

**Validation:**
```
IF not selected → Error: "Select your primary service type"
IF valid → Save to businesses.service_type_primary
```

---

### Step 6: Secondary Services (Optional)

**UI: Checkboxes (same 5 options)**

```
"Any other services you offer?" (optional)

☐ Puppy training
☑ Obedience training
☐ Behaviour consultations
☑ Group classes
☐ Private training
```

**Logic:**
```
User can check any (including primary again)
Saved to businesses.service_type_secondary (array)
```

---

### Step 7: Behavior Issues (Optional)

**UI: Multi-select with descriptions**

```
"Which behavior issues do you address?" (optional)

☑ Pulling on the lead
  "Dog pulls excessively on walks"
☐ Separation anxiety
☐ Excessive barking
☑ Dog aggression
  "Aggression toward other dogs (requires vet screening)"
[... remaining 9 issues ...]

[NEXT]
```

---

### Step 8: Review & Confirm

**UI: Summary**

```
"Review Your Profile"

Business: Loose Lead Training
Suburb: Fitzroy (City of Yarra)
Phone: (03) 9876 5432
Email: alice@looseleadtraining.com
Website: looseleadtraining.com.au

Ages: Puppy, Adolescent, Adult, Rescue
Primary: Obedience training
Also: Group classes
Issues: Pulling on lead, Dog aggression

[✓] I confirm this information is accurate

[SUBMIT]
```

**Backend on Submit:**
```
1. All validations passed
2. Set status = 'pending_review' (AI checks profile)
3. Send confirmation email: "Your profile is live!"
4. Redirect to /trainer/dashboard
5. Z.AI reviews profile for consistency
   IF all tags match bio → status = 'active'
   ELSE → Flag for manual operator review
```

---

### Trainer Dashboard

**UI: Overview**

```
┌───────────────────────────────────────┐
│ Dashboard                             │
├───────────────────────────────────────┤
│ Loose Lead Training                   │
│ City of Yarra (Fitzroy)               │
│ ✓ Active | Views: 427 this month      │
├───────────────────────────────────────┤
│                                       │
│ FEATURED STATUS                       │
│ ☐ Not featured (Upgrade for $20)     │
│                                       │
│ ✓ Featured until 2025-12-31           │
│   (Queue position: 2 of 5 in Yarra)  │
│                                       │
│ ⏳ Queued                              │
│   (Position: 1 of 8, wait ~2 weeks)   │
│                                       │
│ [UPGRADE TO FEATURED]                 │
├───────────────────────────────────────┤
│ REVIEWS                               │
│ ⭐ 4.8 / 5 (23 approved)              │
│ 🕐 7 pending moderation                │
│                                       │
│ [VIEW ALL REVIEWS]                    │
├───────────────────────────────────────┤
│ PROFILE                               │
│                                       │
│ [EDIT PROFILE] [VIEW AS CUSTOMER]     │
└───────────────────────────────────────┘
```

---

### Edit Profile

**UI: Form (same as registration, all fields editable)**

```
Business Name: [Loose Lead Training]
Phone: [(03) 9876 5432]
Email: [alice@looseleadtraining.com]
Website: [looseleadtraining.com.au]

[Age checkboxes - can change]
[Service type - can change]
[Behavior issues - can change]

[SAVE CHANGES]
```

**Validation:**
```
Same as registration:
- Age: ≥1 required
- Primary service: required
- Others: optional
```

**Success Message:**
```
"Profile updated! Changes visible immediately."
```

---

### Purchase Featured Placement

**UI: Upgrade Card**

```
┌─────────────────────────┐
│ ⭐ FEATURED PLACEMENT   │
├─────────────────────────┤
│ Rank #1–5 in search     │
│ results for 30 days     │
│                         │
│ Price: $20 AUD          │
│                         │
│ Slots available: 3/5    │
│ in City of Yarra        │
│                         │
│ [UPGRADE NOW]           │
└─────────────────────────┘
```

**On Click: Stripe Checkout**

```
1. Redirect to Stripe Checkout (Stripe-hosted, PCI compliant)
2. User enters card details on Stripe (no card data on DTD)
3. Stripe processes payment
4. Webhook: charge.succeeded
5. App receives webhook → Creates featured_placements row
   featured_until = NOW() + INTERVAL '30 days'
6. Return: "Featured placement active! You're now #2 in Fitzroy."
```

**Related Decision:** D-002 (Featured $20, 30-day one-time)

---

### Queue Waiting State

**Scenario: 5 featured slots full in council**

```
┌─────────────────────────┐
│ You're in the queue!    │
├─────────────────────────┤
│ Position: 3 of 8        │
│                         │
│ Next available slot:    │
│ ~2025-12-28             │
│ (when a slot expires)   │
│                         │
│ You'll be notified when │
│ your placement becomes  │
│ featured.              │
│                         │
│ [REMOVE FROM QUEUE]     │
└─────────────────────────┘
```

**Cron Job (Daily at 2am AEDT):**

```sql
-- Expire old featured placements
UPDATE featured_placements
SET status = 'expired'
WHERE status = 'active' AND featured_until < NOW();

-- Promote from queue to active (FIFO per council)
WITH queued AS (
  SELECT id, business_id, council_id
  FROM featured_placements
  WHERE status = 'queued'
  ORDER BY created_at ASC
)
UPDATE featured_placements
SET status = 'active', featured_until = NOW() + INTERVAL '30 days'
WHERE id IN (
  SELECT id FROM queued
  WHERE (
    SELECT COUNT(*) FROM featured_placements fp2
    WHERE fp2.council_id = featured_placements.council_id
      AND fp2.status = 'active'
  ) < 5
  LIMIT 1 PER council_id
);

-- Send notifications to newly promoted trainers
SELECT * FROM featured_placements WHERE status = 'active' AND queue_activated_at IS NULL;
-- → Send email: "Your featured placement is now live!"
```

**Related Decision:** D-010 (lean ops: cron handles queue, no operator needed)

---

### Refund Window (3 Days)

**UI: Featured Card (first 3 days)**

```
┌──────────────────────────┐
│ ✓ Featured Active        │
│ Expires: 2025-12-31      │
│                          │
│ Refund available until:  │
│ 2025-12-28 23:59 AEDT   │
│                          │
│ [REQUEST REFUND]         │
└──────────────────────────┘
```

**On [REQUEST REFUND]:**

```
1. Validate (created_at + 3 days) > NOW()
2. If valid → Call Stripe API to issue refund
3. Create featured_placements row with status = 'refunded'
4. Show: "Refund processed. You'll see the credit in 3–5 business days."
5. If NOT valid → "Refund window closed (purchased on 2025-12-25)"
```

**Related Decision:** D-011 (3-day refund window, no exceptions)

---

## Journey 3: Emergency Handler (Triage & Escalation)

### Entry: Emergency Form

**URL:** `/emergency`

**UI: Full-screen form (no navigation clutter)**

```
┌──────────────────────────────────────┐
│ 🚨 DOG EMERGENCY?                   │
│    We can help.                      │
├──────────────────────────────────────┤
│                                      │
│ Describe what's happening:           │
│ [Type here... (max 500 chars)]       │
│                                      │
│ Examples:                            │
│ • "My dog ate chocolate"            │
│ • "He's attacking my cat"           │
│ • "Bleeding from mouth"             │
│ • "Won't stop barking, neighbors"   │
│                                      │
│ Your suburb (optional):              │
│ [Fitzroy ▼]                         │
│                                      │
│ Your phone (optional):               │
│ [(+61) 3 XXXX XXXX]                 │
│                                      │
│ [SUBMIT]                             │
│                                      │
│ ⚠️  For life-threatening emergencies│
│ call 000 or nearest 24h vet now.    │
└──────────────────────────────────────┘
```

**Related Decision:** D-001 (emergency triage classification)

---

### Triage Processing

**Backend: Z.AI Triage Flow**

```
1. Receive dog owner message: "My dog is bleeding from his paw"
2. Call Z.AI medical detector API
   → Input: Message text
   → Output: { classification: "medical", confidence: 0.92, ... }
3. IF confidence >= 0.75:
   → Use classification (medical)
   ELSE:
   → Use keyword fallback (deterministic)
4. Route to appropriate output handler (medical → vets, crisis → police, etc.)
```

**Related Decision:** D-007 (AI fallback rules: deterministic priority order)

**Triage Classifications & Actions:**

```
┌──────────────────────────────────────────┐
│ medical                                  │
│ Keywords: bleeding, injury, poisoned,   │
│ ate [toxin], choking, collapse, breathing│
│ → ACTION: Call 24-hour emergency vet    │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ crisis                                   │
│ Keywords: attacking, fighting, loose,   │
│ out of control, aggressive, danger      │
│ → ACTION: Call 000 (police), animal     │
│ control, warn neighbors                 │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ stray                                    │
│ Keywords: found, loose, unknown, stray, │
│ lost, no owner, wandering               │
│ → ACTION: Call RSPCA, Lost Dogs Home,   │
│ council animal control                  │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ normal                                   │
│ Keywords: everything else (behavior q)  │
│ → ACTION: Recommend matched trainers    │
└──────────────────────────────────────────┘
```

---

### Triage Output: Medical Emergency

**UI: URGENT Results**

```
┌──────────────────────────────────────────┐
│ 🚨 EMERGENCY - GET HELP NOW             │
├──────────────────────────────────────────┤
│                                          │
│ Bleeding / Injury detected              │
│                                          │
│ CALL 24-HOUR EMERGENCY VET:             │
│                                          │
│ 📞 MASH Ringwood                        │
│ (03) 9876 5432                          │
│ 0.2 km from Fitzroy                    │
│ 🟢 OPEN NOW (24/7)                      │
│                                          │
│ 📞 Animal Emergency Clinic              │
│ (03) 9999 0000                          │
│ 1.2 km away                             │
│ 🟢 OPEN NOW (24/7)                      │
│                                          │
│ ⚠️  REMEMBER:                            │
│ • Call immediately (don't wait)        │
│ • Mention you're on the way            │
│ • Apply pressure if bleeding           │
│                                          │
│ [BACK TO SEARCH] [SAVE FOR LATER]       │
└──────────────────────────────────────────┘
```

**Data Source:**
```
SELECT emergency_contacts
FROM emergency_contacts
WHERE resource_type = 'emergency_vet'
  AND council_id = ?  (or nearby councils)
  AND availability_status = 'active'
ORDER BY distance_km ASC
LIMIT 5;
```

---

### Triage Output: Crisis (Aggressive Dog)

**UI: Police + Escalation**

```
┌──────────────────────────────────────────┐
│ 🚨 SAFETY RISK DETECTED                 │
├──────────────────────────────────────────┤
│                                          │
│ Aggression / Immediate danger           │
│                                          │
│ 📞 CALL 000 NOW                         │
│ (Police + animal control dispatch)     │
│                                          │
│ Tell them:                              │
│ • Location and description             │
│ • Dog is a safety risk                │
│ • Request animal control               │
│                                          │
│ After calling 000, you can also:       │
│                                          │
│ 🐕 Behavior Specialists (follow-up):   │
│ • Loose Lead Training (City of Yarra) │
│ • Behavior Consult specializing in     │
│   aggression (contact after crisis)   │
│                                          │
│ [BACK TO SEARCH] [SAVE FOR LATER]      │
└──────────────────────────────────────────┘
```

**Related Decision:** D-005 (emergency escalation pathways)

---

### Triage Output: Stray Dog

**UI: RSPCA + Council Resources**

```
┌──────────────────────────────────────────┐
│ STRAY DOG FOUND?                        │
├──────────────────────────────────────────┤
│                                          │
│ CONTACT IMMEDIATELY:                   │
│                                          │
│ 📞 RSPCA Victoria                       │
│ (03) 9242 2300                          │
│ "I found a dog..."                     │
│                                          │
│ 📞 Lost Dogs Home                       │
│ (03) 9329 2755                          │
│ "Searching for my lost dog..."         │
│                                          │
│ 🐕 Local Council Animal Control        │
│ City of Yarra: (03) 9205 5555          │
│ "Dog found / picked up"                │
│                                          │
│ DO NOW:                                 │
│ • Keep dog safe (safe space)           │
│ • Take photo (for Lost Dogs Home)      │
│ • Check for microchip (vet scan)       │
│ • Post on PetRescue / Pawsitive       │
│                                          │
│ [BACK TO SEARCH] [SAVE FOR LATER]      │
└──────────────────────────────────────────┘
```

---

### Triage Output: Normal (Behavior Question)

**UI: Recommended Trainers**

```
┌──────────────────────────────────────────┐
│ 🐕 TRAINER RECOMMENDATIONS             │
├──────────────────────────────────────────┤
│                                          │
│ Based on your description:              │
│ "Won't stop barking at night"           │
│                                          │
│ We found these specialists:             │
│                                          │
│ 1. Bark Control Specialists (Fitzroy)  │
│    ⭐ 4.9 (18 reviews)                  │
│    Issues: Excessive barking, anxiety   │
│    [VIEW PROFILE] [CALL]               │
│                                          │
│ 2. Calm Dogs Training (Collingwood)    │
│    ⭐ 4.6 (12 reviews)                  │
│    Issues: Excessive barking, anxiety   │
│    [VIEW PROFILE] [CALL]               │
│                                          │
│ [VIEW ALL RESULTS]                      │
│ [BACK TO SEARCH]                        │
└──────────────────────────────────────────┘
```

---

### Optional: Register After Triage

**Prompt (After triage results shown):**

```
"Want to save these results?"

We can send you a follow-up email with
all this information.

[Create account (optional)]
[Email address: _____________]
[SAVE]

OR

[Just show me these results] (no account)
```

**Future Enhancement:** Allow dog owner to create account and save results/trainers to wishlist.

---

## Journey 4: Admin Operator (4h/week Workflow)

### Entry: Admin Dashboard

**UI: Red Alert Priority**

```
┌─────────────────────────────────────────┐
│ 🔴 RED ALERTS                          │
├─────────────────────────────────────────┤
│                                         │
│ ⚠️  Z.AI API Down (1 hour 23 min)      │
│ → Triage using deterministic fallback  │
│ → Fallback confidence: 0.50–0.70       │
│ [INVESTIGATE] [ACKNOWLEDGE]             │
│                                         │
│ ⚠️  Stripe Webhook Failed (Charge)     │
│ Event ID: evt_3A1b2c3d4e5f6g7h8i9j0   │
│ → Review may not be approved           │
│ [RETRY] [INVESTIGATE]                   │
│                                         │
│ ⚠️  Database Connection Timeout        │
│ → API responding slowly (>5s)          │
│ [CHECK LOGS] [CONTACT SUPABASE]        │
│                                         │
├─────────────────────────────────────────┤
│ 🟡 YELLOW ALERTS (Info)                │
├─────────────────────────────────────────┤
│                                         │
│ Manual Review Queue: 43 pending        │
│ (7–14 day SLA) [BATCH REVIEW]          │
│                                         │
│ Refund Requests: 2 pending approval    │
│ (3-day window) [REVIEW]                │
│                                         │
│ Featured Queue: Full (8 waiting)       │
│ Next promotion: 2025-12-28             │
│ (auto-promoted by cron) [NO ACTION]    │
│                                         │
│ [2025-12-25 02:00 AEDT] Cron succeeded │
│ → Featured queue promoted: 1 trainer   │
│ → Expired featured: 2 placements       │
│ [VIEW LOG]                              │
│                                         │
└─────────────────────────────────────────┘
```

**Related Decision:** D-010 (operator 4h/week, pull-based)

---

### Session 1: Daily 5-Min Check (Mon–Fri)

**Workflow:**
```
1. Operator logs in (TOTP required)
2. Views dashboard (< 1 min read)
3. Any red alerts?
   IF YES → Investigate / decide to act or defer
   IF NO → Done (2–3 min)
```

**Red Alert: Z.AI Down**

```
Operator sees: "Z.AI API Down (43 min)"

Options:
1. [RETRY] → Test Z.AI endpoint again
   IF up → Update status to "recovered"
   IF down → Check Z.AI status page (external)
   
2. [ACKNOWLEDGE] → System notes operator saw it
   Operator checks Supabase alerts if needed
   
3. [DO NOTHING] → Deterministic fallback is working
   Triage still available (keyword-based, confidence 0.60)
   No action required unless >30 min down
```

**Outcome:** Operator spends 2–5 min, closes dashboard. No SLA breach (no SLA promised).

---

### Session 2: Weekly 3–4 Hour Batch Work

**Scheduled:** Sunday 10am or flexible 4h block

**Task 1: Manual Review Queue (1–2 hours)**

```
┌──────────────────────────────────────┐
│ REVIEW MODERATION QUEUE              │
├──────────────────────────────────────┤
│ Pending: 43 reviews                 │
│ Approved (auto): 127 this week      │
│ Rejected (spam): 8 this week        │
├──────────────────────────────────────┤
│                                     │
│ ⭐⭐⭐⭐⭐ (5 stars)                   │
│ "Transformed my reactive puppy!"   │
│ — John D. (Loose Lead Training)    │
│ AI Confidence: 0.72 (manual queue) │
│ [✓ APPROVE] [✗ REJECT]             │
│                                     │
│ ⭐⭐ (2 stars)                        │
│ "terrible trainer blocked me"      │
│ — Anonymous (City Trainer)         │
│ AI Confidence: 0.35 (likely spam)  │
│ [✓ APPROVE] [✗ REJECT]             │
│                                     │
│ [Load more reviews]                 │
│                                     │
│ [BULK APPROVE (next 10)]            │
│ [BATCH EXPORT]                      │
└──────────────────────────────────────┘
```

**Operator Action:**
```
For each review:
  IF legitimate → [✓ APPROVE] (moderation_status = 'approved')
  IF spam/abuse → [✗ REJECT] (moderation_status = 'rejected', reason = ?)
  
Set moderation_reason (if rejected):
  "Contains profanity"
  "Unrelated to training"
  "Duplicate review"
  "Competitor posting"
  "Other: [text]"
  
Batch approve efficiency:
  "Looking good. Approving next 10 reviews..."
  [Shows: "43 → 33 remaining in queue"]
```

---

**Task 2: Refund Requests (15–30 min)**

```
┌──────────────────────────────────────┐
│ FEATURED PLACEMENT REFUND REQUESTS   │
├──────────────────────────────────────┤
│                                     │
│ Loose Lead Training (Fitzroy)      │
│ Purchased: 2025-12-23 at 14:23    │
│ Amount: $20 AUD                    │
│ Refund window expires: 2025-12-26  │
│ Status: Pending operator approval  │
│                                     │
│ Reason: "Changed my mind, got busy"│
│                                     │
│ [✓ APPROVE REFUND] [✗ DENY]        │
│                                     │
│ (Next refund request...)            │
│                                     │
└──────────────────────────────────────┘
```

**Operator Action:**
```
FOR each refund request:
  Calculate: (created_at + 3 days) > NOW()?
  IF YES → [✓ APPROVE REFUND]
    → Call Stripe API: refunds.create()
    → Set featured_placements.status = 'refunded'
    → Send email: "Refund approved. Credit in 3–5 days."
  IF NO → [✗ DENY]
    → Send email: "Refund window closed (3 days from purchase)"
    
Expected: 5–15 min (typically 1–2 requests/week)
```

---

**Task 3: Payment Reconciliation (15–30 min)**

```
┌──────────────────────────────────────┐
│ PAYMENT AUDIT LOG                   │
├──────────────────────────────────────┤
│ This week:                          │
│ • Charges succeeded: 8              │
│ • Refunds issued: 1                 │
│ • Webhook failures: 0               │
│ • Pending retries: 0                │
│                                     │
│ Revenue (this week): $160 AUD       │
│ (8 featured placements × $20)       │
│                                     │
│ [EXPORT TO CSV] [VIEW DETAILS]      │
│ [RECONCILE WITH STRIPE]             │
│                                     │
│ Last reconciled: 2025-12-18         │
│ Status: ✓ Balanced (0 discrepancies)│
│                                     │
└──────────────────────────────────────┘
```

**Operator Action:**
```
1. Click [RECONCILE WITH STRIPE]
2. System queries:
   - payment_audit (our DB)
   - Stripe API (charges, refunds)
3. Compares counts and amounts
4. IF balanced → ✓ "All good"
5. IF mismatch → 🔴 Alert operator
   (e.g., "Stripe shows 9 charges, we logged 8")
   → Investigate webhook logs
   
Typical outcome: 5–10 min, no action needed
```

---

**Task 4: Cron Job Health Check (10 min)**

```
┌──────────────────────────────────────┐
│ SCHEDULED CRON JOBS                 │
├──────────────────────────────────────┤
│                                     │
│ featured_expiry_and_promotion       │
│ Last run: 2025-12-25 02:00 AEDT    │
│ Status: ✓ Succeeded                 │
│ Records processed: 3                │
│ • Expired featured: 2               │
│ • Promoted from queue: 1            │
│ Duration: 0.3 sec                   │
│                                     │
│ [VIEW LOG] [RUN NOW (manual)]        │
│                                     │
│ Next scheduled: 2025-12-26 02:00    │
│                                     │
├──────────────────────────────────────┤
│ Monthly cleanup (future)             │
│ Status: Not yet scheduled            │
│                                     │
└──────────────────────────────────────┘
```

**Operator Action:**
```
Check:
  ✓ Last run completed successfully
  ✓ No errors in log
  ✓ Records processed (expected ~2–3/day)
  ✓ Duration reasonable (<1 sec)
  
IF red alert (failure):
  → Check error message
  → [RUN NOW (manual)] to retry
  → If fails again → Escalate to dev team
  
Typical outcome: 2–3 min, no action needed (Cron is autonomous)
```

---

**Task 5: Complaint Investigation (30 min–1h, if needed)**

**Example: Trainer Suspension Request**

```
┌──────────────────────────────────────┐
│ COMPLAINT REPORT                    │
├──────────────────────────────────────┤
│                                     │
│ Business: "Aggressive Training Co"  │
│ Complaint from: Sarah (email)       │
│ Date: 2025-12-24                    │
│                                     │
│ Complaint:                          │
│ "Trainer used physical punishment   │
│  on my puppy. Very aggressive       │
│  methods. Don't recommend."         │
│                                     │
│ Status: Pending investigation       │
│                                     │
│ [REVIEW PROFILE]                    │
│ [CONTACT TRAINER]                   │
│ [SUSPEND LISTING (temporary)]        │
│ [REJECT COMPLAINT (no violation)]    │
│ [REQUEST MORE INFO]                 │
│                                     │
└──────────────────────────────────────┘
```

**Operator Workflow:**
```
1. Read complaint details
2. Check trainer profile:
   - Reviews (any patterns?)
   - Reported issues/methods
   - Other complaints?
3. Decide:
   Option A: Request more info from complainant
   Option B: Contact trainer for explanation
   Option C: Suspend listing (temporary, pending review)
   Option D: Reject (no clear violation)
   Option E: Escalate (legal issue?)

Typical: 15–30 min investigation, decision logged
```

**Related Decision:** D-010 (operator handles exceptions)

---

## State Transitions & Lifecycle

### Business Listing State Machine

```
┌─────────────────────────┐
│ unclaimed               │ ← Scraped from web, manual form, or admin-added
│ (user_id = NULL)        │
└────────┬────────────────┘
         │ Trainer claims + verifies email
         ↓
┌─────────────────────────┐
│ active                  │ ← User claimed, all fields valid
│ (user_id = ?, verified) │   Ready for search results
└────────┬────────────────┘
         │ Trainer purchases featured ($20)
         ├─→ Featured available? YES
         │   └─→ Set featured_until = NOW() + 30 days
         │
         ├─→ Featured available? NO (5 slots full)
         │   └─→ Add to queue (status = queued)
         │       → Cron promotes daily
         │
         ├─→ Complaint → Suspend temporarily
         │   └─→ Set deleted = TRUE (soft-delete)
         │
         └─→ Trainer deletes profile
             └─→ Set deleted = TRUE (soft-delete, recoverable)
```

### Review Moderation State Machine

```
┌──────────────────┐
│ pending          │ ← Just submitted by dog owner
│ (unmoderated)    │
└────────┬─────────┘
         │ Z.AI review moderation
         ├─→ confidence >= 0.85
         │   └─→ moderation_status = 'approved' (auto)
         │
         ├─→ 0.70 <= confidence < 0.85
         │   └─→ moderation_status = 'pending' (manual queue)
         │       → Operator batch approves
         │
         └─→ confidence < 0.70
             └─→ moderation_status = 'rejected' (spam detected)
```

### Featured Placement State Machine

```
┌──────────────────┐
│ pending_payment  │ ← Trainer clicks [UPGRADE], Stripe form loads
└────────┬─────────┘
         │ Stripe processes payment
         ├─→ charge.succeeded
         │   └─→ status = 'active'
         │       featured_until = NOW() + 30 days
         │
         ├─→ charge.failed
         │   └─→ status = 'failed' (not attempted again automatically)
         │
         └─→ charge.refunded (within 3-day window)
             └─→ status = 'refunded'
```

---

## Error Flows & Edge Cases

### Error 1: Z.AI Triage Fails (>30 sec timeout)

**Scenario:**
```
Owner submits emergency triage
App calls Z.AI API
Z.AI down or timing out (>15 sec)
```

**Flow:**
```
1. Try Z.AI (15 sec timeout)
   IF fail → Go to step 2
2. Try z.ai (30 sec timeout)
   IF fail → Go to step 3
3. Use deterministic keyword detection
   (Always works, confidence 0.50–0.70)
4. Return triage output using deterministic result
```

**UI Consequence:**
```
No visible error to user. They see triage output (deterministic).
In logs: "Z.AI failed, used deterministic fallback"
Operator notified if Z.AI down >30 min
```

**Related Decision:** D-007 (fallback rules), D-009 (provider strategy)

---

### Error 2: Owner Tries to Review Same Trainer Twice

**Scenario:**
```
Owner left review for "Loose Lead Training" on 2025-12-20
Owner tries to leave another review for same trainer on 2025-12-25
```

**Validation (future enhancement):**

```
Current (Phase 1):
  → Allow duplicate reviews
  → Operator may flag as spam during moderation

Future (Phase 2):
  → Check: SELECT * FROM reviews 
            WHERE business_id = ? AND reviewer_email = ?
  → IF exists → Error: "You've already reviewed this trainer.
                         [EDIT EXISTING REVIEW]"
```

---

### Error 3: Trainer Submits Invalid Suburb

**Scenario:**
```
Trainer fills form with suburb = "Fitzwilliam" (fake)
Submits form
```

**Validation:**
```
1. App queries localities table
   SELECT * FROM localities WHERE name = 'Fitzwilliam'
2. NOT FOUND
3. UI Error: "Suburb not found. Did you mean:
   • Fitzroy (City of Yarra)
   • Fitzroy Park (Shire of Yarra Ranges)
   [Create new suburb? (Admin only)]"
4. Form blocked, trainer must select valid suburb
```

---

### Error 4: Payment Fails Silently (Webhook Lost)

**Scenario:**
```
Trainer completes Stripe payment (charge.succeeded)
Webhook sent from Stripe to our API
Network glitch → Webhook never delivered
featured_placements row never created
```

**Recovery:**
```
1. Stripe retries webhook exponentially (Stripe docs)
2. If webhook still lost after Stripe retries:
   → Operator runs manual [RECONCILE WITH STRIPE]
   → System queries Stripe API for all charges this week
   → Finds charge that wasn't logged in payment_audit
   → Creates featured_placements row retroactively
   → Sets featured_until correctly
   → Trainer sees featured active (slightly delayed)
```

**Related Decision:** D-012 (Stripe-first DR, payment_audit is source of truth)

---

### Error 5: Search Returns 0 Results (Narrow Filters)

**Scenario:**
```
Owner searches: Suburb=Croydon, Age=Puppy, Issue=Aggression
Result: 0 trainers
```

**UI Recovery:**
```
"No trainers found. Try:

[Nearby councils]
• City of Boroondara (4 km): 3 trainers
• City of Whitehorse (6 km): 2 trainers

[Broader age range]
• Adult (18 months–7 years): 5 trainers
  (many handle young dogs too)

[All issues in Croydon]
• Pulling on lead: 2 trainers
• Jumping up: 1 trainer
• Recall issues: 1 trainer

[Reset all filters]"
```

**Logic:**
```javascript
if (results.length === 0) {
  // Suggest nearby councils
  const nearbyCouncils = await getNearbyCouncils(councilId, radius=10km);
  
  // Suggest broader age range
  const allAges = await search({ ...filters, ageGroup: null });
  
  // Suggest other issues
  const otherIssues = await search({ ...filters, issue: null });
}
```

---

### Error 6: Refund Requested After 3-Day Window

**Scenario:**
```
Trainer purchased featured on 2025-12-22 14:00
Requests refund on 2025-12-26 15:00 (4 days later)
```

**UI:**
```
"Refund window closed

Purchased: 2025-12-22 14:00
Refund available until: 2025-12-25 14:00
Requested: 2025-12-26 15:00

Refund window is 3 days from purchase.
Your placement is now featured and active.

For billing questions, contact [support email]"
```

**Related Decision:** D-011 (3-day refund window, no exceptions)

---

### Error 7: Webhook Receives Duplicate Event

**Scenario:**
```
Stripe sends charge.succeeded webhook
App processes it, creates featured_placements row
Network glitch causes Stripe to retry
Same webhook delivered again 30 seconds later
```

**Protection:**
```sql
CREATE UNIQUE INDEX idx_payment_audit_stripe_event_id 
ON payment_audit(stripe_event_id);
```

**Flow:**
```
1. First webhook: stripe_event_id = evt_123
   → INSERT into payment_audit
   → featured_placements row created
   
2. Second webhook (duplicate): stripe_event_id = evt_123
   → INSERT into payment_audit
   → UNIQUE constraint violation
   → Row rejected (no double-insert)
   → App logs: "Idempotent: Event evt_123 already processed"
```

---

## Accessibility & Compliance Notes

### WCAG 2.1 AA Compliance

- **Keyboard navigation:** All forms, buttons, links keyboard-accessible (tab order)
- **Color contrast:** 4.5:1 for body text, 3:1 for large text (WCAG AA)
- **Alt text:** All images have descriptive alt text
- **Form labels:** Every input has associated `<label>` tag
- **Error messages:** Clear, specific, red color + icon (not color alone)
- **Focus indicators:** Clear outline on focused elements

### Privacy Act Compliance (Australia)

- **Dog owner data:** Minimal collection (suburb, phone optional)
- **Trainer data:** ABN stored securely (encrypted at rest, Phase 2+)
- **Reviews:** Anonymous (no email stored, optional name/initials)
- **Retention:** Soft-delete + audit trail (7-year compliance for Stripe)
- **Consent:** Explicit opt-in for featured placement, reviews require agreement

### ACCC Compliance (Pricing, Refunds)

- **Consumer Guarantees Act:** No refund after 3 days is clearly stated upfront
- **Australian Consumer Law:** Clear pricing ($20 AUD), no hidden fees
- **Deceptive conduct:** No misleading claims about trainer qualifications
- **Bait & switch:** Featured queue clearly explained (realistic timing)

---

## Summary: All Journeys Complete

| Journey | Status | Length | Decisions Implemented |
|---------|--------|--------|---------------------------|
| Dog Owner | ✅ Complete | 2,000 words | D-003 (age-first), D-004 (enums), D-006 (ranking) |
| Trainer | ✅ Complete | 2,200 words | D-013 (OTP), D-002 (featured), D-004 (enums) |
| Emergency | ✅ Complete | 1,500 words | D-001 (triage), D-005 (escalation), D-007 (fallback) |
| Operator | ✅ Complete | 1,800 words | D-010 (4h/week), D-011 (no SLAs), D-012 (DR) |
| State Machines | ✅ Complete | 500 words | All decisions (comprehensive lifecycle) |
| Error Flows | ✅ Complete | 800 words | D-007, D-009, D-012 (resilience) |

---

**Document Status:** ✅ Complete, production-ready  
**Last Updated:** 2025-12-25  
**Owner:** Product + UX design team  
**Next:** 04_ROUTES_AND_NAVIGATION.md (URL structure, auth boundaries)
