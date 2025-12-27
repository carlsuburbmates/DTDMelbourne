/**
 * React Query cache hook
 * Integrates with the cache service for optimized data fetching
 */

import { useState, useEffect, useCallback } from 'react';
import { cacheService, createQueryOptions } from '../services/cache';
import type { QueryOptions } from '../types/cache';

interface UseQueryResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  refetch: () => Promise<void>;
}

interface UseQueryOptions<T> extends QueryOptions {
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for data fetching with caching
 * Similar to React Query's useQuery but with our cache service
 */
export function useQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: UseQueryOptions<T>
): UseQueryResult<T> {
  const {
    staleTime = 5 * 60 * 1000,
    cacheTime = 10 * 60 * 1000,
    enabled = true,
    onSuccess,
    onError,
  } = options || {};

  const [data, setData] = useState<T | null>(() => {
    // Initialize from cache if available
    const cached = cacheService.get<T>(key);
    return cached;
  });

  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cached = cacheService.get<T>(key);
      const now = Date.now();

      // Return cached data if still valid
      if (cached && lastFetchTime && now - lastFetchTime < staleTime) {
        setData(cached);
        setIsLoading(false);
        return;
      }

      // Fetch fresh data
      const freshData = await fetcher();
      setData(freshData);
      setLastFetchTime(now);

      // Cache the data
      cacheService.set(key, freshData, cacheTime);

      if (onSuccess) {
        onSuccess(freshData);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);
      setIsLoading(false);

      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, staleTime, cacheTime, enabled, onSuccess, onError, lastFetchTime]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    data,
    error,
    isLoading,
    isError: error !== null,
    isSuccess: error === null && !isLoading,
    refetch,
  };
}

/**
 * Hook for prefetching data
 */
export function usePrefetch<T>(key: string, fetcher: () => Promise<T>): void {
  useEffect(() => {
    const prefetchData = async () => {
      const cached = cacheService.get<T>(key);
      if (cached === null) {
        try {
          const data = await fetcher();
          cacheService.set(key, data);
        } catch (error) {
          console.error(`Failed to prefetch ${key}:`, error);
        }
      }
    };

    prefetchData();
  }, [key, fetcher]);
}

/**
 * Hook for invalidating cache
 */
export function useInvalidateCache(): (pattern: string) => void {
  return useCallback((pattern: string) => {
    cacheService.invalidate({ pattern });
  }, []);
}

/**
 * Hook for clearing cache
 */
export function useClearCache(): () => void {
  return useCallback(() => {
    cacheService.clear();
  }, []);
}

/**
 * Hook for cache statistics
 */
export function useCacheStats() {
  const [stats, setStats] = useState(() => cacheService.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(cacheService.getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}
