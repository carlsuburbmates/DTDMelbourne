// ============================================================================
// DTD Phase 2: API Contract - Add Service to Trainer Profile
// File: src/app/api/v1/trainer/services/route.ts
// Description: Add service to trainer profile
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase, verifyAccessToken, isTrainer } from '@/lib/auth';
import {
  addServiceRequestSchema,
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
import type { AddServiceRequest } from '@/types/api';

/**
 * POST /api/v1/trainer/services - Add service to trainer profile
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
      throw new ForbiddenError('Only trainers can add services');
    }

    // Get trainer's business profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('businesses')
      .select('id, service_type_primary, service_type_secondary')
      .eq('user_id', user.id)
      .eq('deleted', false)
      .single();

    if (fetchError || !existingProfile) {
      throw new NotFoundError('Trainer profile not found');
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedBody = validateRequestBody(
      addServiceRequestSchema,
      body
    ) as AddServiceRequest;

    // Check if service already exists
    if (existingProfile.service_type_primary === validatedBody.service_type) {
      throw new ForbiddenError('Service already set as primary');
    }

    if (existingProfile.service_type_secondary?.includes(validatedBody.service_type)) {
      throw new ForbiddenError('Service already exists in secondary services');
    }

    // Add service
    let updateData: Record<string, unknown> = {};

    if (validatedBody.is_primary) {
      // Move current primary to secondary if exists
      const secondaryServices = existingProfile.service_type_secondary || [];
      if (existingProfile.service_type_primary) {
        secondaryServices.push(existingProfile.service_type_primary);
      }
      updateData = {
        service_type_primary: validatedBody.service_type,
        service_type_secondary: secondaryServices,
      };
    } else {
      // Add to secondary services
      const secondaryServices = existingProfile.service_type_secondary || [];
      secondaryServices.push(validatedBody.service_type);
      updateData = {
        service_type_secondary: secondaryServices,
      };
    }

    const { data: trainer, error } = await supabase
      .from('businesses')
      .update(updateData)
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
          added_service: validatedBody.service_type,
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
      formatErrorResponse(apiError as any, apiError.message || 'Failed to add service'),
      {
        status: apiError instanceof UnauthorizedError || apiError instanceof ForbiddenError || apiError instanceof NotFoundError ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
