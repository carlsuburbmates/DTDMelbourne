// ============================================================================
// DTD Phase 5: Operations - Health Services API
// File: src/app/api/v1/admin/health/services/route.ts
// Description: Get service health
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
 * GET /api/v1/admin/health/services
 * Get service health
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

    const healthService = new HealthMonitoringService();

    if (serviceParam) {
      // Get specific service health
      const service = serviceParam as ServiceName;
      const serviceHealth = await healthService.getServiceHealth(service);

      return NextResponse.json({
        success: true,
        data: serviceHealth,
        meta: {
          timestamp: new Date().toISOString(),
          request_id: crypto.randomUUID(),
          version: '1.0.0',
        },
      });
    } else {
      // Get all service health
      const systemHealth = await healthService.getSystemHealth();

      return NextResponse.json({
        success: true,
        data: systemHealth.services,
        meta: {
          timestamp: new Date().toISOString(),
          request_id: crypto.randomUUID(),
          version: '1.0.0',
          count: systemHealth.services.length,
        },
      });
    }
  } catch (error) {
    logError(error, { method: 'GET', path: '/api/v1/admin/health/services' });

    if (error instanceof UnauthorizedError) {
      return NextResponse.json(formatErrorResponse(error), { status: 401 });
    }

    if (error instanceof BadRequestError) {
      return NextResponse.json(formatErrorResponse(error), { status: 400 });
    }

    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}
