// ============================================================================
// DTD Phase 2: API Contract - Public Trainers Endpoint
// File: src/app/api/v1/trainers/route.ts
// Description: Search trainers with filters
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/auth';
import {
  searchTrainersQuerySchema,
  validateQueryParams,
} from '@/lib/validation';
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

    // Build Supabase query
    let query = supabase
      .from('businesses')
      .select(`
        *,
        council:councils(id, name, region, shire, ux_label),
        locality:localities(id, name, postcode, region, ux_label)
      `)
      .eq('deleted_at', null);

    // Apply filters
    if (validatedParams.council_id) {
      query = query.eq('council_id', validatedParams.council_id);
    }

    if (validatedParams.locality_id) {
      query = query.eq('locality_id', validatedParams.locality_id);
    }

    if (validatedParams.resource_type) {
      query = query.eq('resource_type', validatedParams.resource_type);
    }

    if (validatedParams.age_specialty) {
      query = query.contains('age_specialties', validatedParams.age_specialty);
    }

    if (validatedParams.behavior_issue) {
      query = query.contains('behavior_issues', validatedParams.behavior_issue);
    }

    if (validatedParams.service_type) {
      query = query.or(
        `service_type_primary.eq.${validatedParams.service_type},service_type_secondary.cs.{${validatedParams.service_type}}`
      );
    }

    if (validatedParams.verified !== undefined) {
      query = query.eq('verified', validatedParams.verified);
    }

    if (validatedParams.claimed !== undefined) {
      query = query.eq('claimed', validatedParams.claimed);
    }

    if (validatedParams.search) {
      query = query.ilike('name', `%${validatedParams.search}%`);
    }

    // Apply sorting
    const sortBy = validatedParams.sort_by || 'created_at';
    const sortOrder = validatedParams.sort_order || 'asc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const page = validatedParams.page || 1;
    const limit = validatedParams.limit || 20;
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: trainers, error, count } = await query;

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
          trainers,
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
