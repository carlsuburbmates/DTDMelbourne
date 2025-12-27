// ============================================================================
// DTD: Pro Subscription Endpoint (SSOT_FINAL)
// File: src/app/api/billing/pro/subscribe/route.ts
// Description: Subscribe to Pro (Gold Card)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyAccessToken, isTrainer } from '@/lib/auth';
import { proSubscribeRequestSchema, validateRequestBody } from '@/lib/validation';
import {
  handleSupabaseError,
  formatErrorResponse,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '@/lib/errors';
import {
  RateLimiters,
  getClientIp,
  checkRateLimitOrThrow,
  formatRateLimitHeaders,
} from '@/lib/rate-limit';
import { createProSubscriptionSession } from '@/lib/stripe';
import type { ProSubscribeRequest } from '@/types/api';

/**
 * POST /api/billing/pro/subscribe - Subscribe to Pro (Gold Card)
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimitOrThrow(RateLimiters.trainer, ip);

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      throw new UnauthorizedError('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await verifyAccessToken(token);

    if (!isTrainer(user)) {
      throw new ForbiddenError('Only trainers can subscribe to Pro');
    }

    const body = await request.json();
    const validatedBody = validateRequestBody(
      proSubscribeRequestSchema,
      body
    ) as ProSubscribeRequest;

    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id, user_id, tier')
      .eq('id', validatedBody.business_id)
      .single();

    if (businessError || !business) {
      throw new NotFoundError('Business not found');
    }

    if (business.user_id !== user.id) {
      throw new ForbiddenError('You do not own this business');
    }

    if (business.tier === 'pro') {
      throw new ForbiddenError('Business is already Pro');
    }

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const session = await createProSubscriptionSession({
      businessId: business.id,
      successUrl: `${appUrl}/trainer/pro/success`,
      cancelUrl: `${appUrl}/trainer/pro/cancelled`,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          session_id: session.sessionId,
          checkout_url: session.url,
        },
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
    const apiError = error instanceof Error ? error : new Error('Unknown error');
    return NextResponse.json(
      formatErrorResponse(apiError as any, apiError.message || 'Failed to subscribe to Pro'),
      {
        status:
          apiError instanceof UnauthorizedError ||
          apiError instanceof ForbiddenError ||
          apiError instanceof NotFoundError
            ? 400
            : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
