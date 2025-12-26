# DTD Phase 3: Monetisation Implementation

## Overview

This document describes the monetisation implementation for the Dog Trainers Directory (DTD) project, including Stripe Checkout integration, webhook handlers, and FIFO queue management for featured placements.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Stripe Integration](#stripe-integration)
3. [FIFO Queue Logic](#fifo-queue-logic)
4. [Webhook Event Handling](#webhook-event-handling)
5. [Cron Job Setup](#cron-job-setup)
6. [Environment Variables](#environment-variables)
7. [API Endpoints](#api-endpoints)
8. [Testing](#testing)

## Architecture Overview

### Components

The monetisation system consists of the following components:

1. **Stripe Client** ([`src/lib/stripe.ts`](../src/lib/stripe.ts))
   - Stripe SDK initialization
   - Checkout session creation
   - Webhook signature verification
   - Payment processing functions

2. **FIFO Queue Manager** ([`src/lib/featured-queue.ts`](../src/lib/featured-queue.ts))
   - Queue position management
   - Trainer promotion logic
   - Queue statistics

3. **Featured Placement Manager** ([`src/lib/featured-placement.ts`](../src/lib/featured-placement.ts))
   - Featured placement creation
   - Placement extension
   - Expiry checking

4. **Cron Job** ([`src/lib/cron/featured-expiry.ts`](../src/lib/cron/featured-expiry.ts))
   - Daily expiry check
   - Automatic queue promotion

5. **Webhook Handler** ([`src/app/api/v1/webhooks/stripe/route.ts`](../src/app/api/v1/webhooks/stripe/route.ts))
   - Stripe event processing
   - Payment audit logging

### Data Flow

```
User Purchase Request
       ↓
Create Checkout Session (Stripe)
       ↓
User Completes Payment
       ↓
Stripe Webhook Event
       ↓
Process Payment (payment_audit table)
       ↓
Update Featured Placement (featured_placements table)
       ↓
Promote from Queue (if queued)
       ↓
Cron Job Checks Expiry (daily)
       ↓
Expire Placement & Promote Next
```

## Stripe Integration

### Configuration

Stripe is configured using environment variables:

- `STRIPE_SECRET_KEY`: Secret key for API calls
- `STRIPE_WEBHOOK_SECRET`: Webhook signature verification
- `STRIPE_PUBLISHABLE_KEY`: Public key for frontend
- `STRIPE_PRICE_ID`: Price ID for featured placement ($20/day)

### Checkout Session Creation

The [`createCheckoutSession()`](../src/lib/stripe.ts:68) function creates a Stripe checkout session:

```typescript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{
    price_data: {
      currency: 'aud',
      product_data: {
        name: `Featured Placement - ${business.name}`,
        description: `${durationDays} day featured placement`,
        metadata: {
          business_id: params.businessId,
          council_id: params.councilId,
          duration_days: params.durationDays.toString(),
        },
      },
      unit_amount: amountCents,
    },
    quantity: 1,
  }],
  mode: 'payment',
  success_url: params.successUrl,
  cancel_url: params.cancelUrl,
  metadata: {
    business_id: params.businessId,
    council_id: params.councilId,
    duration_days: params.durationDays.toString(),
  },
});
```

### Payment Processing

Payment processing is handled by webhook events:

1. **checkout.session.completed**: Successful payment
   - Updates featured placement to `active`
   - Creates payment audit record
   - Promotes trainer from queue if applicable

2. **checkout.session.expired**: Expired checkout
   - Updates featured placement to `cancelled`
   - Creates payment audit record

3. **payment_intent.succeeded**: Payment success confirmation
   - Updates featured placement to `active`
   - Creates payment audit record

4. **payment_intent.payment_failed**: Payment failure
   - Updates featured placement to `refunded`
   - Creates payment audit record with error details

## FIFO Queue Logic

### Queue Structure

The FIFO queue is managed through the [`featured_placements`](../supabase/migrations/002_tables.sql:176) table:

- **Status**: `queued`
- **Position**: Sequential queue position (1, 2, 3, ...)
- **Council**: Queue is per-council (each council has its own queue)

### Queue Operations

#### Add to Queue

The [`addToQueue()`](../src/lib/featured-queue.ts:28) function adds a trainer to the queue:

1. Validates trainer exists
2. Calculates next queue position
3. Creates featured placement with `queued` status
4. Sets `queue_position` to next available position

```typescript
const nextPosition = lastPosition?.queue_position
  ? lastPosition.queue_position + 1
  : 1;
```

#### Promote from Queue

The [`promoteFromQueue()`](../src/lib/featured-queue.ts:68) function promotes the next trainer:

1. Gets next trainer in queue (lowest `queue_position`)
2. Updates placement to `active` status
3. Sets `queue_activated_at` timestamp
4. Updates remaining queue positions sequentially

#### Get Queue Position

The [`getQueuePosition()`](../src/lib/featured-queue.ts:115) function returns:

- Current queue position
- Estimated days until activation
- Based on active placements and queue position

```typescript
const estimatedDays = (placement.queue_position - 1) * 7; // 7 days per placement
```

#### Remove from Queue

The [`removeFromQueue()`](../src/lib/featured-queue.ts:165) function removes a trainer:

1. Updates placement to `cancelled` status
2. Updates remaining queue positions
3. Records cancellation reason

### Queue Statistics

The [`getQueueStatistics()`](../src/lib/featured-queue.ts:227) function provides:

- Total queued trainers
- Total active trainers
- Council breakdown

## Webhook Event Handling

### Webhook Endpoint

The webhook endpoint is at [`POST /api/v1/webhooks/stripe`](../src/app/api/v1/webhooks/stripe/route.ts:19).

### Signature Verification

All webhooks are verified using Stripe signature:

```typescript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### Event Processing

Events are processed in the following order:

1. **checkout.session.completed**
   - Calls [`processSuccessfulPayment()`](../src/lib/stripe.ts:145)
   - Updates `featured_placements` table
   - Creates `payment_audit` record
   - Logs success

2. **checkout.session.expired**
   - Calls [`processExpiredSession()`](../src/lib/stripe.ts:197)
   - Updates `featured_placements` table
   - Creates `payment_audit` record
   - Logs expiry

3. **payment_intent.succeeded**
   - Calls [`processSuccessfulPayment()`](../src/lib/stripe.ts:145)
   - Same as checkout.session.completed

4. **payment_intent.payment_failed**
   - Calls [`processFailedPayment()`](../src/lib/stripe.ts:173)
   - Updates `featured_placements` to `refunded`
   - Creates `payment_audit` record with error
   - Logs failure

### Payment Audit

All payment events are logged in the [`payment_audit`](../supabase/migrations/002_tables.sql:218) table:

```typescript
{
  stripe_event_id: string,
  stripe_event_type: string,
  business_id: number,
  council_id: number,
  payment_intent_id: string,
  charge_id: string,
  customer_id: string,
  amount_cents: number,
  currency: string,
  status: string,
  webhook_received_at: string,
  processed_at: string,
  processing_success: boolean,
  processing_error: string | null,
}
```

## Cron Job Setup

### Featured Expiry Check

The [`runFeaturedExpiryCheck()`](../src/lib/cron/featured-expiry.ts:23) function runs daily to:

1. Find all expired active placements (`end_date < today`)
2. Update each to `expired` status
3. Promote next trainer from queue for each council
4. Log results in `cron_jobs` table

### Cron Job Scheduling

The cron job should be scheduled to run daily:

```bash
# Run at midnight every day
0 0 * * *

# Or run at 2 AM every day
0 2 * * *
```

### Cron Job Audit

All cron job runs are logged in the [`cron_jobs`](../supabase/migrations/002_tables.sql:306) table:

```typescript
{
  job_name: 'featured_expiry_check',
  scheduled_run_time: string,
  actual_run_time: string,
  status: 'pending' | 'running' | 'completed' | 'failed',
  records_processed: number,
  error_message: string | null,
}
```

### Monitoring

Use [`getCronJobStatus()`](../src/lib/cron/featured-expiry.ts:88) to monitor:

- Last run status
- Last successful run
- Last failed run

Use [`getCronJobHistory()`](../src/lib/cron/featured-expiry.ts:123) to view:

- Recent cron job runs
- Success/failure patterns
- Error messages

## Environment Variables

### Required Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_your-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key
STRIPE_PRICE_ID=price_your-price-id

# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Optional Variables

```bash
# Email (for OTP)
EMAIL_SERVICE_PROVIDER=sendgrid
EMAIL_API_KEY=your-email-api-key
EMAIL_FROM_ADDRESS=noreply@dogtrainersdirectory.com

# SMS (for OTP)
SMS_SERVICE_PROVIDER=twilio
SMS_API_KEY=your-sms-api-key
SMS_FROM_NUMBER=+61400000000

# Rate Limiting
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
LOG_STRUCTURED=true
```

## API Endpoints

### Webhook Endpoint

**POST** `/api/v1/webhooks/stripe`

Handles Stripe webhook events for payment processing.

**Request Headers:**
- `stripe-signature`: Stripe webhook signature

**Response:**
```json
{
  "success": true,
  "data": {
    "received": true,
    "event_id": "evt_1234567890",
    "processed": true
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "version": "1.0.0"
  }
}
```

### Trainer Endpoints

**POST** `/api/v1/trainer/featured/purchase`

Create a checkout session for featured placement purchase.

**Request Body:**
```json
{
  "council_id": "1",
  "duration_days": 7,
  "payment_method_id": "pm_1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "featured_placement": {
      "id": "1",
      "business_id": "123",
      "council_id": "1",
      "start_date": "2024-01-01",
      "end_date": "2024-01-08",
      "status": "queued",
      "tier": "basic"
    },
    "payment_intent_id": "pi_1234567890",
    "client_secret": "pi_1234567890_secret_abc123",
    "amount": 14000,
    "currency": "aud"
  }
}
```

**GET** `/api/v1/trainer/featured/status`

Get trainer's featured status and queue position.

**Response:**
```json
{
  "success": true,
  "data": {
    "featured": {
      "id": "1",
      "business_id": "123",
      "council_id": "1",
      "start_date": "2024-01-01",
      "end_date": "2024-01-08",
      "status": "active",
      "tier": "basic"
    },
    "queue_position": null,
    "can_purchase": false,
    "next_available_date": "2024-01-15"
  }
}
```

### Admin Endpoints

**GET** `/api/v1/admin/featured/queue`

Get featured queue for a council.

**Query Parameters:**
- `council_id`: Filter by council
- `status`: Filter by status (queued, active, expired, cancelled, refunded)
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "1",
        "business": {
          "id": "123",
          "name": "John's Dog Training"
        },
        "council": {
          "id": "1",
          "name": "Melbourne City"
        },
        "queue_position": 1,
        "status": "queued"
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 10,
    "has_more": true
  }
}
```

**POST** `/api/v1/admin/featured/promote`

Manually promote a trainer from the queue.

**Request Body:**
```json
{
  "featured_placement_id": "1",
  "start_date": "2024-01-01",
  "end_date": "2024-01-08"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "featured_placement": {
      "id": "1",
      "business_id": "123",
      "council_id": "1",
      "start_date": "2024-01-01",
      "end_date": "2024-01-08",
      "status": "active",
      "tier": "basic"
    },
    "queue_updates": [
      {
        "id": "2",
        "queue_position": 1
      },
      {
        "id": "3",
        "queue_position": 2
      }
    ]
  }
}
```

**GET** `/api/v1/admin/payments/audit`

Get payment audit records.

**Query Parameters:**
- `event_type`: Filter by event type
- `business_id`: Filter by business
- `date_from`: Start date filter
- `date_to`: End date filter
- `page`: Page number
- `limit`: Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "1",
        "stripe_event_id": "evt_1234567890",
        "stripe_event_type": "checkout.session.completed",
        "business_id": 123,
        "council_id": 1,
        "payment_intent_id": "pi_1234567890",
        "charge_id": "ch_1234567890",
        "customer_id": "cus_1234567890",
        "amount_cents": 14000,
        "currency": "AUD",
        "status": "succeeded",
        "webhook_received_at": "2024-01-01T00:00:00.000Z",
        "processed_at": "2024-01-01T00:00:01.000Z",
        "processing_success": true,
        "processing_error": null
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 10,
    "has_more": true
  }
}
```

## Testing

### Unit Testing

Test individual functions:

```typescript
// Test queue operations
import { addToQueue, promoteFromQueue, getQueuePosition } from '@/lib/featured-queue';

describe('Featured Queue', () => {
  it('should add trainer to queue', async () => {
    const placement = await addToQueue('123', '1', 'pi_123', 7);
    expect(placement.status).toBe('queued');
    expect(placement.queue_position).toBe(1);
  });

  it('should promote trainer from queue', async () => {
    const promoted = await promoteFromQueue('1');
    expect(promoted.status).toBe('active');
  });
});
```

### Integration Testing

Test webhook processing:

```bash
# Use Stripe CLI to test webhooks
stripe trigger checkout.session.completed \
  --add checkout_session:cs_1234567890

# Or use ngrok for local testing
ngrok http 3000
# Update Stripe webhook endpoint to ngrok URL
```

### Cron Job Testing

Test cron job manually:

```typescript
import { runFeaturedExpiryCheck } from '@/lib/cron/featured-expiry';

// Run cron job manually
const result = await runFeaturedExpiryCheck();
console.log('Expired:', result.result.expiredCount);
console.log('Promoted:', result.result.promotedCount);
```

## Error Handling

### Stripe Errors

All Stripe errors are handled using [`handleStripeError()`](../src/lib/errors.ts:352):

- `StripeCardError`: Payment failed (card declined, etc.)
- `StripeInvalidRequestError`: Invalid request parameters
- `StripeAPIError`: Stripe API error
- `StripeConnectionError`: Connection error
- `StripeRateLimitError`: Rate limit exceeded

### Database Errors

All database errors are handled using [`handleSupabaseError()`](../src/lib/errors.ts:305):

- `23505`: Unique violation (duplicate entry)
- `23503`: Foreign key violation
- `23502`: Not null violation
- `PGRST116`: Not found

### Logging

All errors are logged using [`logError()`](../src/lib/errors.ts:424):

```typescript
logError(error, {
  context: 'createCheckoutSession',
  params: { businessId, councilId, durationDays },
});
```

## Security Considerations

### Webhook Security

1. **Signature Verification**: Always verify Stripe webhook signatures
2. **Idempotency**: Handle duplicate webhook events gracefully
3. **Rate Limiting**: Protect webhook endpoint from abuse

### Payment Security

1. **Metadata Validation**: Validate payment metadata before processing
2. **Amount Verification**: Verify payment amounts match expected values
3. **Status Checks**: Only process payments with valid status

### Data Security

1. **Environment Variables**: Never commit secrets to version control
2. **API Keys**: Use service role key for admin operations
3. **Audit Logging**: Log all payment operations for audit trail

## Performance Considerations

### Database Optimization

1. **Indexes**: Ensure indexes on frequently queried columns
   - `featured_placements(council_id, status, queue_position)`
   - `payment_audit(stripe_event_id, business_id)`

2. **Query Optimization**: Use efficient queries
   - Limit results with pagination
   - Use appropriate filters

3. **Caching**: Cache frequently accessed data
   - Featured trainers list
   - Queue statistics

### Stripe Optimization

1. **Webhook Processing**: Process webhooks quickly
   - Use async operations
   - Minimize database calls

2. **Retry Logic**: Implement retry for transient failures
   - Exponential backoff
   - Max retry attempts

## Monitoring and Alerts

### Key Metrics

Monitor the following metrics:

1. **Payment Success Rate**: Percentage of successful payments
2. **Queue Length**: Average queue length per council
3. **Expiry Rate**: Number of expired placements per day
4. **Cron Job Health**: Success/failure rate of cron jobs
5. **Webhook Processing Time**: Average time to process webhooks

### Alerting

Set up alerts for:

1. **Payment Failures**: Alert on high failure rate
2. **Queue Backlog**: Alert on long queue lengths
3. **Cron Job Failures**: Alert on cron job failures
4. **Webhook Errors**: Alert on webhook processing errors

## Troubleshooting

### Common Issues

#### Webhook Not Received

**Symptoms**: Webhook events not being processed

**Solutions**:
1. Check Stripe webhook endpoint URL
2. Verify webhook secret matches
3. Check server logs for errors
4. Test webhook using Stripe CLI

#### Queue Not Promoting

**Symptoms**: Trainers stuck in queue

**Solutions**:
1. Check cron job is running
2. Verify queue positions are correct
3. Check for database errors
4. Manually run cron job to debug

#### Payment Not Processing

**Symptoms**: Payments not updating featured placements

**Solutions**:
1. Check payment audit table for errors
2. Verify webhook signature verification
3. Check Stripe dashboard for payment status
4. Review webhook processing logs

## Future Enhancements

### Planned Features

1. **Multiple Tiers**: Support for different featured placement tiers
2. **Bulk Discounts**: Discount for longer placements
3. **Auto-Renewal**: Automatic placement renewal
4. **Analytics Dashboard**: Payment and queue analytics
5. **Email Notifications**: Notify trainers of queue changes

### Scalability Considerations

1. **Multi-Region**: Support for multiple regions
2. **Load Balancing**: Distribute webhook processing
3. **Database Sharding**: Scale database for high volume
4. **Caching Layer**: Redis for queue management

## References

- [Stripe Documentation](https://stripe.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Database Schema](./database-schema-implementation.md)
- [API Contract](./api-contract-implementation.md)

## Changelog

### Version 1.0.0 (2024-01-01)

- Initial implementation
- Stripe Checkout integration
- FIFO queue management
- Webhook event handling
- Cron job for featured expiry
- Payment audit logging
