import React, { useEffect, useCallback } from "react";
import { X, Search } from "lucide-react";

interface Shortcut {
  keys: string;
  description: string;
  action: () => void;
}

export interface ShortcutDef {
  keys: string;
  description: string;
}

const SHORTCUTS: Shortcut[] = [];
const PAGE_SHORTCUTS: Record<string, ShortcutDef[]> = {};

let registered = false;

export function registerShortcut(keys: string, description: string, action: () => void): () => void {
  SHORTCUTS.push({ keys, description, action });
  return () => {
    const idx = SHORTCUTS.indexOf({ keys, description, action } as Shortcut);
    if (idx !== -1) SHORTCUTS.splice(idx, 1);
  };
}

export function registerPageShortcuts(page: string, shortcuts: ShortcutDef[]): () => void {
  const existing = PAGE_SHORTCUTS[page] || [];
  PAGE_SHORTCUTS[page] = [...existing, ...shortcuts];
  return () => {
    const current = PAGE_SHORTCUTS[page] || [];
    const shortcutSet = new Set(shortcuts);
    PAGE_SHORTCUTS[page] = current.filter((s) => !shortcutSet.has(s));
    if (PAGE_SHORTCUTS[page]!.length === 0) {
      delete PAGE_SHORTCUTS[page];
    }
  };
}

export function getPageShortcuts(): Record<string, ShortcutDef[]> {
  return Object.fromEntries(
    Object.entries(PAGE_SHORTCUTS).map(([page, sc]) => [page, [...sc]]),
  );
}

export function getAllShortcuts(): Shortcut[] {
  return [...SHORTCUTS];
}

export const BUILT_IN_SHORTCUT_GROUPS: { label: string; shortcuts: ShortcutDef[] }[] = [
  {
    label: "Navigation",
    shortcuts: [
      { keys: "g d", description: "Dashboard" },
      { keys: "g r", description: "Runs" },
      { keys: "g c", description: "Compare" },
      { keys: "g t", description: "Trends" },
      { keys: "g p", description: "Copilot" },
      { keys: "g s", description: "Settings" },
      { keys: "g a", description: "About" },
    ],
  },
  {
    label: "List Navigation",
    shortcuts: [
      { keys: "j", description: "Next item" },
      { keys: "k", description: "Previous item" },
    ],
  },
  {
    label: "General",
    shortcuts: [
      { keys: "?", description: "Toggle keyboard shortcuts" },
      { keys: "Esc", description: "Close / cancel" },
      { keys: "\u2318K", description: "Command palette" },
      { keys: "/", description: "Quick search" },
    ],
  },
];

const ShortcutContext = React.createContext<{
  showHelp: boolean;
  setShowHelp: (v: boolean) => void;
}>({ showHelp: false, setShowHelp: () => {} });

export function useShortcutHelp() {
  return React.useContext(ShortcutContext);
}

export type NavAction = "home" | "dashboard" | "runs" | "compare" | "tests" | "copilot";

export interface UseKeyboardShortcutsOptions {
  onNavigate: (action: NavAction) => void;
  onToggleHelp: () => void;
  onCloseHelp: () => void;
  onNavigateItems?: (direction: "next" | "prev") => void;
  enabled?: boolean;
}

let _pendingG = false;

export function useKeyboardShortcuts({
  onNavigate,
  onToggleHelp,
  onCloseHelp,
  onNavigateItems,
  enabled = true,
}: UseKeyboardShortcutsOptions): void {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const target = e.target as HTMLElement;
      const tag = target.tagName;
      const isEditable =
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;

      if (e.key === "?" && !e.repeat) {
        e.preventDefault();
        onToggleHelp();
        return;
      }

      if (e.key === "Escape") {
        _pendingG = false;
        onCloseHelp();
        return;
      }

      if (isEditable) return;

      if (e.key === "g" && !e.repeat) {
        _pendingG = true;
        setTimeout(() => {
          _pendingG = false;
        }, 1000);
        return;
      }

      if (_pendingG) {
        _pendingG = false;
        const navMap: Record<string, NavAction> = {
          h: "home",
          d: "dashboard",
          r: "runs",
          c: "compare",
          t: "tests",
          p: "copilot",
        };
        const action = navMap[e.key];
        if (action) {
          e.preventDefault();
          onNavigate(action);
        }
        return;
      }

      if (onNavigateItems && (e.key === "j" || e.key === "k")) {
        e.preventDefault();
        onNavigateItems(e.key === "j" ? "next" : "prev");
      }
    },
    [enabled, onNavigate, onToggleHelp, onCloseHelp, onNavigateItems],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

export function ShortcutProvider({ children, navigate }: { children: React.ReactNode; navigate: (path: string) => void }) {
  const [showHelp, setShowHelp] = React.useState(false);
  const leaderRef = React.useRef<string | null>(null);
  const leaderTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (registered) return;
    registered = true;

    const NAV_MAP: Record<string, string> = {
      d: "/",
      r: "/runs",
      c: "/compare",
      t: "/trends",
      p: "/copilot",
      s: "/settings",
      a: "/about",
    };

    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setShowHelp((p) => !p);
        return;
      }

      if (e.key === "Escape") {
        setShowHelp(false);
        leaderRef.current = null;
        return;
      }

      if (leaderRef.current === "g") {
        const path = NAV_MAP[e.key.toLowerCase()];
        if (path) {
          e.preventDefault();
          navigate(path);
        }
        leaderRef.current = null;
        if (leaderTimerRef.current) clearTimeout(leaderTimerRef.current);
        return;
      }

      if (e.key === "g" && !e.metaKey && !e.ctrlKey) {
        leaderRef.current = "g";
        leaderTimerRef.current = setTimeout(() => { leaderRef.current = null; }, 1000);
        return;
      }

      if (e.key === "j" || e.key === "k") {
        const active = document.activeElement;
        const rows = document.querySelectorAll('[role="button"][tabindex="0"]');
        if (rows.length === 0) return;
        const currentIdx = active ? Array.from(rows).indexOf(active) : -1;
        const nextIdx = e.key === "j"
          ? Math.min(currentIdx + 1, rows.length - 1)
          : Math.max(currentIdx - 1, 0);
        (rows[nextIdx] as HTMLElement)?.focus();
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      registered = false;
    };
  }, [navigate]);

  return (
    <ShortcutContext.Provider value={{ showHelp, setShowHelp }}>
      {children}
      {showHelp && <ShortcutCheatSheetImpl onClose={() => setShowHelp(false)} />}
    </ShortcutContext.Provider>
  );
}

function ShortcutCheatSheetImpl({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const pageShortcuts = React.useMemo(() => getPageShortcuts(), []);
  const pageLabels: Record<string, string> = {
    dashboard: "Dashboard",
    runs: "Runs",
    compare: "Compare",
    trends: "Trends",
    tests: "Tests",
    copilot: "Copilot",
    settings: "Settings",
    about: "About",
  };

  const filterFn = (s: { keys: string; description: string }) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return s.keys.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          maxWidth: 520, width: "90%", maxHeight: "80vh", display: "flex", flexDirection: "column",
          padding: 32, borderRadius: 16,
          border: "1px solid var(--proof-border)",
          background: "var(--proof-surface)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--proof-text)", margin: 0, letterSpacing: "-0.5px" }}>
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, padding: 0, border: "none",
              background: "transparent", cursor: "pointer", color: "var(--proof-text-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "var(--proof-radius-sm)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--proof-text)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--proof-text-muted)"; }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ position: "relative", marginBottom: 16 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--proof-text-muted)", pointerEvents: "none" }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search shortcuts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%", padding: "8px 12px 8px 32px", fontSize: 13,
              background: "var(--proof-surface-2)", border: "1px solid var(--proof-border)",
              borderRadius: "var(--proof-radius)", color: "var(--proof-text)",
              outline: "none", fontFamily: "var(--font-sans)", boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
          {BUILT_IN_SHORTCUT_GROUPS.map((group) => {
            const filtered = group.shortcuts.filter(filterFn);
            if (filtered.length === 0) return null;
            return (
              <div key={group.label}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--proof-text-muted)", marginBottom: 8 }}>{group.label}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {filtered.map((s) => (
                    <div key={s.keys} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
                      <span style={{ fontSize: 13, color: "var(--proof-text-secondary)" }}>{s.description}</span>
                      <kbd style={{
                        fontFamily: "var(--font-mono)", fontSize: 11, padding: "2px 8px",
                        background: "var(--proof-surface-2)", border: "1px solid var(--proof-border)",
                        borderRadius: 4, color: "var(--proof-blue-bright)", letterSpacing: "0.5px",
                      }}>{s.keys}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {Object.entries(pageShortcuts).map(([page, shortcuts]) => {
            const filtered = shortcuts.filter(filterFn);
            if (filtered.length === 0) return null;
            const label = pageLabels[page] || page;
            return (
              <div key={page}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--proof-text-muted)", marginBottom: 8 }}>{label}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {filtered.map((s) => (
                    <div key={s.keys} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
                      <span style={{ fontSize: 13, color: "var(--proof-text-secondary)" }}>{s.description}</span>
                      <kbd style={{
                        fontFamily: "var(--font-mono)", fontSize: 11, padding: "2px 8px",
                        background: "var(--proof-surface-2)", border: "1px solid var(--proof-border)",
                        borderRadius: 4, color: "var(--proof-blue-bright)", letterSpacing: "0.5px",
                      }}>{s.keys}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "var(--proof-text-muted)" }}>
          Press <kbd style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "1px 5px", background: "var(--proof-surface-2)", border: "1px solid var(--proof-border)", borderRadius: 3 }}>Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}
