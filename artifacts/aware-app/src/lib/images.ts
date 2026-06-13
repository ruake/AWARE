const _imageCache = new Map<string, string>();

export function getImageSource(frame: { dataUri: string; imageUrl?: string }): string {
  if (frame.imageUrl) return frame.imageUrl;
  return frame.dataUri;
}

export async function preloadImage(src: string): Promise<string> {
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;
  if (_imageCache.has(src)) return _imageCache.get(src)!;
  const resp = await fetch(src);
  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  _imageCache.set(src, url);
  return url;
}

export function revokeAllImages(): void {
  for (const url of _imageCache.values()) {
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
  }
  _imageCache.clear();
}

export function isExternalImage(frame: { dataUri: string; imageUrl?: string }): boolean {
  return !!frame.imageUrl;
}
