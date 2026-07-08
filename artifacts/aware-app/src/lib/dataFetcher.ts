const DEV_BASE = '/data/';
const PROD_BASE = 'https://raw.githubusercontent.com/ruake/AWARE/data/';

const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 60_000;

function isDev(): boolean {
  return import.meta.env.DEV || window.location.hostname === 'localhost';
}

function dataBase(): string {
  return isDev() ? DEV_BASE : PROD_BASE;
}

async function fetchWithRetry(url: string, signal: AbortSignal, retries = 2): Promise<Response> {
  const delays = [200, 500];
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      if (attempt === retries || signal.aborted) throw err;
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        await new Promise(r => setTimeout(r, delays[attempt]));
        continue;
      }
      throw err;
    }
  }
  throw new Error('fetchWithRetry exhausted');
}

export async function fetchJson<T>(path: string): Promise<T> {
  const url = `${dataBase()}${path.replace(/^\//, '')}`;

  const cached = cache.get(url);
  if (cached && Date.now() < cached.expiry) {
    return cached.data as T;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetchWithRetry(url, controller.signal);
    const data = await res.json() as T;
    cache.set(url, { data, expiry: Date.now() + CACHE_TTL });
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export function clearCache(): void {
  cache.clear();
}
