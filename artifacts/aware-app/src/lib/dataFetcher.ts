import { TimeoutError, FetchError } from "./types";
import type { Run } from "./types";

// Static data URL — always resolves relative to the app's base URL.
// The data/ directory is committed under public/ and co-deployed with the SPA,
// so this works identically in dev (localhost) and in production (GitHub Pages).
//
// If you want to pull live data from a separate GitHub branch instead, set:
//   VITE_DATA_SOURCE=raw
//   VITE_DATA_REPO_OWNER, VITE_DATA_REPO_NAME, VITE_DATA_BRANCH
function staticUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/data/${path}`;
}

function rawUrl(path: string): string {
  const owner = import.meta.env.VITE_DATA_REPO_OWNER ?? "ruake";
  const repo = import.meta.env.VITE_DATA_REPO_NAME ?? "AWARE";
  const branch = import.meta.env.VITE_DATA_BRANCH ?? "data";
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

/**
 * @description Returns the absolute URL for a data file based on the configured data source.
 * @param path - The relative path to the data file.
 * @returns The absolute data URL.
 */
export function dataUrl(path: string): string {
  // Use raw GitHub content only when explicitly opted in.
  // Default (and correct for GitHub Pages) is to use the co-deployed static files.
  if (import.meta.env.VITE_DATA_SOURCE === "raw") {
    return rawUrl(path);
  }
  return staticUrl(path);
}

export interface FetchJsonOptions<T> {
  /** Optional runtime shape validator. Throws DataValidationError on failure. */
  validate?: (data: unknown) => data is T;
  timeoutMs?: number;
  /** Optional number of retries on network error. */
  retries?: number;
}

export class DataValidationError extends Error {
  constructor(
    public readonly url: string,
    message: string,
  ) {
    super(`DataValidationError at ${url}: ${message}`);
    this.name = "DataValidationError";
  }
}

const _fetchCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60000; // 60 seconds

/** Clears the in-memory SWR fetch cache. Exported for test isolation only. */
export function clearFetchCache(): void {
  _fetchCache.clear();
}

/**
 * @description Fetches JSON data from a given path with optional validation, timeout, and retry logic.
 * Uses a stale-while-revalidate caching strategy.
 * @param path - The relative path to the JSON file.
 * @param options - Fetch options including validator, timeout, and retries.
 * @returns The parsed JSON data of type T, or null if not found.
 */
export async function fetchJson<T>(path: string, options?: FetchJsonOptions<T>): Promise<T | null> {
  const { validate: _validate, timeoutMs: _timeoutMs, retries: _retries } = options ?? {};
  const url = dataUrl(path);

  const cached = _fetchCache.get(url);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    // Return cached value and revalidate in background
    _revalidate(url, options);
    return cached.data as T;
  }

  return _doFetch<T>(url, options);
}

async function _revalidate<T>(url: string, options?: FetchJsonOptions<T>): Promise<void> {
  try {
    await _doFetch<T>(url, options);
  } catch {
    // Background revalidation failures are swallowed to avoid disrupting the UI
  }
}

async function _doFetch<T>(url: string, options?: FetchJsonOptions<T>, attempt: number = 0): Promise<T | null> {
  const { validate, timeoutMs = 15000, retries = 0 } = options ?? {};
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      throw new FetchError(`Failed to fetch ${url}: ${res.status} ${res.statusText}`, res.status, url);
    }
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("json") && !ct.includes("text/plain")) {
      return null;
    }
    const data: unknown = await res.json();
    if (validate !== undefined && !validate(data)) {
      throw new DataValidationError(url, "response did not match expected shape");
    }

    _fetchCache.set(url, { data, timestamp: Date.now() });
    return data as T;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError" && !controller.signal.aborted) {
      // This is a weird edge case, but if it's a real timeout we want TimeoutError
    }
    
    const isTimeout = err instanceof Error && err.name === "AbortError";
    const isNetworkError = isTimeout || (err instanceof Error && err.message.toLowerCase().includes("network"));
    const isRetriable = isNetworkError && attempt < retries;

    if (isRetriable) {
      const delay = 100 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return _doFetch<T>(url, options, attempt + 1);
    }
    
    if (isTimeout) {
      throw new TimeoutError(url, timeoutMs);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * @description Fetches a binary blob from a given path.
 * @param path - The relative path to the file.
 * @returns A promise resolving to the Blob.
 */
export async function fetchBlob(path: string): Promise<Blob> {
  const url = dataUrl(path);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
    }
    return res.blob();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * @description Fetches an image and returns a blob URL for local display.
 * @param src - The image source path or URL.
 * @param timeoutMs - Request timeout in milliseconds.
 * @returns A promise resolving to the local blob URL.
 */
export async function fetchImage(src: string, timeoutMs = 15000): Promise<string> {
  if (src.startsWith("data:") || src.startsWith("http")) return src;
  const url = dataUrl(src);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
    }
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } finally {
    clearTimeout(timeout);
  }
}

// ── Type guards for core data shapes ─────────────────────────────────

/**
 * @description Higher-order function that creates an array validator for a given type guard.
 * @param guard - The type guard for an individual item.
 * @returns A type guard for an array of items.
 */
export function isArrayOf<T>(guard: (x: unknown) => x is T): (data: unknown) => data is T[] {
  return (data): data is T[] => Array.isArray(data) && data.every(guard);
}

/**
 * @description Type guard to verify if an unknown object is an array of Run objects.
 * @param data - The data to validate.
 * @returns True if data is an array of Run objects.
 */
export function isRunArray(data: unknown): data is Run[] {
  if (!Array.isArray(data)) return false;
  return data.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as Record<string, unknown>).id === "string" &&
      typeof (item as Record<string, unknown>).started === "string",
  );
}
