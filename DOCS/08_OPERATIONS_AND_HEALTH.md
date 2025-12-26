# 08_OPERATIONS_AND_HEALTH.md – Operator Workflows & Incident Response

**Dog Trainers Directory — Operations, Health Monitoring & Incident Playbooks**

**Date:** 2025-12-25  
**Status:** 🟢 Ready for Phase 1 Implementation  
**Decisions Implemented:** D-010 (4h/week), D-011 (no SLAs), D-012 (DR strategy)  
**Operator Role:** Async, pull-based, 4 hours per week, fully autonomous

---

## Executive Summary

**Lightweight operations. No on-call. Fully autonomous. Pull-based async work.**

- ✅ **4 hours per week** (D-010): Monday 5 min + Thursday 3–4h
- ✅ **Fully autonomous** (no escalation to product team for operational tasks)
- ✅ **5 incident playbooks** (Z.AI down, webhook failed, cron failed, queue disputes, refund rate)
- ✅ **Admin dashboard** (alerts, metrics, pending tasks, quick actions)
- ✅ **No SLAs** (D-011: "as time allows, typically 1–2 weeks")
- ✅ **Health monitoring** (real-time alerts, 1-min refresh, auto-escalation)

---

## Part 1: Operator Role & Responsibilities

### 1.1 Time Allocation (4 Hours/Week, D-010)

```
┌────────────────────────────────────────────────────────────┐
│ WEEKLY OPERATOR SCHEDULE (4 hours/week)                    │
└────────────────────────────────────────────────────────────┘

MONDAY SESSION (5 minutes)
  ├─ Time: 9:00 AM AEDT
  ├─ Purpose: Check for red alerts
  ├─ Actions: Decide if immediate action needed
  ├─ Example: Z.AI down → Switch feature flag to deterministic
  ├─ Decision: Act now or defer to Thursday batch?
  └─ Exit: Back to normal work

THURSDAY SESSION (3–4 hours)
  ├─ Time: 2:00 PM AEDT (flexible, self-scheduled)
  ├─ Purpose: Batch work (reviews, refunds, reconciliation, cron, complaints)
  ├─ Structure: 5 sequential sessions (see Part 2)
  ├─ Flexibility: Can work 1h Mon + 3h Thu, or 2h + 2h, etc.
  └─ Exit: All pending tasks cleared (or escalated)

TOTAL WEEKLY:
  ├─ Red alert checks: 1 × 5 min = 5 min
  ├─ Manual review queue: 1–2 hours
  ├─ Refund processing: 0.5 hours
  ├─ Payment reconciliation: 0.5 hours
  ├─ Cron job monitoring: 0.25 hours
  ├─ Complaint investigation: 0.25–1 hour
  └─ TOTAL: ~3 hours 45 min (flexible)

AUTONOMY RULES:
  ├─ Operator can act independently on all tasks
  ├─ No approval needed from product team
  ├─ Can approve/reject reviews, process refunds, restart cron
  ├─ Escalate only if: Data corruption, legal issue, or product question
  └─ Do not: Delete data, modify trainer accounts, change pricing
```

### 1.2 Daily Alert Check (Monday, 5 minutes)

```
┌────────────────────────────────────────────────────────────┐
│ RED ALERT CHECK (5 MINUTES, MONDAY 9:00 AM AEDT)           │
└────────────────────────────────────────────────────────────┘

Dashboard Status:
  ├─ 🔴 CRITICAL (RED): Immediate action possible
  │  ├─ Z.AI down >30 min
  │  ├─ Stripe webhook failed (payment stuck)
  │  ├─ Database timeout/slow query
  │  ├─ Cron job failed all retries
  │  └─ Action: Switch flag, restart cron, check payment_audit
  │
  ├─ 🟡 WARNING (YELLOW): Inform but no action needed
  │  ├─ Queue >10 per council (normal variation)
  │  ├─ Refund rate 10–15% (monitor)
  │  ├─ Cron hasn't run in 24h (wait until 48h)
  │  └─ Action: Monitor, log event
  │
  └─ 🟢 HEALTHY (GREEN): All systems nominal
     ├─ Z.AI responsive
     ├─ Stripe webhook processing
     ├─ Cron running successfully
     └─ Action: None, proceed with normal work

Operator Decision Tree:
  1. Open /admin/dashboard
  2. Scan RED alerts (critical only)
  3. For each RED alert:
     ├─ Can I fix now? (Yes → Fix, log)
     ├─ Can I fix now? (No → Defer to Thursday)
  4. Return to normal work
  5. Thursday: Batch work session (3–4h)
```

---

## Part 2: Weekly Batch Work (3–4 Hours, Structured)

### 2.1 Session 1 – Manual Review Queue (1–2 hours)

**Highest volume task. Most time-consuming.**

```
┌────────────────────────────────────────────────────────────┐
│ REVIEW MODERATION WORKFLOW (1–2 hours)                     │
└────────────────────────────────────────────────────────────┘

Step 1: Open Admin Panel
  ├─ Navigate to: /admin/reviews/pending
  ├─ View: 51 pending reviews (from dashboard)
  ├─ Sort: By creation date (oldest first)
  └─ Target: Clear queue to <10 pending

Step 2: Bulk Actions (Optimization)
  ├─ Filter: Z.AI_CONFIDENCE >= 0.90 (auto-flagged as safe)
  ├─ Select: All safe reviews (typically 40+)
  ├─ Action: Batch approve with 1 click
  ├─ Time saved: 40 reviews × 30 sec = 20 min (vs 40 min manual)
  └─ Remaining: ~10 edge-case reviews (manual review needed)

Step 3: Manual Review (Remaining)
  ├─ For each edge-case review (10 remaining):
  │  ├─ Read full text
  │  ├─ Check for: Spam, profanity, off-topic
  │  ├─ Decision: Approve or reject (simple)
  │  └─ Time: ~3–5 min per review
  │
  ├─ If approve:
  │  ├─ Click [Approve] → Published to trainer profile
  │  └─ Trainer sees review immediately
  │
  └─ If reject:
     ├─ Click [Reject]
     ├─ Select reason: Spam, Profanity, Off-topic, Other
     ├─ Optional note: Logged in audit trail
     └─ Reviewer not notified (anonymous reviews, no contact)

Step 4: Verification
  ├─ Refresh page
  ├─ Confirm: <10 pending remaining
  ├─ Log: "Approved 50 reviews, rejected 1" (audit trail)
  └─ Status: ✅ Complete

TIME ALLOCATION:
  ├─ Bulk approve: 5 min (40 reviews × click = instant)
  ├─ Manual review: 30–50 min (10 reviews × 3–5 min)
  ├─ Verification: 5 min
  └─ TOTAL: 40–60 min (well under 2-hour target)
```

### 2.2 Session 2 – Refund Requests (15–30 minutes)

**Strictly constrained. 3-day rule is hard (no exceptions).**

```
┌────────────────────────────────────────────────────────────┐
│ REFUND REQUEST PROCESSING (15–30 minutes)                  │
└────────────────────────────────────────────────────────────┘

Step 1: Check Pending Refunds
  ├─ Navigate to: /admin/refunds/pending
  ├─ View: 3 pending refund requests (from dashboard)
  ├─ Each shows: Business name, amount ($22), purchase date, days elapsed
  └─ Sort: By purchase date (oldest first, to prioritize near 3-day deadline)

Step 2: Eligibility Check (Hard Constraint)
  ├─ Rule: Refunds only allowed within 3 days of purchase
  ├─ Calculation: NOW() - purchased_at < 3 days?
  ├─ If YES → Proceed to Step 3 (process refund)
  ├─ If NO → Proceed to Step 4 (deny refund)
  └─ No exceptions, no manager approval (hard rule)

Step 3: Approve Refund (If Eligible)
  ├─ Click [Approve]
  ├─ System action: Call Stripe refund API
  │  ├─ Stripe: refunds.create(charge_id, amount=2200) [cents]
  │  └─ Stripe response: Refund ID (re_xxx)
  ├─ Database update: payment_audit.status = 'refunded'
  ├─ Update: featured_placements.refund_status = 'refunded'
  ├─ Email sent: "Refund processed. Look for it in 3–5 business days."
  ├─ Log: Operator action logged in audit trail
  └─ Status: Refund in progress (trainer sees pending → completed)

Step 4: Deny Refund (If Outside 3 Days)
  ├─ Click [Deny]
  ├─ Email sent: "Unfortunately, refunds are only available within 3 days of purchase. Your purchase was on [date], which is [X] days ago. We cannot process this refund."
  ├─ Tone: Friendly, transparent, factual
  ├─ Log: Denial reason logged
  └─ Status: Request closed

Step 5: Verification
  ├─ Refresh page
  ├─ Confirm: All pending refunds processed
  ├─ Log: "Approved 2 refunds, denied 1" (audit trail)
  └─ Status: ✅ Complete

TIME ALLOCATION:
  ├─ Check pending: 5 min
  ├─ Process each refund: 3–5 min × 3 requests = 10–15 min
  ├─ Verification: 5 min
  └─ TOTAL: 15–30 min
```

### 2.3 Session 3 – Payment Reconciliation (15–30 minutes)

**Verify Stripe charges match database. Critical for audit trail.**

```
┌────────────────────────────────────────────────────────────┐
│ PAYMENT RECONCILIATION WORKFLOW (15–30 minutes)            │
└────────────────────────────────────────────────────────────┘

Step 1: Query Database (Our Side)
  ├─ SQL: SELECT SUM(amount) FROM payment_audit 
           WHERE status='succeeded' AND created_at > NOW() - INTERVAL '7 days'
  ├─ Result: $2,340 AUD (example)
  ├─ This = sum of all successful charges in last 7 days (our records)
  └─ Copy result for comparison

Step 2: Check Stripe Dashboard (Stripe Side)
  ├─ Login to Stripe Dashboard
  ├─ Navigate to: Payments → Transactions
  ├─ Filter: Last 7 days, successful charges only
  ├─ Stripe total: $2,340 AUD (example)
  ├─ Compare: DTD DB = $2,340, Stripe = $2,340 ✅ Match!
  └─ Copy screenshot for audit trail

Step 3: Handle Discrepancies (If Any)
  ├─ If DTD > Stripe (we recorded more than Stripe processed):
  │  ├─ Possible: Charge failed but we recorded it as succeeded
  │  ├─ Action: Check payment_audit for failed charges
  │  ├─ Fix: Update status to 'failed' or 'refunded'
  │  └─ Log: Reconciliation issue, date found
  │
  ├─ If Stripe > DTD (Stripe processed more than we recorded):
  │  ├─ Possible: Webhook delayed, charge in flight
  │  ├─ Action: Check cron job logs, wait 24h, recheck
  │  ├─ Fix: Run cron manually if needed
  │  └─ Log: Reconciliation issue, date found
  │
  └─ If match: Great! No action needed

Step 4: Document & Archive
  ├─ Take screenshot of both: DTD database sum, Stripe dashboard
  ├─ Save to: Operator notes or ticket system (audit trail)
  ├─ Purpose: Proof for ATO if audited (7-year retention)
  ├─ Filename: "Payment_Reconciliation_2025-12-25.png"
  └─ Log: "Reconciliation completed, amounts match"

TIME ALLOCATION:
  ├─ Database query: 5 min
  ├─ Stripe dashboard check: 5 min
  ├─ Comparison & analysis: 5 min
  ├─ Screenshot & archival: 5 min
  └─ TOTAL: 15–20 min
```

### 2.4 Session 4 – Cron Job Health (10 minutes)

**Verify automated daily task completed successfully.**

```
┌────────────────────────────────────────────────────────────┐
│ CRON JOB MONITORING (10 minutes)                           │
└────────────────────────────────────────────────────────────┘

Step 1: Check Cron Logs
  ├─ Navigate to: /admin/cron
  ├─ View table: cron_jobs (execution history)
  ├─ Look for: featured-expiry-and-promotion (daily at 2 AM AEDT)
  ├─ Check: Last run timestamp (should be today)
  └─ Check: Status = 'success' (not 'failure')

Step 2: Verify Last Execution
  ├─ Last run: 2025-12-25 02:00:15 AEDT (should be recent)
  ├─ Duration: 12 seconds (normal)
  ├─ Status: SUCCESS ✅
  ├─ Attempts: 1 (no retries needed)
  ├─ Next run: 2025-12-26 02:00:00 AEDT
  └─ Conclusion: All good!

Step 3: If Last Run was Yesterday or Earlier (ERROR)
  ├─ Problem: Cron hasn't run in >24 hours
  ├─ Action 1: Check current time (is it after 2 AM AEDT?)
  │  ├─ If YES: Cron missed yesterday's run
  │  └─ If NO: It will run in X hours (normal)
  │
  ├─ Action 2: Check error log (if status = 'failure')
  │  ├─ Common errors: DB timeout, Supabase down, network issue
  │  ├─ If timeout: Wait 5 min, retry manually
  │  ├─ If Supabase down: Wait for recovery (not our fault)
  │  └─ If network: Contact DevOps
  │
  ├─ Action 3: Run manually (if safe)
  │  ├─ Click [Run featured-expiry-and-promotion]
  │  ├─ System: Executes cron logic immediately
  │  ├─ Verify: Check featured_queue for promotions (should increase)
  │  └─ Confirm: Status changed to 'success'
  │
  └─ Action 4: Log incident
     ├─ Reason: Cron missed run due to [X]
     └─ Resolution: Manual run successful on [date]

Step 4: What Cron Does (For Context)
  ├─ Every day at 2 AM AEDT:
  ├─ Find all: featured_placements where featured_until < NOW()
  ├─ Action: Set status = 'expired'
  ├─ Next: Promote from featured_queue (FIFO)
  ├─ Result: Next trainer in queue becomes featured
  └─ Impact: If fails → Featured slots empty, queue doesn't advance

TIME ALLOCATION:
  ├─ Check logs: 5 min
  ├─ Verify status: 2 min
  ├─ Manual run (if needed): 3 min
  ├─ Logging: 2 min
  └─ TOTAL: 10–15 min (usually just 5 min check)
```

### 2.5 Session 5 – Complaint Investigation (30 min – 1 hour)

**Ad-hoc investigations from red alerts or trainer complaints.**

```
┌────────────────────────────────────────────────────────────┐
│ COMPLAINT INVESTIGATION (30 min – 1 hour)                  │
└────────────────────────────────────────────────────────────┘

Common Complaint Scenarios:

SCENARIO 1: "My profile isn't being featured"
  ├─ Trainer complaint: "I paid $22 but my profile isn't showing up"
  ├─ Investigation:
  │  ├─ Query: SELECT * FROM featured_placements WHERE business_id = ?
  │  ├─ Check: featured_until > NOW() (currently active?)
  │  ├─ Check: Queue position (if not active, where in queue?)
  │  └─ Check: Payment status (did Stripe charge succeed?)
  │
  ├─ Possible root causes:
  │  ├─ Stripe webhook failed (charge succeeded but we didn't process)
  │  ├─ Featured slot was full, now in queue (expected)
  │  ├─ Trainer doesn't meet criteria (e.g., unverified)
  │  └─ Bug in featured_expiry_and_promotion cron
  │
  ├─ Actions:
  │  ├─ If webhook failed: Manually update featured_placements
  │  ├─ If in queue: Explain position + ETA
  │  ├─ If criteria issue: Log for product team
  │  └─ Email trainer: "Your payment was received. You're in queue position #X."
  │
  └─ Log: "Featured placement investigation, trainer updated"

SCENARIO 2: "Search results are broken"
  ├─ Trainer complaint: "My profile doesn't appear in search results"
  ├─ Investigation:
  │  ├─ Query: SELECT * FROM businesses WHERE business_id = ? AND deleted = false
  │  ├─ Check: status = 'active' (not suspended?)
  │  ├─ Check: age_specialties not empty (required for search)
  │  ├─ Check: behavior_issues not empty (required for search)
  │  └─ Test: Search /api/search with matching criteria
  │
  ├─ Possible root causes:
  │  ├─ Profile incomplete (missing specialties/issues)
  │  ├─ Business deleted or suspended
  │  ├─ Cache issue (recent update, not yet reflected)
  │  └─ Search algorithm bug
  │
  ├─ Actions:
  │  ├─ If incomplete: Tell trainer to complete profile
  │  ├─ If deleted: Explain, offer to restore
  │  ├─ If cache: Clear cache manually, retest
  │  ├─ If bug: Escalate to product team + log
  │  └─ Email trainer: "Try searching for [criteria]. If still missing, update your profile."
  │
  └─ Log: "Search results investigation, root cause: [X]"

SCENARIO 3: "My review was rejected unfairly"
  ├─ Reviewer complaint: "I wrote a honest review but it was rejected"
  ├─ Investigation:
  │  ├─ Query: SELECT * FROM reviews WHERE review_id = ?
  │  ├─ Check: moderation_status = 'rejected'
  │  ├─ Check: rejection_reason (Z.AI flagged it, or manual operator?)
  │  ├─ Read: Review text (was it actually okay?)
  │  └─ Check: Review moderation log (who rejected it, why?)
  │
  ├─ Possible root causes:
  │  ├─ Z.AI false positive (flagged as spam, but legitimate)
  │  ├─ Operator mistakenly rejected (oops)
  │  ├─ Review contained spam/profanity (correctly rejected)
  │  └─ Trainer reported review (manual operator action)
  │
  ├─ Actions:
  │  ├─ If Z.AI error: Approve manually, log feedback
  │  ├─ If operator error: Apologize + approve, update log
  │  ├─ If truly spam: Confirm rejection (don't override)
  │  ├─ If trainer dispute: Escalate to product team (legal question)
  │  └─ Email reviewer: "We reviewed your feedback. [Approved/Denied] for reason: [X]"
  │
  └─ Log: "Review rejection dispute, trainer contacted"

TIME ALLOCATION:
  ├─ Typical scenario: 15–30 min (query, analyze, email)
  ├─ Complex scenario: 45–60 min (multiple queries, escalation)
  ├─ Multiple complaints: Batch similar ones
  └─ TOTAL: 30 min – 1 hour (varies)
```

---

## Part 3: Admin Dashboard Design (MVP)

### 3.1 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│ DTD OPERATOR DASHBOARD                                      │
│ ─────────────────────────────────────────────────────────────│
│                                                               │
│ 🔴 RED ALERTS (3 Critical)                 ⚙️ Settings       │
│   ├─ Z.AI down since 14:32 AEDT (1h 3m)                     │
│   ├─ Stripe webhook failed (1 retry pending)                │
│   └─ Cron failed (attempt 2/5)                              │
│                                                               │
│ 📊 METRICS (Last 30 days)     ⏰ Refresh: 2025-12-25 10:45  │
│   ├─ Revenue: $2,340 AUD (↑ 12% from last month)            │
│   ├─ Featured adoption: 18% (90/500 trainers, target 25%)   │
│   ├─ Queue backlog: 87 total (avg 2 per council)            │
│   ├─ Refund rate: 2% (1 out of 50, healthy)                 │
│   ├─ Search volume: 2,450 searches (↓ 5% weekday)           │
│   └─ AI provider health: Z.AI healthy, z.ai ready         │
│                                                               │
│ ⏳ PENDING TASKS (Sorted by priority)                        │
│   ├─ [51] Reviews pending approval (1–2h work) [PROCESS]   │
│   ├─ [3] Refund requests (0.5h work)         [PROCESS]     │
│   ├─ [1] Featured slot dispute (0.25h work)  [PROCESS]     │
│   └─ [0] Payment reconciliation (0.25h)      [VERIFY]      │
│                                                               │
│ 🔔 LAST 5 ALERTS (Activity log)                             │
│   ├─ 2025-12-25 14:32: Z.AI timeout (UNRESOLVED)            │
│   ├─ 2025-12-25 13:45: Stripe webhook retry #1 (RESOLVED)   │
│   ├─ 2025-12-24 02:15: Cron succeeded (NORMAL)              │
│   ├─ 2025-12-24 09:00: Daily alert check completed          │
│   └─ 2025-12-23 14:22: Manual review batch (50 approved)    │
│   └─ [View All Logs]                                        │
│                                                               │
│ QUICK ACTIONS                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Process Reviews]  [Process Refunds]  [Run Cron Now]   │ │
│ │ [Check Alerts]     [Payment Reconciliation]  [Logs]    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ LAST UPDATE: 2025-12-25 10:45 AEDT (auto-refresh: 1 min)   │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Detailed Metrics Breakdown

```
REVENUE METRICS:
  ├─ LTM (Last 12 months): $24,800 AUD
  │  ├─ Avg per month: $2,067
  │  └─ Trend: ↑ 18% vs previous year
  │
  ├─ MTD (This month): $2,340 AUD
  │  ├─ Daily avg: $94
  │  ├─ Projected month-end: $2,820 (on pace)
  │  └─ Trend: ↑ 12% vs previous month
  │
  └─ WTD (This week): $420 AUD
     ├─ Daily avg: $60
     ├─ Projected week-end: $420 (4 sales)
     └─ Trend: ↓ 15% vs previous week (holiday effect)

FEATURED ADOPTION:
  ├─ Active featured: 5 out of 10 slots per council (50% filled)
  ├─ Total in queue: 87 trainers waiting
  ├─ Conversion rate: 18% (90 featured / 500 total trainers)
  ├─ Target: 25% adoption (growing)
  ├─ Time in queue avg: 21 days (varies by council)
  └─ Churn: 2% of trainers cancel featured before expiry

QUEUE BACKLOG:
  ├─ Melbourne: 24 queued (longest)
  ├─ Monash: 18 queued
  ├─ Stonnington: 15 queued
  ├─ Boroondara: 12 queued
  ├─ Other: 18 queued
  ├─ Avg per council: 2 (very manageable)
  └─ Queue velocity: ~7 promotions per month

REFUND RATE:
  ├─ Approved: 2 refunds (within 3-day window)
  ├─ Denied: 0 refunds (after 3 days)
  ├─ Rate: 2% (2 out of 100 purchases, healthy)
  ├─ Threshold alert: >15% triggers investigation
  ├─ Avg refund value: $22 (full refund, no partial)
  └─ Root cause: Mostly "featured didn't deliver results"

SEARCH VOLUME:
  ├─ Daily: 2,450 searches (average)
  ├─ Peak day: Monday 350+ searches
  ├─ Low day: Saturday 200 searches
  ├─ Most searched: Age (Puppy, Adult), Issues (Pulling, Anxiety)
  ├─ Least searched: Service type filters
  └─ Trend: ↓ 5% (seasonal dip, expect recovery)

AI PROVIDER HEALTH:
  ├─ Z.AI: Healthy (99.9% uptime, avg 342ms)
  ├─ z.ai: Standby (ready, avg 1.2s if needed)
  ├─ Deterministic: Always ready (<10ms)
  ├─ Last incident: Z.AI timeout on 2025-12-25 14:32 (resolved)
  ├─ Cost this month: $37.50 (Z.AI $30, z.ai $6, deterministic $0)
  └─ Budget status: Well under $250 limit ✅
```

---

## Part 4: Incident Response Playbooks (5 Scenarios)

### 4.1 Playbook 1: Z.AI Down >30 Minutes

```
┌─────────────────────────────────────────────────────────────┐
│ INCIDENT: Z.AI SERVICE DOWN >30 MINUTES                    │
│ Severity: 🔴 CRITICAL (Emergency triage disabled)           │
│ Timeline: 2025-12-25 14:32–15:02 AEDT (30 min)             │
└─────────────────────────────────────────────────────────────┘

DETECTION:
  ├─ Source: Cron job failure log (triage_logs empty)
  ├─ Alert: Dashboard shows 🔴 Z.AI down (red)
  ├─ Confirmation: Test POST /api/emergency/triage → timeout
  └─ Decision: Act immediately (don't wait until Thursday)

RESPONSE STEPS:

1. CONFIRM STATUS (1 minute)
   ├─ Check Z.AI status page: https://status.z.ai
   ├─ Result: "Service degraded, investigating"
   ├─ Decision tree:
   │  ├─ If <5 min down: Wait & retest in 5 min
   │  ├─ If 5–30 min: Switch to z.ai (next step)
   │  └─ If >30 min: Switch to deterministic (safest)
   └─ Our case: 30+ min → Switch to deterministic

2. SWITCH FEATURE FLAG (2 minutes)
   ├─ Open: Vercel environment variables
   ├─ Change: AI_MODE = "z_ai" → AI_MODE = "deterministic"
   ├─ Deploy: Auto-deploy (no manual step)
   ├─ Result: All triage calls use keyword matching instead
   ├─ Cost: Drop from $0.001/call to $0
   └─ Accuracy: Slightly lower (keyword matching vs ML), still safe

3. TEST FALLBACK (3 minutes)
   ├─ Test case 1: "Bleeding from paw" → Should return "medical"
   ├─ Test case 2: "Aggressive dog" → Should return "crisis"
   ├─ Test case 3: "Lost dog" → Should return "stray"
   ├─ Test case 4: "Won't listen" → Should return "normal"
   ├─ Result: ✅ All tests pass, deterministic working
   └─ User impact: No difference, triage still works

4. NOTIFY TEAM (1 minute)
   ├─ Action: Post in Slack #incidents channel
   ├─ Message: "Z.AI down since 14:32 (30m+). Switched to deterministic triage. All systems functional."
   ├─ Who to notify: Product team (awareness, not action)
   ├─ Do NOT: Email trainers (transparent fallback, no issues)
   └─ Status: Informational only

5. MONITOR & RESOLVE (Ongoing)
   ├─ Timeline: Check Z.AI status every 15 min
   ├─ At 15:02: Z.AI back online
   ├─ Action: Revert flag AI_MODE = "deterministic" → "z_ai"
   ├─ Deploy: Auto-deploy, live within 1 min
   ├─ Verify: Test triage again with Z.AI
   ├─ Result: ✅ Z.AI responds, switch back to normal
   └─ Incident resolved

6. LOG INCIDENT (5 minutes)
   ├─ Create incident report: cron_jobs table
   ├─ Details:
   │  ├─ Start time: 2025-12-25 14:32 AEDT
   │  ├─ Duration: 30 minutes
   │  ├─ Root cause: Z.AI API degradation
   │  ├─ Detection: Dashboard alert + test failure
   │  ├─ Response: Switched to deterministic fallback
   │  ├─ Resolution: Z.AI recovered, switched back
   │  ├─ User impact: None (transparent fallback)
   │  └─ Cost impact: -$0.30 (saved 300 Z.AI calls × $0.001)
   │
   └─ File: incident_2025-12-25_z-ai-down.txt

TOTAL TIME: 12 minutes (detection + action + monitoring)
USER IMPACT: None (triage still works, just slower/keyword-based)
COST IMPACT: Savings (~$0.30 in avoided Z.AI costs)
```

### 4.2 Playbook 2: Stripe Webhook Failed (Charge Succeeded Lost)

```
┌─────────────────────────────────────────────────────────────┐
│ INCIDENT: STRIPE WEBHOOK FAILED                            │
│ Severity: 🔴 CRITICAL (Payment not processed)              │
│ Impact: Trainer reports "Card charged but no featured"     │
└─────────────────────────────────────────────────────────────┘

DETECTION:
  ├─ Source: Trainer email complaint (not automated alert)
  ├─ Message: "I paid $22 yesterday but my profile isn't featured"
  ├─ Confirmation: Check payment_audit table for orphaned charges
  └─ Root cause: Stripe → Webhook → DTD flow broken

RESPONSE STEPS:

1. VERIFY TRAINER'S CLAIM (5 minutes)
   ├─ Query: SELECT * FROM users WHERE email = trainer_email
   ├─ Get: business_id
   ├─ Query: SELECT * FROM featured_placements WHERE business_id = ?
   ├─ Result: featured_until IS NULL (not featured)
   ├─ Query: SELECT * FROM payment_audit WHERE business_id = ? AND status='succeeded' AND created_at > NOW() - INTERVAL '1 day'
   ├─ Result: Found! Stripe charge_id = ch_xxx, amount = 2200, timestamp = yesterday 14:23
   ├─ Conclusion: Charge succeeded but DTD didn't process it
   └─ Root cause confirmed: Webhook missed this charge

2. CREATE FEATURED PLACEMENT (3 minutes)
   ├─ Action: Manually insert into featured_placements table
   ├─ SQL: INSERT INTO featured_placements (
   │    business_id, charge_id, 
   │    featured_until = NOW() + INTERVAL '30 days',
   │    status = 'active'
   │  )
   ├─ Result: ✅ Trainer now shows as featured
   ├─ Verification: Check /trainer/{id} → Shows featured_until date
   └─ Time: Instant (trainer sees change in <1 min)

3. CROSS-CHECK STRIPE (5 minutes)
   ├─ Login to Stripe Dashboard
   ├─ Find charge: ch_xxx (from payment_audit)
   ├─ Verify: Amount = $22 AUD, status = succeeded
   ├─ Check: Webhook delivery log
   │  ├─ Event: charge.succeeded
   │  ├─ Delivery: FAILED (timeout or network error)
   │  ├─ Timestamp: Yesterday 14:23
   │  └─ Retries: Stripe retried 3 times, all failed
   │
   ├─ Possible causes:
   │  ├─ Our webhook endpoint was down
   │  ├─ Network issue between Stripe & our server
   │  ├─ Webhook handler timeout
   │  └─ Database was slow (couldn't write fast enough)
   │
   └─ Conclusion: Not Stripe's fault, not trainer's fault

4. EMAIL TRAINER (2 minutes)
   ├─ Subject: "Good news! Your featured placement is now active"
   ├─ Body:
   │  "Hi Trainer,
   │
   │  We received your payment ($22 AUD) and have now activated your featured placement. 
   │  Your profile will be featured until [DATE] and will appear at the top of search results.
   │
   │  Thank you for choosing Dog Trainers Directory!
   │  
   │  Best,
   │  DTD Team"
   │
   └─ Status: Sent ✅

5. INVESTIGATE ROOT CAUSE (5–10 minutes)
   ├─ Check: Webhook logs (next 12 hours)
   ├─ Question: Are other charges also affected?
   ├─ Query: SELECT COUNT(*) FROM payment_audit WHERE status='succeeded' AND featured_until IS NULL AND created_at > NOW() - INTERVAL '24 hours'
   ├─ Result: 1 (only this trainer, isolated incident)
   ├─ Check: Is webhook endpoint healthy?
   │  ├─ Test: Send test charge.succeeded event from Stripe
   │  ├─ Verify: Handler responds within 3 seconds
   │  ├─ Result: ✅ Working fine now
   │  └─ Conclusion: Temporary glitch, now resolved
   │
   └─ Action: No further action needed (not systemic)

6. LOG INCIDENT (3 minutes)
   ├─ Record: payment_audit.notes = "Webhook failed, manually reprocessed"
   ├─ Record: incident log
   │  ├─ Date: 2025-12-25
   │  ├─ Time: Discovered 10:30, resolved 10:48
   │  ├─ Duration: 18 minutes
   │  ├─ Cause: Stripe webhook delivery timeout
   │  ├─ Resolution: Manual INSERT into featured_placements
   │  ├─ User impact: Trainer manually featured (same result)
   │  └─ Follow-up: Monitor webhook logs for trends
   │
   └─ Status: ✅ Resolved

TOTAL TIME: 23 minutes (verify + create + email + investigate)
USER IMPACT: Minimal (trainer now featured, same as if webhook worked)
RISK MITIGATION: Monitor webhook logs, alert if >3 failures in 1 hour
```

### 4.3 Playbook 3: Cron Failed All 5 Retries

```
┌─────────────────────────────────────────────────────────────┐
│ INCIDENT: CRON JOB FAILED ALL 5 RETRIES                    │
│ Severity: 🔴 CRITICAL (Featured expiries not processed)    │
│ Impact: Featured slots stuck, queue not advancing          │
└─────────────────────────────────────────────────────────────┘

DETECTION:
  ├─ Source: Dashboard alert or Thursday batch work
  ├─ Alert: cron_jobs table shows status='failure', attempt=5
  ├─ Timestamp: 2025-12-25 02:00 (today's run)
  ├─ Log: Error message (e.g., "DB timeout" or "Connection refused")
  └─ Decision: Investigate & manually run if safe

RESPONSE STEPS:

1. UNDERSTAND THE ERROR (5 minutes)
   ├─ Check: cron_jobs.error_log (full error message)
   ├─ Possible errors & causes:
   │
   │  A) "Database connection timeout (30s)"
   │     ├─ Cause: Supabase slow or overloaded
   │     ├─ Fix: Wait for Supabase to recover
   │     ├─ Action: Don't force (will timeout again)
   │     └─ Resolution: Check Supabase status, wait 5–10 min
   │
   │  B) "Lock timeout acquiring lock (featured_queue)"
   │     ├─ Cause: Another process locked the table
   │     ├─ Fix: Wait for lock to release
   │     ├─ Action: Wait 5 min, then manual retry
   │     └─ Resolution: If lock still held, investigate
   │
   │  C) "Network connection refused (Vercel Edge timeout)"
   │     ├─ Cause: Vercel Edge Function crashed
   │     ├─ Fix: Restart function (auto-happens at next run)
   │     ├─ Action: Wait for next scheduled run (2 AM tomorrow)
   │     └─ Manual: Only if critical (expiries pending)
   │
   └─ Our case: "DB timeout" → Wait for recovery

2. ASSESS IMPACT (3 minutes)
   ├─ Question: How many featured placements are expiring?
   ├─ Query: SELECT COUNT(*) FROM featured_placements WHERE featured_until < NOW()
   ├─ Result: 2 (two trainers' featured periods have expired)
   ├─ Impact: These 2 slots are stuck (should promote from queue)
   ├─ Question: How many in queue waiting?
   ├─ Query: SELECT COUNT(*) FROM featured_queue WHERE promoted_at IS NULL
   ├─ Result: 87 (trainers waiting, 2 could be promoted now)
   ├─ Decision: If critical (many expiries), run manually. If minimal (1–2), wait.
   └─ Our case: 2 expiries → Worth fixing now (don't want stuck slots)

3. RUN CRON MANUALLY (5 minutes)
   ├─ Option A: Use admin panel button
   │  ├─ Navigate: /admin/cron
   │  ├─ Click: [Run featured-expiry-and-promotion]
   │  ├─ System: Executes cron logic immediately
   │  ├─ Wait: Job running... (should take <20s)
   │  ├─ Check: Return status (success/failure)
   │  └─ If success: ✅ Slots promoted, queue advanced
   │
   ├─ Option B: Use CLI (if comfortable)
   │  ├─ Command: npm run cron:featured-expiry-and-promotion
   │  ├─ Env: Must set DATABASE_URL, other secrets
   │  ├─ Run: In terminal (Vercel), takes 10–20s
   │  └─ Result: Same as Option A
   │
   └─ Our case: Use Option A (dashboard button, easier)

4. VERIFY SUCCESS (3 minutes)
   ├─ Check: cron_jobs.status = 'success' (should update)
   ├─ Verify: featured_queue.promoted_at updated for 2 trainers
   │  ├─ Query: SELECT * FROM featured_queue WHERE promoted_at = TODAY
   │  ├─ Result: 2 new rows with promoted_at timestamp
   │  └─ Confirmation: ✅ Promotions successful
   │
   ├─ Verify: featured_placements updated for promoted trainers
   │  ├─ Query: SELECT * FROM featured_placements WHERE status='active' AND created_at = TODAY
   │  ├─ Result: 2 new active placements (today's promotions)
   │  └─ Confirmation: ✅ New featured trainers set up
   │
   └─ Status: Manual run successful ✅

5. MONITOR NEXT RUN (Overnight)
   ├─ Schedule: Tomorrow 2 AM (regular cron)
   ├─ Action: Check logs tomorrow morning
   ├─ Question: Did tomorrow's run succeed?
   ├─ If YES: Incident resolved (today was one-time failure)
   ├─ If NO: Pattern emerging (escalate to DevOps)
   └─ Alert: Set reminder to check Thursday batch

6. LOG INCIDENT (3 minutes)
   ├─ Record: cron_jobs incident
   │  ├─ Date: 2025-12-25 02:00
   │  ├─ Error: Database timeout
   │  ├─ Resolution: Manual run at 10:00 (successful)
   │  ├─ Impact: 2 featured slots promoted, queue advanced
   │  ├─ Root cause: Supabase slow query (5-min recovery)
   │  └─ Status: Resolved
   │
   └─ Follow-up: Monitor Supabase performance, consider query optimization

TOTAL TIME: 19 minutes (debug + impact assess + run + verify)
USER IMPACT: Minimal (2 trainers featured slightly late, but promoted correctly)
ESCALATION: If cron fails again, notify DevOps (infrastructure issue)
```

### 4.4 Playbook 4: Trainer Complains About Queue Position

```
┌─────────────────────────────────────────────────────────────┐
│ COMPLAINT: QUEUE POSITION DISPUTE                          │
│ Severity: 🟡 WARNING (Customer service issue, not critical) │
│ Message: "I paid first! Why am I #5 in queue?"            │
└─────────────────────────────────────────────────────────────┘

RESPONSE STEPS:

1. VERIFY QUEUE DATA (5 minutes)
   ├─ Get trainer email/name
   ├─ Find: business_id
   ├─ Query: SELECT * FROM featured_queue WHERE business_id = ?
   ├─ Result:
   │  ├─ queue_position: 5
   │  ├─ created_at: 2025-12-15 (when they purchased)
   │  ├─ promoted_at: NULL (not yet promoted)
   │  └─ active_count: 5 (5 of 10 slots filled)
   │
   └─ Cross-check: featured_placements
      ├─ Query: SELECT created_at FROM featured_placements 
                 WHERE council_id='melbourne' AND featured_until > NOW()
                 ORDER BY created_at ASC
      ├─ Result: [2025-12-10, 2025-12-11, 2025-12-12, 2025-12-13, 2025-12-14]
      │          (5 trainers currently featured, all purchased before this trainer)
      ├─ Query: SELECT created_at FROM featured_queue 
                 WHERE council_id='melbourne' AND promoted_at IS NULL
                 ORDER BY created_at ASC
      ├─ Result: [2025-12-15 (THIS TRAINER), 2025-12-16, 2025-12-17, ...]
      └─ Confirmation: ✅ Trainer IS in position #5 (correct)

2. EXPLAIN QUEUE LOGIC (2 minutes)
   ├─ Fact: We use first-in-first-out (FIFO) queuing
   ├─ Fact: Featured slots are limited to 5 per council
   ├─ Fact: When a slot expires, next in queue is promoted
   ├─ Example:
   │  ├─ Currently featured: 5 trainers (purchased 12/10–12/14)
   │  ├─ Queued: This trainer (purchased 12/15) + 87 others
   │  ├─ Next promotion: When current featured expires (avg 30 days)
   │  ├─ This trainer's turn: Approximately [DATE] (in ~15 days)
   │  └─ Rule: No jumping queues (fairness)
   │
   └─ Implication: "Your purchase time determines your position. You're fairly #5."

3. CHECK FOR DATA INTEGRITY ISSUES (3 minutes)
   ├─ Question: Is the order actually correct?
   ├─ Potential issue: Trainer claims they paid before someone ahead
   ├─ Check: Compare payment timestamps
   │  ├─ Trainer's claim: Paid 2025-12-13
   │  ├─ Someone ahead: Paid 2025-12-14
   │  ├─ Reality check: Our data shows them paying 2025-12-15
   │  └─ Conclusion: Trainer is mistaken or confused
   │
   ├─ OR
   │
   ├─ Alternative: Data might be corrupted
   │  ├─ Check: SELECT * FROM featured_queue ORDER BY created_at ASC LIMIT 10
   │  ├─ Verify: Is order actually chronological?
   │  ├─ If NO: Data corruption detected → Escalate to product team
   │  └─ If YES: Order is correct, proceed to Step 4
   │
   └─ Our case: No data issues found ✅

4. EMAIL TRAINER (2 minutes)
   ├─ Tone: Friendly, transparent, empowering
   ├─ Message:
   │  "Hi [Trainer Name],
   │
   │  Thank you for reaching out about your queue position. I've reviewed our records 
   │  and can confirm that your featured placement request was received on December 15 
   │  at 2:30 PM. You're currently position #5 in the queue for the [Council] region.
   │
   │  Here's how our queue works:
   │  - We offer 5 featured slots per council, filled on a first-come, first-served basis
   │  - When a trainer's featured period expires, the next person in queue is automatically promoted
   │  - Your turn is estimated to come up around [DATE] (based on current featured expiries)
   │
   │  We appreciate your patience. Your profile will be featured soon!
   │
   │  Best,
   │  DTD Operations"
   │
   └─ Send: Email + save copy to ticket system

5. IF TRAINER IS RIGHT (Rare Data Issue)
   ├─ Scenario: Trainer actually paid before someone ahead
   ├─ Evidence: Payment timestamp proves it
   ├─ Action: Escalate to product team
   │  ├─ Subject: "Data integrity issue: Queue position out of order"
   │  ├─ Details: Trainer X paid before Trainer Y, but Y is ahead in queue
   │  ├─ Impact: Trust issue, potential legal (fairness question)
   │  ├─ Request: Fix queue order, possibly refund if unfair
   │  └─ Urgency: High (customer satisfaction)
   │
   └─ Note: This is NOT common (check logs first)

TOTAL TIME: 12 minutes (verify + explain + email)
USER IMPACT: Low (clarification, not a system bug)
ESCALATION: Only if data corruption found
```

### 4.5 Playbook 5: High Refund Rate Alert (>15%)

```
┌─────────────────────────────────────────────────────────────┐
│ ALERT: HIGH REFUND RATE (>15%)                             │
│ Severity: 🟡 WARNING (Pattern to investigate)              │
│ Threshold: Alert if refund_percent > 15%                   │
│ Current: 18% (9 refunds out of 50 purchases)               │
└─────────────────────────────────────────────────────────────┘

DETECTION:
  ├─ Source: Dashboard metrics
  ├─ Alert: Refund rate 18% (threshold 15%)
  ├─ Time period: Last 7 days
  └─ Decision: Investigate before it escalates

RESPONSE STEPS:

1. ANALYZE REFUND PATTERN (10 minutes)
   ├─ Query: SELECT * FROM featured_placements WHERE status='refunded' 
             AND refunded_at > NOW() - INTERVAL '7 days'
   ├─ Result: 9 refunds from 50 featured purchases
   │  ├─ Trainer A: 3 refunds (purchased 3x, all refunded)
   │  ├─ Trainer B: 2 refunds (purchased 2x, both refunded)
   │  ├─ Trainers C–G: 1 refund each
   │  └─ Average reason: "Featured didn't generate leads"
   │
   └─ Pattern analysis:
      ├─ Question 1: Same trainer multiple times? (Fraudster?)
      │  ├─ Result: YES, Trainer A refunded 3x in 7 days
      │  └─ Red flag: Possible abuse (buy, refund, repeat)
      │
      ├─ Question 2: Bulk refunds from one council? (Product issue?)
      │  ├─ Melbourne: 4 refunds
      │  ├─ Monash: 3 refunds
      │  ├─ Stonnington: 2 refunds
      │  └─ Conclusion: Distributed, not council-specific
      │
      └─ Question 3: Time of purchase impact? (Poor timing?)
           ├─ New trainers (0–7 days old): 5 refunds
           ├─ Older trainers (>30 days old): 4 refunds
           └─ Insight: New trainers often refund (unrealistic expectations?)

2. IDENTIFY ROOT CAUSES (5 minutes)
   ├─ Root cause 1: Fraud / Repeat refunder
   │  ├─ Trainer A: 3 purchases in 7 days, 100% refund rate
   │  ├─ Pattern: Buy featured → Realize no leads → Refund within 3 days → Repeat
   │  ├─ Hypothesis: Testing service, abusing refund policy, or frustrated
   │  └─ Action: Flag for review, consider blocking from future purchases
   │
   ├─ Root cause 2: Unmet expectations
   │  ├─ Quote from refunds: "No new clients," "Saw few clicks," "Didn't help"
   │  ├─ Reality: Featured is prominent, but doesn't guarantee leads
   │  ├─ Issue: Trainers expect immediate ROI (unrealistic)
   │  └─ Action: Set better expectations in marketing/onboarding
   │
   ├─ Root cause 3: Product issue (unlikely)
   │  ├─ Check: Are featured trainers actually showing in search?
   │  ├─ Check: Do they get more views/clicks than non-featured?
   │  ├─ Result: Yes, featured get 3x views (verified)
   │  └─ Conclusion: Featured is working, trainers are impatient
   │
   └─ Root cause 4: Seasonal variation (normal)
       ├─ December: Holiday season (fewer dog training searches)
       ├─ Trainers expect high ROI in winter (bad timing)
       ├─ Resolution: Educate trainers on seasonal patterns
       └─ Status: Expected, not a product problem

3. TAKE ACTION (5 minutes)
   ├─ Action 1: Flag Trainer A for fraud review
   │  ├─ Query: SELECT * FROM users WHERE id = trainer_a_id
   │  ├─ Flag: account_status = 'flagged_for_review'
   │  ├─ Note: "3 refunds in 7 days, possible abuse"
   │  ├─ Decision: Block from purchasing featured until reviewed
   │  └─ Status: Manual review required (product team)
   │
   ├─ Action 2: Improve onboarding messaging
   │  ├─ Add: Expectation-setting email before purchase
   │  ├─ Content: "Featured shows your profile prominently, but results vary."
   │  ├─ Include: Typical views/click numbers (3x baseline)
   │  ├─ Set: Realistic expectations (takes 1–2 weeks to see results)
   │  └─ Document: For product team to implement
   │
   ├─ Action 3: Monitor next week
   │  ├─ Goal: Refund rate should drop to <15% (natural variation)
   │  ├─ If >15% again: Escalate to product team
   │  ├─ Pattern: If persistent, systemic issue (not random)
   │  └─ Action: Consider featured product changes (positioning, messaging)
   │
   └─ Action 4: Document findings (5 minutes)
       ├─ Create incident report:
       │  ├─ Date: 2025-12-25
       │  ├─ Refund rate: 18% (threshold: 15%)
       │  ├─ Root cause: Mix of fraud + unmet expectations
       │  ├─ Actions taken: Flagged Trainer A, documented for product team
       │  └─ Follow-up: Monitor next week
       │
       └─ Send: Summary to product team (not urgent)

4. ESCALATE IF PATTERN CONTINUES (For Next Week)
   ├─ If refund rate stays >15%:
   │  ├─ Possible issues:
   │  │  ├─ Marketing overpromising ("Get tons of leads!")
   │  │  ├─ Featured product not delivering value
   │  │  ├─ Seasonal demand (December slump)
   │  │  └─ Systematic fraudsters exploiting refund policy
   │  │
   │  └─ Escalate: Product team decides if changes needed
   │     ├─ Option 1: Tighten refund policy (reduce window to 1 day)
   │     ├─ Option 2: Improve featured value (show more stats)
   │     ├─ Option 3: Block repeat refunders
   │     └─ Option 4: Nothing (accept 15–20% as normal)
   │
   └─ Decision: Up to product team, operator just flags

TOTAL TIME: 25 minutes (analyze + identify + action + document)
USER IMPACT: None (internal investigation)
ESCALATION: To product team if pattern continues
FOLLOW-UP: Monitor next week, recheck Thursday batch
```

---

## Part 5: SLA Policy (D-011 – No Promises)

### 5.1 What DTD Does NOT Promise

```
┌────────────────────────────────────────────────────────────┐
│ SLA POLICY (Decision D-011: No Service Level Agreements)   │
└────────────────────────────────────────────────────────────┘

Trainer question: "When will my review be approved?"

DTD response (accurate & honest):
  "Our team reviews posts as time allows, typically within 1–2 weeks. 
   We don't provide a guaranteed turnaround time."

Why no SLAs?
  ├─ Operator is part-time (4h/week, other tasks take priority)
  ├─ Manual review is human-dependent (quality takes time)
  ├─ Variable volume (some weeks 10 reviews, some weeks 100+)
  ├─ Z.AI helps but doesn't remove manual work entirely
  ├─ No automated SLA enforcement (would require more resources)
  └─ Honest: Better to under-promise, over-deliver

Implementation:
  ├─ Public messaging:
  │  ├─ Website: "Expect 1–2 weeks for review approval"
  │  ├─ Email after review submitted: "We'll review this as time allows"
  │  ├─ Trainer dashboard: No promised date, just "pending"
  │  └─ FAQ: "We don't provide guaranteed turnaround times"
  │
  ├─ Internal rules:
  │  ├─ No alert if review >7 days pending (okay)
  │  ├─ No escalation if >30 days pending (low priority)
  │  ├─ No compensation if slow (trainer knew expectations)
  │  ├─ Operator paces work (can batch 50 at once or spread out)
  │  └─ Volume spikes okay (weeks can have >100 pending)
  │
  └─ What we DO promise:
     ├─ We will review all submitted reviews
     ├─ Approved reviews will be published
     ├─ Rejected reviews will not be published (no explanation to anon)
     ├─ All moderation is consistent & fair
     └─ Reviews are not censored (unless spam/profanity)
```

---

## Part 6: Metrics Dashboard Details

### 6.1 Real-Time Metrics (1-Minute Refresh)

```
DASHBOARD REFRESH RATE: Every 1 minute (auto-refresh)

METRICS:
  ├─ Revenue: Pull from SUM(payment_audit) (cached, fresh)
  ├─ Featured adoption: Query featured_placements count (fresh)
  ├─ Queue backlog: SELECT COUNT(*) FROM featured_queue (fresh)
  ├─ Refund rate: SUM(refunded) / SUM(total) last 30 days (fresh)
  ├─ Search volume: Events table (ingested in real-time)
  ├─ AI provider health: Health check endpoints (fresh)
  ├─ Cron status: Query cron_jobs.last_run (fresh)
  └─ Stripe status: Stripe API status page (cached, 1-min TTL)

ALERTS:
  ├─ Red alerts update: Every 30 seconds (more frequent)
  ├─ Yellow alerts update: Every 1 minute
  ├─ Last alerts log: Every 30 seconds (recent events)
  └─ Operator sees latest info at all times
```

---

## Part 7: Escalation Path

```
┌────────────────────────────────────────────────────────────┐
│ ESCALATION MATRIX (When to Escalate)                      │
└────────────────────────────────────────────────────────────┘

Operator is stuck? Need help? Follow this path:

SITUATION 1: Data Corruption / Integrity Issue
  ├─ Example: Queue order wrong, payment missing, trainer data corrupted
  ├─ Escalate to: Product Team (engineering)
  ├─ Urgency: High (data is precious)
  ├─ Fix: Likely requires code/DB fix, not operator action
  └─ Action: Create ticket, attach evidence

SITUATION 2: Infrastructure Down (Supabase, Stripe, Vercel)
  ├─ Example: Supabase unavailable, Stripe API down, Vercel deploying
  ├─ Escalate to: DevOps Team (infrastructure)
  ├─ Urgency: Immediate (service down)
  ├─ Action: DevOps monitors and resolves
  └─ Operator: Maintain manual fallbacks while waiting

SITUATION 3: Feature Request / Policy Question
  ├─ Example: "Should we change the 3-day refund window?" "Add new filter?"
  ├─ Escalate to: Product Team (business decisions)
  ├─ Urgency: Low (not operational, can wait until next sprint)
  ├─ Action: Document request, send to product manager
  └─ Operator: Proceed with existing policies

SITUATION 4: Legal / Compliance Issue
  ├─ Example: Trainer disputes refund (wants legal review), privacy complaint
  ├─ Escalate to: Legal Team (compliance)
  ├─ Urgency: Medium (must respond within SLA)
  ├─ Action: Freeze related actions, wait for legal guidance
  └─ Operator: Document everything, don't make precedents

SITUATION 5: Financial / Revenue Question
  ├─ Example: "Why is revenue down 30%?" "Large refund reconciliation"
  ├─ Escalate to: Finance Team (money)
  ├─ Urgency: Medium (monthly finance matters)
  ├─ Action: Finance investigates revenue trends
  └─ Operator: Provide data (queries, exports)

OPERATOR AUTONOMY:
  ├─ ✅ Can: Approve/reject reviews, process refunds, restart cron
  ├─ ✅ Can: Switch feature flags, investigate incidents, document findings
  ├─ ✅ Can: Email trainers, flag suspicious accounts
  ├─ ❌ Cannot: Modify trainer accounts, change pricing, delete data
  ├─ ❌ Cannot: Override policies (3-day refund, queue order, etc.)
  └─ ❌ Cannot: Make product decisions without approval
```

---

**Document Version:** 1.0  
**Date:** 2025-12-25  
**Status:** 🟢 Ready for Phase 1 Implementation  
**Owner:** Operations Team  
**Next Document:** 09_SECURITY_AND_PRIVACY.md (auth, encryption, compliance)

---

**End of 08_OPERATIONS_AND_HEALTH.md**
