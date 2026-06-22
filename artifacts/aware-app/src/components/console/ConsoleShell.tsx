import React from "react";
import { useLocation, Link } from "wouter";
import { CommandPalette } from "../aware/CommandPalette";
import { useLiveStatus } from "@/lib/useLiveStatus";
import {
  LayoutDashboard,
  History,
  GitCompare,
  BarChart3,
  Beaker,
  Bot,
  Settings,
  Info,
  Menu,
  X,
  Search,
  Sun,
  Moon,
  ChevronRight,
  WifiOff,
  Check,
  AlertTriangle,
} from "lucide-react";
import { useDataInit } from "@/lib/hooks/useData";
import { EnvTierSelector } from "./EnvTierSelector";
import { EnvSelector } from "./EnvSelector";
import { SuiteSelector } from "./SuiteSelector";
import {
  getSelectedEnvSnapshot,
  subscribeToSelectedEnv,
  setSelectedEnvIds,
} from "@/lib/selectedEnv";
import {
  getSelectedSuiteSnapshot,
  subscribeToSelectedSuites,
  setSelectedSuiteIds,
} from "@/lib/filters";
import { useSyncExternalStore } from "react";

interface ConsoleShellProps {
  children: React.ReactNode;
}

const NAV_GROUPS = [
  {
    label: "Monitor",
    items: [
      { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/" },
    ],
  },
  {
    label: "Investigate",
    items: [
      { id: "runs", icon: History, label: "Runs", href: "/runs" },
      { id: "compare", icon: GitCompare, label: "Compare", href: "/compare" },
      { id: "trends", icon: BarChart3, label: "Trends", href: "/trends" },
      { id: "tests", icon: Beaker, label: "Tests", href: "/tests" },
    ],
  },
  {
    label: "Assist",
    items: [
      { id: "copilot", icon: Bot, label: "Copilot", href: "/copilot" },
    ],
  },
];

const BOTTOM_NAV = [
  { id: "settings", icon: Settings, label: "Settings", href: "/settings" },
  { id: "about", icon: Info, label: "About", href: "/about" },
];

function activeIdFromPath(path: string): string {
  if (path === "/") return "dashboard";
  const seg = path.split("/")[1];
  const map: Record<string, string> = {
    runs: "runs", compare: "compare", trends: "trends", analytics: "trends",
    tests: "tests", copilot: "copilot", settings: "settings", about: "about",
  };
  return map[seg] ?? "dashboard";
}

function routeLabel(path: string): string {
  if (path === "/") return "Dashboard";
  if (path.startsWith("/runs/")) return "Run Detail";
  const labels: Record<string, string> = {
    "/runs": "Runs", "/compare": "Compare", "/trends": "Trends",
    "/tests": "Tests", "/copilot": "Copilot", "/settings": "Settings", "/about": "About",
  };
  const seg = "/" + path.split("/")[1];
  return labels[seg] ?? "A.W.A.R.E.";
}

function AwareLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px" }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: "linear-gradient(135deg, var(--proof-blue) 0%, var(--proof-blue-bright) 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 14px var(--proof-blue-glow)",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </div>
      <span style={{
        fontSize: 14, fontWeight: 800, letterSpacing: "-0.3px",
        color: "var(--proof-text)",
      }}>
        A.W.A.R.E.
      </span>
    </div>
  );
}

function SidebarNavItem({ item, isActive, collapsed }: {
  item: { id: string; icon: React.ComponentType<{ size?: number }>; label: string; href: string };
  isActive: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: collapsed ? 0 : 9,
        padding: collapsed ? "8px" : "7px 10px",
        borderRadius: "var(--proof-radius)",
        fontSize: 13,
        fontWeight: isActive ? 600 : 500,
        color: isActive ? "var(--proof-blue-bright)" : "var(--proof-text-secondary)",
        cursor: "pointer",
        transition: "all var(--proof-transition)",
        textDecoration: "none",
        border: `1px solid ${isActive ? "var(--proof-blue-border)" : "transparent"}`,
        background: isActive ? "var(--proof-blue-bg)" : "transparent",
        justifyContent: collapsed ? "center" : "flex-start",
        position: "relative",
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
          (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)";
        }
      }}
      title={collapsed ? item.label : undefined}
    >
      <Icon size={15} />
      {!collapsed && (
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.label}
        </span>
      )}
      {!collapsed && isActive && (
        <ChevronRight size={12} style={{ opacity: 0.5, flexShrink: 0 }} />
      )}
    </Link>
  );
}

export function ConsoleShell({ children }: ConsoleShellProps) {
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const paletteRef = React.useRef(paletteOpen);
  const { currentToast, dismissToast } = useLiveStatus();

  const dataState = useDataInit();
  const envSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  const suiteSnap = useSyncExternalStore(subscribeToSelectedSuites, getSelectedSuiteSnapshot);

  const [isDark, setIsDark] = React.useState(() => {
    try { return localStorage.getItem("proof-theme") !== "light"; } catch { return true; }
  });

  const currentId = activeIdFromPath(location);
  const pageLabel = routeLabel(location);

  React.useEffect(() => { paletteRef.current = paletteOpen; }, [paletteOpen]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault(); setPaletteOpen((p) => !p); return;
      }
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault(); setPaletteOpen(true); return;
      }
      if (e.key === "Escape" && paletteRef.current) {
        setPaletteOpen(false); e.preventDefault();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    try { localStorage.setItem("proof-theme", next ? "dark" : "light"); } catch {}
    document.documentElement.classList.toggle("light", !next);
  };

  const sidebarWidth = sidebarOpen ? (sidebarCollapsed ? 52 : 220) : 0;

  return (
    <div style={{
      height: "100dvh", overflow: "hidden", display: "flex", flexDirection: "column",
      background: "var(--proof-bg)", color: "var(--proof-text)",
    }}>
      {/* ── Topbar ───────────────────────────────────────────────── */}
      <header style={{
        height: 52, minHeight: 52, flexShrink: 0,
        background: "var(--proof-title-bar-bg)",
        borderBottom: "1px solid var(--proof-border)",
        display: "flex", alignItems: "center", gap: 8, padding: "0 14px",
        position: "relative", zIndex: 50,
      }}>
        {/* Top accent line */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg, transparent 0%, var(--proof-blue-border) 40%, var(--proof-purple-border) 70%, transparent 100%)",
        }} />

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen((p) => !p)}
          title="Toggle sidebar"
          style={{
            width: 30, height: 30, padding: 0, border: "1px solid var(--proof-border)",
            background: "transparent", cursor: "pointer", color: "var(--proof-text-muted)",
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: "var(--proof-radius)", transition: "all var(--proof-transition)", flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
            (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--proof-text-muted)";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          {sidebarOpen ? <X size={14} /> : <Menu size={14} />}
        </button>

        {/* Logo → Dashboard */}
        <button
          onClick={() => navigate("/")}
          style={{
            display: "flex", alignItems: "center", gap: 8, background: "transparent",
            border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 8,
            transition: "all 150ms ease", flexShrink: 0,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: "linear-gradient(135deg, var(--proof-blue) 0%, var(--proof-blue-bright) 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px var(--proof-blue-glow)", flexShrink: 0,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--proof-text)", letterSpacing: "-0.3px" }}>
            AWARE
          </span>
        </button>

        {/* Breadcrumb */}
        <span style={{ color: "var(--proof-border-strong)", fontSize: 16, opacity: 0.4, userSelect: "none" }}>/</span>
        <span style={{
          fontSize: 11, fontWeight: 600, color: "var(--proof-text-secondary)",
          textTransform: "uppercase", letterSpacing: "0.3px",
          background: "var(--proof-surface-2)", padding: "2px 8px",
          borderRadius: "var(--proof-radius-full)", border: "1px solid var(--proof-border)",
        }}>
          {pageLabel}
        </span>

        {/* Loading indicator */}
        {dataState.loading && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "2px 8px", borderRadius: 99,
            background: "var(--proof-blue-bg)", border: "1px solid var(--proof-blue-border)",
            fontSize: 10, fontWeight: 600, color: "var(--proof-blue-bright)",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--proof-blue-bright)", animation: "badge-pulse 1s ease-in-out infinite" }} />
            Loading
          </span>
        )}

        <div style={{ flex: 1 }} />

        {/* Env + Suite selectors */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
          background: "var(--proof-surface-2)", border: "1px solid var(--proof-border)",
          borderRadius: "var(--proof-radius)", padding: "2px 6px", height: 32,
        }}>
          <EnvSelector currentEnvIds={envSnap.envIds} onEnvChange={setSelectedEnvIds} variant="topbar" />
          <div style={{ width: 1, height: 14, background: "var(--proof-border)", flexShrink: 0 }} />
          <SuiteSelector currentSuiteIds={suiteSnap.suiteIds} onSuiteChange={setSelectedSuiteIds} variant="topbar" />
        </div>

        <div style={{ width: 1, height: 18, background: "var(--proof-border)", flexShrink: 0 }} />
        <EnvTierSelector />
        <div style={{ width: 1, height: 18, background: "var(--proof-border)", flexShrink: 0 }} />

        {/* Search */}
        <button
          onClick={() => setPaletteOpen(true)}
          title="Search (⌘K)"
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "5px 10px",
            fontSize: 11.5, cursor: "pointer",
            border: "1px solid var(--proof-border)", borderRadius: "var(--proof-radius)",
            background: "var(--proof-surface-2)", color: "var(--proof-text-muted)",
            transition: "all 120ms ease", fontFamily: "var(--font-sans)",
            height: 30, minWidth: 110, flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = "var(--proof-border-strong)";
            el.style.color = "var(--proof-text)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = "var(--proof-border)";
            el.style.color = "var(--proof-text-muted)";
          }}
        >
          <Search size={11} />
          <span style={{ flex: 1, textAlign: "left" }}>Search…</span>
          <kbd style={{
            fontSize: 9, border: "1px solid var(--proof-border-strong)",
            borderRadius: 4, padding: "0 4px", fontFamily: "var(--font-mono)",
            lineHeight: "14px", opacity: 0.5,
          }}>⌘K</kbd>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Light mode" : "Dark mode"}
          style={{
            width: 30, height: 30, padding: 0,
            border: "1px solid var(--proof-border)", background: "transparent",
            cursor: "pointer", color: "var(--proof-text-muted)",
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: "var(--proof-radius)", transition: "all 120ms ease", flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = "var(--proof-text)";
            el.style.background = "var(--proof-hover)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = "var(--proof-text-muted)";
            el.style.background = "transparent";
          }}
        >
          {isDark ? <Sun size={13} /> : <Moon size={13} />}
        </button>
      </header>

      {/* ── Body: Sidebar + Main ──────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

        {/* Sidebar */}
        <nav style={{
          width: sidebarWidth, minWidth: sidebarWidth, flexShrink: 0,
          background: "var(--proof-sidebar-bg)",
          borderRight: sidebarOpen ? "1px solid var(--proof-border)" : "none",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          transition: "width 220ms cubic-bezier(0.4,0,0.2,1), min-width 220ms cubic-bezier(0.4,0,0.2,1)",
        }}>
          {sidebarOpen && (
            <>
              {/* Sidebar header */}
              <div style={{
                padding: "14px 12px 10px",
                borderBottom: "1px solid var(--proof-border)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                {!sidebarCollapsed && <AwareLogo />}
                <button
                  onClick={() => setSidebarCollapsed((p) => !p)}
                  title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  style={{
                    width: 26, height: 26, padding: 0, border: "none",
                    background: "transparent", cursor: "pointer", color: "var(--proof-text-muted)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: "var(--proof-radius-sm)", transition: "all var(--proof-transition)",
                    marginLeft: sidebarCollapsed ? "auto" : 0,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
                    (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--proof-text-muted)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  {sidebarCollapsed
                    ? <ChevronRight size={13} />
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="6" x2="15" y2="6" />
                        <line x1="3" y1="18" x2="15" y2="18" />
                      </svg>
                  }
                </button>
              </div>

              {/* Nav groups */}
              <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "10px 8px" }}>
                {NAV_GROUPS.map((group) => (
                  <div key={group.label} style={{ marginBottom: 4 }}>
                    {!sidebarCollapsed && (
                      <div style={{
                        fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: "0.7px", color: "var(--proof-text-muted)",
                        padding: "6px 10px 3px",
                      }}>
                        {group.label}
                      </div>
                    )}
                    {group.items.map((item) => (
                      <SidebarNavItem
                        key={item.id}
                        item={item}
                        isActive={currentId === item.id}
                        collapsed={sidebarCollapsed}
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* Bottom nav */}
              <div style={{
                borderTop: "1px solid var(--proof-border)",
                padding: "8px 8px 12px",
              }}>
                {BOTTOM_NAV.map((item) => (
                  <SidebarNavItem
                    key={item.id}
                    item={item}
                    isActive={currentId === item.id}
                    collapsed={sidebarCollapsed}
                  />
                ))}
              </div>
            </>
          )}
        </nav>

        {/* Main content */}
        <main
          id="main-content"
          style={{
            flex: 1, minWidth: 0, overflowY: "auto", overflowX: "hidden",
            background: "var(--proof-editor-bg)",
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.028) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            position: "relative",
          }}
        >
          {children}
        </main>
      </div>

      {/* ── Command palette ───────────────────────────────────────── */}
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}

      {/* ── Live status toast ─────────────────────────────────────── */}
      {currentToast && (() => {
        const cfg = {
          success: { bg: "var(--proof-green-bg)", border: "var(--proof-green-border)", color: "var(--proof-green)", icon: <Check size={13} /> },
          warning: { bg: "var(--proof-yellow-bg)", border: "var(--proof-yellow-border)", color: "var(--proof-yellow)", icon: <AlertTriangle size={13} /> },
          error: { bg: "var(--proof-red-bg)", border: "var(--proof-red-border)", color: "var(--proof-red-bright)", icon: <AlertTriangle size={13} /> },
          info: { bg: "var(--proof-blue-bg)", border: "var(--proof-blue-border)", color: "var(--proof-blue-bright)", icon: null },
        }[currentToast.type] ?? { bg: "var(--proof-surface-2)", border: "var(--proof-border)", color: "var(--proof-text)", icon: null };

        return (
          <div style={{
            position: "fixed", bottom: 20, left: "50%", zIndex: 9999,
            animation: "toast-pop 0.2s cubic-bezier(0.2,0,0,1) both",
            display: "flex", alignItems: "center", gap: 8, padding: "9px 14px",
            background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
            borderRadius: "var(--proof-radius-lg)", fontSize: 12.5, fontWeight: 600,
            boxShadow: "var(--proof-shadow-lg)", maxWidth: 360,
            transform: "translateX(-50%)",
          }}>
            {cfg.icon}
            <span style={{ flex: 1 }}>{currentToast.message}</span>
            <button
              onClick={dismissToast}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: "inherit", opacity: 0.6, padding: 0, display: "flex",
                alignItems: "center",
              }}
            >
              <X size={12} />
            </button>
          </div>
        );
      })()}

      {/* ── Route announcer (a11y) ────────────────────────────────── */}
      <RouteAnnouncer />
    </div>
  );
}

const ROUTE_NAMES: Record<string, string> = {
  "/": "Dashboard", "/runs": "Runs", "/compare": "Compare", "/trends": "Trends",
  "/tests": "Tests", "/copilot": "Copilot", "/settings": "Settings", "/about": "About",
};

function RouteAnnouncer() {
  const [location] = useLocation();
  const [msg, setMsg] = React.useState("");
  React.useEffect(() => {
    const base = "/" + location.replace(/^\//, "").split(/[/?]/)[0];
    const name = ROUTE_NAMES[base === "/" ? "/" : base] ?? "Page";
    const t0 = setTimeout(() => setMsg(`Navigated to ${name}`), 0);
    const t1 = setTimeout(() => setMsg(""), 2500);
    return () => { clearTimeout(t0); clearTimeout(t1); };
  }, [location]);
  return (
    <div role="status" aria-live="polite" aria-atomic="true" style={{
      position: "absolute", width: 1, height: 1, padding: 0, margin: -1,
      overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0, zIndex: -1,
    }}>
      {msg}
    </div>
  );
}
