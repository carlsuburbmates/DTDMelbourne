// ============================================================================
// DTD Phase 2: API Contract - Councils Endpoint
// File: src/app/api/v1/councils/route.ts
// Description: List all councils
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/auth';
import { getCouncilsQuerySchema, validateQueryParams } from '@/lib/validation';
import { handleSupabaseError, formatErrorResponse } from '@/lib/errors';
import { RateLimiters, getClientIp, checkRateLimitOrThrow, formatRateLimitHeaders } from '@/lib/rate-limit';

/**
 * GET /api/v1/councils - List all councils
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimitOrThrow(RateLimiters.public, ip);

    // Validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = validateQueryParams(getCouncilsQuerySchema, queryParams);

    // Build query
    let query = supabase.from('councils').select('*');

    // Apply region filter
    if (validatedParams.region) {
      query = query.eq('region', validatedParams.region);
    }

    // Apply sorting
    query = query.order('name', { ascending: true });

    // Apply pagination
    const page = validatedParams.page || 1;
    const limit = validatedParams.limit || 20;
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: councils, error, count } = await query;

    if (error) {
      throw handleSupabaseError(error);
    }

    // Get unique regions
    const { data: allCouncils } = await supabase
      .from('councils')
      .select('region');

    const regions = allCouncils
      ? [...new Set(allCouncils.map((c) => c.region))]
      : [];

    const total = count || 0;
    const hasMore = offset + limit < total;

    // Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          councils: councils || [],
          total,
          page,
          limit,
          has_more: hasMore,
          regions,
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
      formatErrorResponse(apiError as any, apiError.message || 'Failed to get councils'),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
