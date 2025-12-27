// ============================================================================
// DTD P2 Phase 3: Advanced Search - Advanced Search Page
// File: src/app/search-advanced/page.tsx
// Description: Advanced search page with all filters
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import type {
  AdvancedSearchFilters,
  SearchResultsResponse,
  GeolocationResult,
  SearchHistoryEntry,
} from '@/types/search';
import { advancedSearch, debounceSearch } from '@/services/search-advanced';
import { trackSearch, getOrCreateSessionId } from '@/services/analytics';
import Geolocation from '@/components/Geolocation';
import AdvancedFilters from '@/components/AdvancedFilters';
import SavedSearches, { triggerSaveSearch } from '@/components/SavedSearches';
import Map from '@/components/Map';

export default function AdvancedSearchPage() {
  const [filters, setFilters] = useState<AdvancedSearchFilters>({});
  const [location, setLocation] = useState<GeolocationResult | null>(null);
  const [results, setResults] = useState<SearchResultsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
  const sessionId = getOrCreateSessionId();

  // Load search history from LocalStorage on mount
  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = () => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem('search_history');
      if (stored) {
        const history: SearchHistoryEntry[] = JSON.parse(stored);
        setSearchHistory(history);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };

  const saveToSearchHistory = (query: string, filters: AdvancedSearchFilters, resultsCount: number) => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const entry: SearchHistoryEntry = {
        id: crypto.randomUUID(),
        query: filters.search || '',
        filters,
        timestamp: new Date(),
        resultsCount,
      };

      const updated = [entry, ...searchHistory].slice(0, 10); // Keep last 10
      setSearchHistory(updated);
      localStorage.setItem('search_history', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setResults(null);

    try {
      const searchResults = await advancedSearch({
        filters,
        location: location || undefined,
        page,
        limit: 20,
        sortBy: 'distance',
        sortOrder: 'asc',
      });

      setResults(searchResults);
      saveToSearchHistory(
        filters.search || '',
        filters,
        searchResults.data.total
      );

      // Track search event
      trackSearch({
        query: filters.search || '',
        filters: filters as Record<string, unknown>,
        resultsCount: searchResults.data.total,
        sessionId,
        searchType: 'advanced',
      });
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = debounceSearch(handleSearch, 500);

  const handleFiltersChange = (newFilters: AdvancedSearchFilters) => {
    setFilters(newFilters);
    debouncedSearch();
  };

  const handleLocationChange = (newLocation: GeolocationResult | null) => {
    setLocation(newLocation);
    if (newLocation) {
      debouncedSearch();
    }
  };

  const handleLoadSearch = (searchFilters: AdvancedSearchFilters) => {
    setFilters(searchFilters);
    setPage(1);
    handleSearch();
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    handleSearch();
  };

  const handleTrainerClick = (trainerId: string) => {
    window.location.href = `/trainer/${trainerId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Advanced Search
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Filters */}
          <div className="lg:col-span-1 space-y-6">
            <Geolocation onLocationChange={handleLocationChange} />
            <AdvancedFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
            <SavedSearches onLoadSearch={handleLoadSearch} />
          </div>

          {/* Middle Column - Results */}
          <div className="lg:col-span-2 space-y-6">
            {loading && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-4">Searching...</p>
              </div>
            )}

            {!loading && results && (
              <>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">
                      Results ({results.data.total})
                    </h2>
                    {results.data.hasMore && (
                      <button
                        onClick={() => handlePageChange(page + 1)}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                        type="button"
                      >
                        Load More
                      </button>
                    )}
                  </div>

                  {results.data.trainers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-600">
                        No trainers found matching your criteria. Try adjusting your filters.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {results.data.trainers.map((result) => (
                        <div
                          key={result.trainer.id}
                          onClick={() => handleTrainerClick(result.trainer.id)}
                          className="p-4 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900">
                                {result.trainer.name}
                              </h3>
                              {result.trainer.rating && (
                                <div className="flex items-center mt-1">
                                  <span className="text-sm text-gray-600">
                                    Rating:
                                  </span>
                                  <span className="text-sm font-medium text-yellow-600">
                                    {result.trainer.rating.toFixed(1)} / 5
                                  </span>
                                </div>
                              )}
                              {result.distance !== undefined && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {result.distance.toFixed(1)} km away
                                </p>
                              )}
                              {result.trainer.service_type_primary && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {result.trainer.service_type_primary}
                                </p>
                              )}
                            </div>
                            {result.trainer.price && (
                              <div className="text-right">
                                <p className="text-lg font-semibold text-gray-900">
                                  ${result.trainer.price}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {results.data.total > results.data.limit && (
                    <div className="flex items-center justify-center space-x-2 mt-6">
                      <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded-md transition-colors"
                        type="button"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {page} of {Math.ceil(results.data.total / results.data.limit)}
                      </span>
                      <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={!results.data.hasMore}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed rounded-md transition-colors"
                        type="button"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>

                {/* Map View */}
                <Map
                  trainers={results.data.trainers.map((r) => r.trainer)}
                  userLocation={location || undefined}
                  onTrainerClick={handleTrainerClick}
                />
              </>
            )}

            {!loading && !results && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-sm text-gray-600">
                  Use the filters on the left to search for trainers
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Searches</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchHistory.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => handleLoadSearch(entry.filters)}
                  className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <h3 className="text-sm font-medium text-gray-900">
                    {entry.query || 'Advanced Search'}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {entry.resultsCount} results
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {entry.timestamp.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
