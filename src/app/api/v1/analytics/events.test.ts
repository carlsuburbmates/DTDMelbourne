// ============================================================================
// DTD P2 Phase 1: Analytics Integration - API Events Tests
// File: src/app/api/v1/analytics/events.test.ts
// Description: Integration tests for analytics events API
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST } from './route';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// MOCKS
// ============================================================================

const mockSupabase = {
  from: vi.fn(() => ({
    insert: vi.fn().mockResolvedValue({ error: null }),
  })),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

const mockRequest = {
  json: vi.fn(),
};

// ============================================================================
// SETUP
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks();
  mockRequest.json.mockResolvedValue({
    events: [],
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================================================
// TESTS
// ============================================================================

describe('POST /api/v1/analytics/events', () => {
  describe('Request Validation', () => {
    it('should reject non-array events', async () => {
      mockRequest.json.mockResolvedValue({ events: 'not an array' });

      const response = await POST(mockRequest as any);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.errors).toBeDefined();
      expect(body.errors?.[0].error).toContain('must be an array');
    });

    it('should accept empty array', async () => {
      mockRequest.json.mockResolvedValue({ events: [] });

      const response = await POST(mockRequest as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.processed).toBe(0);
    });

    it('should reject events without required fields', async () => {
      mockRequest.json.mockResolvedValue({
        events: [
          {
            id: 'event-1',
            sessionId: 'session-1',
            eventType: 'page_view',
            timestamp: new Date(),
            properties: { page: '/test' },
          },
          {
            id: 'event-2',
            sessionId: 'session-2',
            eventType: 'page_view',
            timestamp: new Date(),
            properties: { page: '/test' },
          },
        ],
      });

      const response = await POST(mockRequest as any);

      expect(response.status).toBe(207);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.failed).toBe(2);
    });

    it('should reject invalid event types', async () => {
      mockRequest.json.mockResolvedValue({
        events: [
          {
            id: 'event-1',
            sessionId: 'session-1',
            eventType: 'invalid_type' as any,
            timestamp: new Date(),
            properties: {},
          },
        ],
      });

      const response = await POST(mockRequest as any);

      expect(response.status).toBe(207);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.errors?.[0].error).toContain('Invalid event type');
    });
  });

  describe('Event Processing', () => {
    it('should process valid events successfully', async () => {
      const validEvents = [
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
          properties: {
            action: 'click',
            target: 'button',
            sessionId: 'session-2',
          },
        },
      ];

      mockRequest.json.mockResolvedValue({ events: validEvents });

      const response = await POST(mockRequest as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.processed).toBe(2);
      expect(body.failed).toBe(0);
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.arrayContaining(
          expect.objectContaining({
            id: 'event-1',
            user_id: null,
            session_id: 'session-1',
            event_type: 'page_view',
            properties: { page: '/test', sessionId: 'session-1' },
            timestamp: expect.any(String),
          })
        )
      );
    });

    it('should handle database errors gracefully', async () => {
      const validEvents = [
        {
          id: 'event-1',
          sessionId: 'session-1',
          eventType: 'page_view',
          timestamp: new Date(),
          properties: { page: '/test', sessionId: 'session-1' },
        },
      ];

      mockRequest.json.mockResolvedValue({ events: validEvents });
      mockSupabase.from().insert.mockResolvedValue({
        error: { message: 'Database error' },
      });

      const response = await POST(mockRequest as any);

      expect(response.status).toBe(207);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.failed).toBe(1);
      expect(body.errors).toBeDefined();
    });
  });

  describe('Event Types', () => {
    it('should accept page_view events', async () => {
      const events = [
        {
          id: 'event-1',
          sessionId: 'session-1',
          eventType: 'page_view',
          timestamp: new Date(),
          properties: { page: '/test', sessionId: 'session-1' },
        },
      ];

      mockRequest.json.mockResolvedValue({ events });

      const response = await POST(mockRequest as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('should accept user_action events', async () => {
      const events = [
        {
          id: 'event-1',
          sessionId: 'session-1',
          eventType: 'user_action',
          timestamp: new Date(),
          properties: {
            action: 'click',
            target: 'button',
            sessionId: 'session-1',
          },
        },
      ];

      mockRequest.json.mockResolvedValue({ events });

      const response = await POST(mockRequest as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('should accept search events', async () => {
      const events = [
        {
          id: 'event-1',
          sessionId: 'session-1',
          eventType: 'search',
          timestamp: new Date(),
          properties: {
            query: 'puppy training',
            filters: {},
            resultsCount: 10,
            sessionId: 'session-1',
          },
        },
      ];

      mockRequest.json.mockResolvedValue({ events });

      const response = await POST(mockRequest as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('should accept booking events', async () => {
      const events = [
        {
          id: 'event-1',
          sessionId: 'session-1',
          eventType: 'booking',
          timestamp: new Date(),
          properties: {
            trainerId: 'trainer-123',
            action: 'initiated',
            sessionId: 'session-1',
          },
        },
      ];

      mockRequest.json.mockResolvedValue({ events });

      const response = await POST(mockRequest as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });

    it('should accept emergency events', async () => {
      const events = [
        {
          id: 'event-1',
          sessionId: 'session-1',
          eventType: 'emergency',
          timestamp: new Date(),
          properties: {
            type: 'medical',
            severity: 'high',
            description: 'Emergency',
            sessionId: 'session-1',
          },
        },
      ];

      mockRequest.json.mockResolvedValue({ events });

      const response = await POST(mockRequest as any);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });
  });
});

// ============================================================================
// COMMENTS
// ============================================================================
// 1. Request validation tests
// 2. Event processing tests
// 3. Event type validation tests
// 4. Error handling tests
// 5. Based on DOCS/P2-architectural-plan.md Section 1.8
// ============================================================================
