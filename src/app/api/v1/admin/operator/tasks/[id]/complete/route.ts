// ============================================================================
// DTD Phase 5: Operations - Operator Task Complete API
// File: src/app/api/v1/admin/operator/tasks/[id]/complete/route.ts
// Description: Complete operator task
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import OperatorWorkflowService from '@/lib/operator-workflow';
import {
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
  logError,
  formatErrorResponse,
} from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/admin/operator/tasks/[id]/complete
 * Complete operator task
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    // TODO: Verify JWT token and extract user role
    // For now, we'll skip actual verification

    const { id } = await params;

    if (!id) {
      throw new BadRequestError('Task ID is required');
    }

    const body = await request.json();

    if (!body.notes) {
      throw new BadRequestError('notes is required');
    }

    const workflowService = new OperatorWorkflowService();
    const task = await workflowService.completeTask(id, body.notes);

    return NextResponse.json({
      success: true,
      data: task,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID(),
        version: '1.0.0',
      },
    });
  } catch (error) {
    logError(error, { method: 'POST', path: '/api/v1/admin/operator/tasks/[id]/complete' });

    if (error instanceof UnauthorizedError) {
      return NextResponse.json(formatErrorResponse(error), { status: 401 });
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(formatErrorResponse(error), { status: 404 });
    }

    if (error instanceof BadRequestError) {
      return NextResponse.json(formatErrorResponse(error), { status: 400 });
    }

    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}
