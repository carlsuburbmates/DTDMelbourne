// ============================================================================
// DTD Phase 5: Operations - Health Alert Resolve API
// File: src/app/api/v1/admin/health/alerts/[id]/resolve/route.ts
// Description: Resolve health alert
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import HealthMonitoringService from '@/lib/health-monitoring';
import {
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
  logError,
  formatErrorResponse,
} from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/admin/health/alerts/[id]/resolve
 * Resolve health alert
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    // TODO: Verify JWT token and extract user role
    // For now, we'll skip actual verification

    const { id } = await params;

    if (!id) {
      throw new BadRequestError('Alert ID is required');
    }

    const body = await request.json();

    if (!body.resolved_by || !body.resolution_notes) {
      throw new BadRequestError('resolved_by and resolution_notes are required');
    }

    const healthService = new HealthMonitoringService();
    const alert = await healthService.resolveHealthAlert(
      id,
      body.resolved_by,
      body.resolution_notes
    );

    return NextResponse.json({
      success: true,
      data: alert,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID(),
        version: '1.0.0',
      },
    });
  } catch (error) {
    logError(error, { method: 'POST', path: '/api/v1/admin/health/alerts/[id]/resolve' });

    if (error instanceof UnauthorizedError) {
      return NextResponse.json(formatErrorResponse(error), { status: 401 });
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(formatErrorResponse(error), { status: 404 });
    }

    if (error instanceof BadRequestError) {
      return NextResponse.json(formatErrorResponse(error), { status: 400 });
    }

    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}
