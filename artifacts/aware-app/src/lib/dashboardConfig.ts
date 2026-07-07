import React from "react";

export type WidgetType =
  | "kpi-summary"
  | "pass-rate-chart"
  | "env-health"
  | "anomaly-banner"
  | "heatmap"
  | "run-history"
  | "flakiness-leaderboard"
  | "property-status"
  | "recent-failures"
  | "ci-pipeline";

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  size: "small" | "medium" | "large" | "full";
  position: { x: number; y: number };
  visible: boolean;
}

const STORAGE_KEY = "aware-dashboard-layout-v1";

export const WIDGET_META: Record<WidgetType, {
  label: string;
  description: string;
  defaultSize: WidgetConfig["size"];
}> = {
  "kpi-summary": { label: "KPI Summary", description: "Pass rate, total runs, failures & regressions", defaultSize: "full" },
  "pass-rate-chart": { label: "Pass Rate Trend", description: "Area chart of pass rate over time", defaultSize: "full" },
  "env-health": { label: "Environment Health", description: "Tier cards showing QA/UAT/PROD health", defaultSize: "full" },
  "anomaly-banner": { label: "Anomaly Alert", description: "Banner for regressions & degradation", defaultSize: "full" },
  "heatmap": { label: "Pass Rate Heatmap", description: "Per-run pass rate matrix", defaultSize: "medium" },
  "run-history": { label: "Run History", description: "Recent CI run timeline", defaultSize: "medium" },
  "flakiness-leaderboard": { label: "Flakiness Leaderboard", description: "Most flaky tests ranking", defaultSize: "medium" },
  "property-status": { label: "Property Status", description: "Akamai property configuration status", defaultSize: "small" },
  "recent-failures": { label: "Recent Failures", description: "Latest test failures across envs", defaultSize: "medium" },
  "ci-pipeline": { label: "CI Pipeline", description: "GitHub Actions pipeline overview", defaultSize: "small" },
};

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "anomaly-banner", type: "anomaly-banner", title: "Anomaly Alert", size: "full", position: { x: 0, y: 0 }, visible: true },
  { id: "kpi-summary", type: "kpi-summary", title: "KPI Summary", size: "full", position: { x: 0, y: 1 }, visible: true },
  { id: "env-health", type: "env-health", title: "Environment Health", size: "full", position: { x: 0, y: 2 }, visible: true },
  { id: "pass-rate-chart", type: "pass-rate-chart", title: "Pass Rate Trend", size: "full", position: { x: 0, y: 3 }, visible: true },
  { id: "heatmap", type: "heatmap", title: "Pass Rate Heatmap", size: "medium", position: { x: 0, y: 4 }, visible: false },
  { id: "run-history", type: "run-history", title: "Run History", size: "medium", position: { x: 1, y: 4 }, visible: false },
  { id: "flakiness-leaderboard", type: "flakiness-leaderboard", title: "Flakiness Leaderboard", size: "medium", position: { x: 2, y: 4 }, visible: false },
  { id: "property-status", type: "property-status", title: "Property Status", size: "small", position: { x: 0, y: 5 }, visible: false },
  { id: "recent-failures", type: "recent-failures", title: "Recent Failures", size: "medium", position: { x: 1, y: 5 }, visible: false },
  { id: "ci-pipeline", type: "ci-pipeline", title: "CI Pipeline", size: "small", position: { x: 2, y: 5 }, visible: false },
];

let _widgets: WidgetConfig[] = [];
let _loaded = false;
let _listeners: Array<() => void> = [];

function loadFromStorage(): WidgetConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveToStorage(widgets: WidgetConfig[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
}

function ensureLoaded(): void {
  if (_loaded) return;
  _loaded = true;
  const stored = loadFromStorage();
  if (stored.length === WIDGET_META.size) {
    _widgets = stored;
  } else {
    _widgets = DEFAULT_WIDGETS.map(w => ({ ...w }));
  }
}

function notify(): void {
  for (const cb of _listeners) cb();
}

export function getWidgets(): WidgetConfig[] {
  ensureLoaded();
  return _widgets;
}

export function setWidgets(widgets: WidgetConfig[]): void {
  ensureLoaded();
  const sorted = [...widgets].sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
  _widgets = sorted;
  saveToStorage(_widgets);
  notify();
}

export function toggleWidget(id: string): void {
  ensureLoaded();
  const idx = _widgets.findIndex(w => w.id === id);
  if (idx === -1) return;
  _widgets = _widgets.map((w, i) => (i === idx ? { ...w, visible: !w.visible } : w));
  saveToStorage(_widgets);
  notify();
}

export function resetWidgets(): void {
  _widgets = DEFAULT_WIDGETS.map(w => ({ ...w }));
  saveToStorage(_widgets);
  notify();
}

export function subscribeToWidgets(cb: () => void): () => void {
  _listeners.push(cb);
  return () => {
    _listeners = _listeners.filter(l => l !== cb);
  };
}

export function useWidgets(): WidgetConfig[] {
  const [state, setState] = React.useState(getWidgets());
  React.useEffect(() => subscribeToWidgets(() => setState(getWidgets())), []);
  return state;
}
