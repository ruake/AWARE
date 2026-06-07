import React from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, List, GitCompare, Bug, Play,
  Activity, Bell, Search, Menu, Moon, Sun, ExternalLink,
  Check, AlertTriangle, Info, Bot, BarChart3, FolderTree,
} from "lucide-react";
import { CommandPalette } from "./CommandPalette";
import { useLiveStatus } from "@/lib/useLiveStatus";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/runs", label: "Runs", icon: List },
  { href: "/compare", label: "Compare", icon: GitCompare },
  { href: "/tests", label: "Tests", icon: Bug },
  { href: "/suites", label: "Suites", icon: FolderTree },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/copilot", label: "AI Copilot", icon: Bot },
  { href: "/start", label: "Start Run", icon: Play },
  { href: "/status", label: "Status", icon: Activity },
  { href: "/about", label: "About", icon: Info },
];

export function AppLayout({ children, activeHref }: { children: React.ReactNode; activeHref?: string }) {
  const [location] = useLocation();
  const [isDark, setIsDark] = React.useState(false);
  const [sidebarExpanded, setSidebarExpanded] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const { currentToast, dismissToast, pendingCount, clearCount } = useLiveStatus();
  const current = activeHref ?? location;

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen(p => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const isActive = (href: string) =>
    href === "/" ? current === "/" : current === href || current.startsWith(href + "/");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--gcp-grey-bg)", color: "var(--gcp-text)" }}>

      {/* Top Nav */}
      <header style={{
        height: 56, background: "var(--gcp-surface)",
        borderBottom: "1px solid var(--gcp-grey)",
        display: "flex", alignItems: "center", padding: "0 16px", gap: 12,
        position: "sticky", top: 0, zIndex: 100, flexShrink: 0,
        boxShadow: "0 1px 3px rgba(60,64,67,0.12)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, background: "var(--gcp-blue)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "white", fontWeight: 800, fontSize: 13, letterSpacing: "-0.5px" }}>AW</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: "var(--gcp-text)", letterSpacing: "-0.3px" }}>A.W.A.K.E.</span>
            <span style={{ fontSize: 9, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>CDN Observability</span>
          </div>
        </div>

        {/* Desktop top nav */}
        <nav style={{ display: "flex", height: "100%", overflowX: "auto", flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "0 14px", height: "100%", cursor: "pointer",
                fontSize: 13, fontWeight: active ? 600 : 400,
                color: active ? "var(--gcp-blue)" : "var(--gcp-text-secondary)",
                borderBottom: `2px solid ${active ? "var(--gcp-blue)" : "transparent"}`,
                textDecoration: "none", whiteSpace: "nowrap", transition: "color 0.15s, border-color 0.15s",
                flexShrink: 0,
              }}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", flexShrink: 0 }}>
          {/* ⌘K search button */}
          <button
            onClick={() => setPaletteOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 10px", fontSize: 12, cursor: "pointer",
              border: "1px solid var(--gcp-grey)", borderRadius: 4,
              background: "var(--gcp-grey-bg)", color: "var(--gcp-text-secondary)",
              whiteSpace: "nowrap",
            }}
          >
            <Search size={12} />
            <span>Search</span>
            <kbd style={{ fontSize: 10, border: "1px solid var(--gcp-grey)", borderRadius: 3, padding: "0 4px", fontFamily: "var(--font-mono)", lineHeight: "16px" }}>⌘K</kbd>
          </button>

          {/* Bell */}
          <button
            onClick={clearCount}
            title={`${pendingCount} live updates`}
            style={{ position: "relative", padding: 6, border: "none", background: "transparent", cursor: "pointer", color: "var(--gcp-text-secondary)", display: "flex", alignItems: "center" }}
          >
            <Bell size={18} />
            {pendingCount > 0 && (
              <span style={{
                position: "absolute", top: 1, right: 1,
                width: 16, height: 16, borderRadius: "50%",
                background: "var(--gcp-red)", color: "white",
                fontSize: 9, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </button>

          {/* Dark mode */}
          <button
            onClick={toggleTheme}
            style={{ padding: 6, border: "none", background: "transparent", cursor: "pointer", color: "var(--gcp-text-secondary)", display: "flex", alignItems: "center" }}
            title="Toggle dark mode"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* GitHub */}
          <a
            href="https://github.com"
            target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--gcp-blue)", textDecoration: "none", padding: "4px 6px" }}
          >
            GitHub <ExternalLink size={12} />
          </a>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <aside
          style={{
            display: "flex", flexDirection: "column",
            borderRight: "1px solid var(--gcp-grey)", background: "var(--gcp-surface)",
            width: sidebarExpanded ? 184 : 52,
            transition: "width 0.25s ease", flexShrink: 0, overflow: "hidden",
          }}
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
        >
          <div style={{ padding: "8px 0" }}>
            <button
              onClick={() => setSidebarExpanded(e => !e)}
              style={{ width: "100%", display: "flex", justifyContent: "center", padding: 12, border: "none", background: "transparent", cursor: "pointer", color: "var(--gcp-text-secondary)" }}
            >
              <Menu size={20} />
            </button>
          </div>
          <div style={{ flex: 1, padding: "4px 0", display: "flex", flexDirection: "column", gap: 2 }}>
            {NAV_ITEMS.map(item => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} style={{
                  display: "flex", alignItems: "center",
                  padding: "10px 16px", cursor: "pointer",
                  overflow: "hidden", whiteSpace: "nowrap",
                  textDecoration: "none",
                  color: active ? "var(--gcp-blue)" : "var(--gcp-text-secondary)",
                  background: active ? "var(--gcp-blue-bg)" : "transparent",
                  transition: "background 0.15s, color 0.15s",
                }}>
                  <Icon size={20} style={{ flexShrink: 0 }} />
                  <span style={{
                    marginLeft: 14, fontSize: 13, fontWeight: active ? 600 : 400,
                    opacity: sidebarExpanded ? 1 : 0,
                    transition: "opacity 0.2s",
                  }}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
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
            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 18px", borderRadius: 10, zIndex: 50,
            cursor: "pointer", boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            border: `1px solid ${currentToast.type === "success" ? "var(--gcp-green)" : currentToast.type === "warning" ? "var(--gcp-yellow)" : "var(--gcp-blue)"}`,
            background: currentToast.type === "success" ? "var(--gcp-green-bg)" : currentToast.type === "warning" ? "var(--gcp-yellow-bg)" : "var(--gcp-blue-bg)",
            color: currentToast.type === "success" ? "var(--gcp-green)" : currentToast.type === "warning" ? "var(--gcp-yellow)" : "var(--gcp-blue)",
            fontSize: 13, fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {currentToast.type === "success" ? <Check size={15} /> : currentToast.type === "warning" ? <AlertTriangle size={15} /> : <Activity size={15} />}
          {currentToast.message}
          <button
            onClick={e => { e.stopPropagation(); dismissToast(); }}
            style={{ marginLeft: 6, background: "none", border: "none", cursor: "pointer", fontSize: 16, opacity: 0.6, lineHeight: 1, color: "inherit" }}
          >×</button>
        </div>
      )}
    </div>
  );
}

