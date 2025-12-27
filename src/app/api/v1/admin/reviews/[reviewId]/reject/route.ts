/**
 * Reject Review API Route
 * 
 * POST /api/v1/admin/reviews/[reviewId]/reject - Reject a review
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
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

    // In a real implementation, this would update the database
    // For now, return success response
    console.log(`Review ${params.reviewId} rejected`, rejectedReason);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error rejecting review:', error);
    return NextResponse.json(
      { error: 'Failed to reject review' },
      { status: 500 }
    );
  }
}
