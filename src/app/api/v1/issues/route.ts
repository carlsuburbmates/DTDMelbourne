// ============================================================================
// DTD Phase 2: API Contract - Issues Endpoint
// File: src/app/api/v1/issues/route.ts
// Description: List dog behavior issues
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { RateLimiters, getClientIp, checkRateLimitOrThrow, formatRateLimitHeaders } from '@/lib/rate-limit';

/**
 * GET /api/v1/issues - List dog behavior issues
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimitOrThrow(RateLimiters.public, ip);

    // Return issues list
    const issues = [
      'Pulling on lead',
      'Separation anxiety',
      'Barking',
      'Aggression',
      'Jumping up on people',
      'Recall issues',
      'Socialisation',
      'Chewing',
      'Digging',
      'House training',
      'Fear/phobias',
      'Other',
    ];

    // Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          issues,
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
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: apiError.message || 'Failed to get issues',
          timestamp: new Date().toISOString(),
        },
      },
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
