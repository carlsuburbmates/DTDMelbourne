/**
 * Review types for the Dog Trainers Directory
 * Defines interfaces for reviews, categories, and trainer responses
 */

/**
 * Represents a user review for a trainer
 */
export interface Review {
  id: string;
  trainerId: string;
  userId: string;
  rating: number;
  categories: Record<string, number>;
  comment: string;
  helpful: number;
  timestamp: Date;
}

/**
 * Represents a review category for rating breakdown
 */
export interface ReviewCategory {
  id: string;
  name: string;
  description: string;
}

/**
 * Represents a trainer's response to a review
 */
export interface TrainerResponse {
  id: string;
  reviewId: string;
  trainerId: string;
  response: string;
  timestamp: Date;
}

/**
 * Represents aggregated review statistics
 */
export interface ReviewAggregation {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  categoryBreakdown: Record<string, number>;
}

/**
 * Represents review filter options
 */
export interface ReviewFilters {
  minRating?: number;
  maxRating?: number;
  sortBy?: 'recent' | 'helpful' | 'rating';
  category?: string;
}

/**
 * Represents pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Represents paginated review results
 */
export interface PaginatedReviews {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Represents helpful vote data
 */
export interface HelpfulVote {
  reviewId: string;
  userId: string;
  helpful: boolean;
}

/**
 * Represents review submission data
 */
export interface ReviewSubmission {
  trainerId: string;
  rating: number;
  categories: Record<string, number>;
  comment: string;
}

/**
 * Represents trainer response submission data
 */
export interface TrainerResponseSubmission {
  reviewId: string;
  response: string;
}
