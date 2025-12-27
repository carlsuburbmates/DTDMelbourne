// ============================================================================
// DTD P2 Phase 3: Advanced Search - Geolocation Component
// File: src/components/Geolocation.tsx
// Description: Geolocation component with permission request
// ============================================================================

'use client';

import { useState, useEffect } from 'react';
import type { GeolocationResult } from '@/types/search';
import {
  getGeolocationWithFallback,
  checkGeolocationPermission,
  requestGeolocationPermission,
  formatCoordinates,
  formatDistance,
} from '@/services/geolocation';

interface GeolocationProps {
  onLocationChange: (location: GeolocationResult | null) => void;
  className?: string;
}

export default function Geolocation({ onLocationChange, className = '' }: GeolocationProps) {
  const [location, setLocation] = useState<GeolocationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionState>('prompt');

  // Check permission on mount
  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const perm = await checkGeolocationPermission();
      setPermission(perm);
    } catch (err) {
      console.error('Failed to check permission:', err);
    }
  };

  const handleGetLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      const loc = await getGeolocationWithFallback();
      setLocation(loc);
      onLocationChange(loc);
      setPermission('granted');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      setError(errorMessage);
      setPermission('denied');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    try {
      const granted = await requestGeolocationPermission();
      if (granted) {
        await handleGetLocation();
      } else {
        setPermission('denied');
        setError('Location permission denied');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request permission';
      setError(errorMessage);
    }
  };

  const handleClearLocation = () => {
    setLocation(null);
    onLocationChange(null);
    setError(null);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h2 className="text-xl font-semibold mb-4">Your Location</h2>
      
      {location ? (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-1.414.586l-4-4a1.998 1.998 0 01-.586-1.414l-4.243-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="text-sm text-gray-700">
              Location detected via {location.method}
            </span>
          </div>

          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-sm font-medium text-gray-900">
              {formatCoordinates(location.latitude, location.longitude)}
            </p>
            {location.accuracy > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                Accuracy: {formatDistance(location.accuracy)}
              </p>
            )}
            {location.city && (
              <p className="text-xs text-gray-600 mt-1">
                {location.city}, {location.region}, {location.country}
              </p>
            )}
          </div>

          <button
            onClick={handleClearLocation}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            type="button"
          >
            Clear Location
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {permission === 'denied' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                Location access is denied. Please enable location services in your browser settings.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {permission === 'prompt' && (
            <button
              onClick={handleRequestPermission}
              disabled={loading}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors"
              type="button"
            >
              {loading ? 'Requesting...' : 'Enable Location'}
            </button>
          )}

          {permission === 'granted' && (
            <button
              onClick={handleGetLocation}
              disabled={loading}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors"
              type="button"
            >
              {loading ? 'Detecting...' : 'Detect My Location'}
            </button>
          )}

          <p className="text-xs text-gray-600 text-center">
            We use your location to find trainers near you
          </p>
        </div>
      )}
    </div>
  );
}
