// ============================================================================
// DTD Phase 5: Operations - Health History API
// File: src/app/api/v1/admin/health/history/route.ts
// Description: Get health history
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import HealthMonitoringService from '@/lib/health-monitoring';
import {
  UnauthorizedError,
  BadRequestError,
  logError,
  formatErrorResponse,
} from '@/lib/errors';
import type { ServiceName } from '@/lib/health-monitoring';

/**
 * GET /api/v1/admin/health/history
 * Get health history
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const serviceParam = searchParams.get('service');
    const hoursParam = searchParams.get('hours');

    const hours = hoursParam ? parseInt(hoursParam, 10) : 24;

    if (isNaN(hours) || hours < 1 || hours > 168) {
      throw new BadRequestError('Hours must be between 1 and 168 (7 days)');
    }

    const healthService = new HealthMonitoringService();

    let history;
    if (serviceParam) {
      const service = serviceParam as ServiceName;
      history = await healthService.getHealthHistory(service, hours);
    } else {
      history = await healthService.getHealthHistory(undefined, hours);
    }

    return NextResponse.json({
      success: true,
      data: history,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID(),
        version: '1.0.0',
        count: history.length,
        hours,
      },
    });
  } catch (error) {
    logError(error, { method: 'GET', path: '/api/v1/admin/health/history' });

    if (error instanceof UnauthorizedError) {
      return NextResponse.json(formatErrorResponse(error), { status: 401 });
    }

    if (error instanceof BadRequestError) {
      return NextResponse.json(formatErrorResponse(error), { status: 400 });
    }

    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}
