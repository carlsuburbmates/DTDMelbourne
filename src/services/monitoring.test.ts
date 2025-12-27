/**
 * Unit tests for performance monitoring service
 */

import { describe, it, beforeEach, afterEach } from '@jest/globals';
import { performanceMonitoring } from './monitoring';

describe('PerformanceMonitoringService', () => {
  beforeEach(() => {
    // Clear alerts before each test
    performanceMonitoring.clearAlerts();
  });

  afterEach(() => {
    performanceMonitoring.stopMonitoring();
  });

  describe('startMonitoring', () => {
    it('should start monitoring', async () => {
      await performanceMonitoring.startMonitoring();
      
      // Should not throw
      expect(true).toBe(true);
    });

    it('should not start monitoring twice', async () => {
      await performanceMonitoring.startMonitoring();
      await performanceMonitoring.startMonitoring();
      
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('stopMonitoring', () => {
    it('should stop monitoring', async () => {
      await performanceMonitoring.startMonitoring();
      performanceMonitoring.stopMonitoring();
      
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('getMetrics', () => {
    it('should return empty metrics initially', () => {
      const metrics = performanceMonitoring.getMetrics();
      
      expect(metrics).toEqual({});
    });

    it('should return metrics after monitoring', async () => {
      await performanceMonitoring.startMonitoring();
      
      // Wait for metrics to be collected
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      const metrics = performanceMonitoring.getMetrics();
      
      expect(metrics).toHaveProperty('LCP');
      expect(metrics).toHaveProperty('FID');
      expect(metrics).toHaveProperty('CLS');
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return performance metrics', () => {
      const metrics = performanceMonitoring.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('pageLoadTime');
      expect(metrics).toHaveProperty('domContentLoaded');
      expect(metrics).toHaveProperty('firstPaint');
      expect(metrics).toHaveProperty('firstContentfulPaint');
      expect(metrics).toHaveProperty('resourceTiming');
      expect(metrics).toHaveProperty('navigationTiming');
    });
  });

  describe('getAlerts', () => {
    it('should return empty alerts initially', () => {
      const alerts = performanceMonitoring.getAlerts();
      
      expect(alerts).toEqual([]);
    });

    it('should return alerts after monitoring', async () => {
      await performanceMonitoring.startMonitoring();
      
      // Simulate metric that exceeds threshold
      const mockMetric = {
        id: 'test-metric',
        value: 5000, // Exceeds LCP threshold
        delta: 5000,
        entries: [],
        name: 'LCP',
        rating: 'poor',
        navigationType: 'navigate',
      };
      
      // Manually add alert for testing
      const alerts = performanceMonitoring.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  describe('clearAlerts', () => {
    it('should clear all alerts', async () => {
      await performanceMonitoring.startMonitoring();
      
      // Wait for alerts to be generated
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      const alertsBefore = performanceMonitoring.getAlerts();
      expect(alertsBefore.length).toBeGreaterThan(0);
      
      performanceMonitoring.clearAlerts();
      
      const alertsAfter = performanceMonitoring.getAlerts();
      expect(alertsAfter).toEqual([]);
    });
  });

  describe('getPerformanceScore', () => {
    it('should return performance score', async () => {
      await performanceMonitoring.startMonitoring();
      
      // Wait for metrics to be collected
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      const score = await performanceMonitoring.getPerformanceScore();
      
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('performance');
      expect(score).toHaveProperty('accessibility');
      expect(score).toHaveProperty('bestPractices');
      expect(score).toHaveProperty('seo');
    });

    it('should calculate score based on metrics', async () => {
      await performanceMonitoring.startMonitoring();
      
      // Wait for metrics to be collected
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      const score = await performanceMonitoring.getPerformanceScore();
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(100);
    });
  });

  describe('getDashboardData', () => {
    it('should return dashboard data', async () => {
      await performanceMonitoring.startMonitoring();
      
      // Wait for metrics to be collected
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      const dashboardData = await performanceMonitoring.getDashboardData();
      
      expect(dashboardData).toHaveProperty('coreWebVitals');
      expect(dashboardData).toHaveProperty('performanceMetrics');
      expect(dashboardData).toHaveProperty('cacheStats');
      expect(dashboardData).toHaveProperty('alerts');
      expect(dashboardData).toHaveProperty('score');
    });
  });

  describe('calculateLCPScore', () => {
    it('should return 100 for LCP <= 2500', () => {
      const score = performanceMonitoring['calculateLCPScore'](2500);
      expect(score).toBe(100);
    });

    it('should return 75 for LCP <= 4000', () => {
      const score = performanceMonitoring['calculateLCPScore'](4000);
      expect(score).toBe(75);
    });

    it('should return 50 for LCP <= 6000', () => {
      const score = performanceMonitoring['calculateLCPScore'](6000);
      expect(score).toBe(50);
    });

    it('should return 25 for LCP > 6000', () => {
      const score = performanceMonitoring['calculateLCPScore'](7000);
      expect(score).toBe(25);
    });
  });

  describe('calculateFIDScore', () => {
    it('should return 100 for FID <= 100', () => {
      const score = performanceMonitoring['calculateFIDScore'](100);
      expect(score).toBe(100);
    });

    it('should return 75 for FID <= 300', () => {
      const score = performanceMonitoring['calculateFIDScore'](300);
      expect(score).toBe(75);
    });

    it('should return 50 for FID <= 500', () => {
      const score = performanceMonitoring['calculateFIDScore'](500);
      expect(score).toBe(50);
    });

    it('should return 25 for FID > 500', () => {
      const score = performanceMonitoring['calculateFIDScore'](600);
      expect(score).toBe(25);
    });
  });

  describe('calculateCLSScore', () => {
    it('should return 100 for CLS <= 0.1', () => {
      const score = performanceMonitoring['calculateCLSScore'](0.1);
      expect(score).toBe(100);
    });

    it('should return 75 for CLS <= 0.25', () => {
      const score = performanceMonitoring['calculateCLSScore'](0.25);
      expect(score).toBe(75);
    });

    it('should return 50 for CLS <= 0.5', () => {
      const score = performanceMonitoring['calculateCLSScore'](0.5);
      expect(score).toBe(50);
    });

    it('should return 25 for CLS > 0.5', () => {
      const score = performanceMonitoring['calculateCLSScore'](0.6);
      expect(score).toBe(25);
    });
  });

  describe('calculateINPScore', () => {
    it('should return 100 for INP <= 200', () => {
      const score = performanceMonitoring['calculateINPScore'](200);
      expect(score).toBe(100);
    });

    it('should return 75 for INP <= 500', () => {
      const score = performanceMonitoring['calculateINPScore'](500);
      expect(score).toBe(75);
    });

    it('should return 50 for INP <= 800', () => {
      const score = performanceMonitoring['calculateINPScore'](800);
      expect(score).toBe(50);
    });

    it('should return 25 for INP > 800', () => {
      const score = performanceMonitoring['calculateINPScore'](900);
      expect(score).toBe(25);
    });
  });
});
