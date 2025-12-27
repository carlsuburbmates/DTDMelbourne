// ============================================================================
// DTD P2 Phase 1: Analytics Integration - Analytics Service
// File: src/services/analytics.ts
// Description: Analytics service with Google Analytics 4 integration
// ============================================================================

import type {
  AnalyticsEvent,
  PageViewEvent,
  UserActionEvent,
  SearchEvent,
  BookingEvent,
  EmergencyEvent,
  BatchEventRequest,
  BatchEventResponse,
  GA4EventParams,
  GA4Config,
} from '../types/analytics';

// ============================================================================
// CONFIGURATION
// ============================================================================

const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || '';
const GA4_API_SECRET = process.env.GA4_API_SECRET || '';
const GA4_DEBUG = process.env.NEXT_PUBLIC_GA4_DEBUG === 'true';

const ga4Config: GA4Config = {
  measurementId: GA4_MEASUREMENT_ID,
  apiSecret: GA4_API_SECRET,
  debug: GA4_DEBUG,
};

// ============================================================================
// EVENT BATCHING
// ============================================================================

/**
 * Event batch for processing
 */
interface EventBatch {
  events: AnalyticsEvent[];
  maxSize: number;
  flushInterval: number;
  timer?: NodeJS.Timeout;
}

/**
 * In-memory event batch
 */
let eventBatch: EventBatch = {
  events: [],
  maxSize: 20,
  flushInterval: 5000, // 5 seconds
};

/**
 * Add event to batch
 */
function addToBatch(event: AnalyticsEvent): void {
  eventBatch.events.push(event);

  if (eventBatch.events.length >= eventBatch.maxSize) {
    flushBatch();
  } else if (!eventBatch.timer) {
    eventBatch.timer = setTimeout(() => {
      flushBatch();
    }, eventBatch.flushInterval);
  }
}

/**
 * Flush event batch to GA4 and database
 */
async function flushBatch(): Promise<void> {
  if (eventBatch.events.length === 0) {
    return;
  }

  const events = [...eventBatch.events];
  eventBatch.events = [];

  if (eventBatch.timer) {
    clearTimeout(eventBatch.timer);
    eventBatch.timer = undefined;
  }

  try {
    // Send to GA4
    await sendToGA4(events);

    // Send to database
    await sendToDatabase(events);
  } catch (error) {
    console.error('Failed to flush analytics batch:', error);
    // Retry failed events
    eventBatch.events.unshift(...events);
  }
}

// ============================================================================
// GOOGLE ANALYTICS 4 INTEGRATION
// ============================================================================

/**
 * Convert analytics event to GA4 event
 */
function convertToGA4Event(event: AnalyticsEvent): {
  name: string;
  params: GA4EventParams;
} {
  const baseParams: GA4EventParams = {
    session_id: event.sessionId,
    timestamp: event.timestamp.getTime(),
  };

  if (event.userId) {
    baseParams.user_id = event.userId;
  }

  switch (event.eventType) {
    case 'page_view':
      return {
        name: 'page_view',
        params: {
          ...baseParams,
          page_title: (event as PageViewEvent).properties.title,
          page_location: (event as PageViewEvent).properties.path,
          page_referrer: (event as PageViewEvent).properties.referrer,
        },
      };

    case 'user_action':
      return {
        name: 'user_action',
        params: {
          ...baseParams,
          action_name: (event as UserActionEvent).properties.action,
          action_target: (event as UserActionEvent).properties.target,
          action_value: (event as UserActionEvent).properties.value,
          action_category: (event as UserActionEvent).properties.category,
          action_label: (event as UserActionEvent).properties.label,
        },
      };

    case 'search':
      return {
        name: 'search',
        params: {
          ...baseParams,
          search_term: (event as SearchEvent).properties.query,
          search_results_count: (event as SearchEvent).properties.resultsCount,
          search_type: (event as SearchEvent).properties.searchType,
          council_id: (event as SearchEvent).properties.councilId,
          locality_id: (event as SearchEvent).properties.localityId,
        },
      };

    case 'booking':
      return {
        name: 'booking',
        params: {
          ...baseParams,
          booking_action: (event as BookingEvent).properties.action,
          trainer_id: (event as BookingEvent).properties.trainerId,
          booking_amount: (event as BookingEvent).properties.amount,
          booking_currency: (event as BookingEvent).properties.currency,
          booking_id: (event as BookingEvent).properties.bookingId,
        },
      };

    case 'emergency':
      return {
        name: 'emergency',
        params: {
          ...baseParams,
          emergency_type: (event as EmergencyEvent).properties.type,
          emergency_severity: (event as EmergencyEvent).properties.severity,
          emergency_classification: (event as EmergencyEvent).properties.classification,
          confidence_score: (event as EmergencyEvent).properties.confidenceScore,
        },
      };

    default:
      return {
        name: 'unknown_event',
        params: baseParams,
      };
  }
}

/**
 * Send events to Google Analytics 4
 */
async function sendToGA4(events: AnalyticsEvent[]): Promise<void> {
  if (!ga4Config.measurementId) {
    console.warn('GA4 measurement ID not configured');
    return;
  }

  const ga4Events = events.map(convertToGA4Event);

  const payload = {
    client_id: crypto.randomUUID(),
    events: ga4Events,
  };

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${ga4Config.measurementId}&api_secret=${ga4Config.apiSecret}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`GA4 request failed: ${response.statusText}`);
    }

    if (ga4Config.debug) {
      console.log('Analytics events sent to GA4:', ga4Events);
    }
  } catch (error) {
    console.error('Failed to send events to GA4:', error);
    throw error;
  }
}

// ============================================================================
// DATABASE INTEGRATION
// ============================================================================

/**
 * Send events to database
 */
async function sendToDatabase(events: AnalyticsEvent[]): Promise<void> {
  try {
    const response = await fetch('/api/v1/analytics/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      throw new Error(`Database request failed: ${response.statusText}`);
    }

    if (ga4Config.debug) {
      console.log('Analytics events sent to database:', events.length);
    }
  } catch (error) {
    console.error('Failed to send events to database:', error);
    throw error;
  }
}

// ============================================================================
// EVENT TRACKING FUNCTIONS
// ============================================================================

/**
 * Track page view event
 */
export function trackPageView(properties: {
  page: string;
  referrer?: string;
  sessionId: string;
  title?: string;
  path?: string;
  query?: Record<string, string>;
}): void {
  const event: PageViewEvent = {
    id: crypto.randomUUID(),
    sessionId: properties.sessionId,
    eventType: 'page_view',
    timestamp: new Date(),
    properties,
  };

  addToBatch(event);
}

/**
 * Track user action event
 */
export function trackUserAction(properties: {
  action: string;
  target?: string;
  value?: string;
  sessionId: string;
  category?: string;
  label?: string;
}): void {
  const event: UserActionEvent = {
    id: crypto.randomUUID(),
    sessionId: properties.sessionId,
    eventType: 'user_action',
    timestamp: new Date(),
    properties,
  };

  addToBatch(event);
}

/**
 * Track search event
 */
export function trackSearch(properties: {
  query: string;
  filters: Record<string, unknown>;
  resultsCount: number;
  sessionId: string;
  searchType?: 'basic' | 'advanced';
  councilId?: string;
  localityId?: string;
}): void {
  const event: SearchEvent = {
    id: crypto.randomUUID(),
    sessionId: properties.sessionId,
    eventType: 'search',
    timestamp: new Date(),
    properties,
  };

  addToBatch(event);
}

/**
 * Track booking event
 */
export function trackBooking(properties: {
  trainerId: string;
  action: 'initiated' | 'completed' | 'cancelled';
  amount?: number;
  sessionId: string;
  currency?: string;
  bookingId?: string;
}): void {
  const event: BookingEvent = {
    id: crypto.randomUUID(),
    sessionId: properties.sessionId,
    eventType: 'booking',
    timestamp: new Date(),
    properties,
  };

  addToBatch(event);
}

/**
 * Track emergency event
 */
export function trackEmergency(properties: {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  sessionId: string;
  classification?: string;
  confidenceScore?: number;
}): void {
  const event: EmergencyEvent = {
    id: crypto.randomUUID(),
    sessionId: properties.sessionId,
    eventType: 'emergency',
    timestamp: new Date(),
    properties,
  };

  addToBatch(event);
}

/**
 * Track custom event
 */
export function trackCustomEvent(
  eventType: string,
  properties: Record<string, unknown>,
  sessionId: string
): void {
  const event: AnalyticsEvent = {
    id: crypto.randomUUID(),
    sessionId,
    eventType: 'user_action',
    timestamp: new Date(),
    properties: {
      action: eventType,
      ...properties,
    },
  };

  addToBatch(event);
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

/**
 * Process batch of events
 */
export async function processBatch(
  request: BatchEventRequest
): Promise<BatchEventResponse> {
  const { events } = request;

  let processed = 0;
  let failed = 0;
  const errors: Array<{ eventId: string; error: string }> = [];

  for (const event of events) {
    try {
      await sendToGA4([event]);
      processed++;
    } catch (error) {
      failed++;
      errors.push({
        eventId: event.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    success: failed === 0,
    processed,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Flush pending events
 */
export function flushPendingEvents(): Promise<void> {
  return flushBatch();
}

// ============================================================================
// ERROR HANDLING AND RETRY
// ============================================================================

/**
 * Retry failed events
 */
export async function retryFailedEvents(
  events: AnalyticsEvent[],
  maxRetries: number = 3
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sendToGA4(events);
      await sendToDatabase(events);
      return;
    } catch (error) {
      console.error(`Retry attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        console.error('Max retries reached, events lost:', events);
        throw error;
      }

      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Generate session ID
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Get or create session ID from storage
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return generateSessionId();
  }

  let sessionId = sessionStorage.getItem('analytics_session_id');

  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }

  return sessionId;
}

/**
 * Clear session ID
 */
export function clearSessionId(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('analytics_session_id');
  }
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export {
  addToBatch,
  flushBatch,
  sendToGA4,
  sendToDatabase,
  convertToGA4Event,
};

// ============================================================================
// COMMENTS
// ============================================================================
// 1. Google Analytics 4 integration with event batching
// 2. Event tracking functions for all event types
// 3. Batch processing with automatic flushing
// 4. Error handling and retry logic with exponential backoff
// 5. Session management for tracking user sessions
// 6. Based on DOCS/P2-architectural-plan.md Section 1
// ============================================================================
