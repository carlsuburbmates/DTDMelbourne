// ============================================================================
// DTD P2 Phase 3: Advanced Search - TypeScript Types
// File: src/types/search.ts
// Description: Advanced search types and interfaces
// ============================================================================

// ============================================================================
// ADVANCED SEARCH FILTERS
// ============================================================================

/**
 * Advanced search filters interface
 */
export interface AdvancedSearchFilters {
  distance?: { min: number; max: number };
  ratingRange?: { min: number; max: number };
  availability?: boolean;
  priceRange?: { min: number; max: number };
  councilId?: string;
  suburbId?: string;
  serviceType?: string;
  ageSpecialty?: string;
  behaviorIssue?: string;
  resourceType?: string;
  abnVerified?: boolean;
  claimed?: boolean;
  search?: string;
}

// ============================================================================
// SAVED SEARCH
// ============================================================================

/**
 * Saved search interface
 */
export interface SavedSearch {
  id: string;
  userId?: string;
  name: string;
  filters: AdvancedSearchFilters;
  timestamp: Date;
}

/**
 * Save search request
 */
export interface SaveSearchRequest {
  name: string;
  filters: AdvancedSearchFilters;
}

/**
 * Save search response
 */
export interface SaveSearchResponse {
  success: boolean;
  id: string;
}

// ============================================================================
// GEOLOCATION
// ============================================================================

/**
 * Geolocation result interface
 */
export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  method: 'browser' | 'ip';
  city?: string;
  region?: string;
  country?: string;
}

/**
 * Geolocation error
 */
export interface GeolocationError {
  code: number;
  message: string;
}

// ============================================================================
// SEARCH RESULTS
// ============================================================================

/**
 * Search result with distance
 */
export interface SearchResultWithDistance {
  trainer: any;
  distance?: number;
}

/**
 * Search results response
 */
export interface SearchResultsResponse {
  success: boolean;
  data: {
    trainers: SearchResultWithDistance[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  meta: {
    timestamp: string;
    version: string;
  };
}

/**
 * Search query parameters
 */
export interface SearchQueryParams {
  filters: AdvancedSearchFilters;
  location?: GeolocationResult;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// MAP VIEW
// ============================================================================

/**
 * Map marker interface
 */
export interface MapMarker {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  title: string;
  type: 'trainer' | 'user';
  data?: any;
}

/**
 * Map view type
 */
export type MapViewType = 'map' | 'list' | 'both';

// ============================================================================
// SEARCH HISTORY
// ============================================================================

/**
 * Search history entry
 */
export interface SearchHistoryEntry {
  id: string;
  query: string;
  filters: AdvancedSearchFilters;
  timestamp: Date;
  resultsCount: number;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  AdvancedSearchFilters,
  SavedSearch,
  SaveSearchRequest,
  SaveSearchResponse,
  GeolocationResult,
  GeolocationError,
  SearchResultWithDistance,
  SearchResultsResponse,
  SearchQueryParams,
  MapMarker,
  MapViewType,
  SearchHistoryEntry,
};

// ============================================================================
// COMMENTS
// ============================================================================
// 1. Advanced search filters with distance, rating, availability, price
// 2. Saved search with name, filters, timestamp
// 3. Geolocation result with coordinates and accuracy
// 4. Search results with distance calculation
// 5. Map markers for trainer and user locations
// 6. Search history for tracking user searches
// 7. Based on DOCS/P2-architectural-plan.md Section 3
// ============================================================================
