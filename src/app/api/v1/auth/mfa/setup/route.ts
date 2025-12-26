// ============================================================================
// DTD Phase 2: API Contract - Setup MFA
// File: src/app/api/v1/auth/mfa/setup/route.ts
// Description: Setup MFA (TOTP for admin, OTP for trainer)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase, verifyAccessToken, isAdmin, isTrainer, setupAdminTotp, setupTrainerOtp } from '@/lib/auth';
import {
  setupMfaRequestSchema,
  validateRequestBody,
} from '@/lib/validation';
import {
  handleSupabaseError,
  formatErrorResponse,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
} from '@/lib/errors';
import { RateLimiters, getClientIp, checkRateLimitOrThrow, formatRateLimitHeaders } from '@/lib/rate-limit';
import type { SetupMfaRequest, SetupMfaResponse } from '@/types/api';

/**
 * POST /api/v1/auth/mfa/setup - Setup MFA
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimitOrThrow(RateLimiters.auth, ip);

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      throw new UnauthorizedError('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await verifyAccessToken(token);

    // Parse and validate request body
    const body = await request.json();
    const validatedBody = validateRequestBody(
      setupMfaRequestSchema,
      body
    ) as SetupMfaRequest;

    // Check if MFA is already enabled
    const { data: existingMfa } = await supabase
      .from('user_mfa')
      .select('id, enabled')
      .eq('user_id', user.id)
      .eq('method', validatedBody.method)
      .maybeSingle();

    if (existingMfa && existingMfa.enabled) {
      throw new ForbiddenError('MFA is already enabled for this user');
    }

    let responseData: SetupMfaResponse;

    // Setup MFA based on method
    if (validatedBody.method === 'totp') {
      // Check if user is admin
      if (!isAdmin(user)) {
        throw new ForbiddenError('Only admins can setup TOTP');
      }

      // Setup TOTP for admin
      const totpResult = await setupAdminTotp(user.id);
      responseData = {
        secret: totpResult.secret,
        qr_code_url: totpResult.qr_code_url,
        backup_codes: totpResult.backup_codes,
        method: 'totp',
      };
    } else if (validatedBody.method === 'otp') {
      // Check if user is trainer
      if (!isTrainer(user)) {
        throw new ForbiddenError('Only trainers can setup OTP');
      }

      // Determine OTP method (email or SMS)
      const otpMethod = body.otp_method || 'email';

      // Setup OTP for trainer
      await setupTrainerOtp(user.id, otpMethod);
      responseData = {
        method: 'otp',
      };
    } else {
      throw new BadRequestError('Invalid MFA method');
    }

    // Return response
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
      formatErrorResponse(apiError as any, apiError.message || 'Failed to setup MFA'),
      {
        status: apiError instanceof UnauthorizedError || apiError instanceof ForbiddenError || apiError instanceof BadRequestError ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
