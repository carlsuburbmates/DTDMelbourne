/**
 * Tasks API Route
 * 
 * GET /api/v1/admin/tasks - Returns admin tasks
 * POST /api/v1/admin/tasks - Creates a new task
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdminTask } from '../../../../../types/admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;

    // In a real implementation, this would query to database
    // For now, return mock data
    const mockTasks: AdminTask[] = [
      {
        id: '1',
        title: 'Review pending trainer verifications',
        description: 'Review and verify all pending trainer applications',
        priority: 'high',
        status: 'pending',
        dueDate: new Date('2025-12-30'),
      },
      {
        id: '2',
        title: 'Update featured placement pricing',
        description: 'Review and update pricing for featured placements',
        priority: 'medium',
        status: 'in_progress',
        assignedTo: 'admin-1',
        dueDate: new Date('2025-12-28'),
      },
      {
        id: '3',
        title: 'Review emergency logs',
        description: 'Review recent emergency events and AI performance',
        priority: 'low',
        status: 'completed',
        completedAt: new Date('2025-12-25'),
      },
    ];

    let filteredTasks = mockTasks;
    if (status && status !== 'all') {
      filteredTasks = mockTasks.filter((t) => t.status === status);
    }
    if (priority && priority !== 'all') {
      filteredTasks = filteredTasks.filter((t) => t.priority === priority);
    }

    return NextResponse.json({ tasks: filteredTasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, priority, dueDate } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }

    // In a real implementation, this would insert into database
    // For now, return success response
    const newTask: AdminTask = {
      id: `task-${Date.now()}`,
      title,
      description: description || '',
      priority: priority || 'medium',
      status: 'pending',
      dueDate: dueDate ? new Date(dueDate) : undefined,
    };

    console.log('Creating task:', newTask);

    return NextResponse.json({ success: true, id: newTask.id });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
