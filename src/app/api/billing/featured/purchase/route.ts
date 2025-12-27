// ============================================================================
// DTD: Featured Purchase Endpoint (SSOT_FINAL)
// File: src/app/api/billing/featured/purchase/route.ts
// Description: Purchase featured placement (non-recurring)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyAccessToken, isTrainer } from '@/lib/auth';
import { purchaseFeaturedRequestSchema, validateRequestBody } from '@/lib/validation';
import {
  handleSupabaseError,
  formatErrorResponse,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} from '@/lib/errors';
import {
  RateLimiters,
  getClientIp,
  checkRateLimitOrThrow,
  formatRateLimitHeaders,
} from '@/lib/rate-limit';
import { createFeaturedCheckoutSession } from '@/lib/stripe';
import { isFeaturedCapReached } from '@/lib/featured-queue';
import type { PurchaseFeaturedRequest } from '@/types/api';

/**
 * POST /api/billing/featured/purchase - Purchase featured placement
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
      throw new ForbiddenError('Only trainers can purchase featured placement');
    }

    const body = await request.json();
    const validatedBody = validateRequestBody(
      purchaseFeaturedRequestSchema,
      body
    ) as PurchaseFeaturedRequest;

    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id, council_id, user_id')
      .eq('id', validatedBody.business_id)
      .single();

    if (businessError || !business) {
      throw new NotFoundError('Business not found');
    }

    if (business.user_id !== user.id) {
      throw new ForbiddenError('You do not own this business');
    }

    if (business.council_id !== validatedBody.council_id) {
      throw new BadRequestError('Council does not match business listing');
    }

    const { data: existingPlacement } = await supabaseAdmin
      .from('featured_placements')
      .select('id, status')
      .eq('business_id', business.id)
      .in('status', ['active', 'queued'])
      .maybeSingle();

    if (existingPlacement) {
      throw new BadRequestError('Featured placement already active or queued');
    }

    const capReached = await isFeaturedCapReached(business.council_id.toString());
    if (capReached) {
      throw new BadRequestError('Featured cap reached for this council');
    }

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const session = await createFeaturedCheckoutSession({
      businessId: business.id,
      councilId: business.council_id,
      successUrl: `${appUrl}/trainer/featured/success`,
      cancelUrl: `${appUrl}/trainer/featured/cancelled`,
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
      formatErrorResponse(apiError as any, apiError.message || 'Failed to purchase featured placement'),
      {
        status:
          apiError instanceof UnauthorizedError ||
          apiError instanceof ForbiddenError ||
          apiError instanceof NotFoundError ||
          apiError instanceof BadRequestError
            ? 400
            : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
