// ============================================================================
// DTD Phase 2: API Contract - Purchase Featured Placement
// File: src/app/api/v1/trainer/featured/purchase/route.ts
// Description: Purchase featured placement ($20)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase, verifyAccessToken, isTrainer } from '@/lib/auth';
import {
  purchaseFeaturedRequestSchema,
  validateRequestBody,
} from '@/lib/validation';
import {
  handleSupabaseError,
  formatErrorResponse,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  PaymentFailedError,
} from '@/lib/errors';
import { RateLimiters, getClientIp, checkRateLimitOrThrow, formatRateLimitHeaders } from '@/lib/rate-limit';
import type { PurchaseFeaturedRequest } from '@/types/api';

/**
 * POST /api/v1/trainer/featured/purchase - Purchase featured placement
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
      throw new ForbiddenError('Only trainers can purchase featured placements');
    }

    // Get trainer's business profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('businesses')
      .select('id, name, email')
      .eq('resource_type', 'trainer')
      .eq('email', user.email)
      .eq('deleted_at', null)
      .single();

    if (fetchError || !existingProfile) {
      throw new NotFoundError('Trainer profile not found');
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedBody = validateRequestBody(
      purchaseFeaturedRequestSchema,
      body
    ) as PurchaseFeaturedRequest;

    // Check if trainer already has active featured placement
    const { data: activeFeatured } = await supabase
      .from('featured_placements')
      .select('id')
      .eq('business_id', existingProfile.id)
      .eq('status', 'active')
      .gte('start_date', new Date().toISOString())
      .lte('end_date', new Date().toISOString())
      .maybeSingle();

    if (activeFeatured) {
      throw new ForbiddenError('Trainer already has an active featured placement');
    }

    // Check if trainer is already in queue
    const { data: queuedFeatured } = await supabase
      .from('featured_placements')
      .select('id')
      .eq('business_id', existingProfile.id)
      .eq('status', 'queued')
      .maybeSingle();

    if (queuedFeatured) {
      throw new ForbiddenError('Trainer is already in the featured queue');
    }

    // Calculate amount ($20 per day)
    const amount = validatedBody.duration_days * 2000; // $20 = 2000 cents

    // Create Stripe payment intent (placeholder - integrate with Stripe)
    // TODO: Integrate with Stripe API
    const paymentIntentId = `pi_${Date.now()}_${existingProfile.id}`;
    const clientSecret = `pi_${Date.now()}_secret_${existingProfile.id}`;

    // Create featured placement record
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + validatedBody.duration_days);

    const { data: featuredPlacement, error } = await supabase
      .from('featured_placements')
      .insert({
        business_id: existingProfile.id,
        council_id: validatedBody.council_id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        amount: amount,
        currency: 'aud',
        status: 'queued',
        payment_intent_id: paymentIntentId,
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
          featured_placement: featuredPlacement,
          payment_intent_id: paymentIntentId,
          client_secret: clientSecret,
          amount: amount,
          currency: 'aud',
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
      formatErrorResponse(apiError as any, apiError.message || 'Failed to purchase featured placement'),
      {
        status: apiError instanceof UnauthorizedError || apiError instanceof ForbiddenError || apiError instanceof NotFoundError ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
