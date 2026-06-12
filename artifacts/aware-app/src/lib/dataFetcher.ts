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

export async function fetchJson<T>(path: string): Promise<T> {
  const url = dataUrl(path);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}
