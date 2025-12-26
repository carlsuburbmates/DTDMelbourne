// ============================================================================
// DTD Phase 5: Operations - Admin Dashboard Stats API
// File: src/app/api/v1/admin/dashboard/stats/route.ts
// Description: Get dashboard statistics
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
 * GET /api/v1/admin/dashboard/stats
 * Get dashboard statistics
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
    const type = searchParams.get('type');

    const dashboardService = new AdminDashboardService();

    let stats;
    switch (type) {
      case 'trainers':
        stats = await dashboardService.getTrainerStats();
        break;
      case 'reviews':
        stats = await dashboardService.getReviewStats();
        break;
      case 'payments':
        stats = await dashboardService.getPaymentStats();
        break;
      case 'emergency':
        stats = await dashboardService.getEmergencyStats();
        break;
      case 'featured':
        stats = await dashboardService.getFeaturedStats();
        break;
      case null:
      case undefined:
        // Return all stats
        stats = {
          trainers: await dashboardService.getTrainerStats(),
          reviews: await dashboardService.getReviewStats(),
          payments: await dashboardService.getPaymentStats(),
          emergency: await dashboardService.getEmergencyStats(),
          featured: await dashboardService.getFeaturedStats(),
        };
        break;
      default:
        throw new BadRequestError(`Invalid stats type: ${type}`);
    }

    return NextResponse.json({
      success: true,
      data: stats,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID(),
        version: '1.0.0',
      },
    });
  } catch (error) {
    logError(error, { method: 'GET', path: '/api/v1/admin/dashboard/stats' });

    if (error instanceof UnauthorizedError) {
      return NextResponse.json(formatErrorResponse(error), { status: 401 });
    }

    if (error instanceof BadRequestError) {
      return NextResponse.json(formatErrorResponse(error), { status: 400 });
    }

    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}
