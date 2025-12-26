// ============================================================================
// DTD Phase 5: Operations - Admin Dashboard Pending Actions API
// File: src/app/api/v1/admin/dashboard/pending/route.ts
// Description: Get pending actions
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import AdminDashboardService from '@/lib/admin-dashboard';
import {
  UnauthorizedError,
  logError,
  formatErrorResponse,
} from '@/lib/errors';

/**
 * GET /api/v1/admin/dashboard/pending
 * Get pending actions
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
    const pendingActions = await dashboardService.getPendingActions();

    return NextResponse.json({
      success: true,
      data: pendingActions,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID(),
        version: '1.0.0',
        count: pendingActions.length,
      },
    });
  } catch (error) {
    logError(error, { method: 'GET', path: '/api/v1/admin/dashboard/pending' });

    if (error instanceof UnauthorizedError) {
      return NextResponse.json(formatErrorResponse(error), { status: 401 });
    }

    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}
