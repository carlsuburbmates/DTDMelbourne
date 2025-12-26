// ============================================================================
// DTD Phase 5: Operations - Operator Task History API
// File: src/app/api/v1/admin/operator/tasks/[id]/history/route.ts
// Description: Get task history
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import OperatorWorkflowService from '@/lib/operator-workflow';
import {
  UnauthorizedError,
  NotFoundError,
  logError,
  formatErrorResponse,
} from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/admin/operator/tasks/[id]/history
 * Get task history
 */
export async function GET(
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
      throw new NotFoundError('Task ID is required');
    }

    const workflowService = new OperatorWorkflowService();
    const history = await workflowService.getTaskHistory(id);

    return NextResponse.json({
      success: true,
      data: history,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID(),
        version: '1.0.0',
        count: history.length,
      },
    });
  } catch (error) {
    logError(error, { method: 'GET', path: '/api/v1/admin/operator/tasks/[id]/history' });

    if (error instanceof UnauthorizedError) {
      return NextResponse.json(formatErrorResponse(error), { status: 401 });
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json(formatErrorResponse(error), { status: 404 });
    }

    return NextResponse.json(formatErrorResponse(error), { status: 500 });
  }
}
