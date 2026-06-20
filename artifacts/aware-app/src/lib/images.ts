// Simple LRU-ish cache for blob URLs
const MAX_CACHE_SIZE = 100;
const _imageCache = new Map<string, { url: string; lastUsed: number }>();

export function getImageSource(frame: { dataUri: string; imageUrl?: string }): string {
  if (frame.imageUrl) return frame.imageUrl;
  return frame.dataUri;
}

export async function preloadImage(src: string): Promise<string> {
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;

  const cached = _imageCache.get(src);
  if (cached) {
    cached.lastUsed = Date.now();
    return cached.url;
  }

  // Enforce cache limit
  if (_imageCache.size >= MAX_CACHE_SIZE) {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, val] of _imageCache.entries()) {
      if (val.lastUsed < oldestTime) {
        oldestTime = val.lastUsed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      revokeImage(oldestKey);
    }
  }

  try {
    const resp = await fetch(src);
    if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.statusText}`);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    _imageCache.set(src, { url, lastUsed: Date.now() });
    return url;
  } catch (error) {
    console.error("Error preloading image:", error);
    throw error;
  }
}

export function revokeImage(src: string): void {
  const cached = _imageCache.get(src);
  if (cached) {
    if (cached.url.startsWith("blob:")) {
      URL.revokeObjectURL(cached.url);
    }
    _imageCache.delete(src);
  }
}

export function revokeAllImages(): void {
  for (const { url } of _imageCache.values()) {
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
  }
  _imageCache.clear();
}

export function isExternalImage(frame: { dataUri: string; imageUrl?: string }): boolean {
  return !!frame.imageUrl;
}
