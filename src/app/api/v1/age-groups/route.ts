// ============================================================================
// DTD Phase 2: API Contract - Age Groups Endpoint
// File: src/app/api/v1/age-groups/route.ts
// Description: List dog age groups
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { RateLimiters, getClientIp, checkRateLimitOrThrow, formatRateLimitHeaders } from '@/lib/rate-limit';

/**
 * GET /api/v1/age-groups - List dog age groups
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimitOrThrow(RateLimiters.public, ip);

    // Return age groups list
    const ageGroups = [
      'Puppies (0–6m)',
      'Adolescent (6–18m)',
      'Adult (18m–7y)',
      'Senior (7y+)',
      'Rescue',
    ];

    // Return response
    return NextResponse.json(
      {
        success: true,
        data: {
          age_groups: ageGroups,
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
          message: apiError.message || 'Failed to get age groups',
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
