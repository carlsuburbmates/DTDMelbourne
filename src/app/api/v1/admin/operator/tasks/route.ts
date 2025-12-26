// ============================================================================
// DTD Phase 5: Operations - Operator Tasks API
// File: src/app/api/v1/admin/operator/tasks/route.ts
// Description: Get and create operator tasks
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import OperatorWorkflowService from '@/lib/operator-workflow';
import {
  UnauthorizedError,
  BadRequestError,
  logError,
  formatErrorResponse,
} from '@/lib/errors';
import type { CreateTaskInput, TaskFilter } from '@/lib/operator-workflow';

/**
 * GET /api/v1/admin/operator/tasks
 * Get operator tasks
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    // TODO: Verify JWT token and extract user role
    // For now, we'll skip actual verification

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const filter: TaskFilter = {};

    if (searchParams.get('status')) {
      filter.status = searchParams.get('status') as any;
    }
    if (searchParams.get('type')) {
      filter.type = searchParams.get('type') as any;
    }
    if (searchParams.get('priority')) {
      filter.priority = searchParams.get('priority') as any;
    }
    if (searchParams.get('assigned_to')) {
      filter.assigned_to = searchParams.get('assigned_to');
    }
    if (searchParams.get('created_by')) {
      filter.created_by = searchParams.get('created_by');
    }
    if (searchParams.get('entity_type')) {
      filter.entity_type = searchParams.get('entity_type');
    }
    if (searchParams.get('entity_id')) {
      filter.entity_id = searchParams.get('entity_id');
    }
    if (searchParams.get('date_from')) {
      filter.date_from = new Date(searchParams.get('date_from')!);
    }
    if (searchParams.get('date_to')) {
      filter.date_to = new Date(searchParams.get('date_to')!);
    }

    const workflowService = new OperatorWorkflowService();
    const tasks = await workflowService.getOperatorTasks(filter);

    return NextResponse.json({
      success: true,
      data: tasks,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID(),
        version: '1.0.0',
        count: tasks.length,
      },
    });
  } catch (error) {
    logError(error, { method: 'GET', path: '/api/v1/admin/operator/tasks' });

    if (error instanceof UnauthorizedError) {
      return NextResponse.json(formatErrorResponse(error), { status: 401 });
    }

    if (error instanceof BadRequestError) {
      return NextResponse.json(formatErrorResponse(error), { status: 400 });
    }

    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}

/**
 * POST /api/v1/admin/operator/tasks
 * Create new operator task
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    // TODO: Verify JWT token and extract user role
    // For now, we'll skip actual verification

    const body = await request.json();

    // Validate required fields
    if (!body.type || !body.priority || !body.title || !body.description || !body.entity_type || !body.entity_id) {
      throw new BadRequestError('Missing required fields: type, priority, title, description, entity_type, entity_id');
    }

    const input: CreateTaskInput = {
      type: body.type,
      priority: body.priority,
      title: body.title,
      description: body.description,
      entity_type: body.entity_type,
      entity_id: body.entity_id,
      due_date: body.due_date ? new Date(body.due_date) : null,
      created_by: body.created_by || null,
    };

    const workflowService = new OperatorWorkflowService();
    const task = await workflowService.createTask(input);

    return NextResponse.json({
      success: true,
      data: task,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID(),
        version: '1.0.0',
      },
    }, { status: 201 });
  } catch (error) {
    logError(error, { method: 'POST', path: '/api/v1/admin/operator/tasks' });

    if (error instanceof UnauthorizedError) {
      return NextResponse.json(formatErrorResponse(error), { status: 401 });
    }

    if (error instanceof BadRequestError) {
      return NextResponse.json(formatErrorResponse(error), { status: 400 });
    }

    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}
