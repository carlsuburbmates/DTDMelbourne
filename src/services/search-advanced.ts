// ============================================================================
// DTD P2 Phase 3: Advanced Search - Advanced Search Service
// File: src/services/search-advanced.ts
// Description: Advanced search service with geolocation support
// ============================================================================

import type {
  AdvancedSearchFilters,
  SearchResultsResponse,
  SearchQueryParams,
  SearchResultWithDistance,
  GeolocationResult,
} from '../types/search';
import {
  calculateDistance,
  filterByDistance,
} from './geolocation';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// SEARCH CACHE
// ============================================================================

/**
 * Search cache entry
 */
interface SearchCacheEntry {
  results: SearchResultWithDistance[];
  timestamp: number;
  total: number;
}

/**
 * In-memory search cache
 */
const searchCache = new Map<string, SearchCacheEntry>();

/**
 * Generate cache key
 */
function generateCacheKey(params: SearchQueryParams): string {
  const key = JSON.stringify({
    filters: params.filters,
    location: params.location,
    page: params.page,
    limit: params.limit,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });
  return key;
}

/**
 * Get cached search results
 */
function getCachedResults(key: string): SearchCacheEntry | null {
  const entry = searchCache.get(key);
  
  if (!entry) {
    return null;
  }
  
  const age = Date.now() - entry.timestamp;
  if (age > SEARCH_CACHE_TTL) {
    searchCache.delete(key);
    return null;
  }
  
  return entry;
}

/**
 * Cache search results
 */
function cacheResults(key: string, results: SearchResultWithDistance[], total: number): void {
  searchCache.set(key, {
    results,
    timestamp: Date.now(),
    total,
  });
  
  // Clean up old cache entries
  if (searchCache.size > 100) {
    const oldestKey = Array.from(searchCache.keys())[0];
    searchCache.delete(oldestKey);
  }
}

/**
 * Clear search cache
 */
export function clearSearchCache(): void {
  searchCache.clear();
}

// ============================================================================
// ADVANCED SEARCH
// ============================================================================

/**
 * Perform advanced search with filters
 */
export async function advancedSearch(
  params: SearchQueryParams
): Promise<SearchResultsResponse> {
  const startTime = performance.now();
  
  try {
    // Check cache first
    const cacheKey = generateCacheKey(params);
    const cached = getCachedResults(cacheKey);
    
    if (cached) {
      return {
        success: true,
        data: {
          trainers: cached.results,
          total: cached.total,
          page: params.page || 1,
          limit: params.limit || DEFAULT_PAGE_SIZE,
          hasMore: (params.page || 1) * (params.limit || DEFAULT_PAGE_SIZE) < cached.total,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      };
    }
    
    // Build query parameters
    const queryParams = buildQueryParams(params);
    
    // Execute search
    const response = await fetch(
      `/api/v1/trainers?${new URLSearchParams(queryParams)}`
    );
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Calculate distances if location provided
    let trainers = data.data.trainers;
    if (params.location) {
      trainers = filterByDistance(
        trainers,
        params.location,
        params.filters.distance?.max || Infinity
      );
    }
    
    // Cache results
    cacheResults(cacheKey, trainers, data.data.total);
    
    const duration = performance.now() - startTime;
    console.log(`Advanced search completed in ${duration.toFixed(2)}ms`);
    
    return {
      success: true,
      data: {
        trainers,
        total: data.data.total,
        page: params.page || 1,
        limit: params.limit || DEFAULT_PAGE_SIZE,
        hasMore: data.data.hasMore,
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    };
  } catch (error) {
    console.error('Advanced search failed:', error);
    throw error;
  }
}

/**
 * Build query parameters from filters
 */
function buildQueryParams(params: SearchQueryParams): Record<string, string> {
  const queryParams: Record<string, string> = {};
  const { filters, page, limit, sortBy, sortOrder } = params;
  
  // Pagination
  if (page) {
    queryParams.page = page.toString();
  }
  
  if (limit) {
    queryParams.limit = Math.min(limit, MAX_PAGE_SIZE).toString();
  }
  
  // Sorting
  if (sortBy) {
    queryParams.sort_by = sortBy;
  }
  
  if (sortOrder) {
    queryParams.sort_order = sortOrder;
  }
  
  // Filters
  if (filters.councilId) {
    queryParams.council_id = filters.councilId;
  }
  
  if (filters.localityId) {
    queryParams.locality_id = filters.localityId;
  }
  
  if (filters.serviceType) {
    queryParams.service_type = filters.serviceType;
  }
  
  if (filters.ageSpecialty) {
    queryParams.age_specialty = filters.ageSpecialty;
  }
  
  if (filters.behaviorIssue) {
    queryParams.behavior_issue = filters.behaviorIssue;
  }
  
  if (filters.resourceType) {
    queryParams.resource_type = filters.resourceType;
  }
  
  if (filters.verified !== undefined) {
    queryParams.verified = filters.verified.toString();
  }
  
  if (filters.claimed !== undefined) {
    queryParams.claimed = filters.claimed.toString();
  }
  
  if (filters.search) {
    queryParams.search = filters.search;
  }
  
  return queryParams;
}

// ============================================================================
// FILTER APPLICATION
// ============================================================================

/**
 * Apply distance filter
 */
export function applyDistanceFilter(
  trainers: SearchResultWithDistance[],
  maxDistance: number
): SearchResultWithDistance[] {
  return trainers.filter((trainer) => {
    if (!trainer.distance) {
      return false;
    }
    return trainer.distance <= maxDistance;
  });
}

/**
 * Apply rating range filter
 */
export function applyRatingFilter(
  trainers: SearchResultWithDistance[],
  minRating: number,
  maxRating: number
): SearchResultWithDistance[] {
  return trainers.filter((trainer) => {
    const rating = trainer.trainer.rating || 0;
    return rating >= minRating && rating <= maxRating;
  });
}

/**
 * Apply availability filter
 */
export function applyAvailabilityFilter(
  trainers: SearchResultWithDistance[],
  available: boolean
): SearchResultWithDistance[] {
  if (!available) {
    return trainers;
  }
  
  return trainers.filter((trainer) => {
    return trainer.trainer.available === true;
  });
}

/**
 * Apply price range filter
 */
export function applyPriceFilter(
  trainers: SearchResultWithDistance[],
  minPrice: number,
  maxPrice: number
): SearchResultWithDistance[] {
  return trainers.filter((trainer) => {
    const price = trainer.trainer.price || 0;
    return price >= minPrice && price <= maxPrice;
  });
}

/**
 * Apply all filters
 */
export function applyAllFilters(
  trainers: SearchResultWithDistance[],
  filters: AdvancedSearchFilters
): SearchResultWithDistance[] {
  let filtered = [...trainers];
  
  // Distance filter
  if (filters.distance) {
    filtered = applyDistanceFilter(filtered, filters.distance.max);
  }
  
  // Rating filter
  if (filters.ratingRange) {
    filtered = applyRatingFilter(
      filtered,
      filters.ratingRange.min,
      filters.ratingRange.max
    );
  }
  
  // Availability filter
  if (filters.availability !== undefined) {
    filtered = applyAvailabilityFilter(filtered, filters.availability);
  }
  
  // Price filter
  if (filters.priceRange) {
    filtered = applyPriceFilter(
      filtered,
      filters.priceRange.min,
      filters.priceRange.max
    );
  }
  
  return filtered;
}

// ============================================================================
// SEARCH PERFORMANCE OPTIMIZATION
// ============================================================================

/**
 * Debounce search function
 */
export function debounceSearch<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle search function
 */
export function throttleSearch<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============================================================================
// SEARCH SUGGESTIONS
// ============================================================================

/**
 * Get search suggestions
 */
export async function getSearchSuggestions(query: string): Promise<string[]> {
  if (query.length < 2) {
    return [];
  }
  
  try {
    const response = await fetch(
      `/api/v1/trainers?search=${encodeURIComponent(query)}&limit=5`
    );
    
    if (!response.ok) {
      throw new Error(`Suggestions failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data.trainers.map((trainer: any) => trainer.name);
  } catch (error) {
    console.error('Failed to get search suggestions:', error);
    return [];
  }
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export {
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
};

// ============================================================================
// COMMENTS
// ============================================================================
// 1. Advanced search with geolocation support
// 2. Filter application (distance, rating, availability, price)
// 3. Search result pagination
// 4. Search performance optimization with caching
// 5. Debounce and throttle utilities
// 6. Search suggestions
// 7. Based on DOCS/P2-architectural-plan.md Section 3
// ============================================================================
