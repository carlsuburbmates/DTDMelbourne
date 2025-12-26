// ============================================================================
// DTD Phase 5: Operations - Admin Dashboard Overview API
// File: src/app/api/v1/admin/dashboard/overview/route.ts
// Description: Get dashboard overview statistics
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import AdminDashboardService from '@/lib/admin-dashboard';
import {
  UnauthorizedError,
  logError,
  formatErrorResponse,
} from '@/lib/errors';

/**
 * GET /api/v1/admin/dashboard/overview
 * Get dashboard overview statistics
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

    const dashboardService = new AdminDashboardService();
    const overview = await dashboardService.getDashboardOverview();

    return NextResponse.json({
      success: true,
      data: overview,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID(),
        version: '1.0.0',
      },
    });
  } catch (error) {
    logError(error, { method: 'GET', path: '/api/v1/admin/dashboard/overview' });

    if (error instanceof UnauthorizedError) {
      return NextResponse.json(formatErrorResponse(error), { status: 401 });
    }

    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}
