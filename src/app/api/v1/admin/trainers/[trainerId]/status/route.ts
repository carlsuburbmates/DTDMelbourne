// ============================================================================
// DTD Phase 2: API Contract - Update Trainer Status
// File: src/app/api/v1/admin/trainers/[trainerId]/status/route.ts
// Description: Update trainer status
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase, verifyAccessToken, isAdmin } from '@/lib/auth';
import {
  updateTrainerStatusRequestSchema,
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
import type { UpdateTrainerStatusRequest } from '@/types/api';

/**
 * PATCH /api/v1/admin/trainers/[trainerId]/status - Update trainer status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { trainerId: string } }
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
      throw new ForbiddenError('Only admins can update trainer status');
    }

    // Get trainer profile
    const { data: existingTrainer, error: fetchError } = await supabase
      .from('businesses')
      .select('id, verified, claimed')
      .eq('id', params.trainerId)
      .eq('resource_type', 'trainer')
      .eq('deleted_at', null)
      .single();

    if (fetchError || !existingTrainer) {
      throw new NotFoundError('Trainer not found');
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedBody = validateRequestBody(
      updateTrainerStatusRequestSchema,
      body
    ) as UpdateTrainerStatusRequest;

    // Store previous status
    const previousStatus = {
      verified: existingTrainer.verified,
      claimed: existingTrainer.claimed,
    };

    // Update trainer status
    const { data: trainer, error } = await supabase
      .from('businesses')
      .update({
        verified: validatedBody.verified,
        claimed: validatedBody.claimed,
      })
      .eq('id', params.trainerId)
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
          trainer,
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
      formatErrorResponse(apiError as any, apiError.message || 'Failed to update trainer status'),
      {
        status: apiError instanceof UnauthorizedError || apiError instanceof ForbiddenError || apiError instanceof NotFoundError ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
