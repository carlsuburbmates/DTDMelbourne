// ============================================================================
// DTD Phase 2: API Contract - Get Trainer by ID Endpoint
// File: src/app/api/v1/trainers/[id]/route.ts
// Description: Get trainer profile by ID
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/auth';
import { getTrainerByIdSchema, validateQueryParams } from '@/lib/validation';
import { handleSupabaseError, formatErrorResponse, NotFoundError } from '@/lib/errors';
import { RateLimiters, getClientIp, checkRateLimitOrThrow, formatRateLimitHeaders } from '@/lib/rate-limit';

/**
 * GET /api/v1/trainers/:id - Get trainer profile by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimitOrThrow(RateLimiters.public, ip);

    // Validate trainer ID
    const validatedParams = validateQueryParams(getTrainerByIdSchema, { id: params.id });

    // Get trainer with council and suburb
    const { data: trainer, error } = await supabase
      .from('businesses')
      .select(`
        *,
        council:councils(id, name, region, shire, ux_label),
        suburb:suburbs(id, name, postcode, region, ux_label)
      `)
      .eq('id', validatedParams.id)
      .eq('deleted', false)
      .single();

    if (error) {
      throw handleSupabaseError(error);
    }

    if (!trainer) {
      throw new NotFoundError(`Trainer not found: ${validatedParams.id}`);
    }

    // Get featured placement
    const { data: featured } = await supabase
      .from('featured_placements')
      .select('*')
      .eq('business_id', validatedParams.id)
      .eq('status', 'active')
      .gt('ends_at', new Date().toISOString())
      .maybeSingle();

    // Get reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('business_id', validatedParams.id)
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10);

    // Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          trainer,
          council: trainer.council,
          suburb: trainer.suburb,
          reviews: reviews || [],
          featured: featured || null,
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
      formatErrorResponse(apiError as any, apiError.message || 'Failed to get trainer'),
      {
        status: apiError instanceof NotFoundError ? 404 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
