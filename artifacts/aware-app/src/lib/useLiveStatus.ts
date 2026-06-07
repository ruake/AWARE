import React from "react";

export interface LiveUpdate {
  id: string;
  message: string;
  type: "info" | "success" | "warning";
  timestamp: number;
}

const SAMPLE_UPDATES: LiveUpdate[] = [
  { id: "run_1012", message: "Run run_1012 completed — 98% pass rate", type: "success", timestamp: 0 },
  { id: "run_1013", message: "Run run_1013 completed — 3 regressions detected", type: "warning", timestamp: 0 },
  { id: "alert", message: "Prod/Staging pass rate dropped to 87%", type: "warning", timestamp: 0 },
  { id: "run_1014", message: "Run run_1014 completed — 100% pass rate", type: "success", timestamp: 0 },
  { id: "info", message: "UAT/Production suite finished in 32m", type: "info", timestamp: 0 },
  { id: "run_1015", message: "Run run_1015 completed — 2 regressions detected", type: "warning", timestamp: 0 },
];

export function useLiveStatus() {
  const [updates, setUpdates] = React.useState<LiveUpdate[]>([]);
  const [pendingCount, setPendingCount] = React.useState(0);
  const [currentToast, setCurrentToast] = React.useState<LiveUpdate | null>(null);
  const indexRef = React.useRef(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const update = { ...SAMPLE_UPDATES[indexRef.current % SAMPLE_UPDATES.length], timestamp: Date.now() };
      indexRef.current++;
      setUpdates(prev => [update, ...prev].slice(0, 50));
      setPendingCount(prev => prev + 1);
      setCurrentToast(update);
      setTimeout(() => setCurrentToast(null), 5000);
    }, 18000);
    return () => clearInterval(interval);
  }, []);

  const dismissToast = React.useCallback(() => setCurrentToast(null), []);
  const clearCount = React.useCallback(() => setPendingCount(0), []);

  return { updates, pendingCount, currentToast, dismissToast, clearCount };
}
