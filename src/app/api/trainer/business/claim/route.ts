// ============================================================================
// DTD: Trainer Business Claim Endpoint (SSOT_FINAL)
// File: src/app/api/trainer/business/claim/route.ts
// Description: Claim existing business listing
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyAccessToken, isTrainer } from '@/lib/auth';
import { claimBusinessRequestSchema, validateRequestBody } from '@/lib/validation';
import {
  handleSupabaseError,
  formatErrorResponse,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
} from '@/lib/errors';
import {
  RateLimiters,
  getClientIp,
  checkRateLimitOrThrow,
  formatRateLimitHeaders,
} from '@/lib/rate-limit';
import type { ClaimBusinessRequest } from '@/types/api';

/**
 * POST /api/trainer/business/claim - Claim business listing
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
      throw new ForbiddenError('Only trainers can claim listings');
    }

    const body = await request.json();
    const validatedBody = validateRequestBody(
      claimBusinessRequestSchema,
      body
    ) as ClaimBusinessRequest;

    const { data: business, error: fetchError } = await supabaseAdmin
      .from('businesses')
      .select('id, email, claimed, user_id')
      .eq('id', validatedBody.business_id)
      .single();

    if (fetchError || !business) {
      throw handleSupabaseError(fetchError);
    }

    if (business.claimed || business.user_id) {
      throw new ForbiddenError('Business is already claimed');
    }

    if (business.email && business.email !== user.email) {
      throw new BadRequestError('Claim verification failed');
    }

    const { error: updateError } = await supabaseAdmin
      .from('businesses')
      .update({
        claimed: true,
        claimed_at: new Date().toISOString(),
        user_id: user.id,
        scaffolded: false,
      })
      .eq('id', business.id);

    if (updateError) {
      throw handleSupabaseError(updateError);
    }

    return NextResponse.json(
      {
        success: true,
        data: { success: true },
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
      formatErrorResponse(apiError as any, apiError.message || 'Failed to claim business'),
      {
        status:
          apiError instanceof UnauthorizedError ||
          apiError instanceof ForbiddenError ||
          apiError instanceof BadRequestError
            ? 401
            : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
