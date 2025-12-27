// ============================================================================
// DTD P2 Phase 3: Advanced Search - Map Component
// File: src/components/Map.tsx
// Description: Map view component with Leaflet integration
// ============================================================================

'use client';

import { useState, useEffect, useRef } from 'react';
import type { MapMarker, MapViewType } from '@/types/search';
import { formatDistance } from '@/services/geolocation';

interface MapProps {
  trainers: Array<{ id: string; name: string; latitude?: number; longitude?: number }>;
  userLocation?: { latitude: number; longitude: number };
  onTrainerClick?: (trainerId: string) => void;
  className?: string;
}

export default function Map({
  trainers,
  userLocation,
  onTrainerClick,
  className = '',
}: MapProps) {
  const [viewType, setViewType] = useState<MapViewType>('list');
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Load Leaflet dynamically
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const loadLeaflet = async () => {
      try {
        // Load Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        // Load Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          setMapLoaded(true);
          initializeMap();
        };
        document.body.appendChild(script);
      } catch (error) {
        console.error('Failed to load Leaflet:', error);
      }
    };

    loadLeaflet();
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || typeof window === 'undefined') {
      return;
    }

    // @ts-ignore - Leaflet is loaded dynamically
    const L = (window as any).L;

    // Initialize map
    const map = L.map(mapRef.current).setView(
      userLocation ? [userLocation.latitude, userLocation.longitude] : [-37.8136, 144.9631],
      10
    );

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Add user location marker
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-marker',
        html: '<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white;"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
        .addTo(map)
        .bindPopup('Your Location');
    }

    // Add trainer markers
    trainers.forEach((trainer) => {
      if (trainer.latitude && trainer.longitude) {
        const trainerIcon = L.divIcon({
          className: 'trainer-marker',
          html: '<div style="background-color: #ef4444; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const marker = L.marker([trainer.latitude, trainer.longitude], {
          icon: trainerIcon,
        })
          .addTo(map)
          .bindPopup(`<b>${trainer.name}</b>`);

        if (onTrainerClick) {
          marker.on('click', () => {
            onTrainerClick(trainer.id);
          });
        }
      }
    });

    // Fit bounds to show all markers
    if (trainers.length > 0) {
      const bounds = L.latLngBounds(
        trainers
          .filter((t) => t.latitude && t.longitude)
          .map((t) => [t.latitude!, t.longitude!])
      );

      if (userLocation) {
        bounds.extend([userLocation.latitude, userLocation.longitude]);
      }

      map.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  const handleViewTypeChange = (type: MapViewType) => {
    setViewType(type);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold">Map View</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewTypeChange('list')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              viewType === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            type="button"
            aria-label="List view"
          >
            List
          </button>
          <button
            onClick={() => handleViewTypeChange('map')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              viewType === 'map'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            type="button"
            aria-label="Map view"
          >
            Map
          </button>
          <button
            onClick={() => handleViewTypeChange('both')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              viewType === 'both'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            type="button"
            aria-label="Both views"
          >
            Both
          </button>
        </div>
      </div>

      {viewType === 'map' || viewType === 'both' ? (
        <div className="relative">
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Loading map...</p>
              </div>
            </div>
          )}
          <div
            ref={mapRef}
            className="h-96 w-full"
            style={{ display: mapLoaded ? 'block' : 'none' }}
            role="application"
            aria-label="Map showing trainer locations"
          />
        </div>
      ) : null}

      {viewType === 'list' || viewType === 'both' ? (
        <div className="p-4">
          <h3 className="text-lg font-medium mb-3">Trainer List</h3>
          {trainers.length === 0 ? (
            <p className="text-sm text-gray-600">No trainers found</p>
          ) : (
            <div className="space-y-3">
              {trainers.map((trainer) => (
                <div
                  key={trainer.id}
                  onClick={() => onTrainerClick?.(trainer.id)}
                  className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <h4 className="text-sm font-medium text-gray-900">
                    {trainer.name}
                  </h4>
                  {trainer.latitude && trainer.longitude && userLocation && (
                    <p className="text-xs text-gray-600 mt-1">
                      {formatDistance(
                        // @ts-ignore - distance calculation
                        calculateDistance(
                          userLocation.latitude,
                          userLocation.longitude,
                          trainer.latitude,
                          trainer.longitude
                        )
                      )} away
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Calculate distance between two coordinates
 */
function calculateDistance(
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

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
