const FILTER_STORAGE_KEY = "aware-filters-v1";
const SAVED_FILTERS_KEY = "aware-saved-filters-v1";

export interface FilterState {
  search: string;
  env: string[];
  suites: string[];
  status: string[];
  category: string[];
  dateRange: { start: string; end: string } | null;
  tags: string[];
  sortBy: string;
  sortDir: "asc" | "desc";
}

export interface SavedFilter {
  id: string;
  name: string;
  state: FilterState;
}

const DEFAULT_FILTERS: FilterState = {
  search: "",
  env: [],
  suites: [],
  status: [],
  category: [],
  dateRange: null,
  tags: [],
  sortBy: "started",
  sortDir: "desc",
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

let filterState: FilterState = loadFromStorage<FilterState>(FILTER_STORAGE_KEY, { ...DEFAULT_FILTERS });

const _listeners = new Set<() => void>();

function notify(): void {
  _listeners.forEach((fn) => fn());
}

export function getFilters(): FilterState {
  return filterState;
}

export function setFilter<K extends keyof FilterState>(key: K, value: FilterState[K]): void {
  filterState = { ...filterState, [key]: value };
  saveToStorage(FILTER_STORAGE_KEY, filterState);
  notify();
}

export function resetFilters(): void {
  filterState = { ...DEFAULT_FILTERS };
  saveToStorage(FILTER_STORAGE_KEY, filterState);
  notify();
}

export function subscribeToFilters(cb: () => void): () => void {
  _listeners.add(cb);
  return () => {
    _listeners.delete(cb);
  };
}

export function getSavedFilters(): SavedFilter[] {
  return loadFromStorage<SavedFilter[]>(SAVED_FILTERS_KEY, []);
}

export function saveCurrentFilter(name: string): SavedFilter {
  const saved = getSavedFilters();
  const entry: SavedFilter = {
    id: `sf_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    name,
    state: { ...filterState },
  };
  const next = [...saved, entry];
  saveToStorage(SAVED_FILTERS_KEY, next);
  return entry;
}

export function loadSavedFilter(id: string): FilterState | null {
  const saved = getSavedFilters();
  const entry = saved.find((sf) => sf.id === id);
  if (!entry) return null;
  filterState = { ...entry.state };
  saveToStorage(FILTER_STORAGE_KEY, filterState);
  notify();
  return filterState;
}

export function deleteSavedFilter(id: string): void {
  const saved = getSavedFilters();
  const next = saved.filter((sf) => sf.id !== id);
  saveToStorage(SAVED_FILTERS_KEY, next);
}
