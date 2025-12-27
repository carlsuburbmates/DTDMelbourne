// ============================================================================
// DTD P2 Phase 1: Analytics Integration - Analytics Provider Tests
// File: src/components/analytics/AnalyticsProvider.test.tsx
// Description: Component tests for analytics provider
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalyticsProvider, useAnalytics } from './AnalyticsProvider';
import * as analyticsService from '../../services/analytics';

// ============================================================================
// MOCKS
// ============================================================================

const mockTrackPageView = vi.fn();
const mockTrackUserAction = vi.fn();
const mockTrackSearch = vi.fn();
const mockTrackBooking = vi.fn();
const mockTrackEmergency = vi.fn();
const mockTrackCustomEvent = vi.fn();
const mockGetOrCreateSessionId = vi.fn(() => 'test-session-id');
const mockClearSessionId = vi.fn();

vi.mock('../../services/analytics', () => ({
  trackPageView: mockTrackPageView,
  trackUserAction: mockTrackUserAction,
  trackSearch: mockTrackSearch,
  trackBooking: mockTrackBooking,
  trackEmergency: mockTrackEmergency,
  trackCustomEvent: mockTrackCustomEvent,
  getOrCreateSessionId: mockGetOrCreateSessionId,
  clearSessionId: mockClearSessionId,
}));

// ============================================================================
// SETUP
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks();
  mockGetOrCreateSessionId.mockReturnValue('test-session-id');
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ============================================================================
// TESTS
// ============================================================================

describe('AnalyticsProvider', () => {
  describe('Rendering', () => {
    it('should render children', () => {
      render(
        <AnalyticsProvider>
          <div>Test Child</div>
        </AnalyticsProvider>
      );

      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('should initialize session ID on mount', () => {
      render(
        <AnalyticsProvider>
          <div>Test Child</div>
        </AnalyticsProvider>
      );

      expect(mockGetOrCreateSessionId).toHaveBeenCalled();
    });

    it('should clear session ID on unmount', () => {
      const { unmount } = render(
        <AnalyticsProvider>
          <div>Test Child</div>
        </AnalyticsProvider>
      );

      unmount();

      expect(mockClearSessionId).toHaveBeenCalled();
    });
  });

  describe('useAnalytics Hook', () => {
    it('should provide analytics context', () => {
      const TestComponent = () => {
        const analytics = useAnalytics();

        return (
          <div>
            <span data-testid="session-id">{analytics.sessionId}</span>
            <button
              onClick={() =>
                analytics.trackPageView({
                  page: '/test',
                  sessionId: analytics.sessionId,
                })
              }
            >
              Track Page View
            </button>
          </div>
        );
      };

      render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      );

      expect(screen.getByTestId('session-id')).toHaveTextContent(
        'test-session-id'
      );
    });

    it('should throw error when used outside provider', () => {
      const TestComponent = () => {
        const analytics = useAnalytics();
        return <div>{analytics.sessionId}</div>;
      };

      expect(() => render(<TestComponent />)).toThrow(
        'useAnalytics must be used within AnalyticsProvider'
      );
    });
  });

  describe('Event Tracking', () => {
    it('should track page view', () => {
      const TestComponent = () => {
        const analytics = useAnalytics();

        return (
          <button
            onClick={() =>
              analytics.trackPageView({
                page: '/test',
                sessionId: analytics.sessionId,
                title: 'Test Page',
              })
            }
          >
            Track Page View
          </button>
        );
      };

      render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      );

      screen.getByText('Track Page View').click();

      expect(mockTrackPageView).toHaveBeenCalledWith({
        page: '/test',
        sessionId: 'test-session-id',
        title: 'Test Page',
      });
    });

    it('should track user action', () => {
      const TestComponent = () => {
        const analytics = useAnalytics();

        return (
          <button
            onClick={() =>
              analytics.trackUserAction({
                action: 'click',
                target: 'button',
                sessionId: analytics.sessionId,
                category: 'interaction',
              })
            }
          >
            Track User Action
          </button>
        );
      };

      render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      );

      screen.getByText('Track User Action').click();

      expect(mockTrackUserAction).toHaveBeenCalledWith({
        action: 'click',
        target: 'button',
        sessionId: 'test-session-id',
        category: 'interaction',
      });
    });

    it('should track search', () => {
      const TestComponent = () => {
        const analytics = useAnalytics();

        return (
          <button
            onClick={() =>
              analytics.trackSearch({
                query: 'puppy training',
                filters: {},
                resultsCount: 10,
                sessionId: analytics.sessionId,
              })
            }
          >
            Track Search
          </button>
        );
      };

      render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      );

      screen.getByText('Track Search').click();

      expect(mockTrackSearch).toHaveBeenCalledWith({
        query: 'puppy training',
        filters: {},
        resultsCount: 10,
        sessionId: 'test-session-id',
      });
    });

    it('should track booking', () => {
      const TestComponent = () => {
        const analytics = useAnalytics();

        return (
          <button
            onClick={() =>
              analytics.trackBooking({
                trainerId: 'trainer-123',
                action: 'initiated',
                sessionId: analytics.sessionId,
              })
            }
          >
            Track Booking
          </button>
        );
      };

      render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      );

      screen.getByText('Track Booking').click();

      expect(mockTrackBooking).toHaveBeenCalledWith({
        trainerId: 'trainer-123',
        action: 'initiated',
        sessionId: 'test-session-id',
      });
    });

    it('should track emergency', () => {
      const TestComponent = () => {
        const analytics = useAnalytics();

        return (
          <button
            onClick={() =>
              analytics.trackEmergency({
                type: 'medical',
                severity: 'high',
                description: 'Emergency',
                sessionId: analytics.sessionId,
              })
            }
          >
            Track Emergency
          </button>
        );
      };

      render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      );

      screen.getByText('Track Emergency').click();

      expect(mockTrackEmergency).toHaveBeenCalledWith({
        type: 'medical',
        severity: 'high',
        description: 'Emergency',
        sessionId: 'test-session-id',
      });
    });

    it('should track custom event', () => {
      const TestComponent = () => {
        const analytics = useAnalytics();

        return (
          <button
            onClick={() =>
              analytics.trackCustomEvent('custom_event', {
                customProperty: 'custom value',
              })
            }
          >
            Track Custom Event
          </button>
        );
      };

      render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      );

      screen.getByText('Track Custom Event').click();

      expect(mockTrackCustomEvent).toHaveBeenCalledWith(
        'custom_event',
        { customProperty: 'custom value' },
        'test-session-id'
      );
    });

    it('should reset session', () => {
      const TestComponent = () => {
        const analytics = useAnalytics();

        return (
          <button onClick={() => analytics.resetSession()}>
            Reset Session
          </button>
        );
      };

      render(
        <AnalyticsProvider>
          <TestComponent />
        </AnalyticsProvider>
      );

      screen.getByText('Reset Session').click();

      expect(mockClearSessionId).toHaveBeenCalled();
      expect(mockGetOrCreateSessionId).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// COMMENTS
// ============================================================================
// 1. Provider rendering tests
// 2. useAnalytics hook tests
// 3. Event tracking function tests
// 4. Session management tests
// 5. Error handling tests
// 6. Based on DOCS/P2-architectural-plan.md Section 1.8
// ============================================================================
