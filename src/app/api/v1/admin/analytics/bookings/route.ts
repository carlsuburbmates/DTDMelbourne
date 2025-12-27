/**
 * Booking Analytics API Route
 * 
 * GET /api/v1/admin/analytics/bookings - Returns booking metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { BookingMetrics } from '../../../../../types/admin';

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, this would query to database
    // For now, return mock data
    const metrics: BookingMetrics = {
      totalBookings: 3420,
      completedBookings: 3150,
      cancelledBookings: 145,
      averageBookingValue: 50.0,
      bookingsByDay: [
        { date: '2025-12-20', count: 45 },
        { date: '2025-12-21', count: 52 },
        { date: '2025-12-22', count: 48 },
        { date: '2025-12-23', count: 61 },
        { date: '2025-12-24', count: 55 },
        { date: '2025-12-25', count: 49 },
        { date: '2025-12-26', count: 58 },
        { date: '2025-12-27', count: 62 },
      ],
    };

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Error fetching booking metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking metrics' },
      { status: 500 }
    );
  }
}
