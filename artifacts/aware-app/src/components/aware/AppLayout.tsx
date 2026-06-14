import React from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  List,
  GitCompare,
  Activity,
  Bell,
  Search,
  Menu,
  Moon,
  Sun,
  ExternalLink,
  Check,
  AlertTriangle,
  Info,
  Bot,
  BarChart3,
  FolderTree,
  Cpu,
  Radio,
  X,
} from "lucide-react";
import { CommandPalette } from "./CommandPalette";
import { ProofLogo } from "./ProofLogo";

import { useLiveStatus } from "@/lib/useLiveStatus";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
}

const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pulse", label: "Pulse", icon: Radio },
  { href: "/runs", label: "Runs", icon: List },
  { href: "/compare", label: "Compare", icon: GitCompare },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/suites", label: "Suites", icon: FolderTree },
  { href: "/copilot", label: "Copilot", icon: Bot },
];

const SECONDARY_NAV: NavItem[] = [
  { href: "/ci-pipeline", label: "CI Pipeline", icon: Cpu },
  { href: "/about", label: "About", icon: Info },
];

export function AppLayout({
  children,
  activeHref,
  fullBleed = false,
}: {
  children: React.ReactNode;
  activeHref?: string;
  /** Remove main content padding for pages that manage their own layout */
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
  const [navSearch, setNavSearch] = React.useState("");
  const [searchHovered, setSearchHovered] = React.useState(false);
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
    if (isDark) {
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
    }
  }, [isDark]);
  const current = activeHref ?? location;

  // Single persistent keyboard handler using refs to avoid re-attachment
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
          p: "/pulse",
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
      /* ignore localStorage write errors */
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
        background: "var(--proof-grey-bg)",
        color: "var(--proof-text)",
      }}
    >
      {/* Top Nav */}
      <header
        style={{
          height: 54,
          background: "var(--proof-surface)",
          borderBottom: "1px solid var(--proof-border)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 100,
          flexShrink: 0,
          boxShadow: "0 1px 12px rgba(0,0,0,0.3)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
          <ProofLogo />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span
              style={{
                fontWeight: 800,
                fontSize: 16,
                color: "var(--proof-text)",
                letterSpacing: "1px",
                fontFamily: "var(--font-mono)",
              }}
            >
              A.W.A.R.E.
            </span>
            <span
              style={{
                fontSize: 8,
                color: "var(--proof-blue)",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                fontWeight: 700,
              }}
            >
              Akamai CDN Observability
            </span>
          </div>
        </div>

        {/* Desktop top nav — primary items only */}
        <nav style={{ display: "flex", height: "100%", overflowX: "auto", flex: 1 }}>
          {PRIMARY_NAV.map((item) => {
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
                  padding: "0 14px",
                  height: "100%",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--proof-blue)" : "var(--proof-text-secondary)",
                  borderBottom: `2px solid ${active ? "var(--proof-blue)" : "transparent"}`,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s, border-color 0.15s, background 0.15s",
                  flexShrink: 0,
                }}
              >
                <Icon size={13} style={{ opacity: active ? 1 : 0.65, flexShrink: 0 }} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginLeft: "auto",
            flexShrink: 0,
          }}
        >
          {/* ⌘K search button */}
          <button
            onClick={() => setPaletteOpen(true)}
            onMouseEnter={() => setSearchHovered(true)}
            onMouseLeave={() => setSearchHovered(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              fontSize: 12,
              cursor: "pointer",
              border: "1px solid var(--proof-border-strong)",
              borderRadius: 7,
              background: searchHovered ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
              color: searchHovered ? "var(--proof-text)" : "var(--proof-text-secondary)",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
            }}
          >
            <Search size={13} />
            <span style={{ fontWeight: 500 }}>Search</span>
            <kbd
              style={{
                fontSize: 10,
                border: "1px solid var(--proof-border-strong)",
                borderRadius: 4,
                padding: "1px 5px",
                fontFamily: "var(--font-mono)",
                lineHeight: "15px",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              ⌘K
            </kbd>
          </button>

          {/* Bell + Notification dropdown */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button
              onClick={() => {
                setShowNotifs((p) => !p);
                clearCount();
              }}
              aria-label="Notifications"
              title={`${pendingCount} live updates`}
              style={{
                position: "relative",
                padding: 6,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "var(--proof-text-secondary)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Bell size={18} />
              {pendingCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 1,
                    right: 1,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "var(--proof-red)",
                    color: "white",
                    fontSize: 9,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
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
                  top: "100%",
                  right: 0,
                  marginTop: 6,
                  width: 320,
                  maxHeight: 360,
                  overflow: "auto",
                  background: "var(--proof-surface)",
                  border: "1px solid var(--proof-grey)",
                  borderRadius: 8,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                  zIndex: 200,
                  animation: "slide-up 0.15s ease-out",
                }}
              >
                <div
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid var(--proof-grey)",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--proof-text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Notifications
                </div>
                {updates.length === 0 && (
                  <div
                    style={{
                      padding: "20px 12px",
                      textAlign: "center",
                      fontSize: 12,
                      color: "var(--proof-text-secondary)",
                    }}
                  >
                    No notifications yet
                  </div>
                )}
                {updates.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      padding: "10px 12px",
                      borderBottom: "1px solid var(--proof-grey)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      {u.type === "success" ? (
                        <Check
                          size={14}
                          style={{ color: "var(--proof-green)", flexShrink: 0, marginTop: 1 }}
                        />
                      ) : u.type === "warning" ? (
                        <AlertTriangle
                          size={14}
                          style={{ color: "var(--proof-yellow)", flexShrink: 0, marginTop: 1 }}
                        />
                      ) : (
                        <Activity
                          size={14}
                          style={{ color: "var(--proof-blue)", flexShrink: 0, marginTop: 1 }}
                        />
                      )}
                      <span style={{ flex: 1, fontSize: 12, lineHeight: 1.4 }}>{u.message}</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, paddingLeft: 22 }}>
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
                              ? "var(--proof-green)"
                              : u.type === "warning"
                                ? "var(--proof-yellow)"
                                : "var(--proof-blue)",
                          background: "none",
                          border: `1px solid ${u.type === "success" ? "rgba(34,197,94,0.25)" : u.type === "warning" ? "rgba(245,158,11,0.25)" : "rgba(91,138,245,0.25)"}`,
                          borderRadius: 5,
                          padding: "2px 8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        View Run →
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
                          borderRadius: 5,
                          padding: "2px 8px",
                          cursor: "pointer",
                        }}
                      >
                        Compare
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dark mode */}
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
            }}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
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
              color: "var(--proof-blue)",
              textDecoration: "none",
              padding: "4px 6px",
            }}
          >
            GitHub <ExternalLink size={12} />
          </a>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        {/* Sidebar */}
        <aside
          style={{
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid var(--proof-grey)",
            background: "var(--proof-surface)",
            width: sidebarExpanded ? 184 : 52,
            transition: "width 0.25s ease",
            flexShrink: 0,
            overflow: "hidden",
          }}
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
        >
          <div
            style={{
              padding: "6px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => setSidebarExpanded((e) => !e)}
              aria-label="Toggle menu"
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                padding: 10,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "var(--proof-text-secondary)",
              }}
            >
              <Menu size={20} />
            </button>
          </div>
          {sidebarExpanded && (
            <div style={{ padding: "0 10px 6px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  border: "1px solid var(--proof-grey)",
                  borderRadius: 4,
                  padding: "4px 8px",
                  background: "var(--proof-grey-bg)",
                }}
              >
                <Search size={12} style={{ color: "var(--proof-text-secondary)", flexShrink: 0 }} />
                <input
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  placeholder="Filter nav..."
                  style={{
                    border: "none",
                    outline: "none",
                    fontSize: 11,
                    background: "transparent",
                    flex: 1,
                    minWidth: 0,
                    color: "var(--proof-text)",
                  }}
                />
              </div>
            </div>
          )}
          <div
            style={{ flex: 1, padding: "4px 0", display: "flex", flexDirection: "column", gap: 2 }}
          >
            {/* Primary nav */}
            {PRIMARY_NAV.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              if (navSearch && !item.label.toLowerCase().includes(navSearch.toLowerCase()))
                return null;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={sidebarExpanded ? undefined : item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "9px 16px",
                    cursor: "pointer",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textDecoration: "none",
                    color: active ? "var(--proof-blue)" : "var(--proof-text-secondary)",
                    background: active ? "rgba(91,138,245,0.10)" : "transparent",
                    boxShadow: active ? "inset 3px 0 0 var(--proof-blue)" : "none",
                    borderRadius: "0 8px 8px 0",
                    marginRight: 6,
                    transition: "background 0.15s, color 0.15s, box-shadow 0.15s",
                  }}
                >
                  <Icon size={18} style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      marginLeft: 13,
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      opacity: sidebarExpanded ? 1 : 0,
                      transition: "opacity 0.2s",
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}

            {/* Divider between primary and secondary */}
            {!navSearch && (
              <div
                style={{
                  margin: "6px 10px",
                  borderTop: "1px solid var(--proof-border)",
                  opacity: 0.5,
                }}
              />
            )}

            {/* Secondary nav */}
            {SECONDARY_NAV.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              if (navSearch && !item.label.toLowerCase().includes(navSearch.toLowerCase()))
                return null;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={sidebarExpanded ? undefined : item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 16px",
                    cursor: "pointer",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textDecoration: "none",
                    color: active ? "var(--proof-blue)" : "var(--proof-text-secondary)",
                    background: active ? "rgba(91,138,245,0.10)" : "transparent",
                    boxShadow: active ? "inset 3px 0 0 var(--proof-blue)" : "none",
                    borderRadius: "0 8px 8px 0",
                    marginRight: 6,
                    opacity: active ? 1 : 0.7,
                    transition: "background 0.15s, color 0.15s, box-shadow 0.15s, opacity 0.15s",
                  }}
                >
                  <Icon size={16} style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      marginLeft: 13,
                      fontSize: 12,
                      fontWeight: active ? 600 : 400,
                      opacity: sidebarExpanded ? 1 : 0,
                      transition: "opacity 0.2s",
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Main content */}
        <main
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: fullBleed ? "hidden" : "auto",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
            padding: fullBleed ? 0 : "0 24px 20px",
          }}
        >
          {children}
        </main>
      </div>

      {/* Command Palette */}
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}

      {/* Live status toast */}
      {currentToast && (
        <div
          onClick={dismissToast}
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 18px",
            borderRadius: 10,
            zIndex: 50,
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            border: `1px solid ${currentToast.type === "success" ? "var(--proof-green)" : currentToast.type === "warning" ? "var(--proof-yellow)" : "var(--proof-blue)"}`,
            background:
              currentToast.type === "success"
                ? "var(--proof-green-bg)"
                : currentToast.type === "warning"
                  ? "var(--proof-yellow-bg)"
                  : "var(--proof-blue-bg)",
            color:
              currentToast.type === "success"
                ? "var(--proof-green)"
                : currentToast.type === "warning"
                  ? "var(--proof-yellow)"
                  : "var(--proof-blue)",
            fontSize: 13,
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {currentToast.type === "success" ? (
            <Check size={15} />
          ) : currentToast.type === "warning" ? (
            <AlertTriangle size={15} />
          ) : (
            <Activity size={15} />
          )}
          {currentToast.message}
          <button
            onClick={(e) => {
              e.stopPropagation();
              dismissToast();
            }}
            aria-label="Close"
            style={{
              marginLeft: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 16,
              opacity: 0.6,
              lineHeight: 1,
              color: "inherit",
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
