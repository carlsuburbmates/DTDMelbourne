// ============================================================================
// DTD P2 Phase 3: Advanced Search - Geolocation API
// File: src/app/api/v1/search/geolocation/route.ts
// Description: GET geolocation by IP
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  RateLimiters,
  getClientIp,
  checkRateLimitOrThrow,
  formatRateLimitHeaders,
} from '@/lib/rate-limit';
import type { GeolocationResult } from '@/types/search';

/**
 * GET /api/v1/search/geolocation - Get geolocation by IP
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimitOrThrow(
      RateLimiters.public,
      ip
    );

    // Get IP from request
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    ip;

    // Use IP geolocation service
    const geoData = await getIPGeolocation(clientIp);

    return NextResponse.json(
      {
        success: true,
        data: geoData,
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
        error: apiError.message || 'Failed to get geolocation',
      },
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Get geolocation data from IP
 */
async function getIPGeolocation(ip: string): Promise<GeolocationResult> {
  try {
    // Use ipapi.co for IP geolocation (free tier)
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    
    if (!response.ok) {
      throw new Error(`IP geolocation failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      accuracy: 50000, // IP geolocation is less accurate
      method: 'ip',
      city: data.city,
      region: data.region,
      country: data.country_name,
    };
  } catch (error) {
    console.error('Failed to get IP geolocation:', error);
    
    // Fallback to default location (Melbourne, Australia)
    return {
      latitude: -37.8136,
      longitude: 144.9631,
      accuracy: 100000,
      method: 'ip',
      city: 'Melbourne',
      region: 'Victoria',
      country: 'Australia',
    };
  }
}
