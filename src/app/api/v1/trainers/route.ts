// ============================================================================
// DTD Phase 2: API Contract - Public Trainers Endpoint
// File: src/app/api/v1/trainers/route.ts
// Description: Search trainers with filters
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  searchTrainersQuerySchema,
  validateQueryParams,
} from '@/lib/validation';
import {
  formatErrorResponse,
  BadRequestError,
} from '@/lib/errors';
import { runPublicSearch } from '@/lib/public-search';
import {
  RateLimiters,
  getClientIp,
  checkRateLimitOrThrow,
  formatRateLimitHeaders,
} from '@/lib/rate-limit';
import type { SearchTrainersQuery } from '@/types/api';

/**
 * GET /api/v1/trainers - Search trainers with filters
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimitOrThrow(
      RateLimiters.public,
      ip
    );

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = validateQueryParams(
      searchTrainersQuerySchema,
      queryParams
    ) as SearchTrainersQuery;

    const result = await runPublicSearch(validatedParams);

    // Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          trainers: result.results,
          total: result.total,
          page: result.page,
          limit: result.limit,
          has_more: result.has_more,
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
      formatErrorResponse(
        apiError as any,
        apiError.message || 'Failed to search trainers'
      ),
      {
        status: apiError instanceof BadRequestError ? 400 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
