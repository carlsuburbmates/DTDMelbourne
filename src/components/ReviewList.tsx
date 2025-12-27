/**
 * ReviewList component for Dog Trainers Directory
 * Displays a list of reviews with pagination and filtering
 */

'use client';

import React from 'react';
import { Review, ReviewFilters } from '../types/reviews';
import StarRating from './StarRating';
import HelpfulVoting from './HelpfulVoting';
import SocialShare from './SocialShare';
import TrainerResponse from './TrainerResponse';

interface ReviewListProps {
  reviews: Review[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  onFilterChange: (filters: ReviewFilters) => void;
  filters: ReviewFilters;
  userId?: string;
  isTrainer?: boolean;
  onReviewUpdated?: () => void;
}

export default function ReviewList({
  reviews,
  total,
  page,
  onPageChange,
  onFilterChange,
  filters,
  userId,
  isTrainer = false,
  onReviewUpdated,
}: ReviewListProps) {
  const totalPages = Math.ceil(total / 10);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, sortBy: e.target.value as 'recent' | 'helpful' | 'rating' });
  };

  const handleRatingFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'all') {
      onFilterChange({ ...filters, minRating: undefined, maxRating: undefined });
    } else {
      const rating = parseInt(value, 10);
      onFilterChange({ ...filters, minRating: rating, maxRating: rating });
    }
  };

  return (
    <div className="review-list">
      <div className="review-filters">
        <div className="filter-group">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            value={filters.sortBy || 'recent'}
            onChange={handleSortChange}
            className="form-select"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="rating-filter">Rating:</label>
          <select
            id="rating-filter"
            value={filters.minRating ? filters.minRating.toString() : 'all'}
            onChange={handleRatingFilterChange}
            className="form-select"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="no-reviews">
          <p>No reviews found. Be the first to review!</p>
        </div>
      ) : (
        <>
          <ul className="reviews" role="list">
            {reviews.map((review) => (
              <li key={review.id} className="review-item" role="listitem">
                <div className="review-header">
                  <div className="review-rating">
                    <StarRating rating={review.rating} size="small" />
                  </div>
                  <div className="review-meta">
                    <time dateTime={review.timestamp.toISOString()}>
                      {new Date(review.timestamp).toLocaleDateString()}
                    </time>
                  </div>
                </div>

                {Object.keys(review.categories).length > 0 && (
                  <div className="review-categories">
                    {Object.entries(review.categories).map(([category, rating]) => (
                      <span key={category} className="category-tag">
                        {category}: {rating}/5
                      </span>
                    ))}
                  </div>
                )}

                <p className="review-comment">{review.comment}</p>

                <div className="review-actions">
                  <HelpfulVoting
                    reviewId={review.id}
                    userId={userId}
                    helpfulCount={review.helpful}
                  />
                  <SocialShare
                    title="Check out this review"
                    text={review.comment.substring(0, 100)}
                  />
                </div>

                <TrainerResponse
                  reviewId={review.id}
                  isTrainer={isTrainer}
                  onResponseSubmitted={onReviewUpdated}
                />
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="pagination" role="navigation" aria-label="Pagination">
              <button
                className="btn btn-secondary"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                aria-label="Previous page"
              >
                Previous
              </button>

              <span className="page-info">
                Page {page} of {totalPages}
              </span>

              <button
                className="btn btn-secondary"
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
