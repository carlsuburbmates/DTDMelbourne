/**
 * ReviewForm component for Dog Trainers Directory
 * Form for submitting reviews with validation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ReviewSubmission, ReviewCategory } from '../types/reviews';
import { submitReview, getReviewCategories, validateReviewSubmission } from '../services/reviews';
import StarRating from './StarRating';

interface ReviewFormProps {
  trainerId: string;
  userId?: string;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function ReviewForm({ trainerId, userId, onSubmit, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [categories, setCategories] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [availableCategories, setAvailableCategories] = useState<ReviewCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getReviewCategories();
      setAvailableCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
  };

  const handleCategoryChange = (categoryName: string, value: number) => {
    setCategories((prev) => ({
      ...prev,
      [categoryName]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submission: ReviewSubmission = {
      trainerId,
      rating,
      categories,
      comment,
    };

    const validation = validateReviewSubmission(submission);

    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setValidationErrors([]);

      await submitReview(submission);
      onSubmit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="review-form" noValidate>
      <div className="form-group">
        <label htmlFor="overall-rating">
          Overall Rating <span className="required">*</span>
        </label>
        <StarRating
          rating={rating}
          onRatingChange={handleRatingChange}
          size="large"
          interactive
        />
        {rating === 0 && validationErrors.length > 0 && (
          <span className="error-message">Please select a rating</span>
        )}
      </div>

      {availableCategories.length > 0 && (
        <div className="form-group">
          <label>Category Ratings</label>
          <div className="category-ratings">
            {availableCategories.map((category) => (
              <div key={category.id} className="category-rating">
                <label htmlFor={`category-${category.id}`}>
                  {category.name}
                  {category.description && (
                    <span className="category-description">
                      {category.description}
                    </span>
                  )}
                </label>
                <StarRating
                  rating={categories[category.name] || 0}
                  onRatingChange={(value) => handleCategoryChange(category.name, value)}
                  size="small"
                  interactive
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="comment">
          Your Review <span className="required">*</span>
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this trainer..."
          rows={5}
          maxLength={1000}
          required
          aria-describedby="comment-hint"
        />
        <div id="comment-hint" className="character-count">
          {comment.length} / 1000 characters
        </div>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="alert alert-error" role="alert">
          <ul>
            {validationErrors.map((err, index) => (
              <li key={index}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || rating === 0 || comment.trim().length === 0}
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
}
