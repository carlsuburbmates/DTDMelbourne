/**
 * User Behavior Analytics API Route
 * 
 * GET /api/v1/admin/analytics/user-behavior - Returns user behavior metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserBehaviorMetrics } from '../../../../../types/admin';

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, this would query the database
    // For now, return mock data
    const metrics: UserBehaviorMetrics = {
      pageViews: 45230,
      uniqueVisitors: 12500,
      avgSessionDuration: 245,
      bounceRate: 42.5,
      topPages: [
        { page: '/', views: 15230 },
        { page: '/trainers', views: 12450 },
        { page: '/trainer/[id]', views: 8920 },
        { page: '/search', views: 5430 },
        { page: '/reviews', views: 3200 },
      ],
    };

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Error fetching user behavior metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user behavior metrics' },
      { status: 500 }
    );
  }
}
