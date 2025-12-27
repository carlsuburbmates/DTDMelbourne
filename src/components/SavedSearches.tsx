// ============================================================================
// DTD P2 Phase 3: Advanced Search - Saved Searches Component
// File: src/components/SavedSearches.tsx
// Description: Saved searches component with LocalStorage
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import type { SavedSearch, AdvancedSearchFilters } from '@/types/search';

interface SavedSearchesProps {
  onLoadSearch: (filters: AdvancedSearchFilters) => void;
  className?: string;
}

const STORAGE_KEY = 'saved_searches';

export default function SavedSearches({
  onLoadSearch,
  className = '',
}: SavedSearchesProps) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [newSearchName, setNewSearchName] = useState('');
  const [currentFilters, setCurrentFilters] = useState<AdvancedSearchFilters | null>(null);
  const [showSaveForm, setShowSaveForm] = useState(false);

  // Load saved searches from LocalStorage on mount
  useEffect(() => {
    loadSavedSearches();
  }, []);

  // Listen for save search events
  useEffect(() => {
    const handleSaveSearch = (event: CustomEvent) => {
      const { filters } = event.detail;
      setCurrentFilters(filters);
      setShowSaveForm(true);
    };

    window.addEventListener('save-search', handleSaveSearch as EventListener);
    return () => {
      window.removeEventListener('save-search', handleSaveSearch as EventListener);
    };
  }, []);

  const loadSavedSearches = () => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const searches: SavedSearch[] = JSON.parse(stored);
        setSavedSearches(searches);
      }
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    }
  };

  const saveToLocalStorage = (searches: SavedSearch[]) => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
    } catch (error) {
      console.error('Failed to save searches:', error);
    }
  };

  const handleSaveSearch = () => {
    if (!newSearchName.trim() || !currentFilters) {
      return;
    }

    const newSearch: SavedSearch = {
      id: crypto.randomUUID(),
      name: newSearchName.trim(),
      filters: currentFilters,
      timestamp: new Date(),
    };

    const updated = [...savedSearches, newSearch];
    setSavedSearches(updated);
    saveToLocalStorage(updated);
    setNewSearchName('');
    setShowSaveForm(false);
    setCurrentFilters(null);
  };

  const handleLoadSearch = (search: SavedSearch) => {
    onLoadSearch(search.filters);
  };

  const handleDeleteSearch = (id: string) => {
    const updated = savedSearches.filter((s) => s.id !== id);
    setSavedSearches(updated);
    saveToLocalStorage(updated);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Today';
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else if (days < 30) {
      return `${Math.floor(days / 7)} weeks ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getFilterSummary = (filters: AdvancedSearchFilters) => {
    const parts: string[] = [];

    if (filters.distance) {
      parts.push(`${filters.distance.min}-${filters.distance.max} km`);
    }

    if (filters.ratingRange) {
      parts.push(`${filters.ratingRange.min}-${filters.ratingRange.max} stars`);
    }

    if (filters.availability) {
      parts.push('Available now');
    }

    if (filters.priceRange) {
      parts.push(`$${filters.priceRange.min}-$${filters.priceRange.max}`);
    }

    if (filters.search) {
      parts.push(`"${filters.search}"`);
    }

    return parts.length > 0 ? parts.join(', ') : 'All filters';
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h2 className="text-xl font-semibold mb-4">Saved Searches</h2>

      {showSaveForm && currentFilters && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Save Current Search
          </h3>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newSearchName}
              onChange={(e) => setNewSearchName(e.target.value)}
              placeholder="Search name..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              aria-label="Search name"
            />
            <button
              onClick={handleSaveSearch}
              disabled={!newSearchName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors"
              type="button"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowSaveForm(false);
                setCurrentFilters(null);
                setNewSearchName('');
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {savedSearches.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-600">
            No saved searches yet. Save your search filters to quickly access them later.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {savedSearches.map((search) => (
            <div
              key={search.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">
                  {search.name}
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  {getFilterSummary(search.filters)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Saved {formatDate(search.timestamp)}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleLoadSearch(search)}
                  className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                  type="button"
                  aria-label={`Load ${search.name}`}
                >
                  Load
                </button>
                <button
                  onClick={() => handleDeleteSearch(search.id)}
                  className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                  type="button"
                  aria-label={`Delete ${search.name}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Trigger save search event
 */
export function triggerSaveSearch(filters: AdvancedSearchFilters): void {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('save-search', { detail: { filters } });
    window.dispatchEvent(event);
  }
}
