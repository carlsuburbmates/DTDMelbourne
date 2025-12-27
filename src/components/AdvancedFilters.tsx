// ============================================================================
// DTD P2 Phase 3: Advanced Search - Advanced Filters Component
// File: src/components/AdvancedFilters.tsx
// Description: Advanced filters component (distance, rating, availability, price)
// ============================================================================

'use client';

import { useState } from 'react';
import type { AdvancedSearchFilters } from '@/types/search';

interface AdvancedFiltersProps {
  filters: AdvancedSearchFilters;
  onFiltersChange: (filters: AdvancedSearchFilters) => void;
  className?: string;
}

export default function AdvancedFilters({
  filters,
  onFiltersChange,
  className = '',
}: AdvancedFiltersProps) {
  const [distance, setDistance] = useState(filters.distance || { min: 0, max: 100 });
  const [ratingRange, setRatingRange] = useState(filters.ratingRange || { min: 1, max: 5 });
  const [availability, setAvailability] = useState(filters.availability || false);
  const [priceRange, setPriceRange] = useState(filters.priceRange || { min: 0, max: 500 });

  const handleDistanceChange = (min: number, max: number) => {
    const newDistance = { min, max };
    setDistance(newDistance);
    onFiltersChange({ ...filters, distance: newDistance });
  };

  const handleRatingChange = (min: number, max: number) => {
    const newRatingRange = { min, max };
    setRatingRange(newRatingRange);
    onFiltersChange({ ...filters, ratingRange: newRatingRange });
  };

  const handleAvailabilityChange = (checked: boolean) => {
    setAvailability(checked);
    onFiltersChange({ ...filters, availability: checked });
  };

  const handlePriceChange = (min: number, max: number) => {
    const newPriceRange = { min, max };
    setPriceRange(newPriceRange);
    onFiltersChange({ ...filters, priceRange: newPriceRange });
  };

  const handleReset = () => {
    const defaultFilters: AdvancedSearchFilters = {};
    setDistance({ min: 0, max: 100 });
    setRatingRange({ min: 1, max: 5 });
    setAvailability(false);
    setPriceRange({ min: 0, max: 500 });
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters =
    filters.distance ||
    filters.ratingRange ||
    filters.availability ||
    filters.priceRange;

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Advanced Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            type="button"
          >
            Reset All
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Distance Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Distance: {distance.min} - {distance.max} km
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              value={distance.min}
              onChange={(e) =>
                handleDistanceChange(parseInt(e.target.value), distance.max)
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-label="Minimum distance"
            />
            <input
              type="range"
              min="0"
              max="100"
              value={distance.max}
              onChange={(e) =>
                handleDistanceChange(distance.min, parseInt(e.target.value))
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-label="Maximum distance"
            />
          </div>
        </div>

        {/* Rating Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating: {ratingRange.min} - {ratingRange.max} stars
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={ratingRange.min}
              onChange={(e) =>
                handleRatingChange(parseFloat(e.target.value), ratingRange.max)
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-label="Minimum rating"
            />
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={ratingRange.max}
              onChange={(e) =>
                handleRatingChange(ratingRange.min, parseFloat(e.target.value))
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-label="Maximum rating"
            />
          </div>
        </div>

        {/* Availability Filter */}
        <div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={availability}
              onChange={(e) => handleAvailabilityChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              aria-label="Available now"
            />
            <span className="text-sm font-medium text-gray-700">
              Available now
            </span>
          </label>
          <p className="text-xs text-gray-600 mt-1">
            Only show trainers who are currently available
          </p>
        </div>

        {/* Price Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price: ${priceRange.min} - ${priceRange.max}
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={priceRange.min}
              onChange={(e) =>
                handlePriceChange(parseInt(e.target.value), priceRange.max)
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-label="Minimum price"
            />
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={priceRange.max}
              onChange={(e) =>
                handlePriceChange(priceRange.min, parseInt(e.target.value))
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-label="Maximum price"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
