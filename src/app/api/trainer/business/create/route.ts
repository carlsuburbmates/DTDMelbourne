// ============================================================================
// DTD: Trainer Business Create Endpoint (SSOT_FINAL)
// File: src/app/api/trainer/business/create/route.ts
// Description: Create trainer business listing
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyAccessToken, isTrainer } from '@/lib/auth';
import { createBusinessRequestSchema, validateRequestBody } from '@/lib/validation';
import {
  handleSupabaseError,
  formatErrorResponse,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
} from '@/lib/errors';
import {
  RateLimiters,
  getClientIp,
  checkRateLimitOrThrow,
  formatRateLimitHeaders,
} from '@/lib/rate-limit';
import type { CreateBusinessRequest } from '@/types/api';

/**
 * POST /api/trainer/business/create - Create trainer business listing
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimitOrThrow(RateLimiters.trainer, ip);

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      throw new UnauthorizedError('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await verifyAccessToken(token);

    if (!isTrainer(user)) {
      throw new ForbiddenError('Only trainers can create listings');
    }

    const body = await request.json();
    const validatedBody = validateRequestBody(
      createBusinessRequestSchema,
      body
    ) as CreateBusinessRequest;

    const { data: suburb, error: suburbError } = await supabaseAdmin
      .from('suburbs')
      .select('id, council_id, region')
      .ilike('name', validatedBody.suburb)
      .limit(1)
      .maybeSingle();

    if (suburbError) {
      throw handleSupabaseError(suburbError);
    }

    if (!suburb) {
      throw new BadRequestError('Suburb not found');
    }

    const { data: existingBusiness } = await supabaseAdmin
      .from('businesses')
      .select('id')
      .eq('user_id', user.id)
      .eq('deleted', false)
      .maybeSingle();

    if (existingBusiness) {
      throw new ForbiddenError('Trainer already has a business listing');
    }

    const { data: business, error } = await supabaseAdmin
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
      .select('id')
      .single();

    if (error || !business) {
      throw handleSupabaseError(error);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          business_id: business.id,
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
      formatErrorResponse(apiError as any, apiError.message || 'Failed to create business'),
      {
        status:
          apiError instanceof UnauthorizedError ||
          apiError instanceof ForbiddenError ||
          apiError instanceof BadRequestError
            ? 401
            : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
