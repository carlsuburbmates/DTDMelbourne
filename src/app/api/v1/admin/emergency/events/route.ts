/**
 * Emergency Events API Route
 * 
 * GET /api/v1/admin/emergency/events - Returns emergency events
 */

import { NextRequest, NextResponse } from 'next/server';
import { EmergencyEvent } from '../../../../../types/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // In a real implementation, this would query to database
    // For now, return mock data
    const mockEvents: EmergencyEvent[] = [
      {
        id: '1',
        type: 'AI Response Timeout',
        severity: 'high',
        description: 'AI assistant failed to respond within timeout threshold',
        timestamp: new Date('2025-12-26T10:30:00Z'),
        resolved: false,
      },
      {
        id: '2',
        type: 'Database Connection Error',
        severity: 'medium',
        description: 'Temporary database connection issue resolved automatically',
        timestamp: new Date('2025-12-25T14:20:00Z'),
        resolved: true,
      },
      {
        id: '3',
        type: 'API Rate Limit Exceeded',
        severity: 'low',
        description: 'Rate limit warning for search API',
        timestamp: new Date('2025-12-24T09:15:00Z'),
        resolved: true,
      },
    ];

    const limitedEvents = mockEvents.slice(0, limit);

    return NextResponse.json({ events: limitedEvents });
  } catch (error) {
    console.error('Error fetching emergency events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emergency events' },
      { status: 500 }
    );
  }
}
