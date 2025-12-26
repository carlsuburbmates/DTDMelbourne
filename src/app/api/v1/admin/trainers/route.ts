// ============================================================================
// DTD Phase 2: API Contract - Admin List Trainers
// File: src/app/api/v1/admin/trainers/route.ts
// Description: List all trainers (paginated)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase, verifyAccessToken, isAdmin } from '@/lib/auth';
import {
  adminTrainersQuerySchema,
  validateQueryParams,
} from '@/lib/validation';
import {
  handleSupabaseError,
  formatErrorResponse,
  UnauthorizedError,
  ForbiddenError,
} from '@/lib/errors';
import { RateLimiters, getClientIp, checkRateLimitOrThrow, formatRateLimitHeaders } from '@/lib/rate-limit';
import type { AdminTrainersQuery } from '@/types/api';

/**
 * GET /api/v1/admin/trainers - List all trainers (paginated)
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
      adminTrainersQuerySchema,
      queryParams
    ) as AdminTrainersQuery;

    // Build Supabase query
    let query = supabase
      .from('businesses')
      .select(`
        *,
        council:councils(id, name, region, shire, ux_label),
        locality:localities(id, name, postcode, region, ux_label)
      `)
      .eq('resource_type', 'trainer')
      .eq('deleted_at', null);

    // Apply filters
    if (validatedParams.status === 'pending') {
      query = query.eq('verified', false);
    } else if (validatedParams.status === 'verified') {
      query = query.eq('verified', true);
    }

    if (validatedParams.council_id) {
      query = query.eq('council_id', validatedParams.council_id);
    }

    if (validatedParams.resource_type) {
      query = query.eq('resource_type', validatedParams.resource_type);
    }

    if (validatedParams.data_source) {
      query = query.eq('data_source', validatedParams.data_source);
    }

    if (validatedParams.search) {
      query = query.ilike('name', `%${validatedParams.search}%`);
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
          filters: {
            status: validatedParams.status,
            council_id: validatedParams.council_id,
            resource_type: validatedParams.resource_type,
          },
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
      formatErrorResponse(apiError as any, apiError.message || 'Failed to list trainers'),
      {
        status: apiError instanceof UnauthorizedError || apiError instanceof ForbiddenError ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
