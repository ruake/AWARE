import { useState, useEffect, useRef, useCallback } from "react";

export function usePolling(
  callback: () => Promise<void> | void,
  intervalMs: number,
  enabled?: boolean,
): { isPolling: boolean; lastUpdate: Date | null; forceRefresh: () => void } {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const callbackRef = useRef(callback);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const tick = useCallback(async () => {
    try {
      await callbackRef.current();
      setLastUpdate(new Date());
    } catch {
      /* ignore */
    }
  }, []);

  const clear = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clear();
    if (enabled !== false) {
      intervalRef.current = setInterval(tick, intervalMs);
    }
  }, [enabled, intervalMs, tick, clear]);

  const forceRefresh = useCallback(() => {
    tick();
    start();
  }, [tick, start]);

  useEffect(() => {
    start();
    return clear;
  }, [start, clear]);

  useEffect(() => {
    if (enabled === false) return;
    const handleVisibility = () => {
      if (document.hidden) clear();
      else start();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [enabled, start, clear]);

  return { isPolling: enabled !== false, lastUpdate, forceRefresh };
}
