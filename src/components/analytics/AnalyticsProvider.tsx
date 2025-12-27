// ============================================================================
// DTD P2 Phase 1: Analytics Integration - Analytics Provider
// File: src/components/analytics/AnalyticsProvider.tsx
// Description: React Context Provider for analytics
// ============================================================================

'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import {
  trackPageView,
  trackUserAction,
  trackSearch,
  trackBooking,
  trackEmergency,
  trackCustomEvent,
  getOrCreateSessionId,
  clearSessionId,
} from '../../services/analytics';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Analytics context interface
 */
interface AnalyticsContextType {
  sessionId: string;
  trackPageView: (properties: {
    page: string;
    referrer?: string;
    title?: string;
    path?: string;
    query?: Record<string, string>;
  }) => void;
  trackUserAction: (properties: {
    action: string;
    target?: string;
    value?: string;
    category?: string;
    label?: string;
  }) => void;
  trackSearch: (properties: {
    query: string;
    filters: Record<string, unknown>;
    resultsCount: number;
    searchType?: 'basic' | 'advanced';
    councilId?: string;
    localityId?: string;
  }) => void;
  trackBooking: (properties: {
    trainerId: string;
    action: 'initiated' | 'completed' | 'cancelled';
    amount?: number;
    currency?: string;
    bookingId?: string;
  }) => void;
  trackEmergency: (properties: {
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    classification?: string;
  }) => void;
  trackCustomEvent: (
    eventType: string,
    properties: Record<string, unknown>
  ) => void;
  resetSession: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(
  undefined
);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface AnalyticsProviderProps {
  children: ReactNode;
  userId?: string;
}

export function AnalyticsProvider({ children, userId }: AnalyticsProviderProps) {
  const [sessionId, setSessionId] = React.useState<string>('');

  // Initialize session ID on mount
  useEffect(() => {
    const newSessionId = getOrCreateSessionId();
    setSessionId(newSessionId);

    // Track initial page view
    if (typeof window !== 'undefined') {
      trackPageView({
        page: window.location.pathname,
        path: window.location.pathname,
        query: Object.fromEntries(
          new URLSearchParams(window.location.search).entries()
        ),
        referrer: document.referrer,
        title: document.title,
        sessionId: newSessionId,
      });
    }

    // Cleanup on unmount
    return () => {
      clearSessionId();
    };
  }, []);

  // Track page view on route change
  useEffect(() => {
    const handleRouteChange = () => {
      if (typeof window !== 'undefined') {
        trackPageView({
          page: window.location.pathname,
          path: window.location.pathname,
          query: Object.fromEntries(
            new URLSearchParams(window.location.search).entries()
          ),
          referrer: document.referrer,
          title: document.title,
          sessionId,
        });
      }
    };

    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [sessionId]);

  // Track page view functions
  const handleTrackPageView = (properties: {
    page: string;
    referrer?: string;
    title?: string;
    path?: string;
    query?: Record<string, string>;
  }) => {
    trackPageView({
      ...properties,
      sessionId,
    });
  };

  // Track user action functions
  const handleTrackUserAction = (properties: {
    action: string;
    target?: string;
    value?: string;
    category?: string;
    label?: string;
  }) => {
    trackUserAction({
      ...properties,
      sessionId,
    });
  };

  // Track search functions
  const handleTrackSearch = (properties: {
    query: string;
    filters: Record<string, unknown>;
    resultsCount: number;
    searchType?: 'basic' | 'advanced';
    councilId?: string;
    localityId?: string;
  }) => {
    trackSearch({
      ...properties,
      sessionId,
    });
  };

  // Track booking functions
  const handleTrackBooking = (properties: {
    trainerId: string;
    action: 'initiated' | 'completed' | 'cancelled';
    amount?: number;
    currency?: string;
    bookingId?: string;
  }) => {
    trackBooking({
      ...properties,
      sessionId,
    });
  };

  // Track emergency functions
  const handleTrackEmergency = (properties: {
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    classification?: string;
  }) => {
    trackEmergency({
      ...properties,
      sessionId,
    });
  };

  // Track custom event functions
  const handleTrackCustomEvent = (
    eventType: string,
    properties: Record<string, unknown>
  ) => {
    trackCustomEvent(eventType, properties, sessionId);
  };

  // Reset session
  const handleResetSession = () => {
    clearSessionId();
    const newSessionId = getOrCreateSessionId();
    setSessionId(newSessionId);
  };

  const value: AnalyticsContextType = {
    sessionId,
    trackPageView: handleTrackPageView,
    trackUserAction: handleTrackUserAction,
    trackSearch: handleTrackSearch,
    trackBooking: handleTrackBooking,
    trackEmergency: handleTrackEmergency,
    trackCustomEvent: handleTrackCustomEvent,
    resetSession: handleResetSession,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Use analytics hook
 */
export function useAnalytics(): AnalyticsContextType {
  const context = useContext(AnalyticsContext);

  if (context === undefined) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }

  return context;
}

// ============================================================================
// COMMENTS
// ============================================================================
// 1. React Context Provider for analytics
// 2. Automatic session management
// 3. Automatic page view tracking on route changes
// 4. Event tracking functions for all event types
// 5. Based on DOCS/P2-architectural-plan.md Section 1.4
// ============================================================================
