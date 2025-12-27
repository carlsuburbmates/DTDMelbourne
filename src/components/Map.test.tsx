// ============================================================================
// DTD P2 Phase 3: Advanced Search - Map Component Tests
// File: src/components/Map.test.tsx
// Description: Component tests for Map
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Map from './Map';

describe('Map Component', () => {
  const mockOnTrainerClick = vi.fn();

  const mockTrainers = [
    {
      id: '1',
      name: 'Trainer 1',
      latitude: -37.8136,
      longitude: 144.9631,
    },
    {
      id: '2',
      name: 'Trainer 2',
      latitude: -37.816,
      longitude: 144.945,
    },
    {
      id: '3',
      name: 'Trainer 3',
      latitude: -37.820,
      longitude: 144.950,
    },
  ];

  const mockUserLocation = {
    latitude: -37.8136,
    longitude: 144.9631,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render map view toggle buttons', () => {
    render(
      <Map
        trainers={mockTrainers}
        userLocation={mockUserLocation}
        onTrainerClick={mockOnTrainerClick}
      />
    );

    expect(screen.getByText('Map View')).toBeInTheDocument();
    expect(screen.getByText('List')).toBeInTheDocument();
    expect(screen.getByText('Map')).toBeInTheDocument();
    expect(screen.getByText('Both')).toBeInTheDocument();
  });

  it('should render trainer list in list view', () => {
    render(
      <Map
        trainers={mockTrainers}
        userLocation={mockUserLocation}
        onTrainerClick={mockOnTrainerClick}
      />
    );

    expect(screen.getByText('Trainer List')).toBeInTheDocument();
    expect(screen.getByText('Trainer 1')).toBeInTheDocument();
    expect(screen.getByText('Trainer 2')).toBeInTheDocument();
    expect(screen.getByText('Trainer 3')).toBeInTheDocument();
  });

  it('should display distance from user location', () => {
    render(
      <Map
        trainers={mockTrainers}
        userLocation={mockUserLocation}
        onTrainerClick={mockOnTrainerClick}
      />
    );

    expect(screen.getByText(/away/)).toBeInTheDocument();
  });

  it('should call onTrainerClick when trainer clicked', async () => {
    render(
      <Map
        trainers={mockTrainers}
        userLocation={mockUserLocation}
        onTrainerClick={mockOnTrainerClick}
      />
    );

    const trainerCard = screen.getByText('Trainer 1').closest('div');
    fireEvent.click(trainerCard!);

    await waitFor(() => {
      expect(mockOnTrainerClick).toHaveBeenCalledWith('1');
    });
  });

  it('should switch to map view when map button clicked', async () => {
    render(
      <Map
        trainers={mockTrainers}
        userLocation={mockUserLocation}
        onTrainerClick={mockOnTrainerClick}
      />
    );

    const mapButton = screen.getByText('Map');
    fireEvent.click(mapButton);

    await waitFor(() => {
      expect(screen.getByText('Loading map...')).toBeInTheDocument();
    });
  });

  it('should display no trainers message when no results', () => {
    render(
      <Map
        trainers={[]}
        userLocation={mockUserLocation}
        onTrainerClick={mockOnTrainerClick}
      />
    );

    expect(screen.getByText('No trainers found')).toBeInTheDocument();
  });

  it('should render both views when both button clicked', async () => {
    render(
      <Map
        trainers={mockTrainers}
        userLocation={mockUserLocation}
        onTrainerClick={mockOnTrainerClick}
      />
    );

    const bothButton = screen.getByText('Both');
    fireEvent.click(bothButton);

    await waitFor(() => {
      expect(screen.getByText('Trainer List')).toBeInTheDocument();
      expect(screen.getByText('Loading map...')).toBeInTheDocument();
    });
  });
});
