/**
 * StarRating component for Dog Trainers Directory
 * Displays and handles star rating input (1-5 stars)
 */

'use client';

import React from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
}

export default function StarRating({
  rating,
  onRatingChange,
  size = 'medium',
  interactive = false,
}: StarRatingProps) {
  const handleStarClick = (starNumber: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starNumber);
    }
  };

  const handleStarHover = (starNumber: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starNumber);
    }
  };

  const handleStarLeave = () => {
    if (interactive && onRatingChange) {
      onRatingChange(rating);
    }
  };

  const sizeClasses = {
    small: 'star-small',
    medium: 'star-medium',
    large: 'star-large',
  };

  const stars = [1, 2, 3, 4, 5];

  return (
    <div
      className={`star-rating ${sizeClasses[size]} ${interactive ? 'interactive' : ''}`}
      role={interactive ? 'slider' : 'img'}
      aria-label={`${rating} out of 5 stars`}
      aria-valuemin={1}
      aria-valuemax={5}
      aria-valuenow={rating}
    >
      {stars.map((starNumber) => (
        <button
          key={starNumber}
          type="button"
          className={`star ${starNumber <= rating ? 'filled' : 'empty'}`}
          onClick={() => handleStarClick(starNumber)}
          onMouseEnter={() => handleStarHover(starNumber)}
          onMouseLeave={handleStarLeave}
          disabled={!interactive}
          aria-label={`Rate ${starNumber} stars`}
          tabIndex={interactive ? 0 : -1}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
    </div>
  );
}
