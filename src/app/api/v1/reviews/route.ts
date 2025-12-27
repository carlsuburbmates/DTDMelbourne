/**
 * API route for submitting new reviews
 * POST /api/v1/reviews
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReviewSubmission } from '../../../types/reviews';
import { validateReviewSubmission } from '../../../services/reviews';

export async function POST(request: NextRequest) {
  try {
    const body: ReviewSubmission = await request.json();

    // Validate submission
    const validation = validateReviewSubmission(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // TODO: Replace with actual database insertion
    // This is a placeholder implementation
    const reviewId = `review_${Date.now()}`;

    return NextResponse.json({
      success: true,
      id: reviewId,
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
