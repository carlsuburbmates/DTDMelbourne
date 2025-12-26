// ============================================================================
// DTD Phase 5: Operations - Health Monitoring API
// File: src/app/api/v1/admin/health/route.ts
// Description: Get system health
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import HealthMonitoringService from '@/lib/health-monitoring';
import {
  UnauthorizedError,
  logError,
  formatErrorResponse,
} from '@/lib/errors';

/**
 * GET /api/v1/admin/health
 * Get system health
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    // TODO: Verify JWT token and extract user role
    // For now, we'll skip actual verification

    const healthService = new HealthMonitoringService();
    const systemHealth = await healthService.getSystemHealth();

    return NextResponse.json({
      success: true,
      data: systemHealth,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID(),
        version: '1.0.0',
      },
    });
  } catch (error) {
    logError(error, { method: 'GET', path: '/api/v1/admin/health' });

    if (error instanceof UnauthorizedError) {
      return NextResponse.json(formatErrorResponse(error), { status: 401 });
    }

    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}
