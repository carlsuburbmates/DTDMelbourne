// ============================================================================
// DTD Phase 5: Operations - Operator Task Assign API
// File: src/app/api/v1/admin/operator/tasks/[id]/assign/route.ts
// Description: Assign task to operator
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
 * POST /api/v1/admin/operator/tasks/[id]/assign
 * Assign task to operator
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

    if (!body.operator_id) {
      throw new BadRequestError('operator_id is required');
    }

    const workflowService = new OperatorWorkflowService();
    const task = await workflowService.assignTask(id, body.operator_id);

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
    logError(error, { method: 'POST', path: '/api/v1/admin/operator/tasks/[id]/assign' });

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
