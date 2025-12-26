// ============================================================================
// DTD Phase 2: API Contract - Check Featured Placement Status
// File: src/app/api/v1/trainer/featured/status/route.ts
// Description: Check featured placement status
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase, verifyAccessToken, isTrainer } from '@/lib/auth';
import {
  getFeaturedStatusQuerySchema,
  validateQueryParams,
} from '@/lib/validation';
import {
  handleSupabaseError,
  formatErrorResponse,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '@/lib/errors';
import { RateLimiters, getClientIp, checkRateLimitOrThrow, formatRateLimitHeaders } from '@/lib/rate-limit';
import type { FeaturedStatusResponse } from '@/types/api';

/**
 * GET /api/v1/trainer/featured/status - Check featured placement status
 */
export async function GET(request: NextRequest) {
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
      throw new ForbiddenError('Only trainers can access this endpoint');
    }

    // Get trainer's business profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('businesses')
      .select('id, council_id')
      .eq('resource_type', 'trainer')
      .eq('email', user.email)
      .eq('deleted_at', null)
      .single();

    if (fetchError || !existingProfile) {
      throw new NotFoundError('Trainer profile not found');
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = validateQueryParams(
      getFeaturedStatusQuerySchema,
      queryParams
    );

    // Get active featured placement
    const { data: activeFeatured } = await supabase
      .from('featured_placements')
      .select('*')
      .eq('business_id', existingProfile.id)
      .eq('status', 'active')
      .gte('start_date', new Date().toISOString())
      .lte('end_date', new Date().toISOString())
      .maybeSingle();

    // Get queued featured placement
    const { data: queuedFeatured } = await supabase
      .from('featured_placements')
      .select('*')
      .eq('business_id', existingProfile.id)
      .eq('status', 'queued')
      .maybeSingle();

    // Calculate queue position
    let queuePosition: number | null = null;
    if (queuedFeatured) {
      const councilId = validatedParams.council_id || existingProfile.council_id;
      const { count } = await supabase
        .from('featured_placements')
        .select('*', { count: 'exact', head: true })
        .eq('council_id', councilId)
        .eq('status', 'queued')
        .lt('created_at', queuedFeatured.created_at);

      queuePosition = (count || 0) + 1;
    }

    // Check if can purchase
    const canPurchase = !activeFeatured && !queuedFeatured;

    // Calculate next available date
    let nextAvailableDate: string | null = null;
    if (activeFeatured) {
      const endDate = new Date(activeFeatured.end_date);
      nextAvailableDate = endDate.toISOString();
    } else if (queuedFeatured) {
      // Estimate based on queue position (1 day per position)
      const estimatedDays = queuePosition || 1;
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + estimatedDays);
      nextAvailableDate = nextDate.toISOString();
    }

    // Return response
    const responseData: FeaturedStatusResponse = {
      featured: activeFeatured || null,
      queue_position: queuePosition,
      can_purchase: canPurchase,
      next_available_date: nextAvailableDate,
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
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
      formatErrorResponse(apiError as any, apiError.message || 'Failed to get featured status'),
      {
        status: apiError instanceof UnauthorizedError || apiError instanceof ForbiddenError || apiError instanceof NotFoundError ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
