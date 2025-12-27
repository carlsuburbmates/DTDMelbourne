/**
 * Trainer Featured Placement API Route
 * 
 * POST /api/v1/admin/trainers/[trainerId]/featured - Approve or reject featured placement
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { trainerId: string } }
) {
  try {
    const body = await request.json();
    const { status, rejectedReason } = body;

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be approved or rejected' },
        { status: 400 }
      );
    }

    if (status === 'rejected' && !rejectedReason) {
      return NextResponse.json(
        { error: 'Rejected reason is required when rejecting' },
        { status: 400 }
      );
    }

    // In a real implementation, this would update the database
    // For now, return success response
    console.log(`Trainer ${params.trainerId} featured ${status}`, rejectedReason || '');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error approving featured placement:', error);
    return NextResponse.json(
      { error: 'Failed to approve featured placement' },
      { status: 500 }
    );
  }
}
