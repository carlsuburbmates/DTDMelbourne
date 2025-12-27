/**
 * Pending Reviews API Route
 * 
 * GET /api/v1/admin/reviews/pending - Returns pending reviews
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReviewWithModeration, PaginatedResponse } from '../../../../../types/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // In a real implementation, this would query the database
    // For now, return mock data
    const mockReviews: ReviewWithModeration[] = [
      {
        id: '1',
        trainerId: 'trainer-1',
        userId: 'user-1',
        rating: 5,
        comment: 'Excellent trainer! Very professional and knowledgeable.',
        status: 'pending',
        timestamp: new Date('2025-12-25'),
      },
      {
        id: '2',
        trainerId: 'trainer-2',
        userId: 'user-2',
        rating: 4,
        comment: 'Great experience with my dog.',
        status: 'pending',
        timestamp: new Date('2025-12-24'),
      },
    ];

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedReviews = mockReviews.slice(startIndex, endIndex);

    const response: PaginatedResponse<ReviewWithModeration> = {
      data: paginatedReviews,
      total: mockReviews.length,
      page,
      limit,
      totalPages: Math.ceil(mockReviews.length / limit),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending reviews' },
      { status: 500 }
    );
  }
}
