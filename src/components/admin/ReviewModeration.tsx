/**
 * Review Moderation Component
 * 
 * Displays pending reviews with approve/reject actions.
 */

import React, { useEffect, useState } from 'react';
import { ReviewWithModeration, AdminFilters } from '../../types/admin';
import { getPendingReviews, approveReview, rejectReview } from '../../services/admin';

export default function ReviewModeration() {
  const [reviews, setReviews] = useState<ReviewWithModeration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdminFilters>({ page: 1, limit: 20 });
  const [total, setTotal] = useState(0);
  const [selectedReview, setSelectedReview] = useState<ReviewWithModeration | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadReviews();
  }, [filters]);

  async function loadReviews() {
    try {
      setLoading(true);
      const response = await getPendingReviews(filters);
      setReviews(response.data);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(reviewId: string) {
    try {
      await approveReview(reviewId);
      await loadReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve review');
    }
  }

  async function handleReject(reviewId: string) {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    try {
      await rejectReview(reviewId, rejectReason);
      setRejectReason('');
      setSelectedReview(null);
      await loadReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject review');
    }
  }

  function handleFilterChange(key: keyof AdminFilters, value: any) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Review Moderation</h2>
        <p className="text-sm text-gray-500">{total} pending reviews</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-500">No pending reviews to moderate</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onApprove={() => handleApprove(review.id)}
              onReject={() => setSelectedReview(review)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {reviews.length > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Showing {reviews.length} of {total} reviews
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
              disabled={reviews.length < (filters.limit || 20)}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Reject Review</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reject this review?
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
                  setSelectedReview(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedReview.id)}
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

interface ReviewCardProps {
  review: ReviewWithModeration;
  onApprove: () => void;
  onReject: () => void;
}

function ReviewCard({ review, onApprove, onReject }: ReviewCardProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <StarRating rating={review.rating} />
            <span className="text-sm text-gray-500">
              {new Date(review.timestamp).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-gray-500">Trainer ID: {review.trainerId}</p>
          <p className="text-sm text-gray-500">User ID: {review.userId}</p>
        </div>
        <StatusBadge status={review.status} />
      </div>
      <p className="text-gray-900 mb-4">{review.comment}</p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onApprove}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Approve
        </button>
        <button
          onClick={onReject}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

interface StarRatingProps {
  rating: number;
}

function StarRating({ rating }: StarRatingProps) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </span>
      ))}
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
