// ============================================================================
// DTD Phase 2: API Contract - Remove Service from Trainer Profile
// File: src/app/api/v1/trainer/services/[id]/route.ts
// Description: Remove service from trainer profile
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase, verifyAccessToken, isTrainer } from '@/lib/auth';
import {
  removeServiceRequestSchema,
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
import type { RemoveServiceRequest } from '@/types/api';

/**
 * DELETE /api/v1/trainer/services/[id] - Remove service from trainer profile
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      throw new ForbiddenError('Only trainers can remove services');
    }

    // Get trainer's business profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('businesses')
      .select('id, service_type_primary, service_type_secondary')
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
      removeServiceRequestSchema,
      body
    ) as RemoveServiceRequest;

    // Remove service
    let updateData: Record<string, unknown> = {};

    if (existingProfile.service_type_primary === validatedBody.service_type) {
      // Remove primary service
      updateData = {
        service_type_primary: null,
      };
    } else if (existingProfile.service_type_secondary?.includes(validatedBody.service_type)) {
      // Remove from secondary services
      const secondaryServices = existingProfile.service_type_secondary.filter(
        (s) => s !== validatedBody.service_type
      );
      updateData = {
        service_type_secondary: secondaryServices,
      };
    } else {
      throw new NotFoundError('Service not found in trainer profile');
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
          removed_service: validatedBody.service_type,
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
      formatErrorResponse(apiError as any, apiError.message || 'Failed to remove service'),
      {
        status: apiError instanceof UnauthorizedError || apiError instanceof ForbiddenError || apiError instanceof NotFoundError ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
