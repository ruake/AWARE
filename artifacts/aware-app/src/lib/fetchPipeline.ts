import { logInfo, logError } from "./ai/debugLogger";
import { dataUrl } from "./dataFetcher";

export interface FetchRequest {
  path: string;
  timeoutMs: number;
  retries: number;
  cacheTTL: number;
  signal?: AbortSignal;
}

export interface FetchResponse<T = unknown> {
  data: T;
  fromCache: boolean;
  attempts: number;
  durationMs: number;
}

export type FetchHandler<T = unknown> = (
  req: FetchRequest,
) => Promise<FetchResponse<T>>;
export type FetchMiddleware<T = unknown> = (
  req: FetchRequest,
  next: FetchHandler<T>,
) => Promise<FetchResponse<T>>;

/**
 * Base handler that performs the actual fetch.
 */
async function baseFetchHandler<T>(req: FetchRequest): Promise<FetchResponse<T>> {
  const start = Date.now();
  const url = dataUrl(req.path);
  const controller = new AbortController();
  
  // If request has a signal, we want to abort if EITHER that signal or our timeout aborts.
  // AbortSignal.any is relatively new (ES2023), so we use a listener for compatibility if needed,
  // but since we are in a modern environment we'll try to keep it simple.
  if (req.signal) {
    if (req.signal.aborted) {
      throw req.signal.reason;
    }
    req.signal.addEventListener('abort', () => controller.abort(req.signal?.reason), { once: true });
  }

  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Request timed out after ${req.timeoutMs}ms`));
  }, req.timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (res.status === 404) {
      return {
        data: null as unknown as T,
        fromCache: false,
        attempts: 1,
        durationMs: Date.now() - start,
      };
    }
    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return {
      data: data as T,
      fromCache: false,
      attempts: 1,
      durationMs: Date.now() - start,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export function timeoutMiddleware<T>(defaultMs = 15000): FetchMiddleware<T> {
  return async (req, next) => {
    const timeoutMs = req.timeoutMs || defaultMs;
    return next({ ...req, timeoutMs });
  };
}

export function retryMiddleware<T>(
  maxAttempts = 2,
  baseDelayMs = 1000,
): FetchMiddleware<T> {
  return async (req, next) => {
    const attempts = req.retries || maxAttempts;
    let lastError: unknown;

    for (let i = 0; i <= attempts; i++) {
      try {
        const response = await next(req);
        return {
          ...response,
          attempts: i + 1,
        };
      } catch (err) {
        lastError = err;
        if (i < attempts) {
          const delay = baseDelayMs * Math.pow(2, i);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  };
}

const globalCache = new Map<string, { data: any; expires: number }>();

export function cacheMiddleware<T>(defaultTTLMs = 60000): FetchMiddleware<T> {
  return async (req, next) => {
    const ttl = req.cacheTTL !== undefined ? req.cacheTTL : defaultTTLMs;
    if (ttl <= 0) return next(req);

    const cached = globalCache.get(req.path);
    if (cached && cached.expires > Date.now()) {
      return {
        data: cached.data as T,
        fromCache: true,
        attempts: 1,
        durationMs: 0,
      };
    }

    const response = await next(req);
    globalCache.set(req.path, {
      data: response.data,
      expires: Date.now() + ttl,
    });
    return response;
  };
}

export function loggingMiddleware<T>(): FetchMiddleware<T> {
  return async (req, next) => {
    const start = Date.now();
    logInfo("FetchPipeline", `Request: ${req.path}`);
    try {
      const res = await next(req);
      logInfo(
        "FetchPipeline",
        `Success: ${req.path} (${Date.now() - start}ms, cache: ${res.fromCache})`,
      );
      return res;
    } catch (err) {
      logError("FetchPipeline", `Error: ${req.path}`, String(err));
      throw err;
    }
  };
}

export function composePipeline<T>(
  ...middlewares: FetchMiddleware<T>[]
): FetchHandler<T> {
  return (initialReq: FetchRequest) => {
    let index = -1;

    const dispatch = async (i: number, req: FetchRequest): Promise<FetchResponse<T>> => {
      if (i <= index) throw new Error("next() called multiple times");
      index = i;
      const middleware = middlewares[i];
      if (middleware) {
        return middleware(req, (r) => dispatch(i + 1, r));
      }
      return baseFetchHandler<T>(req);
    };

    return dispatch(0, initialReq);
  };
}

export const defaultPipeline = composePipeline<any>(
  loggingMiddleware(),
  timeoutMiddleware(15000),
  retryMiddleware(2),
  cacheMiddleware(60000),
);

export const freshPipeline = composePipeline<any>(
  loggingMiddleware(),
  timeoutMiddleware(15000),
  retryMiddleware(2),
);

export const fastPipeline = composePipeline<any>(
  timeoutMiddleware(5000),
  cacheMiddleware(300000),
);
