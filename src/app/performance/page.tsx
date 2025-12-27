/**
 * Performance dashboard page
 * Displays performance metrics, Core Web Vitals, cache statistics, and recommendations
 */

'use client';

import { useState, useEffect } from 'react';
import { performanceMonitoring } from '../../services/monitoring';
import type {
  PerformanceDashboardData,
  CoreWebVitals,
  PerformanceMetrics,
  CacheStats,
  PerformanceAlert,
  PerformanceScore,
} from '../../services/monitoring';

export default function PerformanceDashboard() {
  const [dashboardData, setDashboardData] = useState<PerformanceDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    loadDashboardData();

    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const data = await performanceMonitoring.getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto" />
          <p className="mt-4 text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load performance data</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { coreWebVitals, performanceMetrics, cacheStats, alerts, score } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Monitor application performance, Core Web Vitals, and cache statistics
          </p>
        </div>

        {/* Controls */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Data
          </button>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            <span className="text-gray-700">Auto-refresh (30s)</span>
          </label>
        </div>

        {/* Performance Score */}
        <PerformanceScoreCard score={score} />

        {/* Core Web Vitals */}
        <CoreWebVitalsCard metrics={coreWebVitals} />

        {/* Performance Metrics */}
        <PerformanceMetricsCard metrics={performanceMetrics} />

        {/* Cache Statistics */}
        <CacheStatsCard stats={cacheStats} />

        {/* Alerts */}
        <AlertsCard alerts={alerts} onClear={() => performanceMonitoring.clearAlerts()} />

        {/* Recommendations */}
        <RecommendationsCard score={score} metrics={coreWebVitals} />
      </div>
    </div>
  );
}

/**
 * Performance score card
 */
function PerformanceScoreCard({ score }: { score: PerformanceScore }) {
  const getScoreColor = (value: number): string => {
    if (value >= 90) return 'text-green-600';
    if (value >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (value: number): string => {
    if (value >= 90) return 'bg-green-100';
    if (value >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="mb-8 bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Score</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          label="Overall"
          value={score.overall}
          color={getScoreColor(score.overall)}
          bgColor={getScoreBgColor(score.overall)}
        />
        <ScoreCard
          label="Performance"
          value={score.performance}
          color={getScoreColor(score.performance)}
          bgColor={getScoreBgColor(score.performance)}
        />
        <ScoreCard
          label="Accessibility"
          value={score.accessibility}
          color={getScoreColor(score.accessibility)}
          bgColor={getScoreBgColor(score.accessibility)}
        />
        <ScoreCard
          label="SEO"
          value={score.seo}
          color={getScoreColor(score.seo)}
          bgColor={getScoreBgColor(score.seo)}
        />
      </div>
    </div>
  );
}

/**
 * Score card component
 */
function ScoreCard({
  label,
  value,
  color,
  bgColor,
}: {
  label: string;
  value: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className={`${bgColor} rounded-lg p-4`}>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{Math.round(value)}</p>
    </div>
  );
}

/**
 * Core Web Vitals card
 */
function CoreWebVitalsCard({ metrics }: { metrics: CoreWebVitals }) {
  const getMetricStatus = (value: number, threshold: number): 'good' | 'needs-improvement' | 'poor' => {
    if (value <= threshold) return 'good';
    if (value <= threshold * 1.5) return 'needs-improvement';
    return 'poor';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-100';
      case 'poor':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="mb-8 bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Core Web Vitals</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.LCP && (
          <MetricCard
            label="Largest Contentful Paint (LCP)"
            value={`${metrics.LCP.value.toFixed(0)} ms`}
            status={getMetricStatus(metrics.LCP.value, 2500)}
            threshold="< 2.5s"
          />
        )}
        {metrics.FID && (
          <MetricCard
            label="First Input Delay (FID)"
            value={`${metrics.FID.value.toFixed(0)} ms`}
            status={getMetricStatus(metrics.FID.value, 100)}
            threshold="< 100ms"
          />
        )}
        {metrics.CLS && (
          <MetricCard
            label="Cumulative Layout Shift (CLS)"
            value={metrics.CLS.value.toFixed(3)}
            status={getMetricStatus(metrics.CLS.value, 0.1)}
            threshold="< 0.1"
          />
        )}
        {metrics.FCP && (
          <MetricCard
            label="First Contentful Paint (FCP)"
            value={`${metrics.FCP.value.toFixed(0)} ms`}
            status={getMetricStatus(metrics.FCP.value, 1800)}
            threshold="< 1.8s"
          />
        )}
        {metrics.TTFB && (
          <MetricCard
            label="Time to First Byte (TTFB)"
            value={`${metrics.TTFB.value.toFixed(0)} ms`}
            status={getMetricStatus(metrics.TTFB.value, 600)}
            threshold="< 600ms"
          />
        )}
        {metrics.INP && (
          <MetricCard
            label="Interaction to Next Paint (INP)"
            value={`${metrics.INP.value.toFixed(0)} ms`}
            status={getMetricStatus(metrics.INP.value, 200)}
            threshold="< 200ms"
          />
        )}
      </div>
    </div>
  );
}

/**
 * Metric card component
 */
function MetricCard({
  label,
  value,
  status,
  threshold,
}: {
  label: string;
  value: string;
  status: 'good' | 'needs-improvement' | 'poor';
  threshold: string;
}) {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-100';
      case 'poor':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`${getStatusColor(status)} rounded-lg p-4`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-1">Target: {threshold}</p>
    </div>
  );
}

/**
 * Performance metrics card
 */
function PerformanceMetricsCard({ metrics }: { metrics: PerformanceMetrics }) {
  return (
    <div className="mb-8 bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-600">Page Load Time</p>
          <p className="text-2xl font-bold text-gray-900">
            {metrics.pageLoadTime.toFixed(0)} ms
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-600">DOM Content Loaded</p>
          <p className="text-2xl font-bold text-gray-900">
            {metrics.domContentLoaded.toFixed(0)} ms
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-600">First Paint</p>
          <p className="text-2xl font-bold text-gray-900">
            {metrics.firstPaint.toFixed(0)} ms
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-600">First Contentful Paint</p>
          <p className="text-2xl font-bold text-gray-900">
            {metrics.firstContentfulPaint.toFixed(0)} ms
          </p>
        </div>
      </div>
      {metrics.memoryUsage && (
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-600">Memory Usage</p>
          <p className="text-2xl font-bold text-gray-900">
            {(metrics.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Cache statistics card
 */
function CacheStatsCard({ stats }: { stats: CacheStats }) {
  const getHitRateColor = (rate: number): string => {
    if (rate >= 0.8) return 'text-green-600';
    if (rate >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="mb-8 bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Cache Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-600">Cache Hits</p>
          <p className="text-2xl font-bold text-gray-900">{stats.hits}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-600">Cache Misses</p>
          <p className="text-2xl font-bold text-gray-900">{stats.misses}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-600">Cache Size</p>
          <p className="text-2xl font-bold text-gray-900">{stats.size}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-600">Hit Rate</p>
          <p className={`text-2xl font-bold ${getHitRateColor(stats.hitRate)}`}>
            {(stats.hitRate * 100).toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Alerts card
 */
function AlertsCard({
  alerts,
  onClear,
}: {
  alerts: PerformanceAlert[];
  onClear: () => void;
}) {
  if (alerts.length === 0) {
    return (
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Alerts</h2>
        <p className="text-gray-600">No performance alerts</p>
      </div>
    );
  }

  const getAlertColor = (type: string): string => {
    switch (type) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'error':
        return 'border-orange-500 bg-orange-50';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="mb-8 bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Performance Alerts</h2>
        <button
          onClick={onClear}
          className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Clear Alerts
        </button>
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`border-l-4 ${getAlertColor(alert.type)} rounded p-4`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{alert.metric}</p>
                <p className="text-sm text-gray-600">{alert.message}</p>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(alert.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Recommendations card
 */
function RecommendationsCard({
  score,
  metrics,
}: {
  score: PerformanceScore;
  metrics: CoreWebVitals;
}) {
  const recommendations: string[] = [];

  if (score.performance < 90) {
    recommendations.push('Optimize images and reduce bundle size');
  }

  if (metrics.LCP && metrics.LCP.value > 2500) {
    recommendations.push('Improve LCP by optimizing largest contentful paint elements');
  }

  if (metrics.FID && metrics.FID.value > 100) {
    recommendations.push('Reduce JavaScript execution time to improve FID');
  }

  if (metrics.CLS && metrics.CLS.value > 0.1) {
    recommendations.push('Reduce layout shifts by reserving space for dynamic content');
  }

  if (score.accessibility < 90) {
    recommendations.push('Improve accessibility by adding ARIA labels and alt text');
  }

  if (score.seo < 90) {
    recommendations.push('Improve SEO by adding meta tags and structured data');
  }

  if (recommendations.length === 0) {
    return (
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommendations</h2>
        <p className="text-green-600 font-medium">
          Great job! Your performance is excellent. No recommendations at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8 bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Recommendations</h2>
      <ul className="space-y-2">
        {recommendations.map((recommendation, index) => (
          <li key={index} className="flex items-start">
            <span className="mr-2 text-blue-600">•</span>
            <span className="text-gray-700">{recommendation}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
