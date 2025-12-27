/**
 * Trainers API Route
 * 
 * GET /api/v1/admin/trainers - Returns trainers with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { TrainerWithVerification, PaginatedResponse } from '../../../../../types/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // In a real implementation, this would query the database
    // For now, return mock data
    const mockTrainers: TrainerWithVerification[] = [
      {
        id: '1',
        name: 'John Smith',
        email: 'john.smith@example.com',
        verificationStatus: 'pending',
        submittedAt: new Date('2025-12-20'),
      },
      {
        id: '2',
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        verificationStatus: 'verified',
        submittedAt: new Date('2025-12-15'),
        verifiedAt: new Date('2025-12-16'),
      },
      {
        id: '3',
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        verificationStatus: 'rejected',
        submittedAt: new Date('2025-12-18'),
        rejectedReason: 'Insufficient documentation',
      },
    ];

    let filteredTrainers = mockTrainers;
    if (status && status !== 'all') {
      filteredTrainers = mockTrainers.filter((t) => t.verificationStatus === status);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTrainers = filteredTrainers.slice(startIndex, endIndex);

    const response: PaginatedResponse<TrainerWithVerification> = {
      data: paginatedTrainers,
      total: filteredTrainers.length,
      page,
      limit,
      totalPages: Math.ceil(filteredTrainers.length / limit),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching trainers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trainers' },
      { status: 500 }
    );
  }
}
