// ============================================================================
// DTD P2 Phase 3: Advanced Search - Saved Searches Component Tests
// File: src/components/SavedSearches.test.tsx
// Description: Component tests for SavedSearches
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SavedSearches, { triggerSaveSearch } from './SavedSearches';
import type { AdvancedSearchFilters } from '@/types/search';

describe('SavedSearches Component', () => {
  const mockOnLoadSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  it('should render empty state', () => {
    render(
      <SavedSearches onLoadSearch={mockOnLoadSearch} />
    );

    expect(screen.getByText('Saved Searches')).toBeInTheDocument();
    expect(screen.getByText(/No saved searches yet/)).toBeInTheDocument();
  });

  it('should render saved searches', () => {
    const savedSearches = [
      {
        id: '1',
        name: 'Search 1',
        filters: { search: 'puppy training' },
        timestamp: new Date('2024-01-01'),
      },
      {
        id: '2',
        name: 'Search 2',
        filters: { distance: { min: 0, max: 10 } },
        timestamp: new Date('2024-01-02'),
      },
    ];

    if (typeof window !== 'undefined') {
      localStorage.setItem('saved_searches', JSON.stringify(savedSearches));
    }

    render(
      <SavedSearches onLoadSearch={mockOnLoadSearch} />
    );

    expect(screen.getByText('Search 1')).toBeInTheDocument();
    expect(screen.getByText('Search 2')).toBeInTheDocument();
  });

  it('should load saved searches from LocalStorage', () => {
    const savedSearches = [
      {
        id: '1',
        name: 'Search 1',
        filters: { search: 'puppy training' },
        timestamp: new Date(),
      },
    ];

    if (typeof window !== 'undefined') {
      localStorage.setItem('saved_searches', JSON.stringify(savedSearches));
    }

    render(
      <SavedSearches onLoadSearch={mockOnLoadSearch} />
    );

    expect(screen.getByText('Search 1')).toBeInTheDocument();
  });

  it('should call onLoadSearch when load button clicked', async () => {
    const savedSearches = [
      {
        id: '1',
        name: 'Search 1',
        filters: { search: 'puppy training' },
        timestamp: new Date(),
      },
    ];

    if (typeof window !== 'undefined') {
      localStorage.setItem('saved_searches', JSON.stringify(savedSearches));
    }

    render(
      <SavedSearches onLoadSearch={mockOnLoadSearch} />
    );

    const loadButton = screen.getAllByText('Load')[0];
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(mockOnLoadSearch).toHaveBeenCalledWith({
        search: 'puppy training',
      });
    });
  });

  it('should delete saved search', async () => {
    const savedSearches = [
      {
        id: '1',
        name: 'Search 1',
        filters: { search: 'puppy training' },
        timestamp: new Date(),
      },
    ];

    if (typeof window !== 'undefined') {
      localStorage.setItem('saved_searches', JSON.stringify(savedSearches));
    }

    render(
      <SavedSearches onLoadSearch={mockOnLoadSearch} />
    );

    const deleteButton = screen.getAllByText('Delete')[0];
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText('Search 1')).not.toBeInTheDocument();
    });
  });

  it('should format date correctly', () => {
    const savedSearches = [
      {
        id: '1',
        name: 'Search 1',
        filters: { search: 'puppy training' },
        timestamp: new Date(),
      },
      {
        id: '2',
        name: 'Search 2',
        filters: { search: 'obedience training' },
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      },
    ];

    if (typeof window !== 'undefined') {
      localStorage.setItem('saved_searches', JSON.stringify(savedSearches));
    }

    render(
      <SavedSearches onLoadSearch={mockOnLoadSearch} />
    );

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
  });

  it('should display save form when triggered', async () => {
    const filters: AdvancedSearchFilters = {
      search: 'puppy training',
      distance: { min: 0, max: 10 },
    };

    triggerSaveSearch(filters);

    render(
      <SavedSearches onLoadSearch={mockOnLoadSearch} />
    );

    await waitFor(() => {
      expect(screen.getByText('Save Current Search')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search name...')).toBeInTheDocument();
    });
  });

  it('should save search to LocalStorage', async () => {
    const filters: AdvancedSearchFilters = {
      search: 'puppy training',
    };

    triggerSaveSearch(filters);

    render(
      <SavedSearches onLoadSearch={mockOnLoadSearch} />
    );

    const nameInput = screen.getByPlaceholderText('Search name...');
    fireEvent.change(nameInput, { target: { value: 'My Search' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.queryByText('Save Current Search')).not.toBeInTheDocument();
      expect(screen.getByText('My Search')).toBeInTheDocument();
    });
  });

  it('should cancel save form', async () => {
    const filters: AdvancedSearchFilters = {
      search: 'puppy training',
    };

    triggerSaveSearch(filters);

    render(
      <SavedSearches onLoadSearch={mockOnLoadSearch} />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Save Current Search')).not.toBeInTheDocument();
    });
  });
});
