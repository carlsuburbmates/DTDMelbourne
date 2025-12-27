/**
 * Unified caching service supporting multiple strategies
 * Implements memory cache, React Query integration, SWR integration, and HTTP cache with ETag support
 */

import type {
  CacheEntry,
  CacheConfig,
  CacheStats,
  CacheInvalidationOptions,
  HttpCacheEntry,
  SWROptions,
  QueryOptions,
} from '../types/cache';

/**
 * Memory cache implementation
 */
class MemoryCache {
  private cache: Map<string, CacheEntry>;
  private stats: CacheStats;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0, size: 0, hitRate: 0 };
    this.config = config;
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.size = this.cache.size;
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    this.stats.hits++;
    this.updateHitRate();
    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
    };

    // Enforce max size
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, entry);
    this.stats.size = this.cache.size;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    this.stats.size = this.cache.size;
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  /**
   * Invalidate cache entries based on options
   */
  invalidate(options: CacheInvalidationOptions): void {
    const { pattern, tags, olderThan } = options;

    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    }

    if (olderThan) {
      const cutoff = Date.now() - olderThan;
      for (const [key, entry] of this.cache.entries()) {
        if (entry.timestamp < cutoff) {
          this.cache.delete(key);
        }
      }
    }

    this.stats.size = this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Evict oldest entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

/**
 * HTTP cache with ETag support
 */
class HttpCache {
  private cache: Map<string, HttpCacheEntry>;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.cache = new Map();
    this.config = config;
  }

  /**
   * Get cached response with ETag
   */
  get<T>(key: string): HttpCacheEntry<T> | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry as HttpCacheEntry<T>;
  }

  /**
   * Set cached response with ETag
   */
  set<T>(key: string, value: T, etag?: string, lastModified?: string, headers?: Record<string, string>): void {
    const entry: HttpCacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl: this.config.defaultTTL,
      etag,
      lastModified,
      headers,
    };

    this.cache.set(key, entry);
  }

  /**
   * Check if cached response is still valid
   */
  isValid(key: string, etag?: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (etag && entry.etag !== etag) {
      return false;
    }

    return Date.now() - entry.timestamp <= entry.ttl;
  }

  /**
   * Clear HTTP cache
   */
  clear(): void {
    this.cache.clear();
  }
}

/**
 * Unified caching service
 */
class CacheService {
  private memoryCache: MemoryCache;
  private httpCache: HttpCache;
  private config: CacheConfig;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 100,
      strategies: ['memory', 'http'],
      ...config,
    };

    this.memoryCache = new MemoryCache(this.config);
    this.httpCache = new HttpCache(this.config);
  }

  /**
   * Get value from memory cache
   */
  get<T>(key: string): T | null {
    return this.memoryCache.get<T>(key);
  }

  /**
   * Set value in memory cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    this.memoryCache.set(key, value, ttl);
  }

  /**
   * Delete entry from memory cache
   */
  delete(key: string): boolean {
    return this.memoryCache.delete(key);
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.memoryCache.clear();
    this.httpCache.clear();
  }

  /**
   * Invalidate cache entries
   */
  invalidate(options: CacheInvalidationOptions): void {
    this.memoryCache.invalidate(options);
  }

  /**
   * Get HTTP cached response
   */
  getHttp<T>(key: string): HttpCacheEntry<T> | null {
    return this.httpCache.get<T>(key);
  }

  /**
   * Set HTTP cached response
   */
  setHttp<T>(key: string, value: T, etag?: string, lastModified?: string, headers?: Record<string, string>): void {
    this.httpCache.set(key, value, etag, lastModified, headers);
  }

  /**
   * Check if HTTP cache is valid
   */
  isHttpValid(key: string, etag?: string): boolean {
    return this.httpCache.isValid(key, etag);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return this.memoryCache.getStats();
  }

  /**
   * Get or fetch pattern with caching
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Prefetch multiple keys
   */
  async prefetch<T>(keys: string[], fetcher: (key: string) => Promise<T>): Promise<void> {
    await Promise.all(
      keys.map(async (key) => {
        const cached = this.get<T>(key);
        if (cached === null) {
          const value = await fetcher(key);
          this.set(key, value);
        }
      })
    );
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Export classes for testing
export { MemoryCache, HttpCache, CacheService };

// Export SWR options helper
export const createSWROptions = (options?: Partial<SWROptions>): SWROptions => ({
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  refreshInterval: 0,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  ...options,
});

// Export Query options helper
export const createQueryOptions = (options?: Partial<QueryOptions>): QueryOptions => ({
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  refetchOnMount: true,
  retry: 3,
  retryDelay: 1000,
  ...options,
});
