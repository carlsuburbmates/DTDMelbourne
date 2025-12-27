/**
 * Trainer Management Component
 * 
 * Displays trainer list with verification workflow.
 */

import React, { useEffect, useState } from 'react';
import { TrainerWithVerification, AdminFilters } from '../../types/admin';
import { getTrainers, verifyTrainer } from '../../services/admin';

export default function TrainerManagement() {
  const [trainers, setTrainers] = useState<TrainerWithVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdminFilters>({ page: 1, limit: 20 });
  const [total, setTotal] = useState(0);
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerWithVerification | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadTrainers();
  }, [filters]);

  async function loadTrainers() {
    try {
      setLoading(true);
      const response = await getTrainers(filters);
      setTrainers(response.data);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trainers');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(trainerId: string) {
    try {
      await verifyTrainer(trainerId, 'verified');
      await loadTrainers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify trainer');
    }
  }

  async function handleReject(trainerId: string) {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    try {
      await verifyTrainer(trainerId, 'rejected', rejectReason);
      setRejectReason('');
      setSelectedTrainer(null);
      await loadTrainers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject trainer');
    }
  }

  function handleFilterChange(key: keyof AdminFilters, value: any) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  if (loading && trainers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Trainer Management</h2>
        <div className="flex gap-2">
          <select
            value={filters.status || 'all'}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trainers.map((trainer) => (
              <tr key={trainer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{trainer.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{trainer.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={trainer.verificationStatus} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(trainer.submittedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {trainer.verificationStatus === 'pending' && (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleVerify(trainer.id)}
                        className="text-green-600 hover:text-green-900"
                        aria-label="Verify trainer"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => setSelectedTrainer(trainer)}
                        className="text-red-600 hover:text-red-900"
                        aria-label="Reject trainer"
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

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          Showing {trainers.length} of {total} trainers
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
            disabled={trainers.length < (filters.limit || 20)}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Reject Modal */}
      {selectedTrainer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Reject Trainer</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reject {selectedTrainer.name}?
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
                  setSelectedTrainer(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedTrainer.id)}
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
  status: 'pending' | 'verified' | 'rejected';
}

function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    verified: { color: 'bg-green-100 text-green-800', label: 'Verified' },
    rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
  };

  const config = statusConfig[status];

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${config.color}`}>
      {config.label}
    </span>
  );
}
