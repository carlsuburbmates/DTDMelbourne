// ============================================================================
// DTD Phase 3: Monetisation - Stripe Client Configuration
// File: src/lib/stripe.ts
// Description: Stripe client configuration and helper functions
// ============================================================================

import Stripe from 'stripe';
import { supabaseAdmin } from './auth';
import { handleStripeError, logError } from './errors';
import type { FeaturedPlacement, PaymentAudit } from '../types/database';

// ============================================================================
// CONFIGURATION
// ============================================================================

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

// ============================================================================
// TYPES
// ============================================================================

/**
 * Checkout session creation parameters
 */
export interface CreateCheckoutSessionParams {
  businessId: string;
  councilId: string;
  durationDays: number;
  successUrl: string;
  cancelUrl: string;
  priceId?: string;
}

/**
 * Checkout session result
 */
export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
  paymentIntentId?: string;
}

/**
 * Webhook event data
 */
export interface WebhookEventData {
  eventId: string;
  eventType: string;
  data: Record<string, unknown>;
}

// ============================================================================
// CHECKOUT SESSION FUNCTIONS
// ============================================================================

/**
 * Create Stripe checkout session for featured placement purchase
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResult> {
  try {
    // Get business details
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('name, council_id')
      .eq('id', params.businessId)
      .single();

    if (businessError || !business) {
      throw new Error('Business not found');
    }

    // Calculate amount (AUD $20 per day)
    const amountCents = params.durationDays * 2000;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: `Featured Placement - ${business.name}`,
              description: `${params.durationDays} day featured placement`,
              metadata: {
                business_id: params.businessId,
                council_id: params.councilId,
                duration_days: params.durationDays.toString(),
              },
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        business_id: params.businessId,
        council_id: params.councilId,
        duration_days: params.durationDays.toString(),
      },
      customer_email: undefined, // Will be collected during checkout
    });

    // Create featured placement record with queued status
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + params.durationDays);

    const { error: placementError } = await supabaseAdmin
      .from('featured_placements')
      .insert({
        business_id: params.businessId,
        council_id: params.councilId,
        stripe_payment_id: session.payment_intent as string,
        amount_cents: amountCents,
        currency: 'AUD',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: 'queued',
        tier: 'basic',
      });

    if (placementError) {
      throw new Error('Failed to create featured placement record');
    }

    return {
      sessionId: session.id,
      url: session.url!,
      paymentIntentId: session.payment_intent as string,
    };
  } catch (error) {
    logError(error, { context: 'createCheckoutSession', params });
    throw handleStripeError(error);
  }
}

// ============================================================================
// WEBHOOK VERIFICATION FUNCTIONS
// ============================================================================

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): Stripe.Event {
  if (!stripeWebhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set');
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret);
  } catch (error) {
    throw new Error('Invalid webhook signature');
  }
}

/**
 * Parse webhook event
 */
export function parseWebhookEvent(event: Stripe.Event): WebhookEventData {
  return {
    eventId: event.id,
    eventType: event.type,
    data: event.data.object as Record<string, unknown>,
  };
}

// ============================================================================
// PAYMENT PROCESSING FUNCTIONS
// ============================================================================

/**
 * Process successful payment
 */
export async function processSuccessfulPayment(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  try {
    const businessId = paymentIntent.metadata?.business_id;
    const councilId = paymentIntent.metadata?.council_id;
    const durationDays = parseInt(paymentIntent.metadata?.duration_days || '0', 10);

    if (!businessId || !councilId) {
      throw new Error('Missing required metadata in payment intent');
    }

    // Get featured placement
    const { data: featuredPlacement, error: fetchError } = await supabaseAdmin
      .from('featured_placements')
      .select('*')
      .eq('stripe_payment_id', paymentIntent.id)
      .single();

    if (fetchError || !featuredPlacement) {
      throw new Error('Featured placement not found');
    }

    // Update featured placement status to active
    const { error: updateError } = await supabaseAdmin
      .from('featured_placements')
      .update({
        status: 'active',
        queue_activated_at: new Date().toISOString(),
      })
      .eq('id', featuredPlacement.id);

    if (updateError) {
      throw new Error('Failed to update featured placement');
    }

    // Create payment audit record
    await createPaymentAudit({
      stripe_event_id: paymentIntent.id,
      stripe_event_type: 'payment_intent.succeeded',
      business_id: parseInt(businessId, 10),
      council_id: parseInt(councilId, 10),
      payment_intent_id: paymentIntent.id,
      charge_id: paymentIntent.latest_charge as string,
      customer_id: paymentIntent.customer as string,
      amount_cents: paymentIntent.amount,
      currency: paymentIntent.currency.toUpperCase(),
      status: 'succeeded',
      webhook_received_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
      processing_success: true,
    });
  } catch (error) {
    logError(error, { context: 'processSuccessfulPayment', paymentIntentId: paymentIntent.id });
    throw handleStripeError(error);
  }
}

/**
 * Process failed payment
 */
export async function processFailedPayment(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  try {
    const businessId = paymentIntent.metadata?.business_id;

    if (!businessId) {
      throw new Error('Missing required metadata in payment intent');
    }

    // Get featured placement
    const { data: featuredPlacement, error: fetchError } = await supabaseAdmin
      .from('featured_placements')
      .select('*')
      .eq('stripe_payment_id', paymentIntent.id)
      .single();

    if (fetchError || !featuredPlacement) {
      throw new Error('Featured placement not found');
    }

    // Update featured placement status to refunded
    const { error: updateError } = await supabaseAdmin
      .from('featured_placements')
      .update({
        status: 'refunded',
        refund_reason: paymentIntent.last_payment_error?.message || 'Payment failed',
        refunded_at: new Date().toISOString(),
        refund_amount_cents: paymentIntent.amount,
      })
      .eq('id', featuredPlacement.id);

    if (updateError) {
      throw new Error('Failed to update featured placement');
    }

    // Create payment audit record
    await createPaymentAudit({
      stripe_event_id: paymentIntent.id,
      stripe_event_type: 'payment_intent.payment_failed',
      business_id: parseInt(businessId, 10),
      council_id: featuredPlacement.council_id,
      payment_intent_id: paymentIntent.id,
      charge_id: paymentIntent.latest_charge as string,
      customer_id: paymentIntent.customer as string,
      amount_cents: paymentIntent.amount,
      currency: paymentIntent.currency.toUpperCase(),
      status: 'failed',
      webhook_received_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
      processing_success: false,
      processing_error: paymentIntent.last_payment_error?.message,
    });
  } catch (error) {
    logError(error, { context: 'processFailedPayment', paymentIntentId: paymentIntent.id });
    throw handleStripeError(error);
  }
}

/**
 * Process expired checkout session
 */
export async function processExpiredSession(
  session: Stripe.Checkout.Session
): Promise<void> {
  try {
    const businessId = session.metadata?.business_id;

    if (!businessId) {
      throw new Error('Missing required metadata in session');
    }

    // Get featured placement
    const { data: featuredPlacement, error: fetchError } = await supabaseAdmin
      .from('featured_placements')
      .select('*')
      .eq('stripe_payment_id', session.payment_intent as string)
      .single();

    if (fetchError || !featuredPlacement) {
      throw new Error('Featured placement not found');
    }

    // Update featured placement status to cancelled
    const { error: updateError } = await supabaseAdmin
      .from('featured_placements')
      .update({
        status: 'cancelled',
      })
      .eq('id', featuredPlacement.id);

    if (updateError) {
      throw new Error('Failed to update featured placement');
    }

    // Create payment audit record
    await createPaymentAudit({
      stripe_event_id: session.id,
      stripe_event_type: 'checkout.session.expired',
      business_id: parseInt(businessId, 10),
      council_id: featuredPlacement.council_id,
      payment_intent_id: session.payment_intent as string,
      amount_cents: session.amount_total || 0,
      currency: session.currency?.toUpperCase() || 'AUD',
      status: 'expired',
      webhook_received_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
      processing_success: true,
    });
  } catch (error) {
    logError(error, { context: 'processExpiredSession', sessionId: session.id });
    throw handleStripeError(error);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create payment audit record
 */
async function createPaymentAudit(
  data: Omit<PaymentAudit, 'id' | 'created_at'>
): Promise<void> {
  const { error } = await supabaseAdmin.from('payment_audit').insert(data);

  if (error) {
    throw new Error('Failed to create payment audit record');
  }
}

/**
 * Get featured placement by payment intent ID
 */
export async function getFeaturedPlacementByPaymentIntent(
  paymentIntentId: string
): Promise<FeaturedPlacement | null> {
  const { data, error } = await supabaseAdmin
    .from('featured_placements')
    .select('*')
    .eq('stripe_payment_id', paymentIntentId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Get payment intent by ID
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent | null> {
  try {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    logError(error, { context: 'getPaymentIntent', paymentIntentId });
    return null;
  }
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export {
  createCheckoutSession,
  verifyWebhookSignature,
  parseWebhookEvent,
  processSuccessfulPayment,
  processFailedPayment,
  processExpiredSession,
  getFeaturedPlacementByPaymentIntent,
  getPaymentIntent,
};

// ============================================================================
// COMMENTS
// ============================================================================
// 1. Stripe client initialization with secret key
// 2. Checkout session creation for featured placement purchases
// 3. Webhook signature verification
// 4. Payment processing functions (success, failed, expired)
// 5. Payment audit record creation
// 6. Helper functions for payment intent retrieval
// 7. Based on DOCS/05_DATA_AND_API_CONTRACTS.md and D-013 requirement
// ============================================================================
