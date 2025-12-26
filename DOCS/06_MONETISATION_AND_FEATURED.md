# 06_MONETISATION_AND_FEATURED_PLACEMENT.md – Complete Stripe Integration & Featured Promotion Workflow

**Dog Trainers Directory — Monetisation & Payment Processing Specification**

**Date:** 2025-12-25  
**Status:** 🟢 Ready for Phase 1 Implementation  
**Decisions Implemented:** D-002 (Featured $20), D-006 (Search ranking), D-011 (No SLAs), D-012 (DR)  
**Technologies:** Stripe Checkout, Vercel Cron, Postgres, webhooks

---

## Executive Summary

**One monetisation model. Phase 1 only.**

- ✅ **Featured Placement: $20 AUD, one-time, 30-day duration**
- ✅ **Max 5 featured per council** (D-002)
- ✅ **Immediate activation if slots available, FIFO queue if full**
- ✅ **Daily cron at 2am AEDT**: expiry check + queue promotion
- ✅ **3-day refund window** (no exceptions, application-enforced)
- ✅ **Zero trainer friction**: Stripe Checkout modal, email OTP auth, one-click
- ✅ **Disaster-resistant**: Immutable payment audit log, Stripe is source of truth (D-012)

**Non-goals (Phase 2+):**
- Recurring billing (Pro tier deferred)
- Credit system
- Promotional codes
- Tiered pricing
- Auction model

---

## Part 1: Complete Featured Placement Workflow

### 1.1 User Flow: Trainer Purchases Featured

```
Step 1: Trainer Dashboard
  ├─ [Promote] button visible (if profile active + not already featured)
  ├─ Button text: "Promote to Featured — $20 for 30 days"
  ├─ Button color: Primary (teal)
  └─ Button disabled: IF featured_until > NOW() (already featured)

Step 2: Trainer Clicks [Promote]
  ├─ Modal opens (Stripe Checkout embedded)
  ├─ Modal title: "Promote Your Profile"
  ├─ Modal copy: "Your profile will appear in featured results for 30 days"
  ├─ Modal CTA: [Pay $20]
  ├─ Database: INSERT featured_placement_intent (pending, stripe_session_id=null)
  └─ State: featured_placements.status = 'pending_intent'

Step 3: Stripe Checkout Session Created
  ├─ POST /api/payments/create-checkout → Stripe API
  ├─ Amount: 2000 (in cents, AUD)
  ├─ Currency: aud
  ├─ Success URL: /trainer/dashboard?success=featured
  ├─ Cancel URL: /trainer/dashboard?cancelled=featured
  ├─ Metadata: { business_id, trainer_email, council_id }
  └─ Database: UPDATE featured_placements SET stripe_session_id = session.id, status = 'checkout_started'

Step 4: Customer Pays in Stripe Checkout
  ├─ Modal redirects to Stripe-hosted checkout
  ├─ Trainer enters card (or Apple Pay, Google Pay)
  ├─ Stripe tokenizes + charges immediately
  └─ Event: charge.succeeded → Stripe webhook

Step 5: Webhook Received (charge.succeeded)
  ├─ Stripe sends POST /api/webhooks/stripe
  ├─ Signature verified: HMAC-SHA256 (Stripe key)
  ├─ Check: stripe_event_id not processed before (idempotency)
  ├─ Extract: payment_id, amount, business_id, council_id
  ├─ Database transactions:
  │  ├─ INSERT payment_audit (stripe_event_id, amount, status='succeeded', timestamp)
  │  ├─ READ featured_queue WHERE council_id=? ORDER BY created_at
  │  ├─ READ featured_placements WHERE council_id=? AND featured_until > NOW() (active count)
  │  └─ IF active_count < 5 THEN:
  │     └─ UPDATE featured_placements SET featured_until = NOW() + INTERVAL '30 days', status = 'active'
  │  ELSE:
  │     └─ UPDATE featured_placements SET status = 'queued', queue_position = (active_count + pending_count)
  ├─ Email trainer: "✅ Payment received. Featured status: [active|queued]"
  └─ Response: 200 OK (idempotent)

Step 6A (if active): Featured Slot Available
  ├─ Trainer sees on dashboard: "✅ Featured until [DATE]"
  ├─ Profile ranking jumps to #1–5 in search results
  ├─ Trainer can see featured_until countdown
  └─ Cron at 2am AEDT: featured_until will be checked daily

Step 6B (if queued): Featured Slot Full
  ├─ Trainer sees: "⏳ Queued. Position: 2/3. Next slot opens in ~15 days"
  ├─ Trainer can still search for their profile (not featured yet)
  ├─ Cron at 2am AEDT: If featured_until < NOW(), queue promotion happens
  └─ Trainer gets email: "🎉 You're now featured!"
```

---

### 1.2 Database State Machine: featured_placements

```
┌─────────────────────────────────────────────────────┐
│         Featured Placement State Machine            │
└─────────────────────────────────────────────────────┘

State: pending_intent
  Entry: Trainer clicks [Promote] button
  Action: INSERT featured_placements (status='pending_intent')
  Transition:
    ON payment_succeeded → active (if slots available) OR queued (if full)
    ON payment_failed → cancelled
    ON timeout (15 min) → cancelled

State: checkout_started
  Entry: Stripe Checkout session created
  Action: UPDATE featured_placements SET stripe_session_id = ?
  Transition:
    ON payment_succeeded → active (if slots available) OR queued (if full)
    ON payment_failed → cancelled
    ON timeout (30 min) → cancelled

State: active
  Entry: Payment succeeded + Stripe charges customer
  Action: UPDATE featured_placements SET featured_until = NOW() + INTERVAL '30 days'
  Lifetime: 30 days (Jan 1 00:00 → Jan 31 00:00 UTC)
  Transition:
    ON featured_until < NOW() → expired (via cron at 2am AEDT)
    ON refund_requested (within 3 days) → refunded
    ON business_deleted → refunded (pro-rata)

State: queued
  Entry: Payment succeeded + no slots available
  Action: INSERT featured_queue (business_id, council_id, position, created_at)
  Wait: Until active featured expires
  Transition:
    ON cron_promotion (another featured_until < NOW()) → active
    ON refund_requested → refunded

State: expired
  Entry: featured_until < NOW() (via daily cron)
  Action: UPDATE featured_placements SET status = 'expired', featured_until_was = featured_until
  Duration: Permanent (record kept for audit)
  Email: "Your featured status has expired. Want to renew?"
  Transition:
    ON trainer_purchases_again → pending_intent (new featured_placement record)

State: refunded
  Entry: Refund within 3-day window (via operator action)
  Action: Process Stripe refund API call
  Database: UPDATE featured_placements SET status = 'refunded', refunded_at = NOW()
  Email: "Your payment has been refunded."
  Transition:
    (no further transitions, record frozen)

State: cancelled
  Entry: Payment failed or timeout
  Action: DELETE featured_placements (or soft-delete)
  Email: "Payment cancelled. Please try again."
  Transition:
    ON trainer_retries → pending_intent (new featured_placement record)
```

---

## Part 2: Database Schema & Relationships

### 2.1 Core Tables

```sql
-- ═══════════════════════════════════════════════════════════════
-- TABLE: featured_placements
-- Purpose: Track featured promotion purchases (1 per business at a time)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE featured_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  council_id UUID NOT NULL REFERENCES councils(id),
  
  -- Payment & Stripe reference
  stripe_payment_id TEXT UNIQUE NOT NULL,                -- charge.id from Stripe
  stripe_session_id TEXT,                                -- checkout session
  stripe_event_id TEXT,                                  -- charge.succeeded event_id
  
  -- Lifecycle dates
  purchased_at TIMESTAMP NOT NULL DEFAULT NOW(),
  featured_until TIMESTAMP NOT NULL,                     -- Expiry: NOW() + 30 days
  refunded_at TIMESTAMP,                                 -- Non-null if refunded
  cancelled_at TIMESTAMP,                                -- Non-null if cancelled
  
  -- State & queue
  status featured_placement_status NOT NULL,             -- queued, active, expired, refunded, cancelled
  queue_position INT,                                    -- Position in queue (null if active)
  
  -- Soft delete (disaster recovery)
  deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_featured_placements_business_id ON featured_placements(business_id);
CREATE INDEX idx_featured_placements_council_id ON featured_placements(council_id);
CREATE INDEX idx_featured_placements_status ON featured_placements(status);
CREATE INDEX idx_featured_placements_featured_until ON featured_placements(featured_until);
CREATE INDEX idx_featured_placements_stripe_event_id ON featured_placements(stripe_event_id);

-- Constraint: Max 1 active featured per business (soft delete aware)
ALTER TABLE featured_placements ADD CONSTRAINT 
  chk_one_active_per_business 
  CHECK (
    NOT EXISTS (
      SELECT 1 FROM featured_placements fp2
      WHERE fp2.business_id = featured_placements.business_id
      AND fp2.status = 'active'
      AND fp2.id != featured_placements.id
      AND fp2.deleted = FALSE
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- TABLE: payment_audit
-- Purpose: Immutable Stripe webhook log (7-year retention for ATO)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE payment_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Stripe webhook details
  stripe_event_id TEXT UNIQUE NOT NULL,                  -- Idempotency key
  stripe_event_type TEXT NOT NULL,                       -- charge.succeeded, charge.refunded, etc.
  stripe_event_timestamp TIMESTAMP NOT NULL,             -- Stripe event time
  
  -- Payment details
  stripe_payment_id TEXT NOT NULL,                       -- charge.id
  stripe_customer_id TEXT,                               -- Customer ID
  amount_cents INT NOT NULL,                             -- 2000 = $20.00 AUD
  currency TEXT DEFAULT 'AUD',
  
  -- Metadata from webhook
  business_id UUID,                                      -- From metadata
  council_id UUID,
  trainer_email TEXT,
  
  -- Processing result
  status TEXT NOT NULL,                                  -- succeeded, failed, refunded, disputed
  error_message TEXT,                                    -- If failed
  processed_at TIMESTAMP DEFAULT NOW(),
  
  -- Soft delete (never delete for audit trail)
  deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_audit_stripe_event_id ON payment_audit(stripe_event_id);
CREATE INDEX idx_payment_audit_stripe_payment_id ON payment_audit(stripe_payment_id);
CREATE INDEX idx_payment_audit_business_id ON payment_audit(business_id);
CREATE INDEX idx_payment_audit_created_at ON payment_audit(created_at);
CREATE INDEX idx_payment_audit_status ON payment_audit(status);

-- Constraint: No updates (append-only)
ALTER TABLE payment_audit DISABLE TRIGGER ALL;
CREATE TRIGGER enforce_payment_audit_immutability
  BEFORE UPDATE ON payment_audit
  FOR EACH ROW EXECUTE FUNCTION raise_immutability_error();

CREATE OR REPLACE FUNCTION raise_immutability_error()
  RETURNS TRIGGER AS $$
  BEGIN
    RAISE EXCEPTION 'payment_audit is immutable. Cannot update.';
  END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- TABLE: featured_queue (FIFO management)
-- Purpose: Track waiting list for featured slots per council
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE featured_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  featured_placement_id UUID NOT NULL REFERENCES featured_placements(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  council_id UUID NOT NULL REFERENCES councils(id),
  
  -- Queue position (recalculated daily)
  queue_position INT NOT NULL,
  
  -- When did they join the queue?
  joined_queue_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- When were they promoted?
  promoted_at TIMESTAMP,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_featured_queue_council_id ON featured_queue(council_id);
CREATE INDEX idx_featured_queue_business_id ON featured_queue(business_id);
CREATE INDEX idx_featured_queue_queue_position ON featured_queue(queue_position);

-- ═══════════════════════════════════════════════════════════════
-- TABLE: featured_slots_capacity (Tracking)
-- Purpose: Monitor slot utilization per council (denormalized for speed)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE featured_slots_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  council_id UUID NOT NULL UNIQUE REFERENCES councils(id),
  
  -- Capacity (fixed at 5)
  max_slots INT DEFAULT 5 NOT NULL,
  
  -- Current utilization
  active_count INT DEFAULT 0,
  queued_count INT DEFAULT 0,
  
  -- Last check
  last_updated_at TIMESTAMP DEFAULT NOW(),
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_featured_slots_capacity_council_id ON featured_slots_capacity(council_id);
```

### 2.2 Entity Relationship Diagram (Text-Based)

```
┌──────────────────────────────────────────────────────────────┐
│           Monetisation Data Model                             │
└──────────────────────────────────────────────────────────────┘

                    businesses (trainer profiles)
                           │
                  ┌────────┴────────┐
                  ▼                  ▼
        featured_placements    emergency_contacts
              (1 active            (cache for
               per business)         emergency
                  │                 triage)
                  │
        ┌─────────┴──────────┐
        ▼                     ▼
    featured_queue      payment_audit
   (FIFO waiting)       (immutable log,
                        7-year retention,
                        Stripe source
                        of truth)


featured_slots_capacity (per council)
    ├─ council_id → councils
    ├─ max_slots = 5 (fixed)
    ├─ active_count (SUM WHERE featured_until > NOW())
    └─ queued_count (SUM FROM featured_queue)


Constraints:
  • featured_placements.status IN (queued, active, expired, refunded, cancelled)
  • Max 1 active featured per business
  • Max 5 active featured per council (enforced via cron + app logic)
  • payment_audit is immutable (append-only, ATO 7-year retention)
  • Refund window: 3 days from purchase only
  • featured_placements.featured_until is absolute expiry (TZ-aware)
```

---

## Part 3: Stripe Integration Details

### 3.1 Stripe Account Setup (Test & Production)

```
Environment: Test Mode (Phase 1) → Production (Phase 1 launch)

Test API Keys (Vercel Secrets, test environment):
  STRIPE_TEST_PUBLIC_KEY=pk_test_...(publishable)
  STRIPE_TEST_SECRET_KEY=sk_test_...(secret)
  STRIPE_TEST_WEBHOOK_SECRET=whsec_test_...(webhook)

Production API Keys (Vercel Secrets, production environment):
  STRIPE_PUBLIC_KEY=pk_live_...(publishable)
  STRIPE_SECRET_KEY=sk_live_...(secret)
  STRIPE_WEBHOOK_SECRET=whsec_live_...(webhook)

Webhook Endpoint:
  Test: https://staging.dogtrainers.local/api/webhooks/stripe
  Prod: https://dogtrainers.com.au/api/webhooks/stripe

Webhook Events to Subscribe:
  ✅ charge.succeeded
  ✅ charge.refunded
  ✅ charge.failed
  ✅ invoice.payment_failed (future: recurring)

Account Features:
  ✓ Checkout enabled
  ✓ Webhook signing enabled
  ✓ API version locked: 2024-12-15 (or current stable)
```

### 3.2 Checkout Session Creation (TypeScript)

```typescript
// File: /lib/stripe.ts

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface CreateCheckoutSessionParams {
  businessId: string;
  trainerEmail: string;
  councilId: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession({
  businessId,
  trainerEmail,
  councilId,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
  
  const session = await stripe.checkout.sessions.create({
    // Pricing
    payment_method_types: ['card'],
    mode: 'payment',
    
    line_items: [
      {
        price_data: {
          currency: 'aud',
          product_data: {
            name: 'Featured Profile Promotion',
            description: '30-day featured placement in search results',
            images: ['https://dogtrainers.com.au/logo.png'],
          },
          unit_amount: 2000, // $20.00 AUD in cents
        },
        quantity: 1,
      },
    ],
    
    // URLs
    success_url: successUrl,
    cancel_url: cancelUrl,
    
    // Metadata (recovered in webhook)
    metadata: {
      business_id: businessId,
      trainer_email: trainerEmail,
      council_id: councilId,
      feature: 'featured_placement',
      version: '1.0',
    },
    
    // Customer
    customer_email: trainerEmail,
    
    // UX
    locale: 'en-AU',
    submit_type: 'pay',
    billing_address_collection: 'auto',
    
    // Idempotency: Use business_id as key so retries don't create duplicates
    idempotency_key: `featured-${businessId}-${Date.now()}`,
  });

  return session;
}

/**
 * Webhook signature verification
 */
export function verifyWebhookSignature(
  body: string,
  sig: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(body, sig, secret);
}

/**
 * Retrieve payment by ID (for reconciliation)
 */
export async function getPaymentDetails(chargeId: string): Promise<Stripe.Charge> {
  return await stripe.charges.retrieve(chargeId);
}

/**
 * Create refund (manual operator action)
 */
export async function createRefund(
  chargeId: string,
  reason: string
): Promise<Stripe.Refund> {
  return await stripe.refunds.create({
    charge: chargeId,
    reason: 'requested_by_customer', // or 'fraud', 'duplicate'
    metadata: {
      reason,
      operator_note: 'DTD refund via 4h/week operator workflow',
    },
  });
}
```

### 3.3 API Route: Create Checkout Session

```typescript
// File: /app/api/payments/create-checkout/route.ts

import { createCheckoutSession } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { businessId, councilId } = await req.json();
    
    // Validate
    if (!businessId || !councilId) {
      return Response.json(
        { error: 'Missing businessId or councilId' },
        { status: 400 }
      );
    }

    // Get trainer email from Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('user_id')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      return Response.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', business.user_id)
      .single();

    if (userError || !user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      businessId,
      trainerEmail: user.email,
      councilId,
      successUrl: `${process.env.NEXT_PUBLIC_DOMAIN}/trainer/dashboard?success=featured`,
      cancelUrl: `${process.env.NEXT_PUBLIC_DOMAIN}/trainer/dashboard?cancelled=featured`,
    });

    // Insert pending featured_placement record
    await supabase.from('featured_placements').insert({
      business_id: businessId,
      council_id: councilId,
      stripe_session_id: session.id,
      stripe_payment_id: '', // Will be filled by webhook
      status: 'checkout_started',
      featured_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return Response.json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Checkout creation error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### 3.4 Webhook Signature Verification & Handler

```typescript
// File: /app/api/webhooks/stripe/route.ts

import { verifyWebhookSignature } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side only
);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get('stripe-signature');

  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  let event;
  try {
    event = verifyWebhookSignature(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // ═══════════════════════════════════════════════════════════════
  // Event Handler: charge.succeeded
  // ═══════════════════════════════════════════════════════════════
  if (event.type === 'charge.succeeded') {
    const charge = event.data.object as any;

    // Step 1: Check idempotency (prevent double-processing)
    const { data: existingAudit } = await supabase
      .from('payment_audit')
      .select('id')
      .eq('stripe_event_id', event.id)
      .single();

    if (existingAudit) {
      console.log(`Idempotent: Event ${event.id} already processed`);
      return new Response('Idempotent success', { status: 200 });
    }

    // Step 2: Extract metadata
    const { business_id, council_id, trainer_email } = charge.metadata;

    // Step 3: Insert immutable payment_audit record
    await supabase.from('payment_audit').insert({
      stripe_event_id: event.id,
      stripe_event_type: 'charge.succeeded',
      stripe_event_timestamp: new Date(event.created * 1000),
      stripe_payment_id: charge.id,
      stripe_customer_id: charge.customer,
      amount_cents: charge.amount,
      currency: charge.currency.toUpperCase(),
      business_id,
      council_id,
      trainer_email,
      status: 'succeeded',
    });

    // Step 4: Check featured slot availability for council
    const { data: activeCount } = await supabase.rpc('get_active_featured_count', {
      p_council_id: council_id,
    });

    const slotsAvailable = (activeCount || 0) < 5;

    // Step 5: Update featured_placements based on availability
    const now = new Date();
    const featuredUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (slotsAvailable) {
      // Active immediately
      await supabase
        .from('featured_placements')
        .update({
          stripe_payment_id: charge.id,
          stripe_event_id: event.id,
          status: 'active',
          featured_until: featuredUntil.toISOString(),
        })
        .eq('stripe_session_id', charge.metadata.session_id || '')
        .is('deleted', false);

      // Update capacity tracker
      await supabase.rpc('update_featured_slots_capacity', {
        p_council_id: council_id,
      });

      // Send email: Featured Active
      await sendEmail({
        to: trainer_email,
        subject: '✅ Your Profile is Now Featured!',
        template: 'featured_active',
        data: { featured_until: featuredUntil, council_id },
      });
    } else {
      // Queue
      const { data: queuePosition } = await supabase.rpc(
        'get_next_queue_position',
        { p_council_id: council_id }
      );

      await supabase
        .from('featured_placements')
        .update({
          stripe_payment_id: charge.id,
          stripe_event_id: event.id,
          status: 'queued',
          queue_position: queuePosition || 1,
        })
        .eq('stripe_session_id', charge.metadata.session_id || '')
        .is('deleted', false);

      // Insert queue record
      await supabase.from('featured_queue').insert({
        featured_placement_id: charge.metadata.featured_placement_id,
        business_id,
        council_id,
        queue_position: queuePosition || 1,
      });

      // Send email: Queued
      await sendEmail({
        to: trainer_email,
        subject: '⏳ Your Profile is Queued for Featured',
        template: 'featured_queued',
        data: { queue_position: queuePosition, council_id },
      });
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  // ═══════════════════════════════════════════════════════════════
  // Event Handler: charge.refunded
  // ═══════════════════════════════════════════════════════════════
  if (event.type === 'charge.refunded') {
    const charge = event.data.object as any;

    // Check idempotency
    const { data: existingAudit } = await supabase
      .from('payment_audit')
      .select('id')
      .eq('stripe_event_id', event.id)
      .single();

    if (existingAudit) {
      console.log(`Idempotent: Refund event ${event.id} already processed`);
      return new Response('Idempotent success', { status: 200 });
    }

    // Insert refund audit record
    await supabase.from('payment_audit').insert({
      stripe_event_id: event.id,
      stripe_event_type: 'charge.refunded',
      stripe_event_timestamp: new Date(event.created * 1000),
      stripe_payment_id: charge.id,
      amount_cents: charge.amount_refunded,
      status: 'refunded',
    });

    // Update featured_placements
    const { data: featured } = await supabase
      .from('featured_placements')
      .select('id, business_id, council_id')
      .eq('stripe_payment_id', charge.id)
      .single();

    if (featured) {
      await supabase
        .from('featured_placements')
        .update({
          status: 'refunded',
          refunded_at: new Date().toISOString(),
        })
        .eq('id', featured.id);

      // Send email: Refund processed
      const { data: trainer } = await supabase
        .from('businesses')
        .select('user_id')
        .eq('id', featured.business_id)
        .single();

      if (trainer) {
        const { data: user } = await supabase
          .from('users')
          .select('email')
          .eq('id', trainer.user_id)
          .single();

        if (user) {
          await sendEmail({
            to: user.email,
            subject: '💰 Your Refund Has Been Processed',
            template: 'refund_processed',
          });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  // Unknown event type
  console.log(`Unhandled event type: ${event.type}`);
  return new Response(JSON.stringify({ received: true }), { status: 200 });
}

/**
 * Placeholder email function (integrate with SendGrid, Resend, etc.)
 */
async function sendEmail({
  to,
  subject,
  template,
  data,
}: {
  to: string;
  subject: string;
  template: string;
  data?: any;
}) {
  // TODO: Implement with SendGrid or Resend
  console.log(`Email to ${to}: ${subject}`);
}
```

### 3.5 Curl Examples (Testing)

```bash
# Test 1: Create Checkout Session (local dev)
curl -X POST http://localhost:3000/api/payments/create-checkout \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "550e8400-e29b-41d4-a716-446655440000",
    "councilId": "550e8400-e29b-41d4-a716-446655440001"
  }'

# Expected response:
# { "sessionId": "cs_test_..." }

# Test 2: Simulate Stripe Webhook (using stripe CLI in dev)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal:
stripe trigger charge.succeeded

# Test 3: Manual Refund (via Stripe Dashboard or API)
curl https://api.stripe.com/v1/refunds \
  -u sk_test_...: \
  -d charge=ch_1234567890 \
  -d reason=requested_by_customer
```

---

## Part 4: Cron Job Implementation (Daily 2am AEDT)

### 4.1 Cron Timing & UTC Conversion

```
AEDT (Australian Eastern Daylight Time) = UTC+11
2am AEDT = 3pm UTC (previous day)

Vercel Cron Syntax:
  "45 15 * * *"  (45 minutes past 15:00 UTC = 2:45am AEDT)
  
Alternative (more precise):
  "0 15 * * *"   (exactly 3pm UTC = 2am AEDT)
  
Configuration in vercel.json:
  {
    "crons": [
      {
        "path": "/api/cron/featured-expiry-and-promotion",
        "schedule": "0 15 * * *"
      }
    ]
  }
```

### 4.2 Cron Job: Expiry Check & Queue Promotion

```typescript
// File: /app/api/cron/featured-expiry-and-promotion/route.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  // Verify cron secret (Vercel provides X-Vercel-Cron header)
  const cronSecret = req.headers.get('x-vercel-cron') || '';
  if (cronSecret !== process.env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const startTime = Date.now();
  const log = {
    timestamp: new Date().toISOString(),
    step: '',
    expiredCount: 0,
    promotedCount: 0,
    errors: [] as string[],
  };

  try {
    // ═══════════════════════════════════════════════════════════════
    // Step 1: Find & expire featured placements past their featured_until
    // ═══════════════════════════════════════════════════════════════
    log.step = 'expiry_check';
    
    const now = new Date().toISOString();
    const { data: expiredPlacements, error: expireError } = await supabase
      .from('featured_placements')
      .select('id, business_id, council_id')
      .eq('status', 'active')
      .lt('featured_until', now)
      .is('deleted', false);

    if (expireError) {
      throw new Error(`Failed to query expired placements: ${expireError.message}`);
    }

    if (expiredPlacements && expiredPlacements.length > 0) {
      log.expiredCount = expiredPlacements.length;

      // Update each to expired
      for (const placement of expiredPlacements) {
        const { error: updateError } = await supabase
          .from('featured_placements')
          .update({ status: 'expired' })
          .eq('id', placement.id);

        if (updateError) {
          log.errors.push(
            `Failed to expire placement ${placement.id}: ${updateError.message}`
          );
        } else {
          // Send notification email to trainer
          await notifyTrainerFeaturedExpired(placement.business_id);
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // Step 2: Promote queued placements to active (per council)
    // ═══════════════════════════════════════════════════════════════
    log.step = 'queue_promotion';

    // Get all councils
    const { data: councils, error: councilsError } = await supabase
      .from('councils')
      .select('id');

    if (councilsError) {
      throw new Error(`Failed to query councils: ${councilsError.message}`);
    }

    for (const council of councils || []) {
      try {
        // Count active featured (not expired)
        const { data: activeCount, error: countError } = await supabase
          .rpc('get_active_featured_count', { p_council_id: council.id });

        if (countError) {
          log.errors.push(
            `Failed to count active featured in ${council.id}: ${countError.message}`
          );
          continue;
        }

        const availableSlots = Math.max(0, 5 - (activeCount || 0));

        if (availableSlots > 0) {
          // Get next N queued placements
          const { data: queuedPlacements, error: queueError } = await supabase
            .from('featured_placements')
            .select('id, business_id')
            .eq('council_id', council.id)
            .eq('status', 'queued')
            .order('created_at', { ascending: true })
            .limit(availableSlots);

          if (queueError) {
            log.errors.push(
              `Failed to query queued placements in ${council.id}: ${queueError.message}`
            );
            continue;
          }

          // Promote each
          for (const placement of queuedPlacements || []) {
            const newFeaturedUntil = new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString();

            const { error: promoteError } = await supabase
              .from('featured_placements')
              .update({
                status: 'active',
                featured_until: newFeaturedUntil,
                queue_position: null,
              })
              .eq('id', placement.id);

            if (promoteError) {
              log.errors.push(
                `Failed to promote ${placement.id}: ${promoteError.message}`
              );
            } else {
              log.promotedCount++;

              // Delete from featured_queue
              await supabase
                .from('featured_queue')
                .delete()
                .eq('featured_placement_id', placement.id);

              // Send notification email
              await notifyTrainerFeaturedActive(placement.business_id, newFeaturedUntil);
            }
          }
        }
      } catch (err: any) {
        log.errors.push(`Council ${council.id} processing error: ${err.message}`);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // Step 3: Update featured_slots_capacity (denormalized tracking)
    // ═══════════════════════════════════════════════════════════════
    log.step = 'capacity_update';

    const { error: capacityError } = await supabase.rpc(
      'update_all_featured_slots_capacity'
    );

    if (capacityError) {
      log.errors.push(`Capacity update failed: ${capacityError.message}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // Step 4: Log cron execution (append-only for audit)
    // ═══════════════════════════════════════════════════════════════
    log.step = 'logging';

    await supabase.from('cron_jobs').insert({
      job_name: 'featured_expiry_and_promotion',
      status: log.errors.length === 0 ? 'success' : 'partial_failure',
      records_processed: log.expiredCount + log.promotedCount,
      execution_time_ms: Date.now() - startTime,
      error_details: log.errors.length > 0 ? log.errors.join('; ') : null,
      executed_at: new Date().toISOString(),
    });

    // ═══════════════════════════════════════════════════════════════
    // Return result
    // ═══════════════════════════════════════════════════════════════
    return new Response(
      JSON.stringify({
        success: true,
        message: `Cron complete: ${log.expiredCount} expired, ${log.promotedCount} promoted`,
        log,
      }),
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Cron job failed:', error);

    // Log failure
    await supabase.from('cron_jobs').insert({
      job_name: 'featured_expiry_and_promotion',
      status: 'failure',
      error_details: error.message,
      executed_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        log,
      }),
      { status: 500 }
    );
  }
}

/**
 * Notify trainer that featured has expired
 */
async function notifyTrainerFeaturedExpired(businessId: string) {
  try {
    const { data: business } = await supabase
      .from('businesses')
      .select('user_id, name')
      .eq('id', businessId)
      .single();

    if (business) {
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', business.user_id)
        .single();

      if (user) {
        // TODO: Send email via SendGrid/Resend
        console.log(
          `Featured expired notification: ${user.email} (${business.name})`
        );
      }
    }
  } catch (err) {
    console.error('Failed to notify trainer:', err);
  }
}

/**
 * Notify trainer that featured is now active
 */
async function notifyTrainerFeaturedActive(businessId: string, featuredUntil: string) {
  try {
    const { data: business } = await supabase
      .from('businesses')
      .select('user_id, name')
      .eq('id', businessId)
      .single();

    if (business) {
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', business.user_id)
        .single();

      if (user) {
        // TODO: Send email via SendGrid/Resend
        console.log(
          `Featured active notification: ${user.email} (${business.name}) until ${featuredUntil}`
        );
      }
    }
  } catch (err) {
    console.error('Failed to notify trainer:', err);
  }
}
```

### 4.3 SQL RPC Functions (Supabase)

```sql
-- ═══════════════════════════════════════════════════════════════
-- RPC Function: get_active_featured_count (per council)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_active_featured_count(p_council_id UUID)
RETURNS INT AS $$
DECLARE
  count INT;
BEGIN
  SELECT COUNT(*)
  INTO count
  FROM featured_placements
  WHERE council_id = p_council_id
    AND status = 'active'
    AND featured_until > NOW()
    AND deleted = FALSE;
  
  RETURN count;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- RPC Function: get_next_queue_position (per council)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_next_queue_position(p_council_id UUID)
RETURNS INT AS $$
DECLARE
  next_pos INT;
BEGIN
  SELECT COALESCE(MAX(queue_position), 0) + 1
  INTO next_pos
  FROM featured_placements
  WHERE council_id = p_council_id
    AND status = 'queued'
    AND deleted = FALSE;
  
  RETURN next_pos;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- RPC Function: update_featured_slots_capacity (single council)
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_featured_slots_capacity(p_council_id UUID)
RETURNS void AS $$
DECLARE
  active_count INT;
  queued_count INT;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM featured_placements
  WHERE council_id = p_council_id
    AND status = 'active'
    AND featured_until > NOW()
    AND deleted = FALSE;
  
  SELECT COUNT(*) INTO queued_count
  FROM featured_placements
  WHERE council_id = p_council_id
    AND status = 'queued'
    AND deleted = FALSE;
  
  INSERT INTO featured_slots_capacity (council_id, active_count, queued_count)
  VALUES (p_council_id, active_count, queued_count)
  ON CONFLICT (council_id) DO UPDATE
  SET active_count = active_count, queued_count = queued_count;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- RPC Function: update_all_featured_slots_capacity
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_all_featured_slots_capacity()
RETURNS void AS $$
BEGIN
  WITH council_counts AS (
    SELECT
      council_id,
      COUNT(CASE WHEN status = 'active' AND featured_until > NOW() THEN 1 END) as active,
      COUNT(CASE WHEN status = 'queued' THEN 1 END) as queued
    FROM featured_placements
    WHERE deleted = FALSE
    GROUP BY council_id
  )
  INSERT INTO featured_slots_capacity (council_id, active_count, queued_count)
  SELECT council_id, active, queued FROM council_counts
  ON CONFLICT (council_id) DO UPDATE
  SET active_count = EXCLUDED.active_count,
      queued_count = EXCLUDED.queued_count;
END;
$$ LANGUAGE plpgsql;
```

### 4.4 Cron Job Failure Handling

```typescript
// File: /app/api/cron/featured-expiry-and-promotion/error-handler.ts

/**
 * Cron failure scenario: If Vercel cron fails to execute
 * (e.g., network timeout, Supabase down >1 hour)
 * 
 * Vercel will retry automatically:
 * - Attempt 1: immediately
 * - Attempt 2: +5 minutes
 * - Attempt 3: +10 minutes
 * - Attempt 4: +30 minutes
 * - Attempt 5: +1 hour (then stops)
 * 
 * If all retries fail, Vercel sends webhook to configured URL.
 */

export async function handleCronFailure(failureContext: {
  jobName: string;
  attempt: number;
  error: string;
  timestamp: string;
}) {
  // Log to monitoring system
  console.error(`Cron failure: ${failureContext.jobName}`, failureContext);

  // Send Slack alert (high priority, escalates after 3 attempts)
  if (failureContext.attempt >= 3) {
    await sendSlackAlert({
      channel: '#alerts',
      severity: 'critical',
      message: `⚠️ Featured promotion cron FAILED (attempt ${failureContext.attempt}/5)`,
      details: failureContext,
    });
  }

  // After final failure (attempt 5), trigger manual operator check
  if (failureContext.attempt === 5) {
    await createOperatorTask({
      priority: 'high',
      title: 'CRON FAILURE: Featured expiry & promotion failed',
      description:
        'Cron job failed 5 times. Expiries may be delayed, queue may not promote. Manual intervention needed.',
      estimatedMinutes: 15,
    });
  }
}
```

---

## Part 5: Financial Scenarios (Complete Workflows)

### 5.1 Scenario 1: Payment Succeeds, Slots Available

```
Timeline:
  T+0s:   Trainer clicks [Promote], Stripe Checkout modal opens
  T+60s:  Trainer enters card details
  T+120s: Trainer clicks [Pay], Stripe charges card
  T+180s: charge.succeeded webhook received
  T+200s: Featured activated, trainer redirected to /trainer/dashboard?success=featured

Database State Changes:
  featured_placements:
    - status: pending_intent → checkout_started → active
    - featured_until: NOW() + 30 days
    - queue_position: null
  
  payment_audit:
    - INSERT: stripe_event_id, status='succeeded', amount=2000
  
  featured_slots_capacity:
    - active_count: 2 → 3
    - queued_count: 0 (unchanged)

Trainer Experience:
  ✅ "Your profile is now featured for 30 days. Expires on [DATE]."
  ✅ Profile jumps to #1–5 in search results
  ✅ Email: "✅ Featured Profile Activated"

Query Impact:
  - Featured results appear immediately in next search
  - Search ranking query includes: WHERE featured_until > NOW()
  - 30-day countdown visible on trainer dashboard
```

### 5.2 Scenario 2: Payment Succeeds, Slots Full

```
Timeline:
  T+0s:   Trainer clicks [Promote]
  T+120s: Trainer enters card, clicks [Pay]
  T+180s: charge.succeeded webhook received
           Check: active_count = 5 (slots full)
  T+200s: Featured added to queue, trainer redirected

Database State Changes:
  featured_placements:
    - status: pending_intent → checkout_started → queued
    - featured_until: null (will be set when promoted)
    - queue_position: 2
  
  featured_queue:
    - INSERT: queue_position=2, joined_queue_at=NOW()
  
  payment_audit:
    - INSERT: status='succeeded'
  
  featured_slots_capacity:
    - active_count: 5 (unchanged)
    - queued_count: 1 → 2

Trainer Experience:
  ⏳ "You're queued for featured. Position: 2/3. Next slot opens in ~15 days."
  📧 Email: "⏳ You're Queued for Featured"
  📊 Dashboard shows queue position + estimated date
  
  Waits 7–30 days → Cron promotes when slot available → 🎉 Featured Active

Cron Promotion (T+14 days at 2am AEDT):
  - Check: Council has active featured expiring in 6 hours
  - Pull: Next queued placement
  - UPDATE featured_placements: status=active, featured_until=NOW()+30d
  - Email: "🎉 You're now featured!"
```

### 5.3 Scenario 3: Payment Fails

```
Timeline:
  T+120s: Trainer enters invalid card / card declined
  T+180s: charge.failed webhook received
  T+200s: Trainer redirected to /trainer/dashboard?cancelled=featured

Database State Changes:
  featured_placements:
    - status: pending_intent → checkout_started → cancelled
    - featured_until: null
  
  payment_audit:
    - INSERT: status='failed', error_message='card_declined'

Trainer Experience:
  ❌ "Payment failed. Please try again with a different card."
  📧 Email: "❌ Payment Failed"
  🔄 [Retry] button available to try again

Retry Path:
  - Trainer clicks [Retry]
  - New Stripe Checkout session created (NEW idempotency key)
  - NEW featured_placements record (don't reuse cancelled one)
  - Payment succeeds → Featured activated
```

### 5.4 Scenario 4: Refund Requested (Day 2)

```
Timeline:
  Day 1: Payment succeeds, featured activated
  Day 2: Trainer decides to refund
         ✅ Within 3-day window (allowed)
  T+0s:  Trainer clicks [Request Refund] in dashboard
  T+10s: Form submitted: "I'd like a refund" → reason captured
  T+60s: Operator reviews (weekly batch work)
  T+3600s: Operator clicks [Process Refund] → API call to Stripe

Stripe Refund API Call:
  POST /v1/refunds
  charge: ch_1234567890
  reason: requested_by_customer
  metadata: { operator_note: "DTD manual refund" }

Stripe Response:
  - refund.succeeded webhook sent
  - Refund processed (2–5 business days to card)

Database State Changes:
  featured_placements:
    - status: active → refunded
    - refunded_at: NOW()
    - featured_until: null
  
  payment_audit:
    - INSERT: stripe_event_id=(unique), status='refunded'

Trainer Experience:
  ✅ "Your refund has been approved. $20 will be returned to your card in 3–5 days."
  📧 Email: "💰 Refund Processed"
  
  Profile de-featured immediately:
  - Search ranking reverts (no longer featured)
  - Dashboard: "✅ Refunded. You're no longer featured."

Operator Experience:
  - Refund request logged in admin queue
  - Batch approved during weekly 4h session
  - API call to Stripe (via web UI or CLI)
  - System confirms status change
```

### 5.5 Scenario 5: Featured Expires (Day 31)

```
Timeline:
  Day 0: Payment processed, featured_until = Day 30 23:59 UTC
  Day 30 @ 3pm UTC (2am AEDT+1): Cron job runs
    - Check: featured_until < NOW()? Yes
    - UPDATE: status='active' → 'expired'
  
  Day 30 @ 3:05pm UTC: Trainer notified

Database State Changes:
  featured_placements:
    - status: active → expired
    - featured_until: [immutable, stays as Day 30 23:59 UTC]
  
  cron_jobs:
    - INSERT: job_name='featured_expiry_and_promotion', status='success', records_processed=1

Trainer Experience:
  📧 Email: "⏰ Your Featured Status Has Expired"
  📝 Email body:
     "Your profile was featured from [Date A] to [Date B].
      Featured helped you stand out in search results.
      
      Want to feature again? [Promote Button]"
  
  Dashboard:
    - "Featured until: EXPIRED (1 day ago)"
    - [Promote Again] button available
  
  Search Results:
    - Profile ranking reverts to normal (not featured)
    - Drops from #1–5 to ranked by: verified → distance → rating

Post-Expiry Options:
  ✅ Trainer can purchase again immediately ($20)
  ✅ If queue exists, trainer goes to end of queue
```

### 5.6 Scenario 6: Trainer Deletes Listing While Featured

```
Timeline:
  Day 0: Trainer has active featured (featured_until = Day 30)
  Day 15: Trainer deletes profile (hard delete or soft delete?)
  
  Question: Should they get refunded?
  Answer: Phase 1 = NO REFUND (by design)
  
  Reasoning:
  - One-time purchase, non-transferable
  - Trainer had benefit for 15/30 days
  - Reduces refund processing complexity
  - Phase 2+: Implement pro-rata refunds if needed

Implementation (Hard Delete):
  featured_placements:
    - DELETE featured_placements WHERE business_id = ?
    - Cascades: featured_queue records also deleted
  
  payment_audit:
    - REMAINS (never deleted, 7-year retention)
  
  Trainer Experience:
    ✅ Profile deleted successfully
    ❌ "Note: Your $20 featured purchase is non-refundable once applied."
    📧 No additional email (just profile deletion confirmation)

Implementation (Soft Delete):
  If Phase 2 implements business soft-delete:
    businesses:
      - deleted = TRUE
      - deleted_at = NOW()
    
    featured_placements:
      - Exclude from ranking queries (WHERE businesses.deleted = FALSE)
      - Stays in database for audit trail
    
    payment_audit:
      - REMAINS unchanged
```

---

## Part 6: Tax & Compliance

### 6.1 Australian Tax Office (ATO) & 7-Year Records

```
Requirement: Keep all payment records for 7 years (ATO B&BT guidance)

Compliance in DTD:
  ✅ payment_audit: immutable, append-only, never deleted
  ✅ Soft deletes in featured_placements: deleted_at preserved
  ✅ Stripe holds records independently (PCI-DSS compliant)
  
Audit Trail:
  - What: Payment date, amount, payment method (last 4 digits only)
  - Who: Trainer email, business name, ABN (Phase 2)
  - When: Timestamp in UTC (auditable)
  - Why: Product = "Featured Profile Promotion"
  - Result: Success/failure/refunded

7-Year Retention Policy:
  - Don't delete payment_audit (ever)
  - Archive to cold storage after 5 years (optional, cost saving)
  - Query plan: SELECT * FROM payment_audit WHERE created_at > NOW() - INTERVAL '7 years'
```

### 6.2 Trainer ABN Handling

```
Phase 1: ABN OPTIONAL (not collected)
  - Featured works without ABN
  - Trainer doesn't need to provide
  - No PAYG withholding (Phase 1)

Phase 2: ABN REQUIRED for Featured
  - Trainer must provide valid ABN before purchasing featured
  - ABN validated via ATO lookup (future integration)
  - Stored in businesses.abn column (11 digits, CHECK constraint)

Example Constraint:
  ALTER TABLE businesses ADD CONSTRAINT chk_abn_format
  CHECK (abn IS NULL OR LENGTH(abn) = 11 AND abn ~ '^\d{11}$');

What ABN is Used For (Phase 2+):
  - Tax invoice generation (if trainer is ABN-registered)
  - PAYG withholding (if trainer is contractor)
  - GST calculation (if trainer is GST-registered)
  - ATO matching (information exchange)

For Phase 1:
  - No ABN column yet
  - No tax invoices generated
  - No withholding
  - Payment record alone is sufficient for ATO
```

### 6.3 PAYG Withholding (Not Applicable Phase 1)

```
Scenario: Is DTD legally required to withhold PAYG tax?

Analysis:
  ✅ Trainer is independent contractor (not employee)
  ✅ Trainer provides service (dog training), DTD provides platform
  ✅ DTD doesn't control how/when/where trainer works
  ❌ PAYG withholding NOT required (Phase 1)

When Withholding Becomes Relevant (Phase 2+):
  - If DTD pays trainers a commission (DTD takes revenue share)
  - Then PAYG withholding applies (ATO Form HELP)
  - For now: Trainer owns revenue, DTD doesn't withhold

Tax Treatment (Phase 1):
  - Trainer buys featured: $20 + GST = $22 AUD (if GST applies)
  - DTD records gross amount in payment_audit
  - DTD includes in BAS (Business Activity Statement)
  - Trainer reports in tax return (if above $20k turnover threshold)
```

### 6.4 GST Treatment (Goods & Services Tax)

```
Question: Is $20 featured placement subject to 10% GST?

Analysis:
  Digital service: Featured profile placement
  GST-registered business: DTD (presumed)
  
Answer: YES, GST applies if:
  ✅ DTD is GST-registered (turnover >$75k)
  ✅ Featured placement is taxable supply (not exempt)
  ✅ Service provided in Australia (yes)

GST Calculation:
  Price (GST excl): $20.00 AUD
  GST (10%):       $2.00 AUD
  Price (GST incl): $22.00 AUD ← What Stripe charges

Implementation in Stripe:
  line_items[0].price_data.unit_amount: 2200 (in cents = $22 AUD)
  tax_code: 'txc_au_gst' (Stripe handles AU GST)

payment_audit Recording:
  amount_cents: 2200 (full amount including GST)
  metadata: { amount_excl_gst: 2000, gst: 200 }

BAS Reporting (DTD Accountant):
  GST on sales: $2 × N payments = $X
  Included in quarterly BAS submission to ATO

Trainer Perspective:
  - Trainer sees: "Featured: $22 AUD" (GST included)
  - Trainer's receipt shows GST separately
  - If trainer is GST-registered, they claim credit
```

### 6.5 Stripe's Role in Tax Compliance

```
Stripe as DTD's Payment Processor:

What Stripe Handles:
  ✅ PCI-DSS compliance (card security)
  ✅ Payment tokenization (DTD never sees full card)
  ✅ Fraud detection (chargeback protection)
  ✅ Webhook delivery (reliable event notification)
  ✅ Refund processing (credit card networks)
  ✅ Dispute resolution (chargeback handling)

What Stripe Does NOT Handle:
  ❌ Tax invoice generation (DTD's responsibility)
  ❌ ATO reporting (DTD accountant's job)
  ❌ GST compliance (DTD's responsibility)
  ❌ PAYG withholding (DTD's responsibility)

Stripe Reporting Features (Available):
  - Payment reconciliation (Stripe Dashboard API)
  - Tax reporting (Stripe Tax API, optional)
  - Invoice generation (Stripe Invoicing, optional)

DTD's Tax Obligations:
  1. Register for GST (if >$75k turnover)
  2. Report GST in BAS (quarterly)
  3. Keep payment records 7 years (✅ payment_audit)
  4. Provide tax invoices to trainers (optional, Phase 2)
  5. File ABN with ATO (already done)
```

---

## Part 7: Metrics & Monitoring

### 7.1 Revenue Tracking

```sql
-- Total Revenue (all time)
SELECT
  SUM(amount_cents) / 100.0 as total_aud,
  COUNT(*) as transaction_count,
  COUNT(DISTINCT business_id) as unique_trainers
FROM payment_audit
WHERE status IN ('succeeded', 'refunded')
  AND created_at > NOW() - INTERVAL '30 days';

-- Monthly Revenue (last 12 months)
SELECT
  DATE_TRUNC('month', created_at) as month,
  SUM(CASE WHEN status = 'succeeded' THEN amount_cents ELSE 0 END) / 100.0 as revenue_aud,
  COUNT(*) as transaction_count
FROM payment_audit
WHERE status IN ('succeeded')
  AND created_at > NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Revenue by Council
SELECT
  c.name as council,
  SUM(pa.amount_cents) / 100.0 as revenue_aud,
  COUNT(DISTINCT pa.business_id) as trainer_count
FROM payment_audit pa
JOIN councils c ON pa.council_id = c.id
WHERE pa.status = 'succeeded'
  AND pa.created_at > NOW() - INTERVAL '30 days'
GROUP BY c.name
ORDER BY revenue_aud DESC;

-- Average Revenue per Trainer
SELECT
  AVG(revenue_per_trainer) as avg_aud,
  COUNT(*) as trainer_count
FROM (
  SELECT
    business_id,
    SUM(amount_cents) / 100.0 as revenue_per_trainer
  FROM payment_audit
  WHERE status = 'succeeded'
  GROUP BY business_id
) sub;
```

### 7.2 Featured Adoption Rate

```sql
-- Current Featured Rate (percentage of trainers with active featured)
SELECT
  ROUND(
    100.0 * 
    (SELECT COUNT(DISTINCT business_id) 
     FROM featured_placements 
     WHERE status = 'active' AND featured_until > NOW()) 
    / 
    (SELECT COUNT(*) FROM businesses WHERE status = 'active'),
    2
  ) as featured_adoption_percent;

-- Featured by Council
SELECT
  c.name as council,
  COUNT(fp.id) as featured_count,
  COUNT(b.id) as total_trainers,
  ROUND(100.0 * COUNT(fp.id) / COUNT(b.id), 2) as adoption_percent
FROM councils c
LEFT JOIN businesses b ON b.council_id = c.id AND b.status = 'active'
LEFT JOIN featured_placements fp ON fp.business_id = b.id 
  AND fp.status = 'active' 
  AND fp.featured_until > NOW()
GROUP BY c.id, c.name
ORDER BY adoption_percent DESC;

-- Featured Engagement (how many views per featured profile)
SELECT
  fp.business_id,
  b.name as trainer_name,
  COUNT(sv.id) as search_view_count,
  ROUND(COUNT(sv.id) / 30.0, 2) as views_per_day
FROM featured_placements fp
JOIN businesses b ON fp.business_id = b.id
LEFT JOIN search_views sv ON sv.business_id = b.id
  AND sv.viewed_at > fp.featured_until - INTERVAL '30 days'
WHERE fp.status = 'active'
  AND fp.featured_until > NOW()
GROUP BY fp.business_id, b.name
ORDER BY search_view_count DESC;
```

### 7.3 Queue Backlog Monitoring

```sql
-- Current Queue Status (per council)
SELECT
  c.name as council,
  COUNT(CASE WHEN fp.status = 'active' THEN 1 END) as active_featured,
  COUNT(CASE WHEN fp.status = 'queued' THEN 1 END) as queued_count,
  MIN(CASE 
        WHEN fp.status = 'active' THEN fp.featured_until 
      END) as next_expiry,
  EXTRACT(DAY FROM MIN(CASE 
        WHEN fp.status = 'active' THEN fp.featured_until 
      END) - NOW())::INT as days_until_slot
FROM councils c
LEFT JOIN featured_placements fp ON fp.council_id = c.id AND fp.deleted = FALSE
GROUP BY c.id, c.name
ORDER BY queued_count DESC;

-- Queue Wait Time Estimation
SELECT
  fp.council_id,
  fp.queue_position,
  COUNT(fp2.id) as expiring_in_next_30_days,
  ROUND(30.0 / COUNT(fp2.id), 1) as estimated_wait_days
FROM featured_placements fp
LEFT JOIN featured_placements fp2 ON fp2.council_id = fp.council_id
  AND fp2.status = 'active'
  AND fp2.featured_until < NOW() + INTERVAL '30 days'
WHERE fp.status = 'queued'
GROUP BY fp.council_id, fp.queue_position
ORDER BY estimated_wait_days DESC;

-- Alert: Long Queue
SELECT
  c.name as council,
  COUNT(fp.id) as queued_count
FROM councils c
JOIN featured_placements fp ON fp.council_id = c.id AND fp.status = 'queued'
GROUP BY c.id, c.name
HAVING COUNT(fp.id) > 5
ORDER BY queued_count DESC;
```

### 7.4 Refund Rate & Patterns

```sql
-- Refund Rate (percentage of payments refunded)
SELECT
  ROUND(
    100.0 *
    (SELECT COUNT(*) FROM payment_audit WHERE status = 'refunded')
    /
    (SELECT COUNT(*) FROM payment_audit WHERE status IN ('succeeded', 'refunded')),
    2
  ) as refund_rate_percent;

-- Refunds by Time Since Purchase
SELECT
  EXTRACT(DAY FROM refunded_at - purchased_at)::INT as days_to_refund,
  COUNT(*) as refund_count
FROM featured_placements
WHERE status = 'refunded'
GROUP BY EXTRACT(DAY FROM refunded_at - purchased_at)
ORDER BY days_to_refund ASC;

-- Trainers with Multiple Refunds (suspicious pattern)
SELECT
  b.id,
  b.name as trainer_name,
  COUNT(fp.id) as total_refunds,
  MAX(fp.refunded_at) as last_refund
FROM featured_placements fp
JOIN businesses b ON fp.business_id = b.id
WHERE fp.status = 'refunded'
GROUP BY b.id, b.name
HAVING COUNT(fp.id) > 2
ORDER BY COUNT(fp.id) DESC;

-- Alert: Refund Rate Too High
SELECT
  CASE
    WHEN refund_percent > 15 THEN 'Alert: Refund rate >15% (investigate)'
    WHEN refund_percent > 5 THEN 'Warning: Refund rate >5% (monitor)'
    ELSE 'OK: Refund rate normal'
  END as status,
  refund_percent
FROM (
  SELECT
    ROUND(
      100.0 *
      (SELECT COUNT(*) FROM payment_audit WHERE status = 'refunded')
      /
      (SELECT COUNT(*) FROM payment_audit WHERE status IN ('succeeded', 'refunded')),
      2
    ) as refund_percent
) sub;
```

### 7.5 Price Elasticity & Dynamic Pricing Analysis

```sql
-- Demand Signals: When Queue Gets Long, Maybe Price is Too Low?

SELECT
  EXTRACT(MONTH FROM created_at) as month,
  EXTRACT(YEAR FROM created_at) as year,
  COUNT(*) as purchase_count,
  COUNT(CASE WHEN status = 'queued' THEN 1 END) as queued_count,
  ROUND(
    100.0 * COUNT(CASE WHEN status = 'queued' THEN 1 END) 
    / COUNT(*),
    2
  ) as queue_rate_percent
FROM featured_placements
WHERE created_at > NOW() - INTERVAL '6 months'
GROUP BY EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)
ORDER BY year DESC, month DESC;

-- Interpretation:
-- - If queue_rate_percent > 30% consistently → demand high, price too low
-- - Consider price increase in Phase 2 (e.g., $25, $30 AUD)
-- - Monitor adoption vs. queue rate as key metric

-- Council-Level Price Sensitivity
SELECT
  c.name as council,
  COUNT(fp.id) as total_purchases,
  COUNT(CASE WHEN fp.status IN ('active', 'queued') THEN 1 END) as repeat_purchases,
  COUNT(CASE WHEN fp.status = 'refunded' THEN 1 END) as refund_count,
  ROUND(100.0 * COUNT(CASE WHEN fp.status = 'queued' THEN 1 END) / COUNT(*), 2) as queue_percent
FROM featured_placements fp
JOIN councils c ON fp.council_id = c.id
GROUP BY c.id, c.name
ORDER BY queue_percent DESC;
```

### 7.6 Monitoring Dashboard (Operator View)

```
Real-Time Metrics (Updated hourly):

🟢 GREEN (Healthy):
  ✓ Revenue (LTM):              $X,XXX AUD
  ✓ Transactions (Last 30d):    XXX
  ✓ Featured Adoption Rate:     YY% (target: 10–20%)
  ✓ Queue Backlog:              AVG 1–2 per council
  ✓ Refund Rate:                Z% (target: <5%)
  ✓ Stripe Connection:          ✅ OK
  ✓ Cron Status:                ✅ Last run 2 hrs ago

🟡 YELLOW (Monitor):
  ⚠ Queue Backlog > 3 in any council
  ⚠ Refund Rate > 5%
  ⚠ Cron hasn't run in 4 hours (pending retry)

🔴 RED (Action Required):
  ❌ Revenue declined >20% WoW
  ❌ Queue Backlog > 10 in any council
  ❌ Stripe connection down >30 min
  ❌ Cron failed all 5 retries (manual intervention)
  ❌ Refund rate > 15% (investigate fraud)

Operator Actions:
  - Click "Investigate" → Drill down to individual council / trainer
  - Click "Process Refunds" → Batch refund requests (within 3-day window)
  - Click "Cron Status" → View job logs, retry if needed
  - Click "Alerts" → Configure thresholds, notification channels
```

---

## Part 8: Edge Cases & Error Handling

### 8.1 Stripe Webhook Failures

```
Scenario: Charge.succeeded webhook never arrives (Stripe network issue)

Timeline:
  T+0:    Trainer clicks [Pay]
  T+60:   Stripe charges card successfully
  T+90:   Stripe attempts webhook → Network timeout (Stripe's network)
  T+5min: Stripe retries (exponential backoff)
  T+30min: Stripe retries again
  T+2hr:  Stripe gives up, creates Issue ticket
  
User Experience:
  ❌ Trainer stuck on Stripe Checkout page
  ❌ Card charged but profile not featured
  ❌ No email confirmation
  
Recovery (Operator Action, weekly batch):
  1. Query: SELECT * FROM payment_audit WHERE status IS NULL
  2. Manual verification: Check Stripe Dashboard for charge ID
  3. UPDATE featured_placements: Set status='active', featured_until=...
  4. EMAIL trainer: "Payment received! Your profile is featured."
  
Prevention:
  - Use Stripe CLI in dev: stripe listen --forward-to localhost:3000
  - Test webhook retry logic
  - Monitor cron_jobs table for missed featured activations
```

### 8.2 Duplicate Charges (Idempotency)

```
Scenario: Trainer clicks [Pay] twice due to slow UI

Timeline:
  T+0:    First [Pay] click → Stripe session created (session_1)
  T+5:    Trainer sees loading, clicks [Pay] again → New Stripe session (session_2)
  T+30:   Charge 1 succeeds, webhook received
  T+40:   Charge 2 succeeds, webhook received (DUPLICATE!)

Prevention (Implementation):
  ✅ Stripe session has idempotency_key
  ✅ Webhook handler checks: stripe_event_id UNIQUE constraint
  ✅ payment_audit.stripe_event_id UNIQUE prevents duplicate INSERT

Example:
  ```sql
  CREATE UNIQUE INDEX idx_payment_audit_stripe_event_id 
  ON payment_audit(stripe_event_id);
  ```

If Duplicate Charge Received:
  1. Webhook handler finds existing payment_audit.stripe_event_id
  2. Skips processing (idempotent response: 200 OK)
  3. Operator discovers via reconciliation (e.g., trainer charged twice)
  4. Operator initiates refund for second charge
  5. Trainer informed and refunded
```

### 8.3 Refund Outside 3-Day Window

```
Scenario: Trainer requests refund on day 5 (outside 3-day window)

Implementation:
  featured_placements.refunded_at (immutable)
  Calculate: NOW() - featured_placements.purchased_at

Operator Sees:
  ❌ "Refund request DENIED: Outside 3-day window"
  📅 Purchased: [5 days ago]
  📅 Window closed: [2 days ago]

Trainer Sees:
  ❌ Email: "Your refund request was denied (outside 3-day window)"
  📝 Policy: "Featured placements cannot be refunded after 3 days."

Code:
  const daysSincePurchase = 
    (Date.now() - new Date(featured.purchased_at).getTime()) / 
    (1000 * 60 * 60 * 24);
  
  if (daysSincePurchase > 3) {
    return { error: 'Refund window has closed (3-day policy)' };
  }
```

### 8.4 Cron Job: Timeout or Database Unavailable

```
Scenario: Cron job starts, Supabase connection drops mid-execution

Timeline:
  2am AEDT: Cron triggers → connects to Supabase
  2:15am:   Cron expires 10 placements
  2:16am:   Cron queries queue → Connection timeout!
  2:17am:   Cron fails, logs to cron_jobs table
  3:47am:   Vercel retries automatically
  3:47am:   Supabase recovered, cron succeeds

Database:
  cron_jobs:
    INSERT: { status='failure', error='Connection timeout' }
    INSERT: { status='success', records_processed=15 } ← retry

Operator Sees:
  ⚠️ "Cron failed once, auto-retried and succeeded"
  📊 Summary: 10 expired, 5 promoted

Action:
  - If all 5 retries fail: Create high-priority operator task
  - Operator manually runs expired check and queue promotion
```

### 8.5 Zero Availability (Full Rollout Pause)

```
Scenario: Featured is disabled completely (e.g., for maintenance)

Implementation:
  Add feature flag in Vercel Secrets:
  FEATURED_PAYMENT_ENABLED=false

Route Handler:
  if (!process.env.FEATURED_PAYMENT_ENABLED) {
    return { error: 'Featured placement unavailable (maintenance)' };
  }

Trainer Sees:
  ❌ [Promote] button disabled
  💬 Tooltip: "Featured promotion is temporarily unavailable"

Operator Controls:
  - Flips flag on/off via Vercel dashboard
  - Instant effect (no redeploy)
  - Useful for: Major bugs, Stripe down, Sales pause
```

---

## Appendix: Implementation Checklist

```
Phase 1 Monetisation Checklist:

Architecture:
  ☐ Decision D-002 locked ($20, 30-day, max 5/council)
  ☐ Stripe account created + API keys captured
  ☐ Webhook endpoint designed + signature verification planned
  ☐ Idempotency strategy (stripe_event_id, session_id) confirmed
  ☐ 3-day refund window logic specified

Database:
  ☐ featured_placements table (full schema, constraints)
  ☐ payment_audit table (immutable, 7-year retention)
  ☐ featured_queue table (FIFO management)
  ☐ featured_slots_capacity table (tracking)
  ☐ All indexes created (25+ total)
  ☐ RPC functions written (get_active_count, promotion logic)
  ☐ Triggers for soft delete + audit

Backend:
  ☐ POST /api/payments/create-checkout (Stripe session)
  ☐ POST /api/webhooks/stripe (charge.succeeded, charge.refunded)
  ☐ Webhook signature verification (HMAC-SHA256)
  ☐ Refund API call (Stripe refunds.create)
  ☐ Email notifications (active, queued, expired, refunded)

Cron:
  ☐ Vercel cron configured (2am AEDT = 3pm UTC)
  ☐ Expiry check SQL + promotion logic
  ☐ Error handling + retry strategy
  ☐ Logging to cron_jobs table
  ☐ Slack alerts for failures

Operations:
  ☐ Operator dashboard (red alerts, refund queue)
  ☐ Manual refund process (UI + API)
  ☐ Reconciliation checklist (weekly)
  ☐ Incident playbooks (Stripe down, cron down)

Testing:
  ☐ Unit tests: Idempotency, slot availability, queue logic
  ☐ Integration tests: Stripe webhook → Database state
  ☐ E2E: User purchase → Featured activation
  ☐ Cron: Expiry + promotion runs correctly
  ☐ Refund: 3-day window enforced
  ☐ Load test: 100 concurrent checkouts

Security:
  ☐ Stripe API keys in Vercel Secrets (not hardcoded)
  ☐ Webhook secret signed (not public)
  ☐ payment_audit immutable (no delete/update)
  ☐ HTTPS only for webhook endpoint
  ☐ Rate limiting on payment API (to prevent abuse)

Compliance:
  ☐ GST calculated (amount_cents includes GST)
  ☐ BAS reporting template ready (accountant)
  ☐ Privacy: ABN not collected Phase 1
  ☐ ATO: 7-year retention policy documented
```

---

**Document Version:** 1.0  
**Date:** 2025-12-25  
**Status:** 🟢 Ready for Phase 1 Implementation  
**Owner:** Product + Architecture  
**Next Review:** After Phase 1 payment processing (Month 2)

---

**End of 06_MONETISATION_AND_FEATURED_PLACEMENT.md**
