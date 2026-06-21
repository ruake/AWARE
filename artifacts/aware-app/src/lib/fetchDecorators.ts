import { dataUrl } from "./dataFetcher";

// Types
export type Fetcher<T> = (path: string) => Promise<T>;

/**
 * Base fetcher that just fetches and returns JSON.
 * It uses the dataUrl helper to resolve the path.
 */
export async function baseFetch<T>(path: string): Promise<T> {
  const url = dataUrl(path);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// Decorators — each wraps a fetcher and returns a new fetcher

/**
 * Adds a timeout to a fetcher.
 */
export function withTimeout<T>(ms: number): (f: Fetcher<T>) => Fetcher<T> {
  return (f: Fetcher<T>) => async (path: string) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    try {
      // Note: This assumes the underlying fetcher respects some global signal or we just race it.
      // But a true decorator for fetch would pass the signal.
      // Since our Fetcher type doesn't include a signal, we have to race it or use a trick.
      // However, the instructions say Fetcher<T> = (path: string) => Promise<T>.
      // To truly timeout the fetch, the fetch call itself needs the signal.
      // If we can't change the Fetcher signature, we have to race the promise.
      
      const promise = f(path);
      const timeoutPromise = new Promise<never>((_, reject) => {
        controller.signal.addEventListener("abort", () => {
          reject(new Error(`Request timed out after ${ms}ms`));
        });
      });

      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(id);
    }
  };
}

/**
 * Adds retry logic to a fetcher.
 */
export function withRetry<T>(maxAttempts: number, baseDelayMs = 1000): (f: Fetcher<T>) => Fetcher<T> {
  return (f: Fetcher<T>) => async (path: string) => {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await f(path);
      } catch (err) {
        lastError = err;
        if (attempt < maxAttempts) {
          const delay = baseDelayMs * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  };
}

/**
 * Adds an in-memory cache to a fetcher.
 */
export function withCache<T>(ttlMs: number): (f: Fetcher<T>) => Fetcher<T> {
  const cache = new Map<string, { data: T; expires: number }>();
  
  return (f: Fetcher<T>) => async (path: string) => {
    const now = Date.now();
    const cached = cache.get(path);
    
    if (cached && cached.expires > now) {
      return cached.data;
    }
    
    const data = await f(path);
    cache.set(path, { data, expires: now + ttlMs });
    return data;
  };
}

// Pre-composed pipelines
export const cachedJsonFetch: Fetcher<unknown> = withCache(60_000)(
  withRetry(2)(
    withTimeout(15_000)(baseFetch)
  )
);

export const freshJsonFetch: Fetcher<unknown> = withRetry(2)(
  withTimeout(15_000)(baseFetch)
);
