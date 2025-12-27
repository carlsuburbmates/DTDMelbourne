// ============================================================================
// DTD: Trainer Business Update Endpoint (SSOT_FINAL)
// File: src/app/api/trainer/business/[id]/route.ts
// Description: Update owned business listing
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyAccessToken, isTrainer } from '@/lib/auth';
import { updateBusinessRequestSchema, validateRequestBody } from '@/lib/validation';
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
import type { UpdateBusinessRequest } from '@/types/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/trainer/business/:id - Update business listing
 */
export async function PATCH(request: NextRequest, context: RouteParams) {
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
      throw new ForbiddenError('Only trainers can update listings');
    }

    const { id } = await context.params;
    const body = await request.json();
    const validatedBody = validateRequestBody(
      updateBusinessRequestSchema,
      body
    ) as UpdateBusinessRequest;

    const { data: business, error: fetchError } = await supabaseAdmin
      .from('businesses')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (fetchError || !business) {
      throw new NotFoundError('Business not found');
    }

    if (business.user_id !== user.id) {
      throw new ForbiddenError('You do not own this business');
    }

    const { error: updateError } = await supabaseAdmin
      .from('businesses')
      .update(validatedBody)
      .eq('id', id);

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
      formatErrorResponse(apiError as any, apiError.message || 'Failed to update business'),
      {
        status:
          apiError instanceof UnauthorizedError ||
          apiError instanceof ForbiddenError ||
          apiError instanceof NotFoundError
            ? 401
            : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
