/**
 * Payment Audit API Route
 * 
 * GET /api/v1/admin/payments/audit - Returns payment audit records
 */

import { NextRequest, NextResponse } from 'next/server';
import { PaymentAudit } from '../../../../../types/admin';

export async function GET(request: NextRequest) {
  try {
    // In a real implementation, this would query to database
    // For now, return mock data
    const mockAudits: PaymentAudit[] = [
      {
        id: '1',
        bookingId: 'booking-1',
        amount: 5000,
        status: 'completed',
        timestamp: new Date('2025-12-20T10:00:00Z'),
      },
      {
        id: '2',
        bookingId: 'booking-2',
        amount: 7500,
        status: 'pending',
        timestamp: new Date('2025-12-21T14:30:00Z'),
      },
      {
        id: '3',
        bookingId: 'booking-3',
        amount: 3000,
        status: 'refunded',
        timestamp: new Date('2025-12-22T09:15:00Z'),
      },
    ];

    return NextResponse.json({ audits: mockAudits });
  } catch (error) {
    console.error('Error fetching payment audit:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment audit' },
      { status: 500 }
    );
  }
}
