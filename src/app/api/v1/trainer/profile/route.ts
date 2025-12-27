// ============================================================================
// DTD Phase 2: API Contract - Trainer Profile Endpoint
// File: src/app/api/v1/trainer/profile/route.ts
// Description: Create, update, get trainer profile
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase, verifyAccessToken, isTrainer } from '@/lib/auth';
import {
  createBusinessRequestSchema,
  updateBusinessRequestSchema,
  validateRequestBody,
} from '@/lib/validation';
import {
  handleSupabaseError,
  formatErrorResponse,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
} from '@/lib/errors';
import { RateLimiters, getClientIp, checkRateLimitOrThrow, formatRateLimitHeaders } from '@/lib/rate-limit';
import type { CreateBusinessRequest, UpdateBusinessRequest } from '@/types/api';

/**
 * POST /api/v1/trainer/profile - Create trainer profile
 */
export async function POST(request: NextRequest) {
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
      throw new ForbiddenError('Only trainers can create profiles');
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedBody = validateRequestBody(
      createBusinessRequestSchema,
      body
    ) as CreateBusinessRequest;

    // Check if trainer already has a profile
    const { data: existingProfile } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .eq('deleted', false)
      .maybeSingle();

    if (existingProfile) {
      throw new ForbiddenError('Trainer profile already exists');
    }

    const { data: suburb, error: suburbError } = await supabase
      .from('suburbs')
      .select('id, council_id, region')
      .ilike('name', validatedBody.suburb)
      .limit(1)
      .maybeSingle();

    if (suburbError) {
      throw handleSupabaseError(suburbError);
    }

    if (!suburb) {
      throw new ForbiddenError('Suburb not found');
    }

    // Create trainer profile
    const { data: trainer, error } = await supabase
      .from('businesses')
      .insert({
        user_id: user.id,
        name: validatedBody.name,
        resource_type: 'trainer',
        suburb_id: suburb.id,
        council_id: suburb.council_id,
        region: suburb.region,
        address: validatedBody.address,
        phone: validatedBody.phone,
        email: validatedBody.email || null,
        website: validatedBody.website || null,
        claimed: true,
        claimed_at: new Date().toISOString(),
        scaffolded: false,
        data_source: 'manual_form',
        tier: 'basic',
      })
      .select()
      .single();

    if (error) {
      throw handleSupabaseError(error);
    }

    // Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          trainer,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      },
      {
        status: 201,
        headers: {
          ...formatRateLimitHeaders(rateLimitResult),
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    const apiError = error instanceof Error ? error : new Error('Unknown error');
    return NextResponse.json(
      formatErrorResponse(apiError as any, apiError.message || 'Failed to create trainer profile'),
      {
        status: apiError instanceof UnauthorizedError || apiError instanceof ForbiddenError ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * PUT /api/v1/trainer/profile - Update trainer profile
 */
export async function PUT(request: NextRequest) {
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
      throw new ForbiddenError('Only trainers can update profiles');
    }

    // Get trainer's business profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingProfile) {
      throw new NotFoundError('Trainer profile not found');
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedBody = validateRequestBody(
      updateBusinessRequestSchema,
      body
    ) as UpdateBusinessRequest;

    // Update trainer profile
    const { data: trainer, error } = await supabase
      .from('businesses')
      .update(validatedBody)
      .eq('id', existingProfile.id)
      .select()
      .single();

    if (error) {
      throw handleSupabaseError(error);
    }

    // Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          trainer,
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
      formatErrorResponse(apiError as any, apiError.message || 'Failed to update trainer profile'),
      {
        status: apiError instanceof UnauthorizedError || apiError instanceof ForbiddenError || apiError instanceof NotFoundError ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * GET /api/v1/trainer/profile - Get own profile
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
    const { data: trainer, error: fetchError } = await supabase
      .from('businesses')
      .select(`
        *,
        council:councils(id, name, region, shire, ux_label),
        suburb:suburbs(id, name, postcode, region, ux_label)
      `)
      .eq('user_id', user.id)
      .eq('deleted', false)
      .single();

    if (fetchError || !trainer) {
      throw new NotFoundError('Trainer profile not found');
    }

    // Get featured placement
    const { data: featured } = await supabase
      .from('featured_placements')
      .select('*')
      .eq('business_id', trainer.id)
      .eq('status', 'active')
      .gt('ends_at', new Date().toISOString())
      .maybeSingle();

    // Get reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('business_id', trainer.id)
      .eq('moderation_status', 'approved');

    const averageRating = reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    const totalReviews = reviews?.length || 0;

    // Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          trainer,
          featured: featured || null,
          stats: {
            total_reviews: totalReviews,
            average_rating: Math.round(averageRating * 10) / 10,
            featured_status: featured?.status || null,
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
      formatErrorResponse(apiError as any, apiError.message || 'Failed to get trainer profile'),
      {
        status: apiError instanceof UnauthorizedError || apiError instanceof ForbiddenError || apiError instanceof NotFoundError ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
