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
 * Featured checkout session creation parameters
 */
export interface CreateFeaturedCheckoutSessionParams {
  businessId: string;
  councilId: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Pro subscription checkout session parameters
 */
export interface CreateProSubscriptionSessionParams {
  businessId: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Checkout session result
 */
export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
  paymentIntentId?: string;
}

const FEATURED_DURATION_DAYS = 30;
const FEATURED_PRICE_CENTS = 1500;
const PRO_PRICE_CENTS = 2000;
const PRO_INTERVAL_DAYS = 30;

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
export async function createFeaturedCheckoutSession(
  params: CreateFeaturedCheckoutSessionParams
): Promise<CheckoutSessionResult> {
  try {
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('name')
      .eq('id', params.businessId)
      .single();

    if (businessError || !business) {
      throw new Error('Business not found');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: `Featured Placement - ${business.name}`,
              description: `${FEATURED_DURATION_DAYS} day featured placement`,
            },
            unit_amount: FEATURED_PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        product: 'featured',
        business_id: params.businessId,
        council_id: params.councilId,
        duration_days: FEATURED_DURATION_DAYS.toString(),
      },
    });

    return {
      sessionId: session.id,
      url: session.url!,
      paymentIntentId: session.payment_intent as string,
    };
  } catch (error) {
    logError(error, { context: 'createFeaturedCheckoutSession', params });
    throw handleStripeError(error);
  }
}

/**
 * Create Stripe checkout session for Pro (Gold Card) subscription
 */
export async function createProSubscriptionSession(
  params: CreateProSubscriptionSessionParams
): Promise<CheckoutSessionResult> {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: 'Pro (Gold Card)',
              description: '30 day subscription',
            },
            recurring: {
              interval: 'day',
              interval_count: PRO_INTERVAL_DAYS,
            },
            unit_amount: PRO_PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      subscription_data: {
        metadata: {
          business_id: params.businessId,
        },
      },
      metadata: {
        product: 'pro',
        business_id: params.businessId,
      },
    });

    return {
      sessionId: session.id,
      url: session.url!,
    };
  } catch (error) {
    logError(error, { context: 'createProSubscriptionSession', params });
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
 * Process checkout session completion (featured or pro)
 */
export async function processCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const product = session.metadata?.product;
  if (product === 'featured') {
    await processFeaturedCheckout(session);
    return;
  }

  if (product === 'pro') {
    await processProSubscription(session);
  }
}

/**
 * Process featured checkout completion
 */
async function processFeaturedCheckout(
  session: Stripe.Checkout.Session
): Promise<void> {
  try {
    const businessId = session.metadata?.business_id;
    const councilId = session.metadata?.council_id;
    if (!businessId || !councilId) {
      throw new Error('Missing required metadata in checkout session');
    }

    if (!session.payment_intent) {
      throw new Error('Missing payment intent in checkout session');
    }

    const { data: existingPlacement } = await supabaseAdmin
      .from('featured_placements')
      .select('id')
      .eq('stripe_payment_id', session.payment_intent as string)
      .maybeSingle();

    if (existingPlacement) {
      return;
    }

    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + FEATURED_DURATION_DAYS);

    const { error } = await supabaseAdmin.from('featured_placements').insert({
      business_id: businessId,
      council_id: councilId,
      stripe_payment_id: session.payment_intent as string,
      amount_cents: FEATURED_PRICE_CENTS,
      currency: 'AUD',
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: 'queued',
    });

    if (error) {
      throw new Error('Failed to create featured placement');
    }
  } catch (error) {
    logError(error, { context: 'processFeaturedCheckout', sessionId: session.id });
    throw handleStripeError(error);
  }
}

/**
 * Process Pro subscription checkout completion
 */
async function processProSubscription(
  session: Stripe.Checkout.Session
): Promise<void> {
  try {
    const businessId = session.metadata?.business_id;
    if (!businessId) {
      throw new Error('Missing business_id in checkout metadata');
    }

    const subscriptionId = session.subscription as string | null;
    if (!subscriptionId) {
      throw new Error('Missing subscription ID');
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

    const { error: upsertError } = await supabaseAdmin
      .from('subscriptions')
      .upsert(
        {
          business_id: businessId,
          tier: 'pro',
          status: subscription.status,
          current_period_end: currentPeriodEnd,
          stripe_subscription_id: subscription.id,
        },
        { onConflict: 'business_id' }
      );

    if (upsertError) {
      throw new Error('Failed to update subscription');
    }

    const { error: businessError } = await supabaseAdmin
      .from('businesses')
      .update({ tier: 'pro' })
      .eq('id', businessId);

    if (businessError) {
      throw new Error('Failed to update business tier');
    }
  } catch (error) {
    logError(error, { context: 'processProSubscription', sessionId: session.id });
    throw handleStripeError(error);
  }
}

/**
 * Process subscription updates
 */
export async function processSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  try {
    const businessId = subscription.metadata?.business_id;
    if (!businessId) {
      return;
    }

    const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

    const { error: upsertError } = await supabaseAdmin
      .from('subscriptions')
      .upsert(
        {
          business_id: businessId,
          tier: 'pro',
          status: subscription.status,
          current_period_end: currentPeriodEnd,
          stripe_subscription_id: subscription.id,
        },
        { onConflict: 'business_id' }
      );

    if (upsertError) {
      throw new Error('Failed to update subscription');
    }

    const newTier = subscription.status === 'active' ? 'pro' : 'basic';
    const { error: businessError } = await supabaseAdmin
      .from('businesses')
      .update({ tier: newTier })
      .eq('id', businessId);

    if (businessError) {
      throw new Error('Failed to update business tier');
    }
  } catch (error) {
    logError(error, { context: 'processSubscriptionUpdated', subscriptionId: subscription.id });
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
  createFeaturedCheckoutSession,
  createProSubscriptionSession,
  verifyWebhookSignature,
  parseWebhookEvent,
  processCheckoutSessionCompleted,
  processSubscriptionUpdated,
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
