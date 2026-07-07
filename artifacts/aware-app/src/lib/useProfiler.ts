import { useEffect, useRef, useState } from "react";

const marks = new Map<string, number>();

export function mark(name: string): void {
  marks.set(name, performance.now());
}

export function measure(from: string, to: string, label?: string): number {
  const start = marks.get(from);
  const end = marks.get(to);
  if (start == null || end == null) return -1;
  const duration = end - start;
  performance.measure(label ?? `${from} → ${to}`, { start, end });
  return duration;
}

export function useProfiler(componentName: string): void {
  const [started] = useState(() => performance.now());

  useEffect(() => {
    const duration = performance.now() - started;
    if (duration > 16) {
      console.warn(`[Profiler] ${componentName} mount took ${duration.toFixed(1)}ms (exceeds 16ms frame budget)`);
    }
  }, [componentName, started]);
}

export function observeNavigationTimings(): () => void {
  if (typeof window === "undefined" || !("performance" in window)) return () => {};

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === "navigation") {
        const nav = entry as PerformanceNavigationTiming;
        const ttfb = nav.responseStart - nav.requestStart;
        const domLoad = nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart;
        const total = nav.loadEventEnd - nav.startTime;
        if (ttfb > 1000 || domLoad > 2000 || total > 5000) {
          console.warn(`[Navigation] TTFB:${ttfb}ms DOM:${domLoad}ms Total:${total}ms`);
        }
      }
    }
  });

  try {
    observer.observe({ type: "navigation", buffered: true });
  } catch {
    observer.observe({ entryTypes: ["navigation"] });
  }

  return () => observer.disconnect();
}
