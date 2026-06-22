import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { dataUrl, fetchJson, fetchBlob, fetchImage, DataValidationError, clearFetchCache } from "../dataFetcher";

beforeEach(() => {
  vi.restoreAllMocks();
  clearFetchCache();
});

describe("dataUrl", () => {
  const originalEnv = { ...import.meta.env };

  afterEach(() => {
    // Note: import.meta.env is often immutable in some test environments, 
    // but vitest stubEnv should work for dataUrl which reads from it.
    vi.unstubAllEnvs();
  });

  it("returns static URL by default (dev base)", () => {
    vi.stubEnv('BASE_URL', '/');
    vi.stubEnv('VITE_DATA_SOURCE', 'static');
    const url = dataUrl("runs.json");
    expect(url).toBe("/data/runs.json");
  });

  it("returns static URL with non-root BASE_URL", () => {
    vi.stubEnv('BASE_URL', '/AWARE/');
    vi.stubEnv('VITE_DATA_SOURCE', 'static');
    const url = dataUrl("runs.json");
    expect(url).toBe("/AWARE/data/runs.json");
  });

  it("returns raw GitHub URL when VITE_DATA_SOURCE is raw", () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'raw');
    vi.stubEnv('VITE_DATA_REPO_OWNER', 'ruake');
    vi.stubEnv('VITE_DATA_REPO_NAME', 'AWARE');
    vi.stubEnv('VITE_DATA_BRANCH', 'data');
    const url = dataUrl("runs.json");
    expect(url).toBe("https://raw.githubusercontent.com/ruake/AWARE/data/runs.json");
  });

  it("preserves path subdirectories", () => {
    vi.stubEnv('VITE_DATA_SOURCE', 'raw');
    const url = dataUrl("subdir/test-results.json");
    expect(url).toBe("https://raw.githubusercontent.com/ruake/AWARE/data/subdir/test-results.json");
  });
});

describe("fetchJson", () => {
  it("fetches and parses JSON successfully", async () => {
    const data = { key: "value" };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve(data),
    });

    const result = await fetchJson("test.json");
    expect(result).toEqual(data);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("test.json"),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("returns null on 404", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    const result = await fetchJson("missing.json");
    expect(result).toBeNull();
  });

  it("throws on non-ok response other than 404", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(fetchJson("error.json")).rejects.toThrow("Failed to fetch");
  });

  it("returns null if content-type is HTML (SPA fallback)", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'text/html' }),
      json: () => Promise.resolve({}),
    });

    const result = await fetchJson("page.html");
    expect(result).toBeNull();
  });

  it("throws DataValidationError if validation fails", async () => {
    const mockData = { id: 123 };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue(mockData),
    });

    const validate = (data: any): data is { name: string } => typeof (data as any).name === 'string';
    
    await expect(fetchJson('invalid.json', { validate })).rejects.toThrow(DataValidationError);
  });

  it("aborts on timeout", async () => {
    vi.useFakeTimers();
    const abortSpy = vi.fn();
    
    globalThis.fetch = vi.fn().mockImplementation((_url, options) => {
      options.signal.addEventListener("abort", abortSpy);
      return new Promise((_, reject) => {
        options.signal.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });

    const promise = fetchJson("slow.json", { timeoutMs: 100 });
    
    // Use vi.advanceTimersByTime and then await the promise
    vi.advanceTimersByTime(150);
    
    await expect(promise).rejects.toThrow();
    expect(abortSpy).toHaveBeenCalled();
    
    vi.useRealTimers();
  });

  it("clears timeout on success", async () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({}),
    });

    await fetchJson("test.json", { timeoutMs: 5000 });
    expect(clearTimeoutSpy).toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe("fetchBlob", () => {
  it("fetches and returns a blob", async () => {
    const blob = new Blob(["test"]);
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(blob),
    });

    const result = await fetchBlob("test.bin");
    expect(result).toBe(blob);
  });

  it("throws on non-ok response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(fetchBlob("error.bin")).rejects.toThrow("Failed to fetch");
  });
});

describe("fetchImage", () => {
  it("returns data URIs as-is", async () => {
    const result = await fetchImage("data:image/png;base64,abc");
    expect(result).toBe("data:image/png;base64,abc");
  });

  it("returns http URLs as-is", async () => {
    const result = await fetchImage("https://example.com/image.png");
    expect(result).toBe("https://example.com/image.png");
  });

  it("fetches relative image paths and creates object URLs", async () => {
    const blob = new Blob(["fake-image"]);
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(blob),
    });
    const createObjectURL = vi.fn().mockReturnValue("blob:image-url");
    URL.createObjectURL = createObjectURL;

    const result = await fetchImage("screenshots/test.png");
    expect(result).toBe("blob:image-url");
    expect(createObjectURL).toHaveBeenCalledWith(blob);
  });

  it("throws on non-ok response for image fetch", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
    });

    await expect(fetchImage("screenshots/test.png")).rejects.toThrow("Failed to fetch");
  });
});
