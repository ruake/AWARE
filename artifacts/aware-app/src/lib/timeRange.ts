import { createStore } from "zustand/vanilla";

export type PresetRange = "1h" | "6h" | "24h" | "7d" | "14d" | "30d" | "90d" | "all";

export interface TimeRange {
  preset: PresetRange;
  start?: Date;
  end?: Date;
  label: string;
}

const STORAGE_KEY = "aware-time-range-v1";

const PRESET_LABELS: Record<PresetRange, string> = {
  "1h": "1H",
  "6h": "6H",
  "24h": "24H",
  "7d": "7D",
  "14d": "14D",
  "30d": "30D",
  "90d": "90D",
  all: "ALL",
};

const PRESET_MS: Record<PresetRange, number | null> = {
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "14d": 14 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
  all: null,
};

function readStorage(): PresetRange {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && Object.prototype.hasOwnProperty.call(PRESET_MS, raw)) return raw as PresetRange;
  } catch {
    /* ignore */
  }
  return "24h";
}

function computeTimeRange(preset: PresetRange): TimeRange {
  const label = PRESET_LABELS[preset];
  const ms = PRESET_MS[preset];
  if (ms === null) return { preset, label };
  const end = new Date();
  const start = new Date(end.getTime() - ms);
  return { preset, start, end, label };
}

interface TimeRangeState {
  preset: PresetRange;
}

const _store = createStore<TimeRangeState>()(() => ({
  preset: readStorage(),
}));

function persist(preset: PresetRange): void {
  try {
    localStorage.setItem(STORAGE_KEY, preset);
  } catch {
    /* ignore */
  }
}

export function getTimeRange(): TimeRange {
  return computeTimeRange(_store.getState().preset);
}

export function setTimeRange(preset: PresetRange): void {
  persist(preset);
  _store.setState({ preset });
}

export function subscribeToTimeRange(cb: () => void): () => void {
  return _store.subscribe(cb);
}

export function getPresetLabels(): PresetRange[] {
  return Object.keys(PRESET_LABELS) as PresetRange[];
}
