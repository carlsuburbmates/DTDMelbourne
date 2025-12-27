/**
 * KPI API Route
 * 
 * GET /api/v1/admin/kpi - Returns KPI metrics for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdminKPI } from '../../../../../types/admin';

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, this would query the database
    // For now, return mock data
    const kpi: AdminKPI = {
      users: {
        total: 1250,
        active: 890,
        newThisWeek: 45,
      },
      bookings: {
        total: 3420,
        pending: 125,
        completed: 3150,
        cancelled: 145,
        revenue: 157500,
      },
      reviews: {
        total: 2890,
        pending: 45,
        approved: 2780,
        rejected: 65,
      },
      featured: {
        total: 120,
        pending: 15,
        approved: 95,
        rejected: 10,
      },
    };

    return NextResponse.json({ kpi });
  } catch (error) {
    console.error('Error fetching KPI:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KPI metrics' },
      { status: 500 }
    );
  }
}
