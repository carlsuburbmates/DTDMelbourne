/**
 * Performance monitoring service
 * Integrates with Core Web Vitals for performance metrics tracking
 */

import { Metric } from 'web-vitals';

/**
 * Core Web Vitals metrics
 */
export interface CoreWebVitals {
  LCP?: Metric; // Largest Contentful Paint
  FID?: Metric; // First Input Delay
  CLS?: Metric; // Cumulative Layout Shift
  FCP?: Metric; // First Contentful Paint
  TTFB?: Metric; // Time to First Byte
  INP?: Metric; // Interaction to Next Paint
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  pageLoadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  resourceTiming: ResourceTiming[];
  navigationTiming: PerformanceNavigationTiming;
  memoryUsage?: PerformanceMemory;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

/**
 * Performance alert
 */
export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
  message: string;
}

/**
 * Performance dashboard data
 */
export interface PerformanceDashboardData {
  coreWebVitals: CoreWebVitals;
  performanceMetrics: PerformanceMetrics;
  cacheStats: CacheStats;
  alerts: PerformanceAlert[];
  score: PerformanceScore;
}

/**
 * Performance score
 */
export interface PerformanceScore {
  overall: number;
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

/**
 * Performance monitoring service
 */
class PerformanceMonitoringService {
  private metrics: CoreWebVitals = {};
  private alerts: PerformanceAlert[] = [];
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;

  /**
   * Start monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;

    // Load web-vitals library dynamically
    const { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');

    // Core Web Vitals
    onCLS((metric) => {
      this.metrics.CLS = metric;
      this.checkThreshold('CLS', metric.value, 0.1);
      this.sendMetric('CLS', metric);
    });

    onFID((metric) => {
      this.metrics.FID = metric;
      this.checkThreshold('FID', metric.value, 100);
      this.sendMetric('FID', metric);
    });

    onFCP((metric) => {
      this.metrics.FCP = metric;
      this.checkThreshold('FCP', metric.value, 1800);
      this.sendMetric('FCP', metric);
    });

    onLCP((metric) => {
      this.metrics.LCP = metric;
      this.checkThreshold('LCP', metric.value, 2500);
      this.sendMetric('LCP', metric);
    });

    onTTFB((metric) => {
      this.metrics.TTFB = metric;
      this.checkThreshold('TTFB', metric.value, 600);
      this.sendMetric('TTFB', metric);
    });

    onINP((metric) => {
      this.metrics.INP = metric;
      this.checkThreshold('INP', metric.value, 200);
      this.sendMetric('INP', metric);
    });

    // Performance Observer
    this.setupPerformanceObserver();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    // Disconnect all observers
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }

  /**
   * Setup Performance Observer
   */
  private setupPerformanceObserver(): void {
    if (typeof PerformanceObserver === 'undefined') {
      return;
    }

    // Observe navigation timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.sendNavigationTiming(entry as PerformanceNavigationTiming);
          }
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);
    } catch (error) {
      console.error('Failed to setup navigation observer:', error);
    }

    // Observe resource timing
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.sendResourceTiming(entry as PerformanceResourceTiming);
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (error) {
      console.error('Failed to setup resource observer:', error);
    }

    // Observe paint timing
    try {
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-paint') {
            this.sendMetric('firstPaint', entry);
          } else if (entry.name === 'first-contentful-paint') {
            this.sendMetric('firstContentfulPaint', entry);
          }
        });
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);
    } catch (error) {
      console.error('Failed to setup paint observer:', error);
    }
  }

  /**
   * Check threshold and create alert if exceeded
   */
  private checkThreshold(metric: string, value: number, threshold: number): void {
    if (value > threshold) {
      const alert: PerformanceAlert = {
        id: `${metric}-${Date.now()}`,
        type: value > threshold * 2 ? 'critical' : 'warning',
        metric,
        value,
        threshold,
        timestamp: new Date(),
        message: `${metric} (${value.toFixed(2)}) exceeds threshold (${threshold})`,
      };

      this.alerts.push(alert);
      this.sendAlert(alert);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): CoreWebVitals {
    return { ...this.metrics };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    const firstPaint = paint.find((entry) => entry.name === 'first-paint')?.startTime || 0;
    const firstContentfulPaint = paint.find((entry) => entry.name === 'first-contentful-paint')?.startTime || 0;

    return {
      pageLoadTime: navigation?.loadEventEnd || 0,
      domContentLoaded: navigation?.domContentLoadedEventEnd || 0,
      firstPaint,
      firstContentfulPaint,
      resourceTiming: resources,
      navigationTiming: navigation,
      memoryUsage: (performance as any).memory,
    };
  }

  /**
   * Get alerts
   */
  getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Get performance score
   */
  async getPerformanceScore(): Promise<PerformanceScore> {
    // Calculate score based on Core Web Vitals
    let performanceScore = 100;

    if (this.metrics.LCP) {
      const lcpScore = this.calculateLCPScore(this.metrics.LCP.value);
      performanceScore = Math.min(performanceScore, lcpScore);
    }

    if (this.metrics.FID) {
      const fidScore = this.calculateFIDScore(this.metrics.FID.value);
      performanceScore = Math.min(performanceScore, fidScore);
    }

    if (this.metrics.CLS) {
      const clsScore = this.calculateCLSScore(this.metrics.CLS.value);
      performanceScore = Math.min(performanceScore, clsScore);
    }

    if (this.metrics.INP) {
      const inpScore = this.calculateINPScore(this.metrics.INP.value);
      performanceScore = Math.min(performanceScore, inpScore);
    }

    return {
      overall: performanceScore,
      performance: performanceScore,
      accessibility: 95, // Placeholder - should be calculated from accessibility audit
      bestPractices: 90, // Placeholder - should be calculated from best practices audit
      seo: 92, // Placeholder - should be calculated from SEO audit
    };
  }

  /**
   * Calculate LCP score
   */
  private calculateLCPScore(lcp: number): number {
    if (lcp <= 2500) return 100;
    if (lcp <= 4000) return 75;
    if (lcp <= 6000) return 50;
    return 25;
  }

  /**
   * Calculate FID score
   */
  private calculateFIDScore(fid: number): number {
    if (fid <= 100) return 100;
    if (fid <= 300) return 75;
    if (fid <= 500) return 50;
    return 25;
  }

  /**
   * Calculate CLS score
   */
  private calculateCLSScore(cls: number): number {
    if (cls <= 0.1) return 100;
    if (cls <= 0.25) return 75;
    if (cls <= 0.5) return 50;
    return 25;
  }

  /**
   * Calculate INP score
   */
  private calculateINPScore(inp: number): number {
    if (inp <= 200) return 100;
    if (inp <= 500) return 75;
    if (inp <= 800) return 50;
    return 25;
  }

  /**
   * Send metric to analytics
   */
  private sendMetric(name: string, metric: Metric | PerformanceEntry): void {
    // Send to analytics service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        event_category: 'Performance',
        event_label: name,
        value: Math.round(metric.value),
        custom_map: {
          metric_name: name,
          metric_value: metric.value,
          metric_id: metric.id,
        },
      });
    }

    // Send to custom analytics endpoint
    this.sendToAnalytics({
      type: 'performance',
      metric: name,
      value: metric.value,
      id: metric.id,
      timestamp: Date.now(),
    });
  }

  /**
   * Send navigation timing to analytics
   */
  private sendNavigationTiming(timing: PerformanceNavigationTiming): void {
    this.sendToAnalytics({
      type: 'navigation',
      pageLoadTime: timing.loadEventEnd,
      domContentLoaded: timing.domContentLoadedEventEnd,
      timestamp: Date.now(),
    });
  }

  /**
   * Send resource timing to analytics
   */
  private sendResourceTiming(timing: PerformanceResourceTiming): void {
    this.sendToAnalytics({
      type: 'resource',
      name: timing.name,
      duration: timing.duration,
      size: timing.transferSize,
      timestamp: Date.now(),
    });
  }

  /**
   * Send alert to analytics
   */
  private sendAlert(alert: PerformanceAlert): void {
    this.sendToAnalytics({
      type: 'alert',
      alert: alert,
      timestamp: Date.now(),
    });
  }

  /**
   * Send data to analytics endpoint
   */
  private async sendToAnalytics(data: any): Promise<void> {
    try {
      await fetch('/api/v1/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: [
            {
              eventType: 'performance',
              properties: data,
              timestamp: new Date(),
            },
          ],
        }),
      });
    } catch (error) {
      console.error('Failed to send performance data:', error);
    }
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(): Promise<PerformanceDashboardData> {
    const score = await this.getPerformanceScore();
    const performanceMetrics = this.getPerformanceMetrics();

    return {
      coreWebVitals: this.getMetrics(),
      performanceMetrics,
      cacheStats: this.getCacheStats(),
      alerts: this.getAlerts(),
      score,
    };
  }

  /**
   * Get cache statistics
   */
  private getCacheStats(): CacheStats {
    // Get cache stats from cache service
    if (typeof window !== 'undefined' && (window as any).cacheService) {
      return (window as any).cacheService.getStats();
    }

    return {
      hits: 0,
      misses: 0,
      size: 0,
      hitRate: 0,
    };
  }
}

// Export singleton instance
export const performanceMonitoring = new PerformanceMonitoringService();

// Export types
export type {
  CoreWebVitals,
  PerformanceMetrics,
  CacheStats,
  PerformanceAlert,
  PerformanceDashboardData,
  PerformanceScore,
};
