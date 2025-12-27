// ============================================================================
// DTD P2 Phase 1: Analytics Integration - Generic Event Tracking API
// File: src/app/api/v1/analytics/events/route.ts
// Description: Generic event tracking endpoint
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../../../types/database';
import type { AnalyticsEvent, BatchEventResponse } from '../../../../types/analytics';

// ============================================================================
// CONFIGURATION
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// ============================================================================
// POST HANDLER
// ============================================================================

/**
 * POST /api/v1/analytics/events
 * Generic event tracking endpoint
 */
export async function POST(request: NextRequest): Promise<NextResponse<BatchEventResponse>> {
  try {
    const body = await request.json();
    const { events } = body as { events: AnalyticsEvent[] };

    // Validate request
    if (!Array.isArray(events)) {
      return NextResponse.json(
        {
          success: false,
          processed: 0,
          failed: 0,
          errors: [{ eventId: 'N/A', error: 'Events must be an array' }],
        },
        { status: 400 }
      );
    }

    if (events.length === 0) {
      return NextResponse.json(
        {
          success: true,
          processed: 0,
          failed: 0,
        },
        { status: 200 }
      );
    }

    // Validate each event
    const validEvents: AnalyticsEvent[] = [];
    const errors: Array<{ eventId: string; error: string }> = [];

    for (const event of events) {
      if (!event.id || !event.sessionId || !event.eventType || !event.timestamp) {
        errors.push({
          eventId: event.id || 'unknown',
          error: 'Missing required fields (id, sessionId, eventType, timestamp)',
        });
        continue;
      }

      if (
        !['page_view', 'user_action', 'search', 'booking', 'emergency'].includes(
          event.eventType
        )
      ) {
        errors.push({
          eventId: event.id,
          error: `Invalid event type: ${event.eventType}`,
        });
        continue;
      }

      validEvents.push(event);
    }

    // Insert valid events into database
    let processed = 0;
    let failed = 0;

    if (validEvents.length > 0) {
      const { error: insertError } = await supabase
        .from('analytics_events')
        .insert(
          validEvents.map((event) => ({
            id: event.id,
            user_id: event.userId || null,
            session_id: event.sessionId,
            event_type: event.eventType,
            properties: event.properties,
            timestamp: event.timestamp.toISOString(),
          }))
        );

      if (insertError) {
        console.error('Failed to insert analytics events:', insertError);
        failed = validEvents.length;
        errors.push(
          ...validEvents.map((event) => ({
            eventId: event.id,
            error: 'Database insertion failed',
          }))
        );
      } else {
        processed = validEvents.length;
      }
    }

    failed += errors.length;

    return NextResponse.json(
      {
        success: failed === 0,
        processed,
        failed,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: failed === 0 ? 200 : 207 }
    );
  } catch (error) {
    console.error('Analytics events API error:', error);
    return NextResponse.json(
      {
        success: false,
        processed: 0,
        failed: 0,
        errors: [{ eventId: 'N/A', error: 'Internal server error' }],
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// COMMENTS
// ============================================================================
// 1. Generic event tracking endpoint for all event types
// 2. Batch processing support
// 3. Input validation
// 4. Error handling with detailed error messages
// 5. Based on DOCS/P2-architectural-plan.md Section 1.5
// ============================================================================
