/**
 * Featured Placement Component
 * 
 * Displays pending featured placement requests with approve/reject actions.
 */

import React, { useEffect, useState } from 'react';
import { FeaturedPlacement, AdminFilters } from '../../types/admin';
import { getPendingFeaturedRequests, approveFeatured, rejectFeatured } from '../../services/admin';

export default function FeaturedPlacement() {
  const [placements, setPlacements] = useState<FeaturedPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdminFilters>({ page: 1, limit: 20 });
  const [total, setTotal] = useState(0);
  const [selectedPlacement, setSelectedPlacement] = useState<FeaturedPlacement | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadPlacements();
  }, [filters]);

  async function loadPlacements() {
    try {
      setLoading(true);
      const response = await getPendingFeaturedRequests(filters);
      setPlacements(response.data);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load featured requests');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(placementId: string) {
    try {
      await approveFeatured(placementId);
      await loadPlacements();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve placement');
    }
  }

  async function handleReject(placementId: string) {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    try {
      await rejectFeatured(placementId, rejectReason);
      setRejectReason('');
      setSelectedPlacement(null);
      await loadPlacements();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject placement');
    }
  }

  function handleFilterChange(key: keyof AdminFilters, value: any) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  if (loading && placements.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Featured Placement Requests</h2>
        <p className="text-sm text-gray-500">{total} pending requests</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {placements.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-500">No pending featured placement requests</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trainer ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {placements.map((placement) => (
                <tr key={placement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{placement.trainerId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={placement.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(placement.requestedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {placement.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleApprove(placement.id)}
                          className="text-green-600 hover:text-green-900"
                          aria-label="Approve placement"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setSelectedPlacement(placement)}
                          className="text-red-600 hover:text-red-900"
                          aria-label="Reject placement"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {placements.length > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Showing {placements.length} of {total} requests
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange('page', Math.max(1, (filters.page || 1) - 1))}
              disabled={(filters.page || 1) === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => handleFilterChange('page', (filters.page || 1) + 1)}
              disabled={placements.length < (filters.limit || 20)}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {selectedPlacement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Reject Featured Placement</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reject this featured placement request?
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedPlacement(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedPlacement.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface StatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected';
}

function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
    rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
  };

  const config = statusConfig[status];

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}>
      {config.label}
    </span>
  );
}
