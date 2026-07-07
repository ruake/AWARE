export type ThemeMode = "light" | "dark" | "system";

type Listener = (mode: ThemeMode) => void;

const STORAGE_KEY = "aware-theme-v1";
let currentMode: ThemeMode = "system";
let listeners: Set<Listener> = new Set();
let mediaQuery: MediaQueryList | null = null;

function loadMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {}
  return "system";
}

function persistMode(mode: ThemeMode) {
  try { localStorage.setItem(STORAGE_KEY, mode); } catch {}
}

function applyTheme(mode: ThemeMode) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = mode === "dark" || (mode === "system" && prefersDark);
  document.documentElement.toggleAttribute("data-theme", isDark);
  document.documentElement.classList.toggle("light", !isDark);
}

function handleSystemChange() {
  if (currentMode === "system") applyTheme("system");
}

export function getTheme(): ThemeMode {
  return currentMode;
}

export function setTheme(mode: ThemeMode) {
  currentMode = mode;
  persistMode(mode);
  applyTheme(mode);
  if (mediaQuery) {
    mediaQuery.removeEventListener("change", handleSystemChange);
    mediaQuery = null;
  }
  if (mode === "system") {
    mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", handleSystemChange);
  }
  listeners.forEach(cb => cb(mode));
}

export function subscribeToTheme(cb: Listener): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function getEffectiveTheme(): "light" | "dark" {
  if (currentMode === "dark") return "dark";
  if (currentMode === "light") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Initialize on module load
currentMode = loadMode();
applyTheme(currentMode);
if (currentMode === "system") {
  mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", handleSystemChange);
}
