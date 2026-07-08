interface FilmstripFrame {
  dataUri: string;
  imageUrl?: string;
}

const blobCache = new Map<string, string>();

export function getImageSource(frame: FilmstripFrame): string {
  return frame.imageUrl || frame.dataUri;
}

export function isExternalImage(frame: FilmstripFrame): boolean {
  return !!frame.imageUrl;
}

export async function preloadImage(src: string): Promise<string> {
  if (src.startsWith('data:') || src.startsWith('blob:')) return src;
  if (blobCache.has(src)) return blobCache.get(src)!;
  const res = await fetch(src);
  if (!res.ok) throw new Error(`Failed to load image: ${res.statusText}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  blobCache.set(src, url);
  return url;
}

export function revokeImage(src: string): void {
  const url = blobCache.get(src);
  if (url) {
    URL.revokeObjectURL(url);
    blobCache.delete(src);
  }
}

export function revokeAllImages(): void {
  for (const url of blobCache.values()) {
    URL.revokeObjectURL(url);
  }
  blobCache.clear();
}

export function dataUriToBlob(dataUri: string): Blob {
  const [header, data] = dataUri.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png';
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i);
  }
  return new Blob([arr], { type: mime });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  const img = await loadImage(src);
  return { width: img.naturalWidth, height: img.naturalHeight };
}

export function canvasToDataUri(
  canvas: HTMLCanvasElement,
  format: 'image/png' | 'image/jpeg' = 'image/png',
  quality?: number,
): string {
  return canvas.toDataURL(format, quality);
}

export async function resizeImage(
  src: string,
  maxWidth: number,
  maxHeight: number,
  format: 'image/png' | 'image/jpeg' = 'image/png',
  quality?: number,
): Promise<string> {
  const img = await loadImage(src);
  let { width, height } = img;
  if (width > maxWidth) {
    height = Math.round(height * (maxWidth / width));
    width = maxWidth;
  }
  if (height > maxHeight) {
    width = Math.round(width * (maxHeight / height));
    height = maxHeight;
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL(format, quality);
}
