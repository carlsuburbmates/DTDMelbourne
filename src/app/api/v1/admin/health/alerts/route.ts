// ============================================================================
// DTD Phase 5: Operations - Health Alerts API
// File: src/app/api/v1/admin/health/alerts/route.ts
// Description: Get and create health alerts
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import HealthMonitoringService from '@/lib/health-monitoring';
import {
  UnauthorizedError,
  BadRequestError,
  logError,
  formatErrorResponse,
} from '@/lib/errors';
import type { CreateHealthAlertInput } from '@/lib/health-monitoring';

/**
 * GET /api/v1/admin/health/alerts
 * Get health alerts
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
    const statusParam = searchParams.get('status');
    const serviceParam = searchParams.get('service');

    const healthService = new HealthMonitoringService();

    const alerts = await healthService.getHealthAlerts(
      statusParam as 'active' | 'resolved' | 'all' || 'all',
      serviceParam as any || undefined
    );

    return NextResponse.json({
      success: true,
      data: alerts,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID(),
        version: '1.0.0',
        count: alerts.length,
      },
    });
  } catch (error) {
    logError(error, { method: 'GET', path: '/api/v1/admin/health/alerts' });

    if (error instanceof UnauthorizedError) {
      return NextResponse.json(formatErrorResponse(error), { status: 401 });
    }

    if (error instanceof BadRequestError) {
      return NextResponse.json(formatErrorResponse(error), { status: 400 });
    }

    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}

/**
 * POST /api/v1/admin/health/alerts
 * Create health alert
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    // TODO: Verify JWT token and extract user role
    // For now, we'll skip actual verification

    const body = await request.json();

    // Validate required fields
    if (!body.service || !body.severity || !body.title || !body.message) {
      throw new BadRequestError('Missing required fields: service, severity, title, message');
    }

    const input: CreateHealthAlertInput = {
      service: body.service,
      severity: body.severity,
      title: body.title,
      message: body.message,
      details: body.details || undefined,
    };

    const healthService = new HealthMonitoringService();
    const alert = await healthService.createHealthAlert(input);

    return NextResponse.json({
      success: true,
      data: alert,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID(),
        version: '1.0.0',
      },
    }, { status: 201 });
  } catch (error) {
    logError(error, { method: 'POST', path: '/api/v1/admin/health/alerts' });

    if (error instanceof UnauthorizedError) {
      return NextResponse.json(formatErrorResponse(error), { status: 401 });
    }

    if (error instanceof BadRequestError) {
      return NextResponse.json(formatErrorResponse(error), { status: 400 });
    }

    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}
