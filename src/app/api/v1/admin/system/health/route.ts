/**
 * System Health API Route
 * 
 * GET /api/v1/admin/system/health - Returns system health metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { SystemHealth } from '../../../../../types/admin';

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, this would query to system
    // For now, return mock data
    const health: SystemHealth = {
      cpu: 45.2,
      memory: 62.8,
      disk: 71.5,
      uptime: 2592000, // 30 days in seconds
      responseTime: 245,
    };

    return NextResponse.json({ health });
  } catch (error) {
    console.error('Error fetching system health:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system health' },
      { status: 500 }
    );
  }
}
