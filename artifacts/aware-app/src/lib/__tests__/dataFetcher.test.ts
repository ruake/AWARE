import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { dataUrl, fetchJson, fetchBlob, fetchImage } from "../dataFetcher";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("dataUrl", () => {
  const originalDev = import.meta.env.DEV;

  afterEach(() => {
    import.meta.env.DEV = originalDev;
  });

  it("returns dev URL when import.meta.env.DEV is true", () => {
    import.meta.env.DEV = true;
    import.meta.env.BASE_URL = "/";
    const url = dataUrl("runs.json");
    expect(url).toBe("/data/runs.json");
  });

  it("returns dev URL with non-root BASE_URL", () => {
    import.meta.env.DEV = true;
    import.meta.env.BASE_URL = "/AWARE/";
    const url = dataUrl("runs.json");
    expect(url).toBe("/AWARE/data/runs.json");
  });

  it("returns raw GitHub URL when import.meta.env.DEV is false", () => {
    import.meta.env.DEV = false;
    const url = dataUrl("runs.json");
    expect(url).toBe("https://raw.githubusercontent.com/ruake/AWARE/data/runs.json");
  });

  it("preserves path subdirectories", () => {
    import.meta.env.DEV = false;
    const url = dataUrl("subdir/test-results.json");
    expect(url).toBe("https://raw.githubusercontent.com/ruake/AWARE/data/subdir/test-results.json");
  });
});

describe("fetchJson", () => {
  it("fetches and parses JSON successfully", async () => {
    const data = { key: "value" };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(data),
    });

    const result = await fetchJson("test.json");
    expect(result).toEqual(data);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("test.json"),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("throws on non-ok response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    await expect(fetchJson("missing.json")).rejects.toThrow("Failed to fetch");
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

    const promise = fetchJson("slow.json", 100);
    vi.advanceTimersByTime(100);
    await expect(promise).rejects.toThrow();
    expect(abortSpy).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("clears timeout on success", async () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await fetchJson("test.json", 5000);
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
