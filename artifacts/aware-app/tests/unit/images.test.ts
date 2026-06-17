import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getImageSource,
  isExternalImage,
  preloadImage,
  revokeImage,
  revokeAllImages,
} from "@/lib/images";

const makeFrame = (dataUri: string, imageUrl?: string) => ({ dataUri, imageUrl });

describe("getImageSource", () => {
  it("returns imageUrl when present", () => {
    const frame = makeFrame("data:image/png;base64,abc", "https://cdn.example.com/img.png");
    expect(getImageSource(frame)).toBe("https://cdn.example.com/img.png");
  });

  it("returns dataUri when imageUrl is absent", () => {
    const frame = makeFrame("data:image/png;base64,abc");
    expect(getImageSource(frame)).toBe("data:image/png;base64,abc");
  });

  it("returns imageUrl over dataUri even when dataUri is a valid data URI", () => {
    const frame = makeFrame("data:image/jpeg;base64,xyz", "https://example.com/photo.jpg");
    expect(getImageSource(frame)).toBe("https://example.com/photo.jpg");
  });
});

describe("isExternalImage", () => {
  it("returns true when imageUrl is set", () => {
    expect(isExternalImage(makeFrame("data:image/png;base64,a", "https://x.com/a.png"))).toBe(true);
  });

  it("returns false when imageUrl is absent", () => {
    expect(isExternalImage(makeFrame("data:image/png;base64,a"))).toBe(false);
  });

  it("returns false when imageUrl is empty string", () => {
    expect(isExternalImage(makeFrame("data:image/png;base64,a", ""))).toBe(false);
  });
});

describe("preloadImage", () => {
  const fakeBlob = new Blob(["img"], { type: "image/png" });
  const fakeBlobUrl = "blob:http://localhost/fake-uuid";

  beforeEach(() => {
    revokeAllImages();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(fakeBlob) }));
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => fakeBlobUrl),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    revokeAllImages();
  });

  it("returns data: URL as-is without fetching", async () => {
    const src = "data:image/png;base64,abc";
    const result = await preloadImage(src);
    expect(result).toBe(src);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns blob: URL as-is without fetching", async () => {
    const src = "blob:http://localhost/existing";
    const result = await preloadImage(src);
    expect(result).toBe(src);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fetches an external URL and returns a blob URL", async () => {
    const src = "https://cdn.example.com/screenshot.png";
    const result = await preloadImage(src);
    expect(fetch).toHaveBeenCalledWith(src);
    expect(result).toBe(fakeBlobUrl);
  });

  it("caches the result — second call does not fetch again", async () => {
    const src = "https://cdn.example.com/cached.png";
    await preloadImage(src);
    await preloadImage(src);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("throws when fetch fails with non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, statusText: "Not Found" }));
    await expect(preloadImage("https://cdn.example.com/broken.png")).rejects.toThrow();
  });

  it("throws when fetch rejects (network error)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
    await expect(preloadImage("https://cdn.example.com/network-error.png")).rejects.toThrow("Network error");
  });
});

describe("revokeImage", () => {
  const fakeBlobUrl = "blob:http://localhost/revoke-me";

  beforeEach(() => {
    revokeAllImages();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(new Blob(["x"])) }));
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => fakeBlobUrl),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    revokeAllImages();
  });

  it("revokes a cached blob URL and removes from cache", async () => {
    const src = "https://example.com/img.png";
    await preloadImage(src);
    revokeImage(src);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(fakeBlobUrl);
    const secondFetch = vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(new Blob(["x"])) });
    vi.stubGlobal("fetch", secondFetch);
    await preloadImage(src);
    expect(secondFetch).toHaveBeenCalledTimes(1);
  });

  it("is a no-op for an unknown src", () => {
    expect(() => revokeImage("https://example.com/not-cached.png")).not.toThrow();
  });
});

describe("revokeAllImages", () => {
  const fakeBlobUrl = "blob:http://localhost/all-revoke";

  beforeEach(() => {
    revokeAllImages();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(new Blob(["x"])) }));
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => fakeBlobUrl),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    revokeAllImages();
  });

  it("revokes all cached blob URLs", async () => {
    await preloadImage("https://example.com/a.png");
    await preloadImage("https://example.com/b.png");
    revokeAllImages();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it("empties the cache so subsequent calls fetch again", async () => {
    const src = "https://example.com/c.png";
    await preloadImage(src);
    revokeAllImages();
    const freshFetch = vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(new Blob(["x"])) });
    vi.stubGlobal("fetch", freshFetch);
    await preloadImage(src);
    expect(freshFetch).toHaveBeenCalledTimes(1);
  });

  it("does not throw when cache is already empty", () => {
    expect(() => revokeAllImages()).not.toThrow();
  });
});
