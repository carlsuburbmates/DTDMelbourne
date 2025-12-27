// ============================================================================
// DTD P2 Phase 1: Analytics Integration - TypeScript Types
// File: src/types/analytics.ts
// Description: Analytics event types and interfaces
// ============================================================================

// ============================================================================
// BASE EVENT TYPE
// ============================================================================

/**
 * Base analytics event interface
 */
export interface AnalyticsEvent {
  id: string;
  userId?: string;
  sessionId: string;
  eventType: 'page_view' | 'user_action' | 'search' | 'booking' | 'emergency';
  timestamp: Date;
  properties: Record<string, unknown>;
}

// ============================================================================
// PAGE VIEW EVENT
// ============================================================================

/**
 * Page view event properties
 */
export interface PageViewProperties {
  page: string;
  referrer?: string;
  sessionId: string;
  title?: string;
  path?: string;
  query?: Record<string, string>;
}

/**
 * Page view event
 */
export interface PageViewEvent extends AnalyticsEvent {
  eventType: 'page_view';
  properties: PageViewProperties;
}

// ============================================================================
// USER ACTION EVENT
// ============================================================================

/**
 * User action event properties
 */
export interface UserActionProperties {
  action: string;
  target?: string;
  value?: string;
  sessionId: string;
  category?: string;
  label?: string;
}

/**
 * User action event
 */
export interface UserActionEvent extends AnalyticsEvent {
  eventType: 'user_action';
  properties: UserActionProperties;
}

// ============================================================================
// SEARCH EVENT
// ============================================================================

/**
 * Search event properties
 */
export interface SearchProperties {
  query: string;
  filters: Record<string, unknown>;
  resultsCount: number;
  sessionId: string;
  searchType?: 'basic' | 'advanced';
  councilId?: string;
  localityId?: string;
}

/**
 * Search event
 */
export interface SearchEvent extends AnalyticsEvent {
  eventType: 'search';
  properties: SearchProperties;
}

// ============================================================================
// BOOKING EVENT
// ============================================================================

/**
 * Booking event properties
 */
export interface BookingProperties {
  trainerId: string;
  action: 'initiated' | 'completed' | 'cancelled';
  amount?: number;
  sessionId: string;
  currency?: string;
  bookingId?: string;
}

/**
 * Booking event
 */
export interface BookingEvent extends AnalyticsEvent {
  eventType: 'booking';
  properties: BookingProperties;
}

// ============================================================================
// EMERGENCY EVENT
// ============================================================================

/**
 * Emergency event properties
 */
export interface EmergencyProperties {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  sessionId: string;
  classification?: string;
  confidenceScore?: number;
}

/**
 * Emergency event
 */
export interface EmergencyEvent extends AnalyticsEvent {
  eventType: 'emergency';
  properties: EmergencyProperties;
}

// ============================================================================
// BATCH EVENT REQUEST
// ============================================================================

/**
 * Batch event request for API
 */
export interface BatchEventRequest {
  events: AnalyticsEvent[];
}

/**
 * Batch event response
 */
export interface BatchEventResponse {
  success: boolean;
  processed: number;
  failed: number;
  errors?: Array<{
    eventId: string;
    error: string;
  }>;
}

// ============================================================================
// ANALYTICS METRICS
// ============================================================================

/**
 * User behavior metrics
 */
export interface UserBehaviorMetrics {
  totalPageViews: number;
  uniqueSessions: number;
  averageSessionDuration: number;
  bounceRate: number;
  topPages: Array<{
    page: string;
    views: number;
  }>;
  userActions: Array<{
    action: string;
    count: number;
  }>;
}

/**
 * Booking metrics
 */
export interface BookingMetrics {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  conversionRate: number;
  averageBookingValue: number;
  revenue: number;
}

/**
 * Search metrics
 */
export interface SearchMetrics {
  totalSearches: number;
  averageResultsCount: number;
  topSearchQueries: Array<{
    query: string;
    count: number;
  }>;
  zeroResultSearches: number;
}

/**
 * Emergency metrics
 */
export interface EmergencyMetrics {
  totalEmergencies: number;
  bySeverity: Record<'low' | 'medium' | 'high', number>;
  byType: Record<string, number>;
  averageConfidenceScore: number;
}

/**
 * Combined analytics metrics
 */
export interface AnalyticsMetrics {
  userBehavior: UserBehaviorMetrics;
  bookings: BookingMetrics;
  searches: SearchMetrics;
  emergencies: EmergencyMetrics;
  period: {
    start: Date;
    end: Date;
  };
}

// ============================================================================
// ANALYTICS QUERY PARAMETERS
// ============================================================================

/**
 * Analytics query parameters
 */
export interface AnalyticsQuery {
  startDate?: Date;
  endDate?: Date;
  eventType?: AnalyticsEvent['eventType'];
  userId?: string;
  sessionId?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// GOOGLE ANALYTICS 4 TYPES
// ============================================================================

/**
 * GA4 event parameters
 */
export interface GA4EventParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * GA4 configuration
 */
export interface GA4Config {
  measurementId: string;
  apiSecret?: string;
  debug?: boolean;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  AnalyticsEvent,
  PageViewEvent,
  PageViewProperties,
  UserActionEvent,
  UserActionProperties,
  SearchEvent,
  SearchProperties,
  BookingEvent,
  BookingProperties,
  EmergencyEvent,
  EmergencyProperties,
  BatchEventRequest,
  BatchEventResponse,
  UserBehaviorMetrics,
  BookingMetrics,
  SearchMetrics,
  EmergencyMetrics,
  AnalyticsMetrics,
  AnalyticsQuery,
  GA4EventParams,
  GA4Config,
};

// ============================================================================
// COMMENTS
// ============================================================================
// 1. Base event interface with common fields
// 2. Specific event types with typed properties
// 3. Batch event request/response for API
// 4. Analytics metrics for dashboard
// 5. Query parameters for filtering analytics data
// 6. Google Analytics 4 integration types
// 7. Based on DOCS/P2-architectural-plan.md Section 1
// ============================================================================
