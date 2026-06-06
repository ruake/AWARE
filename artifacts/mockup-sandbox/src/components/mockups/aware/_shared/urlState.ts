import React from "react";

export function useSyncedUrlState<T>(key: string, defaultValue: T): [T, (val: T) => void] {
  const [state, setState] = React.useState<T>(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get(key);
    if (raw === null) return defaultValue;
    try { return JSON.parse(raw) as T; } catch { return raw as unknown as T; }
  });

  const setSynced = React.useCallback((val: T) => {
    setState(val);
    const url = new URL(window.location.href);
    const isDefault =
      val === defaultValue ||
      val === "" ||
      (Array.isArray(val) && val.length === 0) ||
      (typeof val === "object" && val !== null && !Array.isArray(val) && Object.keys(val as object).length === 0);
    if (isDefault) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, typeof val === "string" ? val : JSON.stringify(val));
    }
    window.history.replaceState({}, "", url.toString());
  }, [key, defaultValue]);

  return [state, setSynced];
}
