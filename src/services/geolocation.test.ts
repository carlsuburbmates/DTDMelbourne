// ============================================================================
// DTD P2 Phase 3: Advanced Search - Geolocation Service Tests
// File: src/services/geolocation.test.ts
// Description: Unit tests for geolocation service
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getBrowserGeolocation,
  getIPGeolocation,
  getGeolocationWithFallback,
  checkGeolocationPermission,
  requestGeolocationPermission,
  calculateDistance,
  filterByDistance,
  formatCoordinates,
  formatDistance,
} from './geolocation';
import type { GeolocationResult } from '@/types/search';

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
};

Object.defineProperty(navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock navigator.permissions
const mockPermissions = {
  query: vi.fn(),
};

Object.defineProperty(navigator, 'permissions', {
  value: mockPermissions,
  writable: true,
});

// Mock fetch
global.fetch = vi.fn();

describe('Geolocation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const distance = calculateDistance(-37.8136, 144.9631, -37.816, 144.945);

      expect(distance).toBeCloseTo(3.5, 1);
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(-37.8136, 144.9631, -37.8136, 144.9631);

      expect(distance).toBe(0);
    });

    it('should calculate distance for long distances', () => {
      const distance = calculateDistance(-37.8136, 144.9631, -33.8688, 151.2093);

      expect(distance).toBeCloseTo(475, 5);
    });
  });

  describe('filterByDistance', () => {
    it('should filter items by distance', () => {
      const items = [
        { id: '1', name: 'Item 1', latitude: -37.8136, longitude: 144.9631 },
        { id: '2', name: 'Item 2', latitude: -37.816, longitude: 144.945 },
        { id: '3', name: 'Item 3', latitude: -37.820, longitude: 144.950 },
      ];

      const userLocation: GeolocationResult = {
        latitude: -37.8136,
        longitude: 144.9631,
        accuracy: 10,
        method: 'browser',
      };

      const filtered = filterByDistance(items, userLocation, 10);

      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe('1');
      expect(filtered[1].id).toBe('2');
    });

    it('should handle items without coordinates', () => {
      const items = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2', latitude: -37.816, longitude: 144.945 },
      ];

      const userLocation: GeolocationResult = {
        latitude: -37.8136,
        longitude: 144.9631,
        accuracy: 10,
        method: 'browser',
      };

      const filtered = filterByDistance(items, userLocation, 10);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2');
    });

    it('should sort by distance', () => {
      const items = [
        { id: '1', name: 'Item 1', latitude: -37.820, longitude: 144.950 },
        { id: '2', name: 'Item 2', latitude: -37.816, longitude: 144.945 },
        { id: '3', name: 'Item 3', latitude: -37.8136, longitude: 144.9631 },
      ];

      const userLocation: GeolocationResult = {
        latitude: -37.8136,
        longitude: 144.9631,
        accuracy: 10,
        method: 'browser',
      };

      const filtered = filterByDistance(items, userLocation, 50);

      expect(filtered).toHaveLength(3);
      expect(filtered[0].distance).toBeLessThan(filtered[1].distance);
      expect(filtered[1].distance).toBeLessThan(filtered[2].distance);
    });
  });

  describe('formatCoordinates', () => {
    it('should format coordinates correctly', () => {
      const formatted = formatCoordinates(-37.8136, 144.9631);

      expect(formatted).toBe('-37.813600, 144.963100');
    });
  });

  describe('formatDistance', () => {
    it('should format distance in meters', () => {
      const formatted = formatDistance(0.5);

      expect(formatted).toBe('500m');
    });

    it('should format distance in kilometers', () => {
      const formatted = formatDistance(5.5);

      expect(formatted).toBe('5.5km');
    });

    it('should format distance with one decimal', () => {
      const formatted = formatDistance(10.25);

      expect(formatted).toBe('10.3km');
    });
  });

  describe('checkGeolocationPermission', () => {
    it('should return permission state', async () => {
      mockPermissions.query.mockResolvedValue({ state: 'granted' });

      const permission = await checkGeolocationPermission();

      expect(permission).toBe('granted');
    });

    it('should return prompt when permissions API not available', async () => {
      Object.defineProperty(navigator, 'permissions', {
        value: undefined,
        writable: true,
      });

      const permission = await checkGeolocationPermission();

      expect(permission).toBe('prompt');
    });
  });

  describe('getBrowserGeolocation', () => {
    it('should get browser geolocation', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: -37.8136,
            longitude: 144.9631,
            accuracy: 10,
          },
        });
      });

      const location = await getBrowserGeolocation();

      expect(location).toEqual({
        latitude: -37.8136,
        longitude: 144.9631,
        accuracy: 10,
        method: 'browser',
      });
    });

    it('should handle permission denied', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
        error({ code: 1, message: 'Permission denied' });
      });

      await expect(getBrowserGeolocation()).rejects.toThrow('User denied the request for geolocation');
    });
  });

  describe('getIPGeolocation', () => {
    it('should get IP geolocation', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          latitude: -37.8136,
          longitude: 144.9631,
          city: 'Melbourne',
          region: 'Victoria',
          country_name: 'Australia',
        }),
      });

      const location = await getIPGeolocation();

      expect(location).toEqual({
        latitude: -37.8136,
        longitude: 144.9631,
        accuracy: 50000,
        method: 'ip',
        city: 'Melbourne',
        region: 'Victoria',
        country: 'Australia',
      });
    });

    it('should handle API failure', async () => {
      (global.fetch as any).mockRejectedValue(new Error('API Error'));

      await expect(getIPGeolocation()).rejects.toThrow();
    });
  });

  describe('getGeolocationWithFallback', () => {
    it('should use browser geolocation when available', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: -37.8136,
            longitude: 144.9631,
            accuracy: 10,
          },
        });
      });

      const location = await getGeolocationWithFallback();

      expect(location.method).toBe('browser');
      expect(location.latitude).toBe(-37.8136);
    });

    it('should fallback to IP geolocation when browser fails', async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
        error({ code: 1, message: 'Permission denied' });
      });

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          latitude: -37.8136,
          longitude: 144.9631,
        }),
      });

      const location = await getGeolocationWithFallback();

      expect(location.method).toBe('ip');
    });
  });
});
