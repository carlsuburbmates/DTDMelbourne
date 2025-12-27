/**
 * Unit tests for useSWR hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSWR, useSWRPrefetch, useSWRMutate } from './useSWR';

describe('useSWR', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return cached data immediately', async () => {
    const fetcher = jest.fn().mockResolvedValue('fresh-data');
    
    const { result } = renderHook(() => useSWR('key1', fetcher));
    
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBe('fresh-data');
  });

  it('should handle fetch errors', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('Fetch failed'));
    
    const { result } = renderHook(() => useSWR('key1', fetcher));
    
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('should revalidate on window focus', async () => {
    const fetcher = jest.fn().mockResolvedValue('data1');
    
    const { result } = renderHook(() => useSWR('key1', fetcher, { revalidateOnFocus: true }));
    
    await waitFor(() => expect(result.current.data).toBe('data1'));
    
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  });

  it('should revalidate on reconnect', async () => {
    const fetcher = jest.fn().mockResolvedValue('data1');
    
    const { result } = renderHook(() => useSWR('key1', fetcher, { revalidateOnReconnect: true }));
    
    await waitFor(() => expect(result.current.data).toBe('data1'));
    
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  });

  it('should mutate data', async () => {
    const fetcher = jest.fn().mockResolvedValue('data1');
    
    const { result } = renderHook(() => useSWR('key1', fetcher));
    
    await waitFor(() => expect(result.current.data).toBe('data1'));
    
    act(() => {
      result.current.mutate('data2');
    });
    
    expect(result.current.data).toBe('data2');
  });

  it('should call onSuccess callback', async () => {
    const onSuccess = jest.fn();
    const fetcher = jest.fn().mockResolvedValue('data');
    
    renderHook(() => useSWR('key1', fetcher, { onSuccess }));
    
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith('data'));
  });

  it('should call onError callback', async () => {
    const onError = jest.fn();
    const fetcher = jest.fn().mockRejectedValue(new Error('Error'));
    
    renderHook(() => useSWR('key1', fetcher, { onError }));
    
    await waitFor(() => expect(onError).toHaveBeenCalled());
  });
});

describe('useSWRPrefetch', () => {
  it('should prefetch data', async () => {
    const fetcher = jest.fn().mockResolvedValue('data');
    
    renderHook(() => useSWRPrefetch('key1', fetcher));
    
    await waitFor(() => expect(fetcher).toHaveBeenCalled());
  });

  it('should skip already cached data', async () => {
    const fetcher = jest.fn().mockResolvedValue('data');
    
    // Pre-populate cache
    const { cacheService } = require('../services/cache');
    cacheService.set('key1', 'cached-data');
    
    renderHook(() => useSWRPrefetch('key1', fetcher));
    
    await waitFor(() => expect(fetcher).not.toHaveBeenCalled());
  });
});

describe('useSWRMutate', () => {
  it('should mutate cache', () => {
    const { result } = renderHook(() => useSWRMutate('key1'));
    
    act(() => {
      result.current('new-data');
    });
    
    const { cacheService } = require('../services/cache');
    expect(cacheService.get('key1')).toBe('new-data');
  });

  it('should mutate with function', () => {
    const { result } = renderHook(() => useSWRMutate('key1'));
    
    act(() => {
      result.current((data) => data ? 'updated' : 'new');
    });
    
    const { cacheService } = require('../services/cache');
    expect(cacheService.get('key1')).toBe('updated');
  });
});
