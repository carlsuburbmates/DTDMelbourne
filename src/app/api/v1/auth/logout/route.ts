// ============================================================================
// DTD Phase 2: API Contract - Logout User
// File: src/app/api/v1/auth/logout/route.ts
// Description: Logout user
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { logoutUser } from '@/lib/auth';
import {
  logoutRequestSchema,
  validateRequestBody,
} from '@/lib/validation';
import {
  formatErrorResponse,
  BadRequestError,
} from '@/lib/errors';
import { RateLimiters, getClientIp, checkRateLimitOrThrow, formatRateLimitHeaders } from '@/lib/rate-limit';
import type { LogoutRequest } from '@/types/api';

/**
 * POST /api/v1/auth/logout - Logout user
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimitOrThrow(RateLimiters.auth, ip);

    // Parse and validate request body
    const body = await request.json();
    const validatedBody = validateRequestBody(
      logoutRequestSchema,
      body
    ) as LogoutRequest;

    // Logout user
    await logoutUser(validatedBody.refresh_token);

    // Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          message: 'Logged out successfully',
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
      formatErrorResponse(apiError as any, apiError.message || 'Failed to logout'),
      {
        status: apiError instanceof BadRequestError ? 400 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
