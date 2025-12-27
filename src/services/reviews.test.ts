/**
 * Tests for reviews service
 */

import {
  calculateAverageRating,
  calculateRatingDistribution,
  calculateCategoryBreakdown,
  sortReviews,
  filterReviewsByRating,
  filterReviewsByCategory,
  validateReviewSubmission,
  validateTrainerResponseSubmission,
} from './reviews';
import { Review } from '../types/reviews';

describe('Reviews Service', () => {
  describe('calculateAverageRating', () => {
    it('should return 0 for empty array', () => {
      expect(calculateAverageRating([])).toBe(0);
    });

    it('should calculate average correctly', () => {
      const reviews: Review[] = [
        { id: '1', trainerId: 't1', userId: 'u1', rating: 4, categories: {}, comment: 'Good', helpful: 0, timestamp: new Date() },
        { id: '2', trainerId: 't1', userId: 'u2', rating: 5, categories: {}, comment: 'Great', helpful: 0, timestamp: new Date() },
      ];
      expect(calculateAverageRating(reviews)).toBe(4.5);
    });

    it('should round to one decimal place', () => {
      const reviews: Review[] = [
        { id: '1', trainerId: 't1', userId: 'u1', rating: 4, categories: {}, comment: 'Good', helpful: 0, timestamp: new Date() },
        { id: '2', trainerId: 't1', userId: 'u2', rating: 5, categories: {}, comment: 'Great', helpful: 0, timestamp: new Date() },
        { id: '3', trainerId: 't1', userId: 'u3', rating: 5, categories: {}, comment: 'Great', helpful: 0, timestamp: new Date() },
      ];
      expect(calculateAverageRating(reviews)).toBe(4.7);
    });
  });

  describe('calculateRatingDistribution', () => {
    it('should return empty distribution for empty array', () => {
      const distribution = calculateRatingDistribution([]);
      expect(distribution).toEqual({
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      });
    });

    it('should calculate distribution correctly', () => {
      const reviews: Review[] = [
        { id: '1', trainerId: 't1', userId: 'u1', rating: 5, categories: {}, comment: 'Great', helpful: 0, timestamp: new Date() },
        { id: '2', trainerId: 't1', userId: 'u2', rating: 4, categories: {}, comment: 'Good', helpful: 0, timestamp: new Date() },
        { id: '3', trainerId: 't1', userId: 'u3', rating: 5, categories: {}, comment: 'Great', helpful: 0, timestamp: new Date() },
        { id: '4', trainerId: 't1', userId: 'u4', rating: 3, categories: {}, comment: 'Okay', helpful: 0, timestamp: new Date() },
      ];
      const distribution = calculateRatingDistribution(reviews);
      expect(distribution).toEqual({
        1: 0,
        2: 0,
        3: 1,
        4: 1,
        5: 2,
      });
    });
  });

  describe('calculateCategoryBreakdown', () => {
    it('should return empty object for empty array', () => {
      expect(calculateCategoryBreakdown([])).toEqual({});
    });

    it('should calculate category averages correctly', () => {
      const reviews: Review[] = [
        { id: '1', trainerId: 't1', userId: 'u1', rating: 5, categories: { Communication: 5, Professionalism: 4 }, comment: 'Great', helpful: 0, timestamp: new Date() },
        { id: '2', trainerId: 't1', userId: 'u2', rating: 4, categories: { Communication: 4, Professionalism: 5 }, comment: 'Good', helpful: 0, timestamp: new Date() },
      ];
      const breakdown = calculateCategoryBreakdown(reviews);
      expect(breakdown).toEqual({
        Communication: 4.5,
        Professionalism: 4.5,
      });
    });
  });

  describe('sortReviews', () => {
    const reviews: Review[] = [
      { id: '1', trainerId: 't1', userId: 'u1', rating: 3, categories: {}, comment: 'Okay', helpful: 5, timestamp: new Date('2024-01-01') },
      { id: '2', trainerId: 't1', userId: 'u2', rating: 5, categories: {}, comment: 'Great', helpful: 10, timestamp: new Date('2024-01-02') },
      { id: '3', trainerId: 't1', userId: 'u3', rating: 4, categories: {}, comment: 'Good', helpful: 2, timestamp: new Date('2024-01-03') },
    ];

    it('should sort by recent', () => {
      const sorted = sortReviews(reviews, 'recent');
      expect(sorted[0].id).toBe('3');
      expect(sorted[1].id).toBe('2');
      expect(sorted[2].id).toBe('1');
    });

    it('should sort by helpful', () => {
      const sorted = sortReviews(reviews, 'helpful');
      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('1');
      expect(sorted[2].id).toBe('3');
    });

    it('should sort by rating', () => {
      const sorted = sortReviews(reviews, 'rating');
      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('3');
      expect(sorted[2].id).toBe('1');
    });
  });

  describe('filterReviewsByRating', () => {
    const reviews: Review[] = [
      { id: '1', trainerId: 't1', userId: 'u1', rating: 5, categories: {}, comment: 'Great', helpful: 0, timestamp: new Date() },
      { id: '2', trainerId: 't1', userId: 'u2', rating: 3, categories: {}, comment: 'Okay', helpful: 0, timestamp: new Date() },
      { id: '3', trainerId: 't1', userId: 'u3', rating: 4, categories: {}, comment: 'Good', helpful: 0, timestamp: new Date() },
    ];

    it('should filter by min rating', () => {
      const filtered = filterReviewsByRating(reviews, 4);
      expect(filtered).toHaveLength(2);
      expect(filtered.every(r => r.rating >= 4)).toBe(true);
    });

    it('should filter by max rating', () => {
      const filtered = filterReviewsByRating(reviews, undefined, 4);
      expect(filtered).toHaveLength(2);
      expect(filtered.every(r => r.rating <= 4)).toBe(true);
    });

    it('should filter by rating range', () => {
      const filtered = filterReviewsByRating(reviews, 4, 4);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].rating).toBe(4);
    });
  });

  describe('filterReviewsByCategory', () => {
    const reviews: Review[] = [
      { id: '1', trainerId: 't1', userId: 'u1', rating: 5, categories: { Communication: 5 }, comment: 'Great', helpful: 0, timestamp: new Date() },
      { id: '2', trainerId: 't1', userId: 'u2', rating: 3, categories: { Professionalism: 4 }, comment: 'Okay', helpful: 0, timestamp: new Date() },
      { id: '3', trainerId: 't1', userId: 'u3', rating: 4, categories: { Communication: 4 }, comment: 'Good', helpful: 0, timestamp: new Date() },
    ];

    it('should filter by category', () => {
      const filtered = filterReviewsByCategory(reviews, 'Communication');
      expect(filtered).toHaveLength(2);
      expect(filtered.every(r => r.categories['Communication'] !== undefined)).toBe(true);
    });
  });

  describe('validateReviewSubmission', () => {
    it('should pass valid submission', () => {
      const submission = {
        trainerId: 't1',
        rating: 5,
        categories: { Communication: 5 },
        comment: 'Great trainer!',
      };
      const result = validateReviewSubmission(submission);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail with missing trainerId', () => {
      const submission = {
        trainerId: '',
        rating: 5,
        categories: { Communication: 5 },
        comment: 'Great trainer!',
      };
      const result = validateReviewSubmission(submission);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Trainer ID is required');
    });

    it('should fail with invalid rating', () => {
      const submission = {
        trainerId: 't1',
        rating: 6,
        categories: { Communication: 5 },
        comment: 'Great trainer!',
      };
      const result = validateReviewSubmission(submission);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Rating must be between 1 and 5');
    });

    it('should fail with empty comment', () => {
      const submission = {
        trainerId: 't1',
        rating: 5,
        categories: { Communication: 5 },
        comment: '',
      };
      const result = validateReviewSubmission(submission);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Comment is required');
    });

    it('should fail with comment too long', () => {
      const submission = {
        trainerId: 't1',
        rating: 5,
        categories: { Communication: 5 },
        comment: 'a'.repeat(1001),
      };
      const result = validateReviewSubmission(submission);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Comment must be less than 1000 characters');
    });
  });

  describe('validateTrainerResponseSubmission', () => {
    it('should pass valid submission', () => {
      const submission = {
        reviewId: 'r1',
        response: 'Thank you for your feedback!',
      };
      const result = validateTrainerResponseSubmission(submission);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail with missing reviewId', () => {
      const submission = {
        reviewId: '',
        response: 'Thank you for your feedback!',
      };
      const result = validateTrainerResponseSubmission(submission);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Review ID is required');
    });

    it('should fail with empty response', () => {
      const submission = {
        reviewId: 'r1',
        response: '',
      };
      const result = validateTrainerResponseSubmission(submission);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Response is required');
    });

    it('should fail with response too long', () => {
      const submission = {
        reviewId: 'r1',
        response: 'a'.repeat(1001),
      };
      const result = validateTrainerResponseSubmission(submission);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Response must be less than 1000 characters');
    });
  });
});
