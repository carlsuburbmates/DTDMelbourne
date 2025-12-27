/**
 * React HTTP cache hook
 * Integrates with cache service for HTTP caching with ETag support
 */

import { useState, useEffect, useCallback } from 'react';
import { cacheService } from '../services/cache';
import type { HttpCacheEntry } from '../types/cache';

interface UseHttpCacheResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  refetch: () => Promise<void>;
  etag?: string;
  lastModified?: string;
}

interface UseHttpCacheOptions {
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  headers?: Record<string, string>;
}

/**
 * Custom hook for HTTP caching with ETag support
 * Implements conditional requests with If-None-Match and If-Modified-Since headers
 */
export function useHttpCache<T>(
  key: string,
  fetcher: (headers?: Record<string, string>) => Promise<{ data: T; etag?: string; lastModified?: string }>,
  options?: UseHttpCacheOptions
): UseHttpCacheResult<T> {
  const {
    enabled = true,
    onSuccess,
    onError,
    headers: customHeaders,
  } = options || {};

  const [data, setData] = useState<T | null>(() => {
    // Initialize from HTTP cache if available
    const cached = cacheService.getHttp<T>(key);
    return cached?.value || null;
  });

  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [etag, setEtag] = useState<string | undefined>(() => {
    const cached = cacheService.getHttp<T>(key);
    return cached?.etag;
  });
  const [lastModified, setLastModified] = useState<string | undefined>(() => {
    const cached = cacheService.getHttp<T>(key);
    return cached?.lastModified;
  });

  const fetchData = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check HTTP cache first
      const cached = cacheService.getHttp<T>(key);

      // Build conditional request headers
      const requestHeaders: Record<string, string> = {
        ...customHeaders,
      };

      if (cached?.etag) {
        requestHeaders['If-None-Match'] = cached.etag;
      }

      if (cached?.lastModified) {
        requestHeaders['If-Modified-Since'] = cached.lastModified;
      }

      // Fetch data with conditional headers
      const response = await fetcher(requestHeaders);

      // Check if response is 304 Not Modified
      if (response.data === undefined && (response.etag || response.lastModified)) {
        // Use cached data
        if (cached) {
          setData(cached.value);
          setEtag(cached.etag);
          setLastModified(cached.lastModified);

          if (onSuccess) {
            onSuccess(cached.value);
          }
        }
      } else {
        // New data received
        setData(response.data);
        setEtag(response.etag);
        setLastModified(response.lastModified);

        // Cache the response
        cacheService.setHttp(
          key,
          response.data,
          response.etag,
          response.lastModified,
          customHeaders
        );

        if (onSuccess) {
          onSuccess(response.data);
        }
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
  }, [key, fetcher, enabled, onSuccess, onError, customHeaders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    // Force refetch by bypassing cache
    await fetchData();
  }, [fetchData]);

  return {
    data,
    error,
    isLoading,
    isError: error !== null,
    isSuccess: error === null && !isLoading,
    refetch,
    etag,
    lastModified,
  };
}

/**
 * Hook for checking if HTTP cache is valid
 */
export function useHttpCacheValid(key: string, etag?: string): boolean {
  const [isValid, setIsValid] = useState(() => {
    return cacheService.isHttpValid(key, etag);
  });

  useEffect(() => {
    const checkValidity = () => {
      setIsValid(cacheService.isHttpValid(key, etag));
    };

    checkValidity();

    // Check validity periodically
    const interval = setInterval(checkValidity, 60000); // Every minute

    return () => clearInterval(interval);
  }, [key, etag]);

  return isValid;
}

/**
 * Hook for prefetching HTTP cache
 */
export function useHttpPrefetch<T>(
  key: string,
  fetcher: (headers?: Record<string, string>) => Promise<{ data: T; etag?: string; lastModified?: string }>
): void {
  useEffect(() => {
    const prefetchData = async () => {
      const cached = cacheService.getHttp<T>(key);
      
      if (cached === null) {
        try {
          const response = await fetcher();
          cacheService.setHttp(
            key,
            response.data,
            response.etag,
            response.lastModified
          );
        } catch (error) {
          console.error(`Failed to prefetch ${key}:`, error);
        }
      }
    };

    prefetchData();
  }, [key, fetcher]);
}

/**
 * Hook for invalidating HTTP cache
 */
export function useInvalidateHttpCache(): (key: string) => void {
  return useCallback((key: string) => {
    cacheService.invalidate({ pattern: key });
  }, []);
}

/**
 * Hook for clearing HTTP cache
 */
export function useClearHttpCache(): () => void {
  return useCallback(() => {
    cacheService.clear();
  }, []);
}

/**
 * Hook for HTTP cache statistics
 */
export function useHttpCacheStats() {
  const [stats, setStats] = useState(() => cacheService.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(cacheService.getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return stats;
}
