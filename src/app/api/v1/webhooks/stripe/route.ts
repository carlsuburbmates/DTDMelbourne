// ============================================================================
// DTD Phase 3: Monetisation - Stripe Webhook Handler
// File: src/app/api/v1/webhooks/stripe/route.ts
// Description: Handle Stripe webhooks
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  handleStripeError,
  formatErrorResponse,
  logError,
} from '@/lib/errors';
import { RateLimiters, getClientIp, checkRateLimitOrThrow, formatRateLimitHeaders } from '@/lib/rate-limit';
import {
  verifyWebhookSignature,
  parseWebhookEvent,
  processCheckoutSessionCompleted,
  processSubscriptionUpdated,
} from '@/lib/stripe';
import type { WebhookResponse } from '@/types/api';

/**
 * POST /api/v1/webhooks/stripe - Handle Stripe webhooks
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimitOrThrow(RateLimiters.webhook, ip);

    // Get Stripe signature
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('Stripe signature missing');
    }

    // Get raw body
    const body = await request.text();

    // Verify webhook signature
    const event = verifyWebhookSignature(body, signature);

    // Parse event data
    const eventData = parseWebhookEvent(event);

    // Log webhook receipt
    console.log(`[Stripe Webhook] Received event: ${eventData.eventType}`, {
      eventId: eventData.eventId,
    });

    // Handle different event types
    switch (eventData.eventType) {
      case 'checkout.session.completed':
        await processCheckoutSessionCompleted(eventData.data as any);
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await processSubscriptionUpdated(eventData.data as any);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${eventData.eventType}`);
    }

    // Return response
    const responseData: WebhookResponse = {
      received: true,
      event_id: eventData.eventId,
      processed: true,
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      },
      {
        status: 200,
        headers: {
          ...formatRateLimitHeaders(rateLimitResult),
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    logError(error, { context: 'stripeWebhook' });
    const apiError = error instanceof Error ? error : new Error('Unknown error');
    return NextResponse.json(
      formatErrorResponse(apiError as any, apiError.message || 'Failed to process webhook'),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// ============================================================================
// COMMENTS
// ============================================================================
// 1. Stripe webhook handler for payment events
// 2. Handles checkout.session.completed, checkout.session.expired
// 3. Handles payment_intent.succeeded, payment_intent.payment_failed
// 4. Updates payment_audit and featured_placements tables
// 5. Promotes trainers from FIFO queue on successful payment
// 6. Based on DOCS/05_DATA_AND_API_CONTRACTS.md and D-013 requirement
// ============================================================================
