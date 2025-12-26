// ============================================================================
// DTD Phase 2: API Contract - Remove Issue from Trainer Profile
// File: src/app/api/v1/trainer/issues/[id]/route.ts
// Description: Remove issue from trainer profile
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase, verifyAccessToken, isTrainer } from '@/lib/auth';
import {
  removeIssueRequestSchema,
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
import type { RemoveIssueRequest } from '@/types/api';

/**
 * DELETE /api/v1/trainer/issues/[id] - Remove issue from trainer profile
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimitOrThrow(RateLimiters.trainer, ip);

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      throw new UnauthorizedError('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await verifyAccessToken(token);

    // Check if user is a trainer
    if (!isTrainer(user)) {
      throw new ForbiddenError('Only trainers can remove issues');
    }

    // Get trainer's business profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('businesses')
      .select('id, behavior_issues')
      .eq('resource_type', 'trainer')
      .eq('email', user.email)
      .eq('deleted_at', null)
      .single();

    if (fetchError || !existingProfile) {
      throw new NotFoundError('Trainer profile not found');
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedBody = validateRequestBody(
      removeIssueRequestSchema,
      body
    ) as RemoveIssueRequest;

    // Check if issue exists
    if (!existingProfile.behavior_issues?.includes(validatedBody.behavior_issue)) {
      throw new NotFoundError('Issue not found in trainer profile');
    }

    // Remove issue
    const behaviorIssues = existingProfile.behavior_issues.filter(
      (issue) => issue !== validatedBody.behavior_issue
    );

    const { data: trainer, error } = await supabase
      .from('businesses')
      .update({ behavior_issues })
      .eq('id', existingProfile.id)
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
          removed_issue: validatedBody.behavior_issue,
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
      formatErrorResponse(apiError as any, apiError.message || 'Failed to remove issue'),
      {
        status: apiError instanceof UnauthorizedError || apiError instanceof ForbiddenError || apiError instanceof NotFoundError ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
