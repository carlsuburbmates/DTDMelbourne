// ============================================================================
// DTD: Public Search Endpoint (SSOT_FINAL)
// File: src/app/api/public/search/route.ts
// Description: Public search with suburb-first compatibility filtering
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { searchTrainersQuerySchema, validateQueryParams } from '@/lib/validation';
import {
  handleSupabaseError,
  formatErrorResponse,
  BadRequestError,
} from '@/lib/errors';
import {
  RateLimiters,
  getClientIp,
  checkRateLimitOrThrow,
  formatRateLimitHeaders,
} from '@/lib/rate-limit';
import { runPublicSearch } from '@/lib/public-search';
import type { SearchTrainersQuery } from '@/types/api';

/**
 * GET /api/public/search - Public search (suburb-first, age-first)
 */
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimitOrThrow(RateLimiters.public, ip);

    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = validateQueryParams(
      searchTrainersQuerySchema,
      queryParams
    ) as SearchTrainersQuery;

    const result = await runPublicSearch(validatedParams);

    return NextResponse.json(
      {
        success: true,
        data: {
          results: result.results,
          total: result.total,
          page: result.page,
          limit: result.limit,
          has_more: result.has_more,
        },
        meta: result.meta,
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
    const responseError =
      apiError instanceof BadRequestError
        ? apiError
        : handleSupabaseError(apiError as any);

    return NextResponse.json(
      formatErrorResponse(
        responseError as any,
        responseError.message || 'Failed to search trainers'
      ),
      {
        status: responseError instanceof BadRequestError ? 400 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
