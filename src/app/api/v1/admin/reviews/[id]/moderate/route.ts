// ============================================================================
// DTD Phase 2: API Contract - Moderate Review
// File: src/app/api/v1/admin/reviews/[id]/moderate/route.ts
// Description: Moderate review
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase, verifyAccessToken, isAdmin } from '@/lib/auth';
import {
  moderateReviewRequestSchema,
  validateRequestBody,
} from '@/lib/validation';
import {
  handleSupabaseError,
  formatErrorResponse,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '@/lib/errors';
import { RateLimiters, getClientIp, checkRateLimitOrThrow, formatRateLimitHeaders } from '@/lib/rate-limit';
import type { ModerateReviewRequest } from '@/types/api';

/**
 * PATCH /api/v1/admin/reviews/[id]/moderate - Moderate review
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimitOrThrow(RateLimiters.admin, ip);

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      throw new UnauthorizedError('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await verifyAccessToken(token);

    // Check if user is an admin
    if (!isAdmin(user)) {
      throw new ForbiddenError('Only admins can moderate reviews');
    }

    // Get review
    const { data: existingReview, error: fetchError } = await supabase
      .from('reviews')
      .select('id, moderation_status')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingReview) {
      throw new NotFoundError('Review not found');
    }

    // Check if review is already moderated
    if (existingReview.moderation_status !== 'pending') {
      throw new ForbiddenError('Review has already been moderated');
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedBody = validateRequestBody(
      moderateReviewRequestSchema,
      body
    ) as ModerateReviewRequest;

    // Store previous status
    const previousStatus = existingReview.moderation_status;

    // Update review moderation status
    const { data: review, error } = await supabase
      .from('reviews')
      .update({
        moderation_status: validatedBody.moderation_status,
        rejection_reason: validatedBody.rejection_reason,
        moderated_by: user.id,
        moderated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      throw handleSupabaseError(error);
    }

    // Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          review,
          previous_status: previousStatus,
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
      formatErrorResponse(apiError as any, apiError.message || 'Failed to moderate review'),
      {
        status: apiError instanceof UnauthorizedError || apiError instanceof ForbiddenError || apiError instanceof NotFoundError ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
