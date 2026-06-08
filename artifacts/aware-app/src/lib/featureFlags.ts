const STORAGE_KEY = "aware_feature_flags";

export interface FeatureFlags {
  copilot: boolean;
}

const defaults: FeatureFlags = {
  copilot: true,
};

let flags: FeatureFlags = { ...defaults };
const listeners = new Set<() => void>();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) flags = { ...defaults, ...JSON.parse(raw) };
  } catch { /* ignore */ }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
}

load();

export function getFeatureFlags(): FeatureFlags {
  return { ...flags };
}

export function updateFeatureFlag<K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]) {
  flags = { ...flags, [key]: value };
  save();
  listeners.forEach(l => l());
}

export function subscribeToFeatureFlags(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

export function resetFeatureFlags() {
  flags = { ...defaults };
  save();
  listeners.forEach(l => l());
}
