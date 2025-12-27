/**
 * Analytics Dashboard Component
 * 
 * Displays user behavior and booking analytics metrics.
 */

import React, { useEffect, useState } from 'react';
import { UserBehaviorMetrics, BookingMetrics } from '../../types/admin';
import { getUserBehaviorMetrics, getBookingMetrics } from '../../services/admin';

export default function Analytics() {
  const [userMetrics, setUserMetrics] = useState<UserBehaviorMetrics | null>(null);
  const [bookingMetrics, setBookingMetrics] = useState<BookingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const [userBehavior, bookings] = await Promise.all([
          getUserBehaviorMetrics(),
          getBookingMetrics(),
        ]);
        setUserMetrics(userBehavior);
        setBookingMetrics(bookings);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>

      {/* User Behavior Metrics */}
      {userMetrics && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">User Behavior</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Page Views"
              value={userMetrics.pageViews.toLocaleString()}
              icon="📄"
            />
            <MetricCard
              title="Unique Visitors"
              value={userMetrics.uniqueVisitors.toLocaleString()}
              icon="👥"
            />
            <MetricCard
              title="Avg Session Duration"
              value={`${Math.round(userMetrics.avgSessionDuration / 60)}m`}
              icon="⏱️"
            />
            <MetricCard
              title="Bounce Rate"
              value={`${userMetrics.bounceRate.toFixed(1)}%`}
              icon="📉"
            />
          </div>

          {/* Top Pages */}
          <div>
            <h4 className="text-md font-semibold mb-3">Top Pages</h4>
            <div className="space-y-2">
              {userMetrics.topPages.map((page, index) => (
                <div
                  key={page.page}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500">
                      #{index + 1}
                    </span>
                    <span className="text-sm text-gray-900">{page.page}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {page.views.toLocaleString()} views
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Booking Metrics */}
      {bookingMetrics && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Booking Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Total Bookings"
              value={bookingMetrics.totalBookings.toLocaleString()}
              icon="📅"
            />
            <MetricCard
              title="Completed"
              value={bookingMetrics.completedBookings.toLocaleString()}
              icon="✅"
            />
            <MetricCard
              title="Cancelled"
              value={bookingMetrics.cancelledBookings.toLocaleString()}
              icon="❌"
            />
            <MetricCard
              title="Avg Booking Value"
              value={`$${bookingMetrics.averageBookingValue.toFixed(2)}`}
              icon="💰"
            />
          </div>

          {/* Bookings by Day Chart */}
          <div>
            <h4 className="text-md font-semibold mb-3">Bookings by Day</h4>
            <div className="space-y-2">
              {bookingMetrics.bookingsByDay.map((day) => (
                <div
                  key={day.date}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded"
                >
                  <span className="text-sm text-gray-500 w-24">
                    {new Date(day.date).toLocaleDateString()}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{
                        width: `${(day.count / Math.max(...bookingMetrics.bookingsByDay.map((d) => d.count))) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">
                    {day.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: string;
}

function MetricCard({ title, value, icon }: MetricCardProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-sm font-medium text-blue-800">{title}</p>
          <p className="text-2xl font-bold text-blue-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
