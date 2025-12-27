/**
 * React SWR cache hook
 * Integrates with cache service for stale-while-revalidate pattern
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheService, createSWROptions } from '../services/cache';
import type { SWROptions } from '../types/cache';

interface UseSWRResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isValidating: boolean;
  isError: boolean;
  mutate: (data?: T | Promise<T> | ((data?: T) => T | Promise<T>), shouldRevalidate?: boolean) => void;
}

interface UseSWROptions<T> extends SWROptions {
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for data fetching with SWR pattern
 * Stale-While-Revalidate: Return cached data immediately, then fetch fresh data in background
 */
export function useSWR<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: UseSWROptions<T>
): UseSWRResult<T> {
  const {
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
    dedupingInterval = 2000,
    refreshInterval = 0,
    errorRetryCount = 3,
    errorRetryInterval = 5000,
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
  const [isValidating, setIsValidating] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);

  const fetchRef = useRef<(() => Promise<T>) | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  const fetchData = useCallback(async (isBackground = false) => {
    if (!enabled) {
      return;
    }

    // Deduplication check
    if (fetchRef.current && Date.now() - (lastFetchTime || 0) < dedupingInterval) {
      return;
    }

    fetchRef.current = fetcher;

    if (!isBackground) {
      setIsLoading(true);
    }
    setIsValidating(true);
    setError(null);

    try {
      const freshData = await fetcher();
      setData(freshData);
      setLastFetchTime(Date.now());

      // Cache the fresh data
      cacheService.set(key, freshData);

      retryCountRef.current = 0;

      if (onSuccess) {
        onSuccess(freshData);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);

      // Retry logic
      if (retryCountRef.current < errorRetryCount) {
        retryCountRef.current++;
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          fetchData(isBackground);
        }, errorRetryInterval);
      }

      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
      setIsValidating(false);
      fetchRef.current = null;
    }
  }, [key, fetcher, dedupingInterval, enabled, onSuccess, onError, errorRetryCount, errorRetryInterval, lastFetchTime]);

  // Initial fetch
  useEffect(() => {
    // Check cache first for SWR pattern
    const cached = cacheService.get<T>(key);
    if (cached !== null) {
      setData(cached);
      // Fetch fresh data in background
      fetchData(true);
    } else {
      // No cache, fetch immediately
      fetchData(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [key, fetchData]);

  // Revalidate on window focus
  useEffect(() => {
    if (!revalidateOnFocus) {
      return;
    }

    const handleFocus = () => {
      fetchData(true);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [revalidateOnFocus, fetchData]);

  // Revalidate on reconnect
  useEffect(() => {
    if (!revalidateOnReconnect) {
      return;
    }

    const handleOnline = () => {
      fetchData(true);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [revalidateOnReconnect, fetchData]);

  // Refresh interval
  useEffect(() => {
    if (refreshInterval <= 0) {
      return;
    }

    const interval = setInterval(() => {
      fetchData(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, fetchData]);

  // Mutate function
  const mutate = useCallback((
    data?: T | Promise<T> | ((data?: T) => T | Promise<T>),
    shouldRevalidate = true
  ) => {
    if (data === undefined) {
      // Revalidate
      fetchData(false);
      return;
    }

    if (typeof data === 'function') {
      // Update data with function
      setData((prev) => {
        const newData = (data as (data?: T) => T | Promise<T>)(prev || undefined);
        if (newData instanceof Promise) {
          newData.then((resolved) => {
            cacheService.set(key, resolved);
          });
        } else {
          cacheService.set(key, newData);
        }
        return newData instanceof Promise ? prev : newData;
      });
    } else if (data instanceof Promise) {
      // Async update
      data.then((resolved) => {
        setData(resolved);
        cacheService.set(key, resolved);
      });
    } else {
      // Direct update
      setData(data);
      cacheService.set(key, data);
    }

    if (shouldRevalidate) {
      fetchData(true);
    }
  }, [key, fetchData]);

  return {
    data,
    error,
    isLoading,
    isValidating,
    isError: error !== null,
    mutate,
  };
}

/**
 * Hook for prefetching SWR data
 */
export function useSWRPrefetch<T>(key: string, fetcher: () => Promise<T>): void {
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
 * Hook for mutating SWR cache
 */
export function useSWRMutate<T>(key: string): (
  data?: T | Promise<T> | ((data?: T) => T | Promise<T>),
  shouldRevalidate?: boolean
) => void {
  return useCallback((
    data?: T | Promise<T> | ((data?: T) => T | Promise<T>),
    shouldRevalidate = true
  ) => {
    if (data === undefined) {
      return;
    }

    if (typeof data === 'function') {
      const cached = cacheService.get<T>(key);
      const newData = (data as (data?: T) => T | Promise<T>)(cached || undefined);
      if (newData instanceof Promise) {
        newData.then((resolved) => {
          cacheService.set(key, resolved);
        });
      } else {
        cacheService.set(key, newData);
      }
    } else if (data instanceof Promise) {
      data.then((resolved) => {
        cacheService.set(key, resolved);
      });
    } else {
      cacheService.set(key, data);
    }
  }, [key]);
}
