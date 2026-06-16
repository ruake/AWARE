import React from "react";

const SYNC_EVENT = "urlstate:sync";

function readParam<T>(key: string, defaultValue: T): T {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get(key);
  if (raw === null) return defaultValue;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function triggerSync() {
  window.dispatchEvent(new CustomEvent(SYNC_EVENT));
}

export function useSyncedUrlState<T>(
  key: string,
  defaultValue: T,
): [T, (val: T | ((prev: T) => T)) => void] {
  const [state, setState] = React.useState<T>(() => readParam(key, defaultValue));

  // Sync when another component changes the URL for this key
  React.useEffect(() => {
    const handler = () => {
      const next = readParam(key, defaultValue);
      setState(next);
    };
    window.addEventListener(SYNC_EVENT, handler);
    return () => window.removeEventListener(SYNC_EVENT, handler);
  }, [key, defaultValue]);

  const setSynced = React.useCallback(
    (val: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = typeof val === "function" ? (val as (prev: T) => T)(prev) : val;
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
        return next;
      });
    },
    [key, defaultValue],
  );

  return [state, setSynced];
}
