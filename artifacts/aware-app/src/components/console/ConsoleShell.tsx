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
import { ProofLogo } from "../aware/ProofLogo";

interface ConsoleShellProps {
  children: React.ReactNode;
  fullBleed?: boolean;
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
    "/start": "Start Run", "/share": "Share",
  };
  const seg = "/" + path.split("/")[1];
  return labels[seg] ?? "A.W.A.R.E.";
}

function SidebarNavItem({ item, isActive, collapsed }: {
  item: { id: string; icon: React.ComponentType<{ size?: number }>; label: string; href: string };
  isActive: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  const { updates } = useLiveStatus();
  const hasRunning = item.id === "runs" && updates.some(u => u.type === "info" || u.message.toLowerCase().includes("running"));

  return (
    <Link
      href={item.href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: collapsed ? 0 : 12,
        padding: collapsed ? "10px" : "8px 12px",
        borderRadius: "var(--proof-radius)",
        fontSize: 13,
        fontWeight: isActive ? 600 : 500,
        color: isActive ? "var(--proof-blue-bright)" : "var(--proof-text-secondary)",
        cursor: "pointer",
        transition: "all 150ms ease",
        textDecoration: "none",
        borderLeft: isActive ? "3px solid var(--proof-blue)" : "3px solid transparent",
        background: isActive ? "var(--proof-blue-bg)" : "transparent",
        boxShadow: isActive ? "0 0 12px rgba(0, 196, 255, 0.15)" : "none",
        justifyContent: collapsed ? "center" : "flex-start",
        position: "relative",
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
          (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
          (e.currentTarget as HTMLElement).style.textShadow = "0 0 8px rgba(255,255,255,0.3)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)";
          (e.currentTarget as HTMLElement).style.textShadow = "none";
        }
      }}
      title={collapsed ? item.label : undefined}
    >
      <Icon size={16} />
      {!collapsed && (
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.label}
        </span>
      )}
      {item.id === "runs" && (
        <div style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "var(--proof-blue)",
          marginLeft: collapsed ? 0 : 4,
          position: collapsed ? "absolute" : "relative",
          top: collapsed ? 6 : "auto",
          right: collapsed ? 6 : "auto",
          boxShadow: "0 0 6px var(--proof-blue)",
          animation: "badge-pulse 2s infinite"
        }} />
      )}
    </Link>
  );
}

export function ConsoleShell({ children, fullBleed }: ConsoleShellProps) {
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
    try { localStorage.setItem("proof-theme", next ? "dark" : "light"); } catch { /* intentionally empty */ }
    document.documentElement.classList.toggle("light", !next);
  };

  const sidebarWidth = sidebarOpen ? (sidebarCollapsed ? 56 : 200) : 0;

  return (
    <div style={{
      height: "100dvh", overflow: "hidden", display: "flex", flexDirection: "column",
      background: "var(--proof-bg)", color: "var(--proof-text)",
    }}>
      {/* ── Topbar ───────────────────────────────────────────────── */}
      <header style={{
        height: 52, minHeight: 52, flexShrink: 0,
        background: "var(--proof-surface)",
        borderBottom: "1px solid var(--proof-border-strong)",
        display: "flex", alignItems: "center", gap: 12, padding: "0 20px",
        position: "relative", zIndex: 50,
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg, transparent 0%, var(--proof-blue-border) 40%, var(--proof-blue-bright) 70%, transparent 100%)",
        }} />

        <button
          onClick={() => setSidebarOpen((p) => !p)}
          title="Toggle sidebar"
          style={{
            width: 32, height: 32, padding: 0, border: "1px solid var(--proof-border-light)",
            background: "transparent", cursor: "pointer", color: "var(--proof-text-muted)",
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: "var(--proof-radius-sm)", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", flexShrink: 0,
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
          <div style={{
            transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: sidebarOpen ? "rotate(0deg)" : "rotate(180deg)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </div>
        </button>

        <button
          onClick={() => navigate("/")}
          style={{
            display: "flex", alignItems: "center", gap: 12, background: "transparent",
            border: "none", cursor: "pointer", padding: "6px 12px", borderRadius: 10,
            transition: "all 150ms ease", flexShrink: 0,
            position: "relative", overflow: "hidden"
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--proof-surface-3)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(circle at center, var(--proof-blue-bg) 0%, transparent 70%)",
            opacity: 0.5, pointerEvents: "none"
          }} />
          <ProofLogo size={24} />
          <span style={{ 
            fontSize: 15, fontWeight: 900, color: "var(--proof-text)", letterSpacing: "0.5px", fontFamily: "var(--font-mono)",
            background: "linear-gradient(135deg, var(--proof-text) 0%, var(--proof-blue-bright) 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>
            A.W.A.R.E.
          </span>
        </button>

        <span style={{ color: "var(--proof-border-strong)", fontSize: 18, opacity: 0.4, userSelect: "none" }}>/</span>
        <span style={{
          fontSize: 11, fontWeight: 800, 
          textTransform: "uppercase", letterSpacing: "0.08em",
          background: "linear-gradient(135deg, var(--proof-blue) 0%, var(--proof-purple) 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          padding: "4px 0",
          fontFamily: "var(--font-mono)",
        }}>
          {pageLabel}
        </span>

        {dataState.loading && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 6,
            background: "var(--proof-blue-bg)", border: "1px solid var(--proof-blue-border)",
            fontSize: 10, fontWeight: 700, color: "var(--proof-blue-bright)",
            marginLeft: 8
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--proof-blue-bright)", animation: "badge-pulse 1s ease-in-out infinite" }} />
            SYNCING
          </span>
        )}

        <div style={{ flex: 1 }} />

        <div style={{
          display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
          background: "var(--proof-surface)", border: "1px solid var(--proof-border-strong)",
          borderRadius: "var(--proof-radius-sm)", padding: "2px 6px", height: 32,
        }}>
          <EnvSelector currentEnvIds={envSnap.envIds} onEnvChange={setSelectedEnvIds} variant="topbar" />
          <div style={{ width: 1, height: 16, background: "var(--proof-border)", flexShrink: 0 }} />
          <SuiteSelector currentSuiteIds={suiteSnap.suiteIds} onSuiteChange={setSelectedSuiteIds} variant="topbar" />
        </div>

        <div style={{ width: 1, height: 20, background: "var(--proof-border)", flexShrink: 0 }} />
        <EnvTierSelector />
        <div style={{ width: 1, height: 20, background: "var(--proof-border)", flexShrink: 0 }} />

        <button
          onClick={() => setPaletteOpen(true)}
          title="Search (⌘K)"
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "4px 12px",
            fontSize: 12, cursor: "pointer",
            border: "1px solid var(--proof-border)", borderRadius: "var(--proof-radius-md)",
            background: "var(--proof-surface-2)", color: "var(--proof-text-muted)",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)", fontFamily: "var(--font-mono)",
            height: 32, minWidth: 180, flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = "var(--proof-blue-border)";
            el.style.color = "var(--proof-text)";
            el.style.boxShadow = "0 0 15px rgba(0, 196, 255, 0.25)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = "var(--proof-border)";
            el.style.color = "var(--proof-text-muted)";
            el.style.boxShadow = "none";
          }}
        >
          <Search size={14} />
          <span style={{ flex: 1, textAlign: "left" }}>SEARCH COMMANDS...</span>
          <kbd style={{
            fontSize: 10, border: "1px solid var(--proof-border-strong)",
            borderRadius: 4, padding: "0 6px", fontFamily: "var(--font-mono)",
            lineHeight: "18px", opacity: 0.8, background: "var(--proof-surface-3)"
          }}>⌘K</kbd>
        </button>

        <button
          onClick={toggleTheme}
          title={isDark ? "Light mode" : "Dark mode"}
          style={{
            width: 32, height: 32, padding: 0,
            border: "1px solid var(--proof-border)", background: "transparent",
            cursor: "pointer", color: "var(--proof-text-muted)",
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: "50%", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = "var(--proof-text)";
            el.style.background = "var(--proof-hover)";
            const icon = el.firstChild as HTMLElement;
            if (icon) icon.style.transform = "rotate(45deg)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = "var(--proof-text-muted)";
            el.style.background = "transparent";
            const icon = el.firstChild as HTMLElement;
            if (icon) icon.style.transform = "rotate(0deg)";
          }}
        >
          <div style={{ transition: "transform 0.5s ease", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </div>
        </button>
      </header>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        {/* Sidebar */}
        <nav style={{
          width: sidebarWidth, minWidth: sidebarWidth, flexShrink: 0,
          background: "var(--proof-surface-2)",
          borderRight: sidebarOpen ? "1px solid var(--proof-border-strong)" : "none",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          transition: "width 250ms cubic-bezier(0.4,0,0.2,1), min-width 250ms cubic-bezier(0.4,0,0.2,1)",
          position: "relative",
        }}>
          {sidebarOpen && (
            <div style={{
              position: "absolute", top: 0, right: 0, bottom: 0, width: 1,
              background: "linear-gradient(to bottom, var(--proof-blue) 0%, transparent 100%)",
              opacity: 0.2, zIndex: 10, pointerEvents: "none"
            }} />
          )}
          {sidebarOpen && (
            <>
              <div style={{
                padding: "8px 12px",
                display: "flex", alignItems: "center", justifyContent: "flex-end",
                height: 40,
              }}>
                <button
                  onClick={() => setSidebarCollapsed((p) => !p)}
                  title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  style={{
                    width: 28, height: 28, padding: 0, border: "1px solid var(--proof-border-light)",
                    background: "transparent", cursor: "pointer", color: "var(--proof-text-muted)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: "var(--proof-radius-sm)", transition: "all 0.3s ease",
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
                  <div style={{
                    transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: sidebarCollapsed ? "rotate(180deg)" : "rotate(0deg)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <ChevronRight size={14} />
                  </div>
                </button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 12px" }}>
                {NAV_GROUPS.map((group) => (
                  <div key={group.label} style={{ marginBottom: 20 }}>
                    {!sidebarCollapsed && (
                      <div style={{
                        fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                        letterSpacing: "0.15em", color: "var(--proof-text-muted)",
                        padding: "8px 12px", fontFamily: "var(--font-mono)",
                        borderTop: "1px solid var(--proof-border-light)",
                        marginTop: 4,
                      }}>
                        {group.label}
                      </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {group.items.map((item) => (
                        <SidebarNavItem
                          key={item.id}
                          item={item}
                          isActive={currentId === item.id}
                          collapsed={sidebarCollapsed}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                borderTop: "1px solid var(--proof-border-strong)",
                padding: "12px",
                background: "var(--proof-surface-3)",
                position: "relative"
              }}>
                <div style={{
                  position: "absolute", top: 0, left: 12, right: 12, height: 1,
                  background: "linear-gradient(90deg, transparent, var(--proof-border-strong), transparent)",
                  opacity: 0.5
                }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {BOTTOM_NAV.map((item) => (
                    <SidebarNavItem
                      key={item.id}
                      item={item}
                      isActive={currentId === item.id}
                      collapsed={sidebarCollapsed}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </nav>

        {/* Main */}
        <main
          id="main-content"
          style={{
            flex: 1, minWidth: 0, 
            overflowY: fullBleed ? "hidden" : "auto", 
            overflowX: "hidden",
            background: "var(--proof-bg)",
            position: "relative",
            padding: fullBleed ? 0 : undefined,
            boxShadow: "inset 1px 1px 10px rgba(0,0,0,0.2)",
          }}
        >
          {children}
        </main>
      </div>

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}

      {currentToast && (() => {
        const cfg = {
          success: { bg: "var(--proof-green-bg)", border: "var(--proof-green-border)", color: "var(--proof-green)", icon: <Check size={16} />, glow: "0 8px 32px rgba(0, 229, 160, 0.25)" },
          warning: { bg: "var(--proof-yellow-bg)", border: "var(--proof-yellow-border)", color: "var(--proof-yellow)", icon: <AlertTriangle size={16} />, glow: "0 8px 32px rgba(245, 158, 11, 0.25)" },
          error: { bg: "var(--proof-red-bg)", border: "var(--proof-red-border)", color: "var(--proof-red-bright)", icon: <AlertTriangle size={16} />, glow: "0 8px 32px rgba(255, 51, 85, 0.25)" },
          info: { bg: "var(--proof-blue-bg)", border: "var(--proof-blue-border)", color: "var(--proof-blue-bright)", icon: <Bot size={16} />, glow: "0 8px 32px rgba(0, 196, 255, 0.25)" },
        }[currentToast.type] ?? { bg: "var(--proof-surface-2)", border: "var(--proof-border)", color: "var(--proof-text)", icon: null, glow: "none" };

        return (
          <div style={{
            position: "fixed", bottom: 40, left: "50%", zIndex: 9999,
            animation: "toast-pop 0.4s cubic-bezier(0.2,0,0,1) both",
            display: "flex", flexDirection: "column", gap: 0, 
            background: "var(--proof-surface-2)", border: `1px solid ${cfg.border}`, color: cfg.color,
            borderRadius: "var(--proof-radius-lg)", fontSize: 14, fontWeight: 600,
            boxShadow: cfg.glow, minWidth: 320, maxWidth: 480,
            transform: "translateX(-50%)", backdropFilter: "blur(20px)",
            overflow: "hidden"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px" }}>
              {cfg.icon}
              <span style={{ flex: 1, color: "var(--proof-text)" }}>{currentToast.message}</span>
              <button
                onClick={dismissToast}
                style={{
                  background: "transparent", border: "none", cursor: "pointer",
                  color: "var(--proof-text-muted)", opacity: 0.8, padding: 4, display: "flex",
                  alignItems: "center", transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--proof-text)"; (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--proof-text-muted)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.05)", width: "100%" }}>
              <div style={{
                height: "100%",
                background: cfg.color,
                animation: "toast-progress 5s linear forwards",
                boxShadow: `0 0 8px ${cfg.color}`
              }} />
            </div>
          </div>
        );
      })()}
    </div>
  );
}
