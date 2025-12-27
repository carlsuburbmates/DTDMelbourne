// ============================================================================
// DTD P2 Phase 3: Advanced Search - Geolocation Component Tests
// File: src/components/Geolocation.test.tsx
// Description: Component tests for Geolocation
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Geolocation from './Geolocation';
import type { GeolocationResult } from '@/types/search';

// Mock geolocation service
vi.mock('@/services/geolocation', () => ({
  getGeolocationWithFallback: vi.fn(),
  checkGeolocationPermission: vi.fn(),
  requestGeolocationPermission: vi.fn(),
  formatCoordinates: vi.fn((lat, lon) => `${lat.toFixed(6)}, ${lon.toFixed(6)}`),
  formatDistance: vi.fn((km) => (km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`),
}));

describe('Geolocation Component', () => {
  const mockOnLocationChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render location permission prompt', () => {
    const { checkGeolocationPermission } = await import('@/services/geolocation');
    (checkGeolocationPermission as any).mockResolvedValue('prompt');

    render(
      <Geolocation onLocationChange={mockOnLocationChange} />
    );

    expect(screen.getByText('Enable Location')).toBeInTheDocument();
  });

  it('should display detected location', async () => {
    const { getGeolocationWithFallback } = await import('@/services/geolocation');
    const mockLocation: GeolocationResult = {
      latitude: -37.8136,
      longitude: 144.9631,
      accuracy: 10,
      method: 'browser',
    };
    (getGeolocationWithFallback as any).mockResolvedValue(mockLocation);

    render(
      <Geolocation onLocationChange={mockOnLocationChange} />
    );

    await waitFor(() => {
      expect(screen.getByText(/Location detected via browser/)).toBeInTheDocument();
    });
  });

  it('should display location coordinates', async () => {
    const { getGeolocationWithFallback } = await import('@/services/geolocation');
    const mockLocation: GeolocationResult = {
      latitude: -37.8136,
      longitude: 144.9631,
      accuracy: 10,
      method: 'browser',
    };
    (getGeolocationWithFallback as any).mockResolvedValue(mockLocation);

    render(
      <Geolocation onLocationChange={mockOnLocationChange} />
    );

    await waitFor(() => {
      expect(screen.getByText(/-37\.813600, 144\.963100/)).toBeInTheDocument();
    });
  });

  it('should call onLocationChange when location detected', async () => {
    const { getGeolocationWithFallback } = await import('@/services/geolocation');
    const mockLocation: GeolocationResult = {
      latitude: -37.8136,
      longitude: 144.9631,
      accuracy: 10,
      method: 'browser',
    };
    (getGeolocationWithFallback as any).mockResolvedValue(mockLocation);

    render(
      <Geolocation onLocationChange={mockOnLocationChange} />
    );

    await waitFor(() => {
      expect(mockOnLocationChange).toHaveBeenCalledWith(mockLocation);
    });
  });

  it('should clear location when clear button clicked', async () => {
    const { getGeolocationWithFallback } = await import('@/services/geolocation');
    const mockLocation: GeolocationResult = {
      latitude: -37.8136,
      longitude: 144.9631,
      accuracy: 10,
      method: 'browser',
    };
    (getGeolocationWithFallback as any).mockResolvedValue(mockLocation);

    render(
      <Geolocation onLocationChange={mockOnLocationChange} />
    );

    await waitFor(() => {
      const clearButton = screen.getByText('Clear Location');
      fireEvent.click(clearButton);
    });

    expect(mockOnLocationChange).toHaveBeenCalledWith(null);
  });

  it('should display error message when location fails', async () => {
    const { getGeolocationWithFallback } = await import('@/services/geolocation');
    (getGeolocationWithFallback as any).mockRejectedValue(new Error('Location error'));

    render(
      <Geolocation onLocationChange={mockOnLocationChange} />
    );

    await waitFor(() => {
      expect(screen.getByText(/Location error/)).toBeInTheDocument();
    });
  });
});
