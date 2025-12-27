/**
 * Reject Featured Placement API Route
 * 
 * POST /api/v1/admin/featured/[placementId]/reject - Reject featured placement
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { placementId: string } }
) {
  try {
    const body = await request.json();
    const { rejectedReason } = body;

    if (!rejectedReason) {
      return NextResponse.json(
        { error: 'Rejected reason is required' },
        { status: 400 }
      );
    }

    // In a real implementation, this would update to database
    // For now, return success response
    console.log(`Featured placement ${params.placementId} rejected`, rejectedReason);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error rejecting featured placement:', error);
    return NextResponse.json(
      { error: 'Failed to reject featured placement' },
      { status: 500 }
    );
  }
}
