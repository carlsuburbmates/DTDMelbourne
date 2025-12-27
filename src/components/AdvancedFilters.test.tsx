// ============================================================================
// DTD P2 Phase 3: Advanced Search - Advanced Filters Component Tests
// File: src/components/AdvancedFilters.test.tsx
// Description: Component tests for AdvancedFilters
// ============================================================================

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdvancedFilters from './AdvancedFilters';
import type { AdvancedSearchFilters } from '@/types/search';

describe('AdvancedFilters Component', () => {
  const mockOnFiltersChange = vi.fn();

  const defaultFilters: AdvancedSearchFilters = {};

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all filters', () => {
    render(
      <AdvancedFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
    expect(screen.getByText('Distance: 0 - 100 km')).toBeInTheDocument();
    expect(screen.getByText('Rating: 1 - 5 stars')).toBeInTheDocument();
    expect(screen.getByText('Available now')).toBeInTheDocument();
    expect(screen.getByText('Price: $0 - $500')).toBeInTheDocument();
  });

  it('should call onFiltersChange when distance changes', async () => {
    render(
      <AdvancedFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const distanceInputs = screen.getAllByLabelText(/distance/i);
    fireEvent.change(distanceInputs[0], { target: { value: '10' } });

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        distance: { min: 10, max: 100 },
      });
    });
  });

  it('should call onFiltersChange when rating changes', async () => {
    render(
      <AdvancedFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const ratingInputs = screen.getAllByLabelText(/rating/i);
    fireEvent.change(ratingInputs[0], { target: { value: '3' } });

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        ratingRange: { min: 3, max: 5 },
      });
    });
  });

  it('should call onFiltersChange when availability changes', async () => {
    render(
      <AdvancedFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const availabilityCheckbox = screen.getByLabelText('Available now');
    fireEvent.click(availabilityCheckbox);

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        availability: true,
      });
    });
  });

  it('should call onFiltersChange when price changes', async () => {
    render(
      <AdvancedFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const priceInputs = screen.getAllByLabelText(/price/i);
    fireEvent.change(priceInputs[0], { target: { value: '100' } });

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...defaultFilters,
        priceRange: { min: 100, max: 500 },
      });
    });
  });

  it('should reset all filters when reset button clicked', async () => {
    const filtersWithValues: AdvancedSearchFilters = {
      distance: { min: 10, max: 50 },
      ratingRange: { min: 3, max: 5 },
      availability: true,
      priceRange: { min: 100, max: 300 },
    };

    render(
      <AdvancedFilters
        filters={filtersWithValues}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const resetButton = screen.getByText('Reset All');
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({});
    });
  });

  it('should show reset button when filters are active', () => {
    const activeFilters: AdvancedSearchFilters = {
      distance: { min: 10, max: 50 },
    };

    render(
      <AdvancedFilters
        filters={activeFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText('Reset All')).toBeInTheDocument();
  });

  it('should not show reset button when no filters are active', () => {
    render(
      <AdvancedFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.queryByText('Reset All')).not.toBeInTheDocument();
  });
});
