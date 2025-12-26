// ============================================================================
// DTD Phase 5: Operations - Admin Dashboard Activity API
// File: src/app/api/v1/admin/dashboard/activity/route.ts
// Description: Get recent activity log
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import AdminDashboardService from '@/lib/admin-dashboard';
import {
  UnauthorizedError,
  BadRequestError,
  logError,
  formatErrorResponse,
} from '@/lib/errors';

/**
 * GET /api/v1/admin/dashboard/activity
 * Get recent activity log
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
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    if (isNaN(limit) || limit < 1 || limit > 100) {
      throw new BadRequestError('Limit must be between 1 and 100');
    }

    const dashboardService = new AdminDashboardService();
    const activity = await dashboardService.getRecentActivity(limit);

    return NextResponse.json({
      success: true,
      data: activity,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID(),
        version: '1.0.0',
        count: activity.length,
      },
    });
  } catch (error) {
    logError(error, { method: 'GET', path: '/api/v1/admin/dashboard/activity' });

    if (error instanceof UnauthorizedError) {
      return NextResponse.json(formatErrorResponse(error), { status: 401 });
    }

    if (error instanceof BadRequestError) {
      return NextResponse.json(formatErrorResponse(error), { status: 400 });
    }

    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}
