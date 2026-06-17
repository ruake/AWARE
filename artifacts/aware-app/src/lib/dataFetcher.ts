const REPO_OWNER = "ruake";
const REPO_NAME = "AWARE";
const DATA_BRANCH = "data";

function rawUrl(path: string): string {
  return `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${DATA_BRANCH}/${path}`;
}

function devUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/data/${path}`;
}

export function dataUrl(path: string): string {
  if (import.meta.env.DEV) {
    return devUrl(path);
  }
  return rawUrl(path);
}

export async function fetchJson<T>(path: string, timeoutMs = 15000): Promise<T> {
  const url = dataUrl(path);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchBlob(path: string): Promise<Blob> {
  const url = dataUrl(path);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.blob();
}

export async function fetchImage(src: string): Promise<string> {
  if (src.startsWith("data:") || src.startsWith("http")) return src;
  const url = dataUrl(src);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
