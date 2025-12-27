// ============================================================================
// DTD P2 Phase 3: Advanced Search - Advanced Search Service Tests
// File: src/services/search-advanced.test.ts
// Description: Unit tests for search service
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  advancedSearch,
  applyDistanceFilter,
  applyRatingFilter,
  applyAvailabilityFilter,
  applyPriceFilter,
  applyAllFilters,
  debounceSearch,
  throttleSearch,
  getSearchSuggestions,
  clearSearchCache,
} from './search-advanced';
import type { AdvancedSearchFilters, SearchResultWithDistance } from '@/types/search';

// Mock fetch
global.fetch = vi.fn();

describe('Advanced Search Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSearchCache();
  });

  describe('applyDistanceFilter', () => {
    it('should filter trainers by distance', () => {
      const trainers: SearchResultWithDistance[] = [
        { trainer: { id: '1', name: 'Trainer 1' }, distance: 5 },
        { trainer: { id: '2', name: 'Trainer 2' }, distance: 15 },
        { trainer: { id: '3', name: 'Trainer 3' }, distance: 25 },
      ];

      const filtered = applyDistanceFilter(trainers, 20);

      expect(filtered).toHaveLength(2);
      expect(filtered[0].trainer.id).toBe('1');
      expect(filtered[1].trainer.id).toBe('2');
    });

    it('should handle trainers without distance', () => {
      const trainers: SearchResultWithDistance[] = [
        { trainer: { id: '1', name: 'Trainer 1' } },
        { trainer: { id: '2', name: 'Trainer 2' } },
      ];

      const filtered = applyDistanceFilter(trainers, 20);

      expect(filtered).toHaveLength(0);
    });
  });

  describe('applyRatingFilter', () => {
    it('should filter trainers by rating range', () => {
      const trainers: SearchResultWithDistance[] = [
        { trainer: { id: '1', name: 'Trainer 1', rating: 2.5 } },
        { trainer: { id: '2', name: 'Trainer 2', rating: 4.0 } },
        { trainer: { id: '3', name: 'Trainer 3', rating: 4.8 } },
      ];

      const filtered = applyRatingFilter(trainers, 3.0, 4.5);

      expect(filtered).toHaveLength(2);
      expect(filtered[0].trainer.id).toBe('2');
      expect(filtered[1].trainer.id).toBe('3');
    });

    it('should handle trainers without rating', () => {
      const trainers: SearchResultWithDistance[] = [
        { trainer: { id: '1', name: 'Trainer 1' } },
        { trainer: { id: '2', name: 'Trainer 2' } },
      ];

      const filtered = applyRatingFilter(trainers, 3.0, 4.5);

      expect(filtered).toHaveLength(0);
    });
  });

  describe('applyAvailabilityFilter', () => {
    it('should filter available trainers', () => {
      const trainers: SearchResultWithDistance[] = [
        { trainer: { id: '1', name: 'Trainer 1', available: true } },
        { trainer: { id: '2', name: 'Trainer 2', available: false } },
        { trainer: { id: '3', name: 'Trainer 3', available: true } },
      ];

      const filtered = applyAvailabilityFilter(trainers, true);

      expect(filtered).toHaveLength(2);
      expect(filtered[0].trainer.id).toBe('1');
      expect(filtered[1].trainer.id).toBe('3');
    });

    it('should return all trainers when availability is false', () => {
      const trainers: SearchResultWithDistance[] = [
        { trainer: { id: '1', name: 'Trainer 1', available: true } },
        { trainer: { id: '2', name: 'Trainer 2', available: false } },
      ];

      const filtered = applyAvailabilityFilter(trainers, false);

      expect(filtered).toHaveLength(2);
    });
  });

  describe('applyPriceFilter', () => {
    it('should filter trainers by price range', () => {
      const trainers: SearchResultWithDistance[] = [
        { trainer: { id: '1', name: 'Trainer 1', price: 50 } },
        { trainer: { id: '2', name: 'Trainer 2', price: 100 } },
        { trainer: { id: '3', name: 'Trainer 3', price: 200 } },
      ];

      const filtered = applyPriceFilter(trainers, 50, 150);

      expect(filtered).toHaveLength(2);
      expect(filtered[0].trainer.id).toBe('1');
      expect(filtered[1].trainer.id).toBe('2');
    });

    it('should handle trainers without price', () => {
      const trainers: SearchResultWithDistance[] = [
        { trainer: { id: '1', name: 'Trainer 1' } },
        { trainer: { id: '2', name: 'Trainer 2' } },
      ];

      const filtered = applyPriceFilter(trainers, 50, 150);

      expect(filtered).toHaveLength(0);
    });
  });

  describe('applyAllFilters', () => {
    it('should apply all filters', () => {
      const trainers: SearchResultWithDistance[] = [
        {
          trainer: {
            id: '1',
            name: 'Trainer 1',
            rating: 4.5,
            available: true,
            price: 100,
          },
          distance: 10,
        },
        {
          trainer: {
            id: '2',
            name: 'Trainer 2',
            rating: 3.0,
            available: false,
            price: 80,
          },
          distance: 15,
        },
        {
          trainer: {
            id: '3',
            name: 'Trainer 3',
            rating: 4.8,
            available: true,
            price: 120,
          },
          distance: 25,
        },
      ];

      const filters: AdvancedSearchFilters = {
        distance: { min: 0, max: 20 },
        ratingRange: { min: 4.0, max: 5.0 },
        availability: true,
        priceRange: { min: 50, max: 150 },
      };

      const filtered = applyAllFilters(trainers, filters);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].trainer.id).toBe('1');
    });
  });

  describe('debounceSearch', () => {
    it('should debounce function calls', () => {
      vi.useFakeTimers();
      const mockFn = vi.fn();
      const debounced = debounceSearch(mockFn, 100);

      debounced();
      debounced();
      debounced();

      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe('throttleSearch', () => {
    it('should throttle function calls', () => {
      vi.useFakeTimers();
      const mockFn = vi.fn();
      const throttled = throttleSearch(mockFn, 100);

      throttled();
      throttled();
      throttled();

      expect(mockFn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttled();
      expect(mockFn).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });

  describe('clearSearchCache', () => {
    it('should clear search cache', () => {
      // This is a simple function that clears the cache
      // We just verify it doesn't throw
      expect(() => clearSearchCache()).not.toThrow();
    });
  });
});
