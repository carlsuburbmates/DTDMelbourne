// ============================================================================
// DTD Phase 2: API Contract - Login User
// File: src/app/api/v1/auth/login/route.ts
// Description: Login with email/password
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';
import {
  loginRequestSchema,
  validateRequestBody,
} from '@/lib/validation';
import {
  handleSupabaseError,
  formatErrorResponse,
  InvalidCredentialsError,
  BadRequestError,
} from '@/lib/errors';
import { RateLimiters, getClientIp, checkRateLimitOrThrow, formatRateLimitHeaders } from '@/lib/rate-limit';
import type { LoginRequest } from '@/types/api';

/**
 * POST /api/v1/auth/login - Login with email/password
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimitOrThrow(RateLimiters.auth, ip);

    // Parse and validate request body
    const body = await request.json();
    const validatedBody = validateRequestBody(
      loginRequestSchema,
      body
    ) as LoginRequest;

    // Login user
    const session = await loginUser(
      validatedBody.email,
      validatedBody.password
    );

    // Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          user: session.user,
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          requires_mfa: session.requires_mfa,
          mfa_method: session.mfa_method,
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
      formatErrorResponse(apiError as any, apiError.message || 'Failed to login'),
      {
        status: apiError instanceof InvalidCredentialsError || apiError instanceof BadRequestError ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
