// ============================================================================
// DTD P2 Phase 3: Advanced Search - Saved Searches API
// File: src/app/api/v1/search/saved/route.ts
// Description: GET/POST saved searches
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
import type { SavedSearch, SaveSearchRequest } from '@/types/search';

/**
 * GET /api/v1/search/saved - Get saved searches
 */
export async function GET(request: NextRequest) {
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

    // Fetch saved searches
    const { data: searches, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });

    if (error) {
      throw handleSupabaseError(error);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          searches: searches || [],
        },
      },
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
      formatErrorResponse(apiError, 'Failed to get saved searches'),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * POST /api/v1/search/saved - Save a search
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body: SaveSearchRequest = await request.json();

    // Validate request
    if (!body.name || !body.filters) {
      return NextResponse.json(
        { success: false, error: 'Name and filters are required' },
        { status: 400 }
      );
    }

    // Insert saved search
    const { data: search, error } = await supabase
      .from('saved_searches')
      .insert({
        user_id: user.id,
        name: body.name,
        filters: body.filters,
      })
      .select()
      .single();

    if (error) {
      throw handleSupabaseError(error);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: search.id,
        },
      },
      {
        status: 201,
        headers: {
          ...formatRateLimitHeaders(rateLimitResult),
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    const apiError = error instanceof Error ? error : new Error('Unknown error');
    return NextResponse.json(
      formatErrorResponse(apiError, 'Failed to save search'),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
