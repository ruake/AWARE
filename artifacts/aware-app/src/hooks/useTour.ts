import React from "react";

const STORAGE_KEY_PREFIX = "aware-tour-completed-v1";

export function useTour(tourId = "default") {
  const [isActive, setIsActive] = React.useState(false);

  const storageKey = `${STORAGE_KEY_PREFIX}-${tourId}`;

  const checkCompleted = React.useCallback(() => {
    try {
      return localStorage.getItem(storageKey) === "true";
    } catch {
      return false;
    }
  }, [storageKey]);

  const start = React.useCallback(() => setIsActive(true), []);
  const complete = React.useCallback(() => {
    try {
      localStorage.setItem(storageKey, "true");
    } catch { /* intentional empty */ }
    setIsActive(false);
  }, [storageKey]);
  const skip = React.useCallback(() => setIsActive(false), []);
  const reset = React.useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch { /* intentional empty */ }
  }, [storageKey]);

  return { start, isActive, complete, skip, reset, checkCompleted };
}
