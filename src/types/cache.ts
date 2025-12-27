/**
 * Cache entry with key, value, timestamp, and TTL
 */
export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
}

/**
 * Cache configuration with strategies
 */
export interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  strategies: CacheStrategy[];
}

/**
 * Available cache strategies
 */
export type CacheStrategy = 'memory' | 'swr' | 'http' | 'etag';

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

/**
 * Cache invalidation options
 */
export interface CacheInvalidationOptions {
  pattern?: string;
  tags?: string[];
  olderThan?: number;
}

/**
 * HTTP cache entry with ETag support
 */
export interface HttpCacheEntry<T = any> extends CacheEntry<T> {
  etag?: string;
  lastModified?: string;
  headers?: Record<string, string>;
}

/**
 * SWR cache options
 */
export interface SWROptions {
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  dedupingInterval?: number;
  refreshInterval?: number;
  errorRetryCount?: number;
  errorRetryInterval?: number;
}

/**
 * React Query cache options
 */
export interface QueryOptions {
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  refetchOnMount?: boolean;
  retry?: number;
  retryDelay?: number;
}
