// ============================================================================
// DTD Phase 2: API Contract - Suburbs Endpoint
// File: src/app/api/v1/suburbs/route.ts
// Description: List suburbs
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/auth';
import { getSuburbsQuerySchema, validateQueryParams } from '@/lib/validation';
import { handleSupabaseError, formatErrorResponse } from '@/lib/errors';
import { RateLimiters, getClientIp, checkRateLimitOrThrow, formatRateLimitHeaders } from '@/lib/rate-limit';

/**
 * GET /api/v1/suburbs - List suburbs
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimitOrThrow(RateLimiters.public, ip);

    // Validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = validateQueryParams(getSuburbsQuerySchema, queryParams);

    // Build query
    let query = supabase.from('localities').select('*');

    // Apply filters
    if (validatedParams.council_id) {
      query = query.eq('council_id', validatedParams.council_id);
    }

    if (validatedParams.region) {
      query = query.eq('region', validatedParams.region);
    }

    if (validatedParams.postcode) {
      query = query.eq('postcode', validatedParams.postcode);
    }

    // Apply sorting
    query = query.order('name', { ascending: true });

    // Apply pagination
    const page = validatedParams.page || 1;
    const limit = validatedParams.limit || 20;
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: suburbs, error, count } = await query;

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
          suburbs: suburbs || [],
          total,
          page,
          limit,
          has_more: hasMore,
          council_id: validatedParams.council_id,
          region: validatedParams.region,
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
      formatErrorResponse(apiError as any, apiError.message || 'Failed to get suburbs'),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
