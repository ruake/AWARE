import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";

export function useSyncedUrlState<T>(
  key: string,
  defaultValue: T,
  serialize: (v: T) => string = JSON.stringify,
  deserialize: (s: string) => T = JSON.parse,
): [T, (updater: T | ((prev: T) => T)) => void] {
  const [loc, navigate] = useLocation();
  const [state, setState] = useState<T>(() => {
    const params = new URLSearchParams(loc.split("?")[1] || "");
    const raw = params.get(key);
    if (raw === null) return defaultValue;
    try {
      return deserialize(raw);
    } catch {
      return defaultValue;
    }
  });
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const setSynced = useCallback((updater: T | ((prev: T) => T)) => {
    setState((prev) => {
      const next = typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
      stateRef.current = next;
      return next;
    });
  }, []);

  // Sync location on change
  useEffect(() => {
    const [path] = loc.split("?");
    const params = new URLSearchParams(loc.split("?")[1] || "");
    const serialized = serialize(state);
    if (serialized === serialize(defaultValue)) {
      params.delete(key);
    } else {
      params.set(key, serialized);
    }
    const qs = params.toString();
    const newLoc = qs ? `${path}?${qs}` : path;
    if (newLoc !== loc) {
      navigate(newLoc, { replace: true });
    }
  }, [state, key]);

  return [state, setSynced];
}
