/**
 * Overview Dashboard Component
 * 
 * Displays KPI cards with key metrics for the admin dashboard.
 */

import React, { useEffect, useState } from 'react';
import { AdminKPI } from '../../types/admin';
import { getKPI } from '../../services/admin';

export default function Overview() {
  const [kpi, setKpi] = useState<AdminKPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadKPI() {
      try {
        const data = await getKPI();
        setKpi(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load KPI');
      } finally {
        setLoading(false);
      }
    }
    loadKPI();
  }, []);

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

  if (!kpi) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>

      {/* Users KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Total Users"
          value={kpi.users.total}
          icon="👥"
          color="blue"
        />
        <KPICard
          title="Active Users"
          value={kpi.users.active}
          icon="✅"
          color="green"
        />
        <KPICard
          title="New This Week"
          value={kpi.users.newThisWeek}
          icon="📈"
          color="purple"
        />
      </div>

      {/* Bookings KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Bookings"
          value={kpi.bookings.total}
          icon="📅"
          color="blue"
        />
        <KPICard
          title="Pending"
          value={kpi.bookings.pending}
          icon="⏳"
          color="yellow"
        />
        <KPICard
          title="Completed"
          value={kpi.bookings.completed}
          icon="✅"
          color="green"
        />
        <KPICard
          title="Revenue"
          value={`$${kpi.bookings.revenue.toLocaleString()}`}
          icon="💰"
          color="green"
        />
      </div>

      {/* Reviews KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Reviews"
          value={kpi.reviews.total}
          icon="⭐"
          color="blue"
        />
        <KPICard
          title="Pending"
          value={kpi.reviews.pending}
          icon="⏳"
          color="yellow"
        />
        <KPICard
          title="Approved"
          value={kpi.reviews.approved}
          icon="✅"
          color="green"
        />
        <KPICard
          title="Rejected"
          value={kpi.reviews.rejected}
          icon="❌"
          color="red"
        />
      </div>

      {/* Featured KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Featured"
          value={kpi.featured.total}
          icon="⭐"
          color="blue"
        />
        <KPICard
          title="Pending"
          value={kpi.featured.pending}
          icon="⏳"
          color="yellow"
        />
        <KPICard
          title="Approved"
          value={kpi.featured.approved}
          icon="✅"
          color="green"
        />
        <KPICard
          title="Rejected"
          value={kpi.featured.rejected}
          icon="❌"
          color="red"
        />
      </div>
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: number | string;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

function KPICard({ title, value, icon, color }: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
  };

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );
}
