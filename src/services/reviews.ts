/**
 * Reviews service for Dog Trainers Directory
 * Handles CRUD operations, filtering, aggregation, and helpful voting
 */

import {
  Review,
  ReviewCategory,
  TrainerResponse,
  ReviewAggregation,
  ReviewFilters,
  PaginationParams,
  PaginatedReviews,
  HelpfulVote,
  ReviewSubmission,
  TrainerResponseSubmission,
} from '../types/reviews';

const API_BASE = '/api/v1/reviews';

/**
 * Fetch reviews for a specific trainer with pagination and filtering
 */
export async function getTrainerReviews(
  trainerId: string,
  params: PaginationParams & ReviewFilters = { page: 1, limit: 10 }
): Promise<PaginatedReviews> {
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    limit: params.limit.toString(),
  });

  if (params.minRating !== undefined) {
    queryParams.append('minRating', params.minRating.toString());
  }
  if (params.maxRating !== undefined) {
    queryParams.append('maxRating', params.maxRating.toString());
  }
  if (params.sortBy) {
    queryParams.append('sortBy', params.sortBy);
  }
  if (params.category) {
    queryParams.append('category', params.category);
  }

  const response = await fetch(`${API_BASE}/trainer/${trainerId}?${queryParams.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch reviews: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Submit a new review
 */
export async function submitReview(submission: ReviewSubmission): Promise<{ success: boolean; id: string }> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit review: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Vote on a review as helpful or not helpful
 */
export async function voteHelpful(vote: HelpfulVote): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/helpful`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(vote),
  });

  if (!response.ok) {
    throw new Error(`Failed to vote: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Submit a trainer response to a review
 */
export async function submitTrainerResponse(
  submission: TrainerResponseSubmission
): Promise<{ success: boolean; id: string }> {
  const response = await fetch(`${API_BASE}/response`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit response: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get review categories
 */
export async function getReviewCategories(): Promise<ReviewCategory[]> {
  const response = await fetch(`${API_BASE}/categories`);

  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get aggregated review statistics for a trainer
 */
export async function getReviewAggregation(trainerId: string): Promise<ReviewAggregation> {
  const response = await fetch(`${API_BASE}/trainer/${trainerId}/aggregation`);

  if (!response.ok) {
    throw new Error(`Failed to fetch aggregation: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get trainer response for a specific review
 */
export async function getTrainerResponse(reviewId: string): Promise<TrainerResponse | null> {
  const response = await fetch(`${API_BASE}/response/${reviewId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch response: ${response.statusText}`);
  }

  const data = await response.json();
  return data.response || null;
}

/**
 * Delete a review (user's own review)
 */
export async function deleteReview(reviewId: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/${reviewId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete review: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update a review (user's own review)
 */
export async function updateReview(
  reviewId: string,
  updates: Partial<ReviewSubmission>
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/${reviewId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update review: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Calculate average rating from reviews
 */
export function calculateAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

/**
 * Calculate rating distribution
 */
export function calculateRatingDistribution(reviews: Review[]): Record<number, number> {
  const distribution: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  reviews.forEach((review) => {
    distribution[review.rating]++;
  });

  return distribution;
}

/**
 * Calculate category breakdown
 */
export function calculateCategoryBreakdown(reviews: Review[]): Record<string, number> {
  const breakdown: Record<string, number> = {};

  reviews.forEach((review) => {
    Object.entries(review.categories).forEach(([category, rating]) => {
      if (!breakdown[category]) {
        breakdown[category] = 0;
      }
      breakdown[category] += rating;
    });
  });

  // Calculate averages
  Object.keys(breakdown).forEach((category) => {
    const count = reviews.filter((r) => r.categories[category] !== undefined).length;
    breakdown[category] = Math.round((breakdown[category] / count) * 10) / 10;
  });

  return breakdown;
}

/**
 * Sort reviews based on criteria
 */
export function sortReviews(reviews: Review[], sortBy: 'recent' | 'helpful' | 'rating'): Review[] {
  const sorted = [...reviews];

  switch (sortBy) {
    case 'recent':
      return sorted.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    case 'helpful':
      return sorted.sort((a, b) => b.helpful - a.helpful);
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating);
    default:
      return sorted;
  }
}

/**
 * Filter reviews by rating range
 */
export function filterReviewsByRating(
  reviews: Review[],
  minRating?: number,
  maxRating?: number
): Review[] {
  return reviews.filter((review) => {
    if (minRating !== undefined && review.rating < minRating) return false;
    if (maxRating !== undefined && review.rating > maxRating) return false;
    return true;
  });
}

/**
 * Filter reviews by category
 */
export function filterReviewsByCategory(reviews: Review[], category: string): Review[] {
  return reviews.filter((review) => review.categories[category] !== undefined);
}

/**
 * Validate review submission
 */
export function validateReviewSubmission(submission: ReviewSubmission): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!submission.trainerId) {
    errors.push('Trainer ID is required');
  }

  if (submission.rating < 1 || submission.rating > 5) {
    errors.push('Rating must be between 1 and 5');
  }

  if (!submission.comment || submission.comment.trim().length === 0) {
    errors.push('Comment is required');
  }

  if (submission.comment.length > 1000) {
    errors.push('Comment must be less than 1000 characters');
  }

  if (Object.keys(submission.categories).length === 0) {
    errors.push('At least one category rating is required');
  }

  Object.entries(submission.categories).forEach(([category, rating]) => {
    if (rating < 1 || rating > 5) {
      errors.push(`Category rating for ${category} must be between 1 and 5`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate trainer response submission
 */
export function validateTrainerResponseSubmission(
  submission: TrainerResponseSubmission
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!submission.reviewId) {
    errors.push('Review ID is required');
  }

  if (!submission.response || submission.response.trim().length === 0) {
    errors.push('Response is required');
  }

  if (submission.response.length > 1000) {
    errors.push('Response must be less than 1000 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
