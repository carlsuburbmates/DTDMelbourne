// ============================================================================
// DTD Phase 2: API Contract - Promote from Queue to Featured
// File: src/app/api/v1/admin/featured/promote/route.ts
// Description: Promote from queue to featured
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase, verifyAccessToken, isAdmin } from '@/lib/auth';
import {
  promoteFromQueueRequestSchema,
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
import type { PromoteFromQueueRequest } from '@/types/api';

/**
 * POST /api/v1/admin/featured/promote - Promote from queue to featured
 */
export async function POST(request: NextRequest) {
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
      throw new ForbiddenError('Only admins can promote from queue');
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedBody = validateRequestBody(
      promoteFromQueueRequestSchema,
      body
    ) as PromoteFromQueueRequest;

    // Get featured placement from queue
    const { data: featuredPlacement, error: fetchError } = await supabase
      .from('featured_placements')
      .select('*')
      .eq('id', validatedBody.featured_placement_id)
      .eq('status', 'queued')
      .single();

    if (fetchError || !featuredPlacement) {
      throw new NotFoundError('Featured placement not found in queue');
    }

    // Calculate start and end dates
    const startDate = validatedBody.start_date
      ? new Date(validatedBody.start_date)
      : new Date();
    const endDate = validatedBody.end_date
      ? new Date(validatedBody.end_date)
      : new Date(startDate.getTime() + (featuredPlacement.amount / 2000) * 24 * 60 * 60 * 1000);

    // Update featured placement to active
    const { data: updatedFeatured, error } = await supabase
      .from('featured_placements')
      .update({
        status: 'active',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        promoted_by: user.id,
        promoted_at: new Date().toISOString(),
      })
      .eq('id', validatedBody.featured_placement_id)
      .select()
      .single();

    if (error) {
      throw handleSupabaseError(error);
    }

    // Get other queued placements for the same council
    const { data: queueUpdates } = await supabase
      .from('featured_placements')
      .select('*')
      .eq('council_id', featuredPlacement.council_id)
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(5);

    // Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          featured_placement: updatedFeatured,
          queue_updates: queueUpdates || [],
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
      formatErrorResponse(apiError as any, apiError.message || 'Failed to promote from queue'),
      {
        status: apiError instanceof UnauthorizedError || apiError instanceof ForbiddenError || apiError instanceof NotFoundError ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
