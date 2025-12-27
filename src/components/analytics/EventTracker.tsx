// ============================================================================
// DTD P2 Phase 1: Analytics Integration - Event Tracker Component
// File: src/components/analytics/EventTracker.tsx
// Description: Event tracking component for analytics
// ============================================================================

'use client';

import React, { useEffect, ReactNode } from 'react';
import { useAnalytics } from './AnalyticsProvider';

// ============================================================================
// TYPES
// ============================================================================

interface EventTrackerProps {
  children: ReactNode;
  trackPageView?: boolean;
  trackClicks?: boolean;
  trackScrolls?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Event tracker component
 * Automatically tracks user interactions
 */
export function EventTracker({
  children,
  trackPageView = true,
  trackClicks = true,
  trackScrolls = false,
}: EventTrackerProps) {
  const { trackUserAction, trackCustomEvent } = useAnalytics();

  // Track clicks
  useEffect(() => {
    if (!trackClicks) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const className = target.className;
      const id = target.id;
      const text = target.textContent?.slice(0, 50);

      trackUserAction({
        action: 'click',
        target: `${tagName}${id ? `#${id}` : ''}${className ? `.${className}` : ''}`,
        value: text || '',
        category: 'interaction',
        label: 'element_click',
      });
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [trackClicks, trackUserAction]);

  // Track scrolls
  useEffect(() => {
    if (!trackScrolls) {
      return;
    }

    let scrollTimeout: NodeJS.Timeout;
    const SCROLL_THRESHOLD = 100; // pixels
    const SCROLL_DELAY = 500; // milliseconds

    const handleScroll = () => {
      clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        const scrollPercentage = Math.round(
          (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
        );

        trackCustomEvent('scroll', {
          scrollPercentage,
          scrollY: window.scrollY,
          scrollHeight: document.body.scrollHeight,
          windowHeight: window.innerHeight,
        });
      }, SCROLL_DELAY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [trackScrolls, trackCustomEvent]);

  // Track form submissions
  useEffect(() => {
    const handleSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement;
      const formId = form.id;
      const formAction = form.action;
      const formMethod = form.method;

      trackUserAction({
        action: 'form_submit',
        target: formId || formAction || 'unknown',
        value: formMethod || 'POST',
        category: 'form',
        label: 'submission',
      });
    };

    document.addEventListener('submit', handleSubmit, true);

    return () => {
      document.removeEventListener('submit', handleSubmit, true);
    };
  }, [trackUserAction]);

  // Track errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.message;
      const errorSource = event.filename || 'unknown';
      const errorLine = event.lineno || 0;

      trackCustomEvent('error', {
        message: errorMessage,
        source: errorSource,
        line: errorLine,
        stack: event.error?.stack,
      });
    };

    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('error', handleError);
    };
  }, [trackCustomEvent]);

  return <>{children}</>;
}

// ============================================================================
// COMMENTS
// ============================================================================
// 1. Automatic event tracking component
// 2. Tracks clicks, scrolls, form submissions, and errors
// 3. Configurable tracking options
// 4. Based on DOCS/P2-architectural-plan.md Section 1.4
// ============================================================================
