// ============================================================================
// DTD Phase 2: API Contract - Get Pending Reviews
// File: src/app/api/v1/admin/reviews/pending/route.ts
// Description: Get pending reviews
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase, verifyAccessToken, isAdmin } from '@/lib/auth';
import {
  pendingReviewsQuerySchema,
  validateQueryParams,
} from '@/lib/validation';
import {
  handleSupabaseError,
  formatErrorResponse,
  UnauthorizedError,
  ForbiddenError,
} from '@/lib/errors';
import { RateLimiters, getClientIp, checkRateLimitOrThrow, formatRateLimitHeaders } from '@/lib/rate-limit';
import type { PendingReviewsQuery } from '@/types/api';

/**
 * GET /api/v1/admin/reviews/pending - Get pending reviews
 */
export async function GET(request: NextRequest) {
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
      throw new ForbiddenError('Only admins can access this endpoint');
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = validateQueryParams(
      pendingReviewsQuerySchema,
      queryParams
    ) as PendingReviewsQuery;

    // Build Supabase query
    let query = supabase
      .from('reviews')
      .select(`
        *,
        business:businesses(id, name, email, resource_type)
      `)
      .eq('moderation_status', 'pending');

    // Apply filters
    if (validatedParams.council_id) {
      query = query.eq('businesses.council_id', validatedParams.council_id);
    }

    if (validatedParams.min_rating) {
      query = query.gte('rating', validatedParams.min_rating);
    }

    if (validatedParams.max_rating) {
      query = query.lte('rating', validatedParams.max_rating);
    }

    // Apply sorting
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    const page = validatedParams.page || 1;
    const limit = validatedParams.limit || 20;
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: reviews, error, count } = await query;

    if (error) {
      throw handleSupabaseError(error);
    }

    const total = count || 0;
    const hasMore = offset + limit < total;

    // Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          reviews,
          total,
          page,
          limit,
          has_more: hasMore,
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
      formatErrorResponse(apiError as any, apiError.message || 'Failed to get pending reviews'),
      {
        status: apiError instanceof UnauthorizedError || apiError instanceof ForbiddenError ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
