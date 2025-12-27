/**
 * Unit tests for caching service
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CacheService, MemoryCache, HttpCache, createSWROptions, createQueryOptions } from './cache';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache({
      defaultTTL: 5000,
      maxSize: 5,
      strategies: ['memory'],
    });
  });

  afterEach(() => {
    cache.clear();
  });

  describe('get', () => {
    it('should return null for non-existent key', () => {
      const result = cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should return cached value', () => {
      cache.set('key1', 'value1');
      const result = cache.get<string>('key1');
      expect(result).toBe('value1');
    });

    it('should return null for expired entry', () => {
      cache.set('key1', 'value1', 100); // 100ms TTL
      // Wait for expiration
      return new Promise((resolve) => setTimeout(resolve, 150))
        .then(() => {
          const result = cache.get<string>('key1');
          expect(result).toBeNull();
        });
    });

    it('should update stats on miss', () => {
      cache.get('non-existent');
      const stats = cache.getStats();
      expect(stats.misses).toBe(1);
      expect(stats.hits).toBe(0);
    });

    it('should update stats on hit', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(0);
    });
  });

  describe('set', () => {
    it('should set value in cache', () => {
      cache.set('key1', 'value1');
      const result = cache.get<string>('key1');
      expect(result).toBe('value1');
    });

    it('should use default TTL if not provided', () => {
      cache.set('key1', 'value1');
      const result = cache.get<string>('key1');
      expect(result).not.toBeNull();
    });

    it('should use custom TTL if provided', () => {
      cache.set('key1', 'value1', 10000);
      const result = cache.get<string>('key1');
      expect(result).not.toBeNull();
    });

    it('should evict oldest entry when max size reached', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4');
      cache.set('key5', 'value5');
      cache.set('key6', 'value6'); // Should evict key1

      const result = cache.get<string>('key1');
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete entry from cache', () => {
      cache.set('key1', 'value1');
      const deleted = cache.delete('key1');
      expect(deleted).toBe(true);
      expect(cache.get('key1')).toBeNull();
    });

    it('should return false for non-existent key', () => {
      const deleted = cache.delete('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });

  describe('invalidate', () => {
    it('should invalidate entries by pattern', () => {
      cache.set('user:1', 'value1');
      cache.set('user:2', 'value2');
      cache.set('trainer:1', 'value3');
      
      cache.invalidate({ pattern: '^user:' });
      
      expect(cache.get('user:1')).toBeNull();
      expect(cache.get('user:2')).toBeNull();
      expect(cache.get('trainer:1')).not.toBeNull();
    });

    it('should invalidate entries older than specified time', () => {
      cache.set('key1', 'value1', 10000);
      cache.set('key2', 'value2', 10000);
      
      // Wait for key1 to expire
      return new Promise((resolve) => setTimeout(resolve, 150))
        .then(() => {
          cache.invalidate({ olderThan: 100 });
          
          expect(cache.get('key1')).toBeNull();
          expect(cache.get('key2')).not.toBeNull();
        });
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      cache.get('key2');
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.size).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });
  });
});

describe('HttpCache', () => {
  let cache: HttpCache;

  beforeEach(() => {
    cache = new HttpCache({
      defaultTTL: 5000,
      maxSize: 5,
      strategies: ['http'],
    });
  });

  afterEach(() => {
    cache.clear();
  });

  describe('get', () => {
    it('should return null for non-existent key', () => {
      const result = cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should return cached value with ETag', () => {
      cache.set('key1', 'value1', 'etag1', 'lastModified1');
      const result = cache.get('key1');
      expect(result).not.toBeNull();
      expect(result?.etag).toBe('etag1');
      expect(result?.lastModified).toBe('lastModified1');
    });

    it('should return null for expired entry', () => {
      cache.set('key1', 'value1', 'etag1', 'lastModified1', 100);
      
      return new Promise((resolve) => setTimeout(resolve, 150))
        .then(() => {
          const result = cache.get('key1');
          expect(result).toBeNull();
        });
    });
  });

  describe('set', () => {
    it('should set value with ETag', () => {
      cache.set('key1', 'value1', 'etag1', 'lastModified1');
      const result = cache.get('key1');
      expect(result?.value).toBe('value1');
      expect(result?.etag).toBe('etag1');
      expect(result?.lastModified).toBe('lastModified1');
    });

    it('should set value without ETag', () => {
      cache.set('key1', 'value1');
      const result = cache.get('key1');
      expect(result?.value).toBe('value1');
      expect(result?.etag).toBeUndefined();
    });
  });

  describe('isValid', () => {
    it('should return true for valid cache', () => {
      cache.set('key1', 'value1', 'etag1');
      const isValid = cache.isValid('key1', 'etag1');
      expect(isValid).toBe(true);
    });

    it('should return false for mismatched ETag', () => {
      cache.set('key1', 'value1', 'etag1');
      const isValid = cache.isValid('key1', 'etag2');
      expect(isValid).toBe(false);
    });

    it('should return false for expired cache', () => {
      cache.set('key1', 'value1', 'etag1', 'lastModified1', 100);
      
      return new Promise((resolve) => setTimeout(resolve, 150))
        .then(() => {
          const isValid = cache.isValid('key1', 'etag1');
          expect(isValid).toBe(false);
        });
    });
  });
});

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService({
      defaultTTL: 5000,
      maxSize: 5,
      strategies: ['memory', 'http'],
    });
  });

  afterEach(() => {
    cacheService.clear();
  });

  describe('getOrFetch', () => {
    it('should return cached value if available', async () => {
      cacheService.set('key1', 'cached-value');
      const fetcher = jest.fn().mockResolvedValue('fresh-value');
      
      const result = await cacheService.getOrFetch('key1', fetcher);
      
      expect(result).toBe('cached-value');
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should fetch and cache fresh value', async () => {
      const fetcher = jest.fn().mockResolvedValue('fresh-value');
      
      const result = await cacheService.getOrFetch('key1', fetcher);
      
      expect(result).toBe('fresh-value');
      expect(fetcher).toHaveBeenCalled();
      expect(cacheService.get('key1')).toBe('fresh-value');
    });
  });

  describe('prefetch', () => {
    it('should prefetch multiple keys', async () => {
      const fetcher = jest.fn()
        .mockResolvedValueOnce('value1')
        .mockResolvedValueOnce('value2')
        .mockResolvedValueOnce('value3');
      
      await cacheService.prefetch(['key1', 'key2', 'key3'], fetcher);
      
      expect(fetcher).toHaveBeenCalledTimes(3);
      expect(cacheService.get('key1')).toBe('value1');
      expect(cacheService.get('key2')).toBe('value2');
      expect(cacheService.get('key3')).toBe('value3');
    });

    it('should skip already cached keys', async () => {
      cacheService.set('key1', 'cached-value');
      const fetcher = jest.fn().mockResolvedValue('fresh-value');
      
      await cacheService.prefetch(['key1', 'key2'], fetcher);
      
      expect(fetcher).toHaveBeenCalledTimes(1); // Only key2
      expect(cacheService.get('key1')).toBe('cached-value');
    });
  });
});

describe('createSWROptions', () => {
  it('should create default SWR options', () => {
    const options = createSWROptions();
    
    expect(options.revalidateOnFocus).toBe(true);
    expect(options.revalidateOnReconnect).toBe(true);
    expect(options.dedupingInterval).toBe(2000);
    expect(options.refreshInterval).toBe(0);
    expect(options.errorRetryCount).toBe(3);
    expect(options.errorRetryInterval).toBe(5000);
  });

  it('should merge custom options', () => {
    const options = createSWROptions({
      refreshInterval: 10000,
      errorRetryCount: 5,
    });
    
    expect(options.revalidateOnFocus).toBe(true);
    expect(options.refreshInterval).toBe(10000);
    expect(options.errorRetryCount).toBe(5);
  });
});

describe('createQueryOptions', () => {
  it('should create default Query options', () => {
    const options = createQueryOptions();
    
    expect(options.staleTime).toBe(5 * 60 * 1000);
    expect(options.cacheTime).toBe(10 * 60 * 1000);
    expect(options.refetchOnWindowFocus).toBe(false);
    expect(options.refetchOnReconnect).toBe(true);
    expect(options.refetchOnMount).toBe(true);
    expect(options.retry).toBe(3);
    expect(options.retryDelay).toBe(1000);
  });

  it('should merge custom options', () => {
    const options = createQueryOptions({
      staleTime: 10000,
      retry: 5,
    });
    
    expect(options.staleTime).toBe(10000);
    expect(options.retry).toBe(5);
  });
});
