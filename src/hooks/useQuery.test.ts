/**
 * Unit tests for useQuery hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useQuery, usePrefetch, useInvalidateCache, useClearCache, useCacheStats } from './useQuery';

describe('useQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return cached data immediately', async () => {
    const fetcher = jest.fn().mockResolvedValue('fresh-data');
    
    const { result } = renderHook(() => useQuery('key1', fetcher));
    
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBe('fresh-data');
  });

  it('should handle fetch errors', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('Fetch failed'));
    
    const { result } = renderHook(() => useQuery('key1', fetcher));
    
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('should refetch data', async () => {
    const fetcher = jest.fn().mockResolvedValue('data1');
    
    const { result } = renderHook(() => useQuery('key1', fetcher));
    
    await waitFor(() => expect(result.current.data).toBe('data1'));
    
    fetcher.mockResolvedValue('data2');
    
    await act(async () => {
      await result.current.refetch();
    });
    
    expect(result.current.data).toBe('data2');
  });

  it('should respect enabled option', async () => {
    const fetcher = jest.fn().mockResolvedValue('data');
    
    const { result } = renderHook(() => useQuery('key1', fetcher, { enabled: false }));
    
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('should call onSuccess callback', async () => {
    const onSuccess = jest.fn();
    const fetcher = jest.fn().mockResolvedValue('data');
    
    renderHook(() => useQuery('key1', fetcher, { onSuccess }));
    
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('data'));
  });

  it('should call onError callback', async () => {
    const onError = jest.fn();
    const fetcher = jest.fn().mockRejectedValue(new Error('Error'));
    
    renderHook(() => useQuery('key1', fetcher, { onError }));
    
    await waitFor(() => expect(onError).toHaveBeenCalled());
  });
});

describe('usePrefetch', () => {
  it('should prefetch data', async () => {
    const fetcher = jest.fn().mockResolvedValue('data');
    
    renderHook(() => usePrefetch('key1', fetcher));
    
    await waitFor(() => expect(fetcher).toHaveBeenCalled());
  });

  it('should skip already cached data', async () => {
    const fetcher = jest.fn().mockResolvedValue('data');
    
    // Pre-populate cache
    const { cacheService } = require('../services/cache');
    cacheService.set('key1', 'cached-data');
    
    renderHook(() => usePrefetch('key1', fetcher));
    
    await waitFor(() => expect(fetcher).not.toHaveBeenCalled());
  });
});

describe('useInvalidateCache', () => {
  it('should invalidate cache by pattern', () => {
    const { result } = renderHook(() => useInvalidateCache());
    
    act(() => {
      result.current('user:*');
    });
    
    const { cacheService } = require('../services/cache');
    const stats = cacheService.getStats();
    expect(stats.size).toBe(0);
  });
});

describe('useClearCache', () => {
  it('should clear all cache', () => {
    const { result } = renderHook(() => useClearCache());
    
    act(() => {
      result.current();
    });
    
    const { cacheService } = require('../services/cache');
    const stats = cacheService.getStats();
    expect(stats.size).toBe(0);
  });
});

describe('useCacheStats', () => {
  it('should return cache statistics', () => {
    const { result } = renderHook(() => useCacheStats());
    
    expect(result.current).toHaveProperty('hits');
    expect(result.current).toHaveProperty('misses');
    expect(result.current).toHaveProperty('size');
    expect(result.current).toHaveProperty('hitRate');
  });
});
