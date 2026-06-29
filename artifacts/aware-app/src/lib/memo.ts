// Simple LRU cache (max 128 entries)
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 128) {
    this.cache = new Map<K, V>();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Refresh existence by deleting and re-inserting
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict least recently used (the first one in the map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// Memoize decorator with explicit cache key function and LRU eviction
export function memoize<Args extends unknown[], R>(
  fn: (...args: Args) => R,
  keyFn: (...args: Args) => string,
  maxSize: number = 128
): ((...args: Args) => R) & { clear: () => void } {
  const cache: LRUCache<string, R> = new LRUCache<string, R>(maxSize);

  const memoized = (...args: Args): R => {
    const key: string = keyFn(...args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result: R = fn(...args);
    cache.set(key, result);
    return result;
  };

  memoized.clear = (): void => cache.clear();

  return memoized as ((...args: Args) => R) & { clear: () => void };
}

// Memoize with TTL (time-to-live)
export function memoizeWithTTL<Args extends unknown[], R>(
  fn: (...args: Args) => R,
  keyFn: (...args: Args) => string,
  ttlMs: number,
  maxSize: number = 128
): ((...args: Args) => R) & { clear: () => void } {
  const cache: LRUCache<string, { value: R; expires: number }> = new LRUCache<string, { value: R; expires: number }>(maxSize);

  const memoized = (...args: Args): R => {
    const key: string = keyFn(...args);
    const now: number = Date.now();
    const cached = cache.get(key);

    if (cached && cached.expires > now) {
      return cached.value;
    }

    const result: R = fn(...args);
    cache.set(key, { value: result, expires: now + ttlMs });
    return result;
  };

  memoized.clear = (): void => cache.clear();

  return memoized as ((...args: Args) => R) & { clear: () => void };
}
