import React from "react";

export function useSyncedUrlState<T>(key: string, defaultValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [state, setState] = React.useState<T>(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get(key);
    if (raw === null) return defaultValue;
    try { return JSON.parse(raw) as T; } catch { return raw as unknown as T; }
  });

  const setSynced = React.useCallback((val: T | ((prev: T) => T)) => {
    setState(prev => {
      const next = typeof val === "function" ? (val as (prev: T) => T)(prev) : val;
      const url = new URL(window.location.href);
      const isDefault =
        next === defaultValue ||
        next === "" ||
        (Array.isArray(next) && next.length === 0) ||
        (typeof next === "object" && next !== null && !Array.isArray(next) && Object.keys(next as object).length === 0);
      if (isDefault) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, typeof next === "string" ? next : JSON.stringify(next));
      }
      window.history.replaceState({}, "", url.toString());
      return next;
    });
  }, [key, defaultValue]);

  return [state, setSynced];
}
