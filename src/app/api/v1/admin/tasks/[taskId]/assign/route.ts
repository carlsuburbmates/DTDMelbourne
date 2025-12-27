/**
 * Assign Task API Route
 * 
 * POST /api/v1/admin/tasks/[taskId]/assign - Assign a task to a user
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const body = await request.json();
    const { assignedTo } = body;

    if (!assignedTo || !assignedTo.trim()) {
      return NextResponse.json(
        { error: 'Assigned to user ID is required' },
        { status: 400 }
      );
    }

    // In a real implementation, this would update the database
    // For now, return success response
    console.log(`Task ${params.taskId} assigned to ${assignedTo}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error assigning task:', error);
    return NextResponse.json(
      { error: 'Failed to assign task' },
      { status: 500 }
    );
  }
}
