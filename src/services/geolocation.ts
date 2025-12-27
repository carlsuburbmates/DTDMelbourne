// ============================================================================
// DTD P2 Phase 3: Advanced Search - Geolocation Service
// File: src/services/geolocation.ts
// Description: Geolocation service with browser API and IP fallback
// ============================================================================

import type {
  GeolocationResult,
  GeolocationError,
} from '../types/search';

// ============================================================================
// CONFIGURATION
// ============================================================================

const GEOLOCATION_TIMEOUT = 10000; // 10 seconds
const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: GEOLOCATION_TIMEOUT,
  maximumAge: 300000, // 5 minutes
};

// ============================================================================
// BROWSER GEOLOCATION
// ============================================================================

/**
 * Get user's current location using browser Geolocation API
 */
export async function getBrowserGeolocation(): Promise<GeolocationResult> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const result: GeolocationResult = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || 0,
          method: 'browser',
        };
        resolve(result);
      },
      (error) => {
        const geoError: GeolocationError = {
          code: error.code,
          message: getGeolocationErrorMessage(error.code),
        };
        reject(geoError);
      },
      GEOLOCATION_OPTIONS
    );
  });
}

/**
 * Get geolocation error message
 */
function getGeolocationErrorMessage(code: number): string {
  switch (code) {
    case error.PERMISSION_DENIED:
      return 'User denied the request for geolocation';
    case error.POSITION_UNAVAILABLE:
      return 'Location information is unavailable';
    case error.TIMEOUT:
      return 'The request to get user location timed out';
    default:
      return 'An unknown error occurred';
  }
}

// ============================================================================
// IP-BASED GEOLOCATION
// ============================================================================

/**
 * Get geolocation by IP address
 */
export async function getIPGeolocation(): Promise<GeolocationResult> {
  try {
    const response = await fetch('/api/v1/search/geolocation');
    
    if (!response.ok) {
      throw new Error(`IP geolocation failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: 50000, // IP geolocation is less accurate
      method: 'ip',
      city: data.city,
      region: data.region,
      country: data.country,
    };
  } catch (error) {
    console.error('Failed to get IP geolocation:', error);
    throw error;
  }
}

/**
 * Get geolocation with fallback
 * Tries browser geolocation first, falls back to IP-based
 */
export async function getGeolocationWithFallback(): Promise<GeolocationResult> {
  try {
    // Try browser geolocation first
    return await getBrowserGeolocation();
  } catch (error) {
    console.warn('Browser geolocation failed, falling back to IP:', error);
    
    // Fall back to IP-based geolocation
    try {
      return await getIPGeolocation();
    } catch (ipError) {
      console.error('IP geolocation also failed:', ipError);
      throw new Error('Unable to determine location');
    }
  }
}

// ============================================================================
// PERMISSION HANDLING
// ============================================================================

/**
 * Check if geolocation permission is granted
 */
export async function checkGeolocationPermission(): Promise<PermissionState> {
  if (typeof window === 'undefined' || !navigator.permissions) {
    return 'prompt';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  } catch (error) {
    console.error('Failed to check geolocation permission:', error);
    return 'prompt';
  }
}

/**
 * Request geolocation permission
 */
export async function requestGeolocationPermission(): Promise<boolean> {
  try {
    await getBrowserGeolocation();
    return true;
  } catch (error) {
    const geoError = error as GeolocationError;
    
    if (geoError.code === error.PERMISSION_DENIED) {
      return false;
    }
    
    throw error;
  }
}

// ============================================================================
// DISTANCE CALCULATION
// ============================================================================

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Filter results by distance
 */
export function filterByDistance<T extends { latitude?: number; longitude?: number }>(
  items: T[],
  userLocation: GeolocationResult,
  maxDistance: number
): Array<T & { distance: number }> {
  return items
    .map((item) => ({
      ...item,
      distance: item.latitude && item.longitude
        ? calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            item.latitude,
            item.longitude
          )
        : Infinity,
    }))
    .filter((item) => item.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);
}

// ============================================================================
// LOCATION FORMATTING
// ============================================================================

/**
 * Format coordinates for display
 */
export function formatCoordinates(
  latitude: number,
  longitude: number
): string {
  const lat = latitude.toFixed(6);
  const lon = longitude.toFixed(6);
  return `${lat}, ${lon}`;
}

/**
 * Format distance for display
 */
export function formatDistance(kilometers: number): string {
  if (kilometers < 1) {
    return `${Math.round(kilometers * 1000)}m`;
  }
  return `${kilometers.toFixed(1)}km`;
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export {
  getBrowserGeolocation,
  getIPGeolocation,
  getGeolocationWithFallback,
  checkGeolocationPermission,
  requestGeolocationPermission,
  calculateDistance,
  filterByDistance,
  formatCoordinates,
  formatDistance,
};

// ============================================================================
// COMMENTS
// ============================================================================
// 1. Browser Geolocation API integration
// 2. IP-based geolocation fallback
// 3. Permission request and checking
// 4. Distance calculation using Haversine formula
// 5. Distance filtering and sorting
// 6. Location formatting utilities
// 7. Based on DOCS/P2-architectural-plan.md Section 3
// ============================================================================
