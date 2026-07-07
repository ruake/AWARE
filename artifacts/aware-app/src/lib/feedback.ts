const STORAGE_KEY = "aware-feedback-v1";

export interface Feedback {
  id: string;
  type: "bug" | "feature" | "improvement" | "question";
  title: string;
  description: string;
  email?: string;
  page?: string;
  timestamp: string;
  resolved: boolean;
}

function loadAll(): Feedback[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Feedback[];
  } catch {
    return [];
  }
}

function saveAll(items: Feedback[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

let _cache: Feedback[] | null = null;

function getCached(): Feedback[] {
  if (!_cache) _cache = loadAll();
  return _cache;
}

function invalidateCache(): void {
  _cache = null;
}

let _subscribers: Set<() => void> = new Set();

export function subscribeToFeedback(fn: () => void): () => void {
  _subscribers.add(fn);
  return () => _subscribers.delete(fn);
}

function notify(): void {
  _subscribers.forEach((fn) => fn());
}

export function submitFeedback(input: Omit<Feedback, "id" | "timestamp">): void {
  const items = getCached();
  const entry: Feedback = {
    ...input,
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  };
  items.push(entry);
  saveAll(items);
  invalidateCache();
  notify();
}

export function getFeedback(): Feedback[] {
  return getCached();
}

export function toggleFeedbackResolved(id: string): void {
  const items = getCached();
  const idx = items.findIndex((f) => f.id === id);
  if (idx === -1) return;
  items[idx] = { ...items[idx], resolved: !items[idx].resolved };
  saveAll(items);
  invalidateCache();
  notify();
}

export function deleteFeedback(id: string): void {
  const items = getCached();
  const filtered = items.filter((f) => f.id !== id);
  saveAll(filtered);
  invalidateCache();
  notify();
}
