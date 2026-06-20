import React from "react";
import { useLocation } from "wouter";

const SYNC_EVENT = "urlstate:sync";

function readParam<T>(key: string, defaultValue: T): T {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get(key);
  if (raw === null) return defaultValue;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
}

function triggerSync() {
  window.dispatchEvent(new CustomEvent(SYNC_EVENT));
}

export function useSyncedUrlState<T>(
  key: string,
  defaultValue: T,
): [T, (val: T | ((prev: T) => T)) => void] {
  // Subscribe to wouter location so we re-read URL on navigate() from any component
  const [_location] = useLocation();

  // Force re-read on replaceState-based updates and browser back/forward
  const [bump, setBump] = React.useState(0);

  // Derive state directly from URL — re-computes whenever bump changes (urlstate:sync events)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const state = React.useMemo(() => readParam(key, defaultValue), [key, defaultValue, bump]);

  React.useEffect(() => {
    const handler = () => setBump((n) => n + 1);
    window.addEventListener("popstate", handler);
    window.addEventListener(SYNC_EVENT, handler);
    return () => {
      window.removeEventListener("popstate", handler);
      window.removeEventListener(SYNC_EVENT, handler);
    };
  }, []);

  const setSynced = React.useCallback(
    (val: T | ((prev: T) => T)) => {
      const next =
        typeof val === "function" ? (val as (prev: T) => T)(readParam(key, defaultValue)) : val;
      const url = new URL(window.location.href);
      const isDefault =
        next === defaultValue ||
        next === "" ||
        (Array.isArray(next) && next.length === 0) ||
        (typeof next === "object" &&
          next !== null &&
          !Array.isArray(next) &&
          Object.keys(next as object).length === 0);
      if (isDefault) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, typeof next === "string" ? next : JSON.stringify(next));
      }
      window.history.replaceState({}, "", url.toString());
      triggerSync();
    },
    [key, defaultValue],
  );

  return [state, setSynced];
}
