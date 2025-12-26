// ============================================================================
// DTD Phase 2: API Contract - Refresh Access Token
// File: src/app/api/v1/auth/refresh/route.ts
// Description: Refresh access token
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken } from '@/lib/auth';
import {
  refreshTokenRequestSchema,
  validateRequestBody,
} from '@/lib/validation';
import {
  handleSupabaseError,
  formatErrorResponse,
  BadRequestError,
} from '@/lib/errors';
import { RateLimiters, getClientIp, checkRateLimitOrThrow, formatRateLimitHeaders } from '@/lib/rate-limit';
import type { RefreshTokenRequest } from '@/types/api';

/**
 * POST /api/v1/auth/refresh - Refresh access token
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimitOrThrow(RateLimiters.auth, ip);

    // Parse and validate request body
    const body = await request.json();
    const validatedBody = validateRequestBody(
      refreshTokenRequestSchema,
      body
    ) as RefreshTokenRequest;

    // Refresh access token
    const session = await refreshAccessToken(validatedBody.refresh_token);

    // Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
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
      formatErrorResponse(apiError as any, apiError.message || 'Failed to refresh token'),
      {
        status: apiError instanceof BadRequestError ? 400 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
