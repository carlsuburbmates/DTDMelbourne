/**
 * Trainer Verification API Route
 * 
 * POST /api/v1/admin/trainers/[trainerId]/verify - Verify or reject trainer
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { trainerId: string } }
) {
  try {
    const body = await request.json();
    const { status, rejectedReason } = body;

    if (!['verified', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be verified or rejected' },
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
    console.log(`Trainer ${params.trainerId} ${status}`, rejectedReason || '');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying trainer:', error);
    return NextResponse.json(
      { error: 'Failed to verify trainer' },
      { status: 500 }
    );
  }
}
