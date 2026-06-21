import { describe, it, expect } from 'vitest';
import { LRUCache, memoize, memoizeWithTTL } from '../memo';

describe('LRUCache', () => {
  it('should store and retrieve values', () => {
    const cache = new LRUCache<string, number>(2);
    cache.set('a', 1);
    expect(cache.get('a')).toBe(1);
  });

  it('should evict least recently used items', () => {
    const cache = new LRUCache<string, number>(2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a'); // Mark 'a' as recently used
    cache.set('c', 3); // Should evict 'b'

    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('c')).toBe(3);
  });

  it('should delete items', () => {
    const cache = new LRUCache<string, number>(2);
    cache.set('a', 1);
    cache.delete('a');
    expect(cache.get('a')).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it('should clear all items', () => {
    const cache = new LRUCache<string, number>(2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.size).toBe(0);
  });
});

describe('memoize', () => {
  it('should cache results', () => {
    let calls = 0;
    const fn = (x: number) => {
      calls++;
      return x * 2;
    };
    const memoized = memoize(fn, (x) => String(x));

    expect(memoized(2)).toBe(4);
    expect(memoized(2)).toBe(4);
    expect(calls).toBe(1);
  });

  it('should clear cache', () => {
    let calls = 0;
    const fn = (x: number) => {
      calls++;
      return x * 2;
    };
    const memoized = memoize(fn, (x) => String(x));

    memoized(2);
    memoized.clear();
    memoized(2);
    expect(calls).toBe(2);
  });
});

describe('memoizeWithTTL', () => {
  it('should expire entries after TTL', async () => {
    let calls = 0;
    const fn = (x: number) => {
      calls++;
      return x * 2;
    };
    // Mock Date.now()
    let now = 1000;
    const originalNow = Date.now;
    Date.now = () => now;

    try {
      const memoized = memoizeWithTTL(fn, (x) => String(x), 500);

      expect(memoized(2)).toBe(4);
      expect(calls).toBe(1);

      now += 100;
      expect(memoized(2)).toBe(4);
      expect(calls).toBe(1);

      now += 500; // Expired
      expect(memoized(2)).toBe(4);
      expect(calls).toBe(2);
    } finally {
      Date.now = originalNow;
    }
  });
});
