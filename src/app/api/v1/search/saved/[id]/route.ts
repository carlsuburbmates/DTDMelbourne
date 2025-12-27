// ============================================================================
// DTD P2 Phase 3: Advanced Search - Delete Saved Search API
// File: src/app/api/v1/search/saved/[id]/route.ts
// Description: DELETE saved search
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/auth';
import { handleSupabaseError, formatErrorResponse } from '@/lib/errors';
import {
  RateLimiters,
  getClientIp,
  checkRateLimitOrThrow,
  formatRateLimitHeaders,
} from '@/lib/rate-limit';

/**
 * DELETE /api/v1/search/saved/{id} - Delete a saved search
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = checkRateLimitOrThrow(
      RateLimiters.authenticated,
      ip
    );

    // Get user ID from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete saved search
    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) {
      throw handleSupabaseError(error);
    }

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          ...formatRateLimitHeaders(rateLimitResult),
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    const apiError = error instanceof Error ? error : new Error('Unknown error');
    return NextResponse.json(
      formatErrorResponse(apiError, 'Failed to delete saved search'),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
