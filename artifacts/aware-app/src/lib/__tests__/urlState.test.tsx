import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSyncedUrlState } from '../urlState';

// Mock wouter's useLocation
vi.mock('wouter', () => ({
  useLocation: vi.fn(() => ['/', vi.fn()]),
}));

describe('useSyncedUrlState', () => {
  beforeEach(() => {
    // Clear URL search params before each test
    const url = new URL(window.location.href);
    url.search = '';
    window.history.replaceState({}, '', url.toString());
    vi.clearAllMocks();
  });

  it('should use default value when param is absent', () => {
    const { result } = renderHook(() => useSyncedUrlState('testKey', 'defaultVal'));
    expect(result.current[0]).toBe('defaultVal');
  });

  it('should use initial value from URL param', () => {
    const url = new URL(window.location.href);
    url.searchParams.set('testKey', 'urlVal');
    window.history.replaceState({}, '', url.toString());

    const { result } = renderHook(() => useSyncedUrlState('testKey', 'defaultVal'));
    expect(result.current[0]).toBe('urlVal');
  });

  it('should parse JSON values from URL', () => {
    const url = new URL(window.location.href);
    url.searchParams.set('testKey', JSON.stringify({ a: 1 }));
    window.history.replaceState({}, '', url.toString());

    const { result } = renderHook(() => useSyncedUrlState<{ a: number }>('testKey', { a: 0 }));
    expect(result.current[0]).toEqual({ a: 1 });
  });

  it('should update syncs to URL', async () => {
    const { result } = renderHook(() => useSyncedUrlState('testKey', 'defaultVal'));

    await act(async () => {
      result.current[1]('newVal');
    });

    const params = new URLSearchParams(window.location.search);
    expect(params.get('testKey')).toBe('newVal');
    expect(result.current[0]).toBe('newVal');
  });

  it('should remove param from URL if set to default value', async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('testKey', 'urlVal');
    window.history.replaceState({}, '', url.toString());

    const { result } = renderHook(() => useSyncedUrlState('testKey', 'defaultVal'));

    await act(async () => {
      result.current[1]('defaultVal');
    });

    const params = new URLSearchParams(window.location.search);
    expect(params.has('testKey')).toBe(false);
  });

  it('should handle special characters correctly', async () => {
    const specialVal = 'val with spaces & symbols?';
    const { result } = renderHook(() => useSyncedUrlState('testKey', ''));

    await act(async () => {
      result.current[1](specialVal);
    });

    const params = new URLSearchParams(window.location.search);
    expect(params.get('testKey')).toBe(specialVal);
    
    // Check if it's actually encoded in the URL string
    expect(window.location.search).toContain('testKey=val+with+spaces+%26+symbols%3F');
  });

  it('should handle functional updates', async () => {
    const { result } = renderHook(() => useSyncedUrlState<number>('count', 0));

    await act(async () => {
      result.current[1]((prev: number) => prev + 1);
    });

    expect(result.current[0]).toBe(1);
    const params = new URLSearchParams(window.location.search);
    expect(params.get('count')).toBe('1');
  });
});
