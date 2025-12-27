/**
 * Pending Featured Requests API Route
 * 
 * GET /api/v1/admin/featured/pending - Returns pending featured requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { FeaturedPlacement, PaginatedResponse } from '../../../../../types/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // In a real implementation, this would query the database
    // For now, return mock data
    const mockPlacements: FeaturedPlacement[] = [
      {
        id: '1',
        trainerId: 'trainer-1',
        status: 'pending',
        requestedAt: new Date('2025-12-20'),
      },
      {
        id: '2',
        trainerId: 'trainer-2',
        status: 'pending',
        requestedAt: new Date('2025-12-21'),
      },
    ];

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPlacements = mockPlacements.slice(startIndex, endIndex);

    const response: PaginatedResponse<FeaturedPlacement> = {
      data: paginatedPlacements,
      total: mockPlacements.length,
      page,
      limit,
      totalPages: Math.ceil(mockPlacements.length / limit),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching pending featured requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending featured requests' },
      { status: 500 }
    );
  }
}
