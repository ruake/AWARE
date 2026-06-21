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

export async function fetchJson<T>(path: string, options?: FetchJsonOptions<T>): Promise<T> {
  const { validate, timeoutMs = 15000 } = options ?? {};
  const url = dataUrl(path);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
    }
    const data: unknown = await res.json();
    if (validate !== undefined && !validate(data)) {
      throw new DataValidationError(url, "response did not match expected shape");
    }
    return data as T;
  } finally {
    clearTimeout(timeout);
  }
}

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

export function isArrayOf<T>(guard: (x: unknown) => x is T): (data: unknown) => data is T[] {
  return (data): data is T[] => Array.isArray(data) && data.every(guard);
}

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
