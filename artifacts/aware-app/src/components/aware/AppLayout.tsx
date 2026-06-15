import React from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  History,
  GitCompare,
  Activity,
  Bell,
  Search,
  Moon,
  Sun,
  ExternalLink,
  Check,
  AlertTriangle,
  Info,
  Bot,
  BarChart3,
  FolderTree,
  Radio,
  X,
  Zap,
  ChevronRight,
} from "lucide-react";
import { CommandPalette } from "./CommandPalette";
import { ProofLogo } from "./ProofLogo";
import { useLiveStatus } from "@/lib/useLiveStatus";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Monitor",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/activity", label: "Activity", icon: Radio },
    ],
  },
  {
    title: "Investigate",
    items: [
      { href: "/runs", label: "Runs", icon: History },
      { href: "/compare", label: "Compare", icon: GitCompare },
      { href: "/trends", label: "Trends", icon: BarChart3 },
    ],
  },
  {
    title: "Configure",
    items: [{ href: "/suites", label: "Suites", icon: FolderTree }],
  },
  {
    title: "Assist",
    items: [
      { href: "/copilot", label: "Copilot", icon: Bot, badge: "AI" },
      { href: "/about", label: "About", icon: Info },
    ],
  },
];

export function AppLayout({
  children,
  activeHref,
  fullBleed = false,
}: {
  children: React.ReactNode;
  activeHref?: string;
  fullBleed?: boolean;
}) {
  const [location, navigate] = useLocation();
  const [isDark, setIsDark] = React.useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("proof-theme");
      return saved !== null ? saved === "dark" : true;
    } catch {
      return true;
    }
  });
  const [sidebarExpanded, setSidebarExpanded] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [showNotifs, setShowNotifs] = React.useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);
  const { updates, currentToast, dismissToast, pendingCount, clearCount } = useLiveStatus();

  const paletteRef = React.useRef(paletteOpen);
  const notifOpenRef = React.useRef(showNotifs);
  const pendingG = React.useRef(false);

  React.useEffect(() => {
    paletteRef.current = paletteOpen;
  }, [paletteOpen]);
  React.useEffect(() => {
    notifOpenRef.current = showNotifs;
  }, [showNotifs]);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  React.useEffect(() => {
    if (isDark) document.documentElement.classList.remove("light");
    else document.documentElement.classList.add("light");
  }, [isDark]);

  const current = activeHref ?? location;

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && e.shiftKey) {
        e.preventDefault();
        setPaletteOpen((p) => !p);
        return;
      }
      if (e.key === "g" && !e.ctrlKey && !e.metaKey) {
        pendingG.current = true;
        setTimeout(() => {
          pendingG.current = false;
        }, 500);
        return;
      }
      if (pendingG.current) {
        pendingG.current = false;
        const navMap: Record<string, string> = {
          d: "/",
          r: "/runs",
          s: "/suites",
          c: "/copilot",
          a: "/about",
          p: "/activity",
        };
        if (navMap[e.key]) {
          e.preventDefault();
          navigate(navMap[e.key]);
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((p) => !p);
        return;
      }
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (e.key === "Escape") {
        if (notifOpenRef.current) {
          setShowNotifs(false);
          e.preventDefault();
          return;
        }
        if (paletteRef.current) {
          setPaletteOpen(false);
          e.preventDefault();
          return;
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    try {
      localStorage.setItem("proof-theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  };

  const isActive = (href: string) =>
    href === "/" ? current === "/" : current === href || current.startsWith(href + "/");

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "var(--proof-bg)",
        color: "var(--proof-text)",
      }}
    >
      {/* ── Top bar ── */}
      <header
        style={{
          height: 52,
          background: "rgba(10, 22, 40, 0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--proof-border)",
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          gap: 10,
          position: "sticky",
          top: 0,
          zIndex: 100,
          flexShrink: 0,
          boxShadow: "0 1px 0 rgba(59,130,246,0.08), 0 4px 16px rgba(0,0,0,0.4)",
        }}
      >
        {/* Logo */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0, marginRight: 6 }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "linear-gradient(135deg, #2563eb, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(59,130,246,0.4)",
              flexShrink: 0,
            }}
          >
            <Zap size={14} style={{ color: "white" }} fill="white" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span
              style={{
                fontWeight: 800,
                fontSize: 14,
                color: "var(--proof-text)",
                letterSpacing: "1.5px",
                fontFamily: "var(--font-mono)",
              }}
            >
              A.W.A.R.E.
            </span>
            <span
              style={{
                fontSize: 8,
                color: "var(--proof-blue-bright)",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                fontWeight: 600,
              }}
            >
              CDN Observability
            </span>
          </div>
        </div>

        {/* Top nav tabs */}
        <nav
          style={{
            display: "flex",
            height: "100%",
            overflowX: "auto",
            flex: 1,
            scrollbarWidth: "none",
          }}
        >
          {NAV_GROUPS.flatMap((g) => g.items).map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="proof-nav-link"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "0 12px",
                  height: "100%",
                  cursor: "pointer",
                  fontSize: 12.5,
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--proof-blue-bright)" : "var(--proof-text-secondary)",
                  borderBottom: `2px solid ${active ? "var(--proof-blue)" : "transparent"}`,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s, border-color 0.15s",
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                <Icon size={13} style={{ opacity: active ? 1 : 0.6, flexShrink: 0 }} />
                {item.label}
                {item.badge && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "1px 5px",
                      background:
                        "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(59,130,246,0.15))",
                      color: "var(--proof-blue-bright)",
                      borderRadius: 999,
                      border: "1px solid rgba(59,130,246,0.3)",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginLeft: "auto",
            flexShrink: 0,
          }}
        >
          {/* Search */}
          <button
            onClick={() => setPaletteOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px",
              fontSize: 12,
              cursor: "pointer",
              border: "1px solid var(--proof-border)",
              borderRadius: 8,
              background: "rgba(255,255,255,0.03)",
              color: "var(--proof-text-secondary)",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.08)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.25)";
              (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border)";
              (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)";
            }}
          >
            <Search size={12} />
            <span style={{ fontWeight: 500 }}>Search</span>
            <kbd
              style={{
                fontSize: 9,
                border: "1px solid var(--proof-border)",
                borderRadius: 4,
                padding: "1px 4px",
                fontFamily: "var(--font-mono)",
                background: "rgba(255,255,255,0.03)",
                lineHeight: "14px",
              }}
            >
              ⌘K
            </kbd>
          </button>

          {/* Notifications */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button
              onClick={() => {
                setShowNotifs((p) => !p);
                clearCount();
              }}
              aria-label="Notifications"
              style={{
                position: "relative",
                padding: 6,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "var(--proof-text-secondary)",
                display: "flex",
                alignItems: "center",
                borderRadius: 8,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <Bell size={16} />
              {pendingCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 3,
                    right: 3,
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: "var(--proof-red)",
                    color: "white",
                    fontSize: 8,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1.5px solid var(--proof-bg)",
                  }}
                >
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: 340,
                  maxHeight: 380,
                  overflow: "auto",
                  background: "rgba(10, 22, 40, 0.98)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid var(--proof-border-accent)",
                  borderRadius: 12,
                  boxShadow: "0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.1)",
                  zIndex: 200,
                  animation: "slide-up 0.15s ease-out",
                }}
              >
                <div
                  style={{
                    padding: "10px 14px 8px",
                    borderBottom: "1px solid var(--proof-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--proof-text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.6px",
                    }}
                  >
                    Live Updates
                  </span>
                  <button
                    onClick={() => setShowNotifs(false)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--proof-text-muted)",
                      padding: 2,
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
                {updates.length === 0 ? (
                  <div
                    style={{
                      padding: "24px 14px",
                      textAlign: "center",
                      fontSize: 12,
                      color: "var(--proof-text-muted)",
                    }}
                  >
                    No notifications yet
                  </div>
                ) : (
                  updates.map((u) => (
                    <div
                      key={u.id}
                      style={{
                        padding: "10px 14px",
                        borderBottom: "1px solid var(--proof-border)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        {u.type === "success" ? (
                          <Check
                            size={13}
                            style={{ color: "#34d399", flexShrink: 0, marginTop: 1 }}
                          />
                        ) : u.type === "warning" ? (
                          <AlertTriangle
                            size={13}
                            style={{ color: "#fbbf24", flexShrink: 0, marginTop: 1 }}
                          />
                        ) : (
                          <Activity
                            size={13}
                            style={{ color: "#60a5fa", flexShrink: 0, marginTop: 1 }}
                          />
                        )}
                        <span style={{ flex: 1, fontSize: 12, lineHeight: 1.5 }}>{u.message}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, paddingLeft: 21 }}>
                        <button
                          onClick={() => {
                            navigate(`/runs/${u.runId}`);
                            setShowNotifs(false);
                          }}
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color:
                              u.type === "success"
                                ? "#34d399"
                                : u.type === "warning"
                                  ? "#fbbf24"
                                  : "#60a5fa",
                            background: "none",
                            border: `1px solid ${u.type === "success" ? "rgba(52,211,153,0.2)" : u.type === "warning" ? "rgba(251,191,36,0.2)" : "rgba(96,165,250,0.2)"}`,
                            borderRadius: 6,
                            padding: "2px 8px",
                            cursor: "pointer",
                          }}
                        >
                          View Run
                        </button>
                        <button
                          onClick={() => {
                            navigate(`/compare?candidate=${u.runId}`);
                            setShowNotifs(false);
                          }}
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: "var(--proof-text-secondary)",
                            background: "none",
                            border: "1px solid var(--proof-border)",
                            borderRadius: 6,
                            padding: "2px 8px",
                            cursor: "pointer",
                          }}
                        >
                          Compare
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            style={{
              padding: 6,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--proof-text-secondary)",
              display: "flex",
              alignItems: "center",
              borderRadius: 8,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* GitHub */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: "var(--proof-blue-bright)",
              textDecoration: "none",
              padding: "4px 6px",
              borderRadius: 8,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            GitHub <ExternalLink size={11} />
          </a>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        {/* ── Sidebar ── */}
        <aside
          style={{
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid var(--proof-border)",
            background: "rgba(10, 22, 40, 0.7)",
            backdropFilter: "blur(10px)",
            width: sidebarExpanded ? 200 : 52,
            transition: "width 0.2s cubic-bezier(0.4,0,0.2,1)",
            flexShrink: 0,
            overflow: "hidden",
          }}
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
        >
          <div
            style={{
              flex: 1,
              padding: "8px 0",
              display: "flex",
              flexDirection: "column",
              gap: 0,
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            {NAV_GROUPS.map((group, gi) => (
              <div key={group.title}>
                {gi > 0 && (
                  <div
                    style={{
                      margin: "6px 10px",
                      borderTop: "1px solid var(--proof-border)",
                      opacity: 0.6,
                    }}
                  />
                )}
                {sidebarExpanded && (
                  <div
                    style={{
                      padding: "6px 16px 3px",
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: "var(--proof-text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.8px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    }}
                  >
                    {group.title}
                  </div>
                )}
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={sidebarExpanded ? undefined : item.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: sidebarExpanded ? "8px 14px" : "9px 0",
                        justifyContent: sidebarExpanded ? "flex-start" : "center",
                        cursor: "pointer",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textDecoration: "none",
                        color: active ? "var(--proof-blue-bright)" : "var(--proof-text-secondary)",
                        background: active ? "rgba(59,130,246,0.1)" : "transparent",
                        borderLeft: active
                          ? "2px solid var(--proof-blue)"
                          : "2px solid transparent",
                        transition: "background 0.12s, color 0.12s, border-color 0.12s",
                        margin: "1px 0",
                        position: "relative",
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.background =
                            "rgba(59,130,246,0.06)";
                          (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          (e.currentTarget as HTMLElement).style.background = "transparent";
                          (e.currentTarget as HTMLElement).style.color =
                            "var(--proof-text-secondary)";
                        }
                      }}
                    >
                      <Icon
                        size={16}
                        style={{ flexShrink: 0, marginLeft: sidebarExpanded ? 0 : 0 }}
                      />
                      <span
                        style={{
                          marginLeft: 10,
                          fontSize: 12.5,
                          fontWeight: active ? 600 : 400,
                          opacity: sidebarExpanded ? 1 : 0,
                          transition: "opacity 0.15s",
                          overflow: "hidden",
                        }}
                      >
                        {item.label}
                      </span>
                      {item.badge && sidebarExpanded && (
                        <span
                          style={{
                            marginLeft: "auto",
                            fontSize: 8.5,
                            fontWeight: 700,
                            padding: "1px 5px",
                            background: "rgba(59,130,246,0.15)",
                            color: "var(--proof-blue-bright)",
                            borderRadius: 999,
                            border: "1px solid rgba(59,130,246,0.25)",
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>

        {/* ── Main content ── */}
        <main style={{ flex: 1, overflow: "auto", minWidth: 0, position: "relative" }}>
          <div
            style={
              fullBleed
                ? { height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }
                : { padding: "20px 24px", maxWidth: 1400, margin: "0 auto" }
            }
          >
            {children}
          </div>
        </main>
      </div>

      {/* ── Command palette ── */}
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}

      {/* ── Live toast ── */}
      {currentToast && (
        <div className="proof-toast" style={{ maxWidth: 420 }}>
          {currentToast.type === "success" ? (
            <Check size={14} style={{ color: "#34d399" }} />
          ) : currentToast.type === "warning" ? (
            <AlertTriangle size={14} style={{ color: "#fbbf24" }} />
          ) : (
            <Activity size={14} style={{ color: "#60a5fa" }} />
          )}
          <span style={{ flex: 1 }}>{currentToast.message}</span>
          <button
            onClick={dismissToast}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--proof-text-muted)",
              padding: 2,
            }}
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
