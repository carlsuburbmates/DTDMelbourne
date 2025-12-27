/**
 * Payment Audit Component
 * 
 * Displays payment audit records with revenue metrics.
 */

import React, { useEffect, useState } from 'react';
import { PaymentAudit } from '../../types/admin';
import { getPaymentAudit } from '../../services/admin';

export default function PaymentAudit() {
  const [audits, setAudits] = useState<PaymentAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAudits();
  }, []);

  async function loadAudits() {
    try {
      setLoading(true);
      const data = await getPaymentAudit();
      setAudits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment audit');
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: PaymentAudit['status']) {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function calculateRevenueMetrics() {
    const totalRevenue = audits
      .filter((a) => a.status === 'completed')
      .reduce((sum, a) => sum + a.amount, 0);
    const pendingRevenue = audits
      .filter((a) => a.status === 'pending')
      .reduce((sum, a) => sum + a.amount, 0);

    return { totalRevenue, pendingRevenue };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const metrics = calculateRevenueMetrics();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Payment Audit</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-medium text-green-800">Total Revenue</p>
          <p className="text-2xl font-bold text-green-900 mt-2">
            ${metrics.totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm font-medium text-yellow-800">Pending</p>
          <p className="text-2xl font-bold text-yellow-900 mt-2">
            ${metrics.pendingRevenue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Payment Audit Table */}
      {audits.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-500">No payment records found</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {audits.map((audit) => (
                <tr key={audit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {audit.bookingId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${audit.amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        audit.status
                      )}`}
                    >
                      {audit.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(audit.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
