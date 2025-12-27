/**
 * System Health Component
 * 
 * Displays system health metrics including CPU, memory, disk, uptime, and response time.
 */

import React, { useEffect, useState } from 'react';
import { SystemHealth } from '../../types/admin';
import { getSystemHealth } from '../../services/admin';

export default function SystemHealth() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  async function loadHealth() {
    try {
      const data = await getSystemHealth();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load system health');
    } finally {
      setLoading(false);
    }
  }

  function getHealthStatus(value: number, limit: number) {
    if (value < limit * 0.5) return 'good';
    if (value < limit * 0.8) return 'warning';
    return 'critical';
  }

  function getHealthColor(status: 'good' | 'warning' | 'critical') {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function formatUptime(seconds: number) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!health) {
    return null;
  }

  const cpuStatus = getHealthStatus(health.cpu, 100);
  const memoryStatus = getHealthStatus(health.memory, 100);
  const diskStatus = getHealthStatus(health.disk, 100);
  const responseStatus = getHealthStatus(health.responseTime, 1000);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">System Health</h2>
        <button
          onClick={loadHealth}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthCard
          title="CPU Usage"
          value={`${health.cpu.toFixed(1)}%`}
          status={cpuStatus}
          icon="💻"
        />
        <HealthCard
          title="Memory Usage"
          value={`${health.memory.toFixed(1)}%`}
          status={memoryStatus}
          icon="🧠"
        />
        <HealthCard
          title="Disk Usage"
          value={`${health.disk.toFixed(1)}%`}
          status={diskStatus}
          icon="💾"
        />
        <HealthCard
          title="Response Time"
          value={`${health.responseTime.toFixed(0)}ms`}
          status={responseStatus}
          icon="⚡"
        />
      </div>

      {/* Uptime */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">System Uptime</h3>
        <div className="flex items-center gap-4">
          <span className="text-4xl">⏱️</span>
          <div>
            <p className="text-3xl font-bold text-gray-900">
              {formatUptime(health.uptime)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {health.uptime.toFixed(0)} seconds total
            </p>
          </div>
        </div>
      </div>

      {/* Health Status Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Overall Status</h3>
        <div className="flex items-center gap-4">
          {cpuStatus === 'good' && memoryStatus === 'good' && diskStatus === 'good' && responseStatus === 'good' ? (
            <div className="flex items-center gap-2">
              <span className="text-4xl">✅</span>
              <div>
                <p className="text-xl font-bold text-green-800">All Systems Operational</p>
                <p className="text-sm text-green-600">All metrics within normal range</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-4xl">⚠️</span>
              <div>
                <p className="text-xl font-bold text-yellow-800">Attention Required</p>
                <p className="text-sm text-yellow-600">Some metrics exceed normal range</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface HealthCardProps {
  title: string;
  value: string;
  status: 'good' | 'warning' | 'critical';
  icon: string;
}

function HealthCard({ title, value, status, icon }: HealthCardProps) {
  const colorClass = getHealthColor(status);

  return (
    <div className={`border rounded-lg p-4 ${colorClass}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
      </div>
    </div>
  );
}

function getHealthColor(status: 'good' | 'warning' | 'critical') {
  switch (status) {
    case 'good':
      return 'bg-green-50 text-green-800 border-green-200';
    case 'warning':
      return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    case 'critical':
      return 'bg-red-50 text-red-800 border-red-200';
    default:
      return 'bg-gray-50 text-gray-800 border-gray-200';
  }
}
