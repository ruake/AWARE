import type { DebugLogEntry, LangGraphNodeId } from "./langGraphTypes";

const MAX_LOG_ENTRIES = 500;

let logEntries: DebugLogEntry[] = [];
let listeners: (() => void)[] = [];

let lastTiming: Record<string, number> = {};

export function clearLogs(): void {
  logEntries = [];
  lastTiming = {};
  notifyListeners();
}

export function getLogs(): DebugLogEntry[] {
  return logEntries;
}

export function subscribeLogs(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function notifyListeners(): void {
  for (const fn of listeners) fn();
}

export function logDebug(
  node: LangGraphNodeId,
  event: string,
  level: "info" | "warn" | "error" | "debug" = "debug",
  details?: string,
): void {
  const entry: DebugLogEntry = {
    timestamp: new Date().toISOString(),
    node,
    event,
    level,
    details,
  };
  logEntries.push(entry);
  if (logEntries.length > MAX_LOG_ENTRIES) {
    logEntries = logEntries.slice(-MAX_LOG_ENTRIES);
  }
  notifyListeners();
}

export function logInfo(node: LangGraphNodeId, event: string, details?: string): void {
  logDebug(node, event, "info", details);
}

export function logWarn(node: LangGraphNodeId, event: string, details?: string): void {
  logDebug(node, event, "warn", details);
}

export function logError(node: LangGraphNodeId, event: string, details?: string): void {
  logDebug(node, event, "error", details);
}

export function startTiming(label: string): void {
  lastTiming[label] = performance.now();
  logDebug("timing", `start: ${label}`, "debug");
}

export function endTiming(label: string): number | undefined {
  const start = lastTiming[label];
  if (start === undefined) return undefined;
  const duration = Math.round(performance.now() - start);
  delete lastTiming[label];
  logDebug("timing", `end: ${label}`, "debug", `${duration}ms`);
  return duration;
}
