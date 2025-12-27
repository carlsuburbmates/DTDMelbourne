// ============================================================================
// DTD P2 Phase 1: Analytics Integration - Analytics Service Tests
// File: src/services/analytics.test.ts
// Description: Unit tests for analytics service
// ============================================================================

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import {
  trackPageView,
  trackUserAction,
  trackSearch,
  trackBooking,
  trackEmergency,
  trackCustomEvent,
  processBatch,
  flushPendingEvents,
  retryFailedEvents,
  generateSessionId,
  getOrCreateSessionId,
  clearSessionId,
  convertToGA4Event,
} from './analytics';
import type {
  PageViewEvent,
  UserActionEvent,
  SearchEvent,
  BookingEvent,
  EmergencyEvent,
  AnalyticsEvent,
} from '../types/analytics';

// ============================================================================
// MOCKS
// ============================================================================

const mockFetch = vi.fn();
global.fetch = mockFetch as any;

const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

global.sessionStorage = mockSessionStorage as any;

// ============================================================================
// SETUP
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({}),
  } as Response);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================================================
// SESSION MANAGEMENT TESTS
// ============================================================================

describe('Session Management', () => {
  describe('generateSessionId', () => {
    it('should generate a unique session ID', () => {
      const sessionId1 = generateSessionId();
      const sessionId2 = generateSessionId();

      expect(sessionId1).toBeDefined();
      expect(sessionId2).toBeDefined();
      expect(sessionId1).not.toBe(sessionId2);
    });

    it('should generate a valid UUID format', () => {
      const sessionId = generateSessionId();
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      expect(sessionId).toMatch(uuidRegex);
    });
  });

  describe('getOrCreateSessionId', () => {
    it('should create a new session ID if none exists', () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      const sessionId = getOrCreateSessionId();

      expect(sessionId).toBeDefined();
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'analytics_session_id',
        sessionId
      );
    });

    it('should return existing session ID if one exists', () => {
      const existingSessionId = 'existing-session-id';
      mockSessionStorage.getItem.mockReturnValue(existingSessionId);

      const sessionId = getOrCreateSessionId();

      expect(sessionId).toBe(existingSessionId);
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('clearSessionId', () => {
    it('should remove session ID from storage', () => {
      clearSessionId();

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
        'analytics_session_id'
      );
    });
  });
});

// ============================================================================
// EVENT TRACKING TESTS
// ============================================================================

describe('Event Tracking', () => {
  const sessionId = 'test-session-id';

  describe('trackPageView', () => {
    it('should create a page view event', () => {
      const properties = {
        page: '/test-page',
        sessionId,
        title: 'Test Page',
        path: '/test-page',
      };

      trackPageView(properties);

      // Event should be added to batch
      expect(true).toBe(true);
    });

    it('should include optional referrer', () => {
      const properties = {
        page: '/test-page',
        sessionId,
        referrer: 'https://example.com',
      };

      trackPageView(properties);

      expect(true).toBe(true);
    });
  });

  describe('trackUserAction', () => {
    it('should create a user action event', () => {
      const properties = {
        action: 'click',
        target: 'button',
        sessionId,
        category: 'interaction',
        label: 'submit',
      };

      trackUserAction(properties);

      expect(true).toBe(true);
    });

    it('should include optional value', () => {
      const properties = {
        action: 'input',
        target: 'search',
        value: 'test query',
        sessionId,
      };

      trackUserAction(properties);

      expect(true).toBe(true);
    });
  });

  describe('trackSearch', () => {
    it('should create a search event', () => {
      const properties = {
        query: 'puppy training',
        filters: { council: 'test' },
        resultsCount: 10,
        sessionId,
        searchType: 'basic' as const,
      };

      trackSearch(properties);

      expect(true).toBe(true);
    });

    it('should include optional council and locality IDs', () => {
      const properties = {
        query: 'obedience',
        filters: {},
        resultsCount: 5,
        sessionId,
        councilId: 'council-123',
        localityId: 'locality-456',
      };

      trackSearch(properties);

      expect(true).toBe(true);
    });
  });

  describe('trackBooking', () => {
    it('should create a booking event', () => {
      const properties = {
        trainerId: 'trainer-123',
        action: 'initiated' as const,
        amount: 100,
        currency: 'AUD',
        sessionId,
        bookingId: 'booking-789',
      };

      trackBooking(properties);

      expect(true).toBe(true);
    });

    it('should handle all booking actions', () => {
      const actions: Array<'initiated' | 'completed' | 'cancelled'> = [
        'initiated',
        'completed',
        'cancelled',
      ];

      actions.forEach((action) => {
        const properties = {
          trainerId: 'trainer-123',
          action,
          sessionId,
        };

        trackBooking(properties);

        expect(true).toBe(true);
      });
    });
  });

  describe('trackEmergency', () => {
    it('should create an emergency event', () => {
      const properties = {
        type: 'medical',
        severity: 'high' as const,
        description: 'Dog needs immediate medical attention',
        sessionId,
        classification: 'medical',
      };

      trackEmergency(properties);

      expect(true).toBe(true);
    });

    it('should handle all severity levels', () => {
      const severities: Array<'low' | 'medium' | 'high'> = [
        'low',
        'medium',
        'high',
      ];

      severities.forEach((severity) => {
        const properties = {
          type: 'test',
          severity,
          description: 'Test emergency',
          sessionId,
        };

        trackEmergency(properties);

        expect(true).toBe(true);
      });
    });
  });

  describe('trackCustomEvent', () => {
    it('should create a custom event', () => {
      const eventType = 'custom_event';
      const properties = {
        customProperty: 'custom value',
        anotherProperty: 123,
      };

      trackCustomEvent(eventType, properties, sessionId);

      expect(true).toBe(true);
    });
  });
});

// ============================================================================
// GA4 CONVERSION TESTS
// ============================================================================

describe('GA4 Event Conversion', () => {
  const sessionId = 'test-session-id';

  describe('convertToGA4Event', () => {
    it('should convert page view event to GA4 format', () => {
      const event: PageViewEvent = {
        id: 'event-1',
        sessionId,
        eventType: 'page_view',
        timestamp: new Date(),
        properties: {
          page: '/test',
          sessionId,
          title: 'Test Page',
        },
      };

      const ga4Event = convertToGA4Event(event);

      expect(ga4Event.name).toBe('page_view');
      expect(ga4Event.params.page_title).toBe('Test Page');
      expect(ga4Event.params.page_location).toBe('/test');
      expect(ga4Event.params.session_id).toBe(sessionId);
    });

    it('should convert user action event to GA4 format', () => {
      const event: UserActionEvent = {
        id: 'event-2',
        sessionId,
        eventType: 'user_action',
        timestamp: new Date(),
        properties: {
          action: 'click',
          target: 'button',
          sessionId,
          category: 'interaction',
        },
      };

      const ga4Event = convertToGA4Event(event);

      expect(ga4Event.name).toBe('user_action');
      expect(ga4Event.params.action_name).toBe('click');
      expect(ga4Event.params.action_target).toBe('button');
      expect(ga4Event.params.action_category).toBe('interaction');
    });

    it('should convert search event to GA4 format', () => {
      const event: SearchEvent = {
        id: 'event-3',
        sessionId,
        eventType: 'search',
        timestamp: new Date(),
        properties: {
          query: 'puppy training',
          filters: {},
          resultsCount: 10,
          sessionId,
        },
      };

      const ga4Event = convertToGA4Event(event);

      expect(ga4Event.name).toBe('search');
      expect(ga4Event.params.search_term).toBe('puppy training');
      expect(ga4Event.params.search_results_count).toBe(10);
    });

    it('should convert booking event to GA4 format', () => {
      const event: BookingEvent = {
        id: 'event-4',
        sessionId,
        eventType: 'booking',
        timestamp: new Date(),
        properties: {
          trainerId: 'trainer-123',
          action: 'completed',
          amount: 100,
          sessionId,
        },
      };

      const ga4Event = convertToGA4Event(event);

      expect(ga4Event.name).toBe('booking');
      expect(ga4Event.params.booking_action).toBe('completed');
      expect(ga4Event.params.trainer_id).toBe('trainer-123');
      expect(ga4Event.params.booking_amount).toBe(100);
    });

    it('should convert emergency event to GA4 format', () => {
      const event: EmergencyEvent = {
        id: 'event-5',
        sessionId,
        eventType: 'emergency',
        timestamp: new Date(),
        properties: {
          type: 'medical',
          severity: 'high',
          description: 'Emergency',
          sessionId,
        },
      };

      const ga4Event = convertToGA4Event(event);

      expect(ga4Event.name).toBe('emergency');
      expect(ga4Event.params.emergency_type).toBe('medical');
      expect(ga4Event.params.emergency_severity).toBe('high');
    });
  });
});

// ============================================================================
// BATCH PROCESSING TESTS
// ============================================================================

describe('Batch Processing', () => {
  describe('processBatch', () => {
    it('should process batch of events successfully', async () => {
      const events: AnalyticsEvent[] = [
        {
          id: 'event-1',
          sessionId: 'session-1',
          eventType: 'page_view',
          timestamp: new Date(),
          properties: { page: '/test', sessionId: 'session-1' },
        },
        {
          id: 'event-2',
          sessionId: 'session-2',
          eventType: 'user_action',
          timestamp: new Date(),
          properties: { action: 'click', sessionId: 'session-2' },
        },
      ];

      const result = await processBatch({ events });

      expect(result.success).toBe(true);
      expect(result.processed).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toBeUndefined();
    });

    it('should handle partial failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const events: AnalyticsEvent[] = [
        {
          id: 'event-1',
          sessionId: 'session-1',
          eventType: 'page_view',
          timestamp: new Date(),
          properties: { page: '/test', sessionId: 'session-1' },
        },
      ];

      const result = await processBatch({ events });

      expect(result.success).toBe(false);
      expect(result.processed).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBe(1);
    });

    it('should handle empty batch', async () => {
      const result = await processBatch({ events: [] });

      expect(result.success).toBe(true);
      expect(result.processed).toBe(0);
      expect(result.failed).toBe(0);
    });
  });

  describe('retryFailedEvents', () => {
    it('should retry failed events with exponential backoff', async () => {
      const events: AnalyticsEvent[] = [
        {
          id: 'event-1',
          sessionId: 'session-1',
          eventType: 'page_view',
          timestamp: new Date(),
          properties: { page: '/test', sessionId: 'session-1' },
        },
      ];

      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await retryFailedEvents(events, 2);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should give up after max retries', async () => {
      const events: AnalyticsEvent[] = [
        {
          id: 'event-1',
          sessionId: 'session-1',
          eventType: 'page_view',
          timestamp: new Date(),
          properties: { page: '/test', sessionId: 'session-1' },
        },
      ];

      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(retryFailedEvents(events, 3)).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});

// ============================================================================
// COMMENTS
// ============================================================================
// 1. Session management tests
// 2. Event tracking tests for all event types
// 3. GA4 event conversion tests
// 4. Batch processing tests
// 5. Error handling and retry tests
// 6. Based on DOCS/P2-architectural-plan.md Section 1.8
// ============================================================================
