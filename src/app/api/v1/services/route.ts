// ============================================================================
// DTD Phase 2: API Contract - Services Endpoint
// File: src/app/api/v1/services/route.ts
// Description: List trainer services
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { RateLimiters, getClientIp, checkRateLimitOrThrow, formatRateLimitHeaders } from '@/lib/rate-limit';

/**
 * GET /api/v1/services - List trainer services
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimitOrThrow(RateLimiters.public, ip);

    // Return services list
    const services = [
      'Puppy training',
      'Obedience training',
      'Behaviour consultations',
      'Group classes',
      'Private training',
    ];

    // Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          services,
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
          message: apiError.message || 'Failed to get services',
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
