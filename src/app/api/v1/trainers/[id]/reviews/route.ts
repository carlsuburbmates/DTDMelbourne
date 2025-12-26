// ============================================================================
// DTD Phase 2: API Contract - Get Trainer Reviews Endpoint
// File: src/app/api/v1/trainers/[id]/reviews/route.ts
// Description: Get trainer reviews
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/auth';
import { getTrainerReviewsQuerySchema, validateQueryParams } from '@/lib/validation';
import { handleSupabaseError, formatErrorResponse, NotFoundError } from '@/lib/errors';
import { RateLimiters, getClientIp, checkRateLimitOrThrow, formatRateLimitHeaders } from '@/lib/rate-limit';

/**
 * GET /api/v1/trainers/:id/reviews - Get trainer reviews
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimitOrThrow(RateLimiters.public, ip);

    // Validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = validateQueryParams(
      getTrainerReviewsQuerySchema,
      queryParams
    );

    // Check if trainer exists
    const { data: trainer, error: trainerError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', params.id)
      .eq('deleted_at', null)
      .single();

    if (trainerError || !trainer) {
      throw new NotFoundError(`Trainer not found: ${params.id}`);
    }

    // Build reviews query
    let query = supabase
      .from('reviews')
      .select('*')
      .eq('business_id', params.id)
      .eq('moderation_status', 'approved');

    // Apply rating filters
    if (validatedParams.min_rating) {
      query = query.gte('rating', validatedParams.min_rating);
    }

    if (validatedParams.max_rating) {
      query = query.lte('rating', validatedParams.max_rating);
    }

    // Apply sorting
    const sortBy = validatedParams.sort_by || 'created_at';
    const sortOrder = validatedParams.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

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

    // Calculate average rating
    const { data: ratingData } = await supabase
      .from('reviews')
      .select('rating')
      .eq('business_id', params.id)
      .eq('moderation_status', 'approved');

    const averageRating = ratingData && ratingData.length > 0
      ? ratingData.reduce((sum, r) => sum + r.rating, 0) / ratingData.length
      : 0;

    const total = count || 0;
    const hasMore = offset + limit < total;

    // Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          reviews: reviews || [],
          total,
          page,
          limit,
          has_more: hasMore,
          trainer_id: params.id,
          average_rating: Math.round(averageRating * 10) / 10,
          total_reviews: total,
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
      formatErrorResponse(apiError as any, apiError.message || 'Failed to get reviews'),
      {
        status: apiError instanceof NotFoundError ? 404 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
