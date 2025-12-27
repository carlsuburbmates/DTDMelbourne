/**
 * Reviews component for Dog Trainers Directory
 * Main component that manages review display and submission
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Review, ReviewAggregation, ReviewFilters } from '../types/reviews';
import { getTrainerReviews, getReviewAggregation } from '../services/reviews';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';

interface ReviewsProps {
  trainerId: string;
  userId?: string;
  isTrainer?: boolean;
}

export default function Reviews({ trainerId, userId, isTrainer = false }: ReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [aggregation, setAggregation] = useState<ReviewAggregation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState<ReviewFilters>({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadReviews();
    loadAggregation();
  }, [trainerId, filters, page]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getTrainerReviews(trainerId, { ...filters, page, limit: 10 });
      setReviews(result.reviews);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const loadAggregation = async () => {
    try {
      const data = await getReviewAggregation(trainerId);
      setAggregation(data);
    } catch (err) {
      console.error('Failed to load aggregation:', err);
    }
  };

  const handleReviewSubmitted = () => {
    setShowForm(false);
    loadReviews();
    loadAggregation();
  };

  const handleFilterChange = (newFilters: ReviewFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="reviews-container" role="region" aria-label="Reviews">
      <div className="reviews-header">
        <h2>Reviews</h2>
        {aggregation && (
          <div className="reviews-summary">
            <div className="average-rating">
              <span className="rating-value">{aggregation.averageRating.toFixed(1)}</span>
              <span className="rating-label">out of 5</span>
            </div>
            <div className="total-reviews">
              {aggregation.totalReviews} {aggregation.totalReviews === 1 ? 'review' : 'reviews'}
            </div>
          </div>
        )}
      </div>

      {!isTrainer && userId && (
        <button
          className="btn btn-primary write-review-btn"
          onClick={() => setShowForm(!showForm)}
          aria-expanded={showForm}
          aria-controls="review-form"
        >
          {showForm ? 'Cancel' : 'Write a Review'}
        </button>
      )}

      {showForm && (
        <div id="review-form" className="review-form-container">
          <ReviewForm
            trainerId={trainerId}
            userId={userId}
            onSubmit={handleReviewSubmitted}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-spinner" aria-label="Loading reviews">
          <div className="spinner"></div>
        </div>
      ) : (
        <ReviewList
          reviews={reviews}
          total={total}
          page={page}
          onPageChange={handlePageChange}
          onFilterChange={handleFilterChange}
          filters={filters}
          userId={userId}
          isTrainer={isTrainer}
          onReviewUpdated={loadReviews}
        />
      )}
    </div>
  );
}
