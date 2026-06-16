import React, { useSyncExternalStore } from "react";
import { Search, Bell, Sun, Moon, ExternalLink, Menu, Activity } from "lucide-react";
import { EnvSelector } from "./EnvSelector";
import {
  getSelectedEnvSnapshot,
  setSelectedEnvIds,
  subscribeToSelectedEnv,
} from "@/lib/selectedEnv";

interface ConsoleTopBarProps {
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
  onSearchOpen?: () => void;
}

export function ConsoleTopBar({
  onToggleSidebar,
  onSearchOpen,
}: ConsoleTopBarProps) {
  const [isDark, setIsDark] = React.useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("proof-theme");
      return saved !== null ? saved === "dark" : true;
    } catch { return true; }
  });

  const selectedEnvSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);

  React.useEffect(() => {
    if (isDark) document.documentElement.classList.remove("light");
    else document.documentElement.classList.add("light");
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    try { localStorage.setItem("proof-theme", next ? "dark" : "light"); } catch { /* */ }
    if (next) document.documentElement.classList.remove("light");
    else document.documentElement.classList.add("light");
  };

  const iconBtn: React.CSSProperties = {
    width: 32, height: 32, padding: 0,
    border: "none", background: "transparent", cursor: "pointer",
    color: "var(--proof-text-secondary)",
    display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: 8,
    transition: "background 0.13s, color 0.13s",
    flexShrink: 0,
  };

  return (
    <header style={{
      height: "var(--proof-console-topbar-height)",
      background: "var(--proof-topbar-bg)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      borderBottom: "1px solid var(--proof-border)",
      display: "flex", alignItems: "center",
      padding: "0 12px 0 8px", gap: 6,
      position: "fixed", top: 0, left: 0, right: 0,
      zIndex: 100, flexShrink: 0,
    }}>
      {/* Hamburger */}
      {onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          style={iconBtn}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--proof-console-nav-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--proof-text)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)"; }}
        >
          <Menu size={17} />
        </button>
      )}

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginRight: 4, padding: "0 4px" }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #06b6d4 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(59,130,246,0.4)",
          flexShrink: 0,
        }}>
          <Activity size={13} style={{ color: "white" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1, gap: 1 }}>
          <span style={{
            fontWeight: 800, fontSize: 12.5, color: "var(--proof-text)",
            letterSpacing: "1.8px", fontFamily: "var(--font-mono)",
          }}>
            A.W.A.R.E.
          </span>
          <span style={{
            fontSize: 7, color: "var(--proof-blue-bright)",
            textTransform: "uppercase", letterSpacing: "1.8px", fontWeight: 600,
            opacity: 0.8,
          }}>
            CDN Observability
          </span>
        </div>
      </div>

      {/* Separator */}
      <div style={{ width: 1, height: 20, background: "var(--proof-border)", flexShrink: 0, margin: "0 4px" }} />

      {/* Search bar */}
      <div
        onClick={onSearchOpen}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter" && onSearchOpen) onSearchOpen(); }}
        style={{
          flex: 1, maxWidth: 440,
          display: "flex", alignItems: "center", gap: 7,
          border: "1px solid var(--proof-border)",
          borderRadius: 8, padding: "0 10px", height: 30,
          background: "var(--proof-subtle-bg)",
          margin: "0 8px", cursor: "pointer",
          transition: "border-color 0.13s, background 0.13s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border-accent)"; (e.currentTarget as HTMLElement).style.background = "var(--proof-blue-bg)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border)"; (e.currentTarget as HTMLElement).style.background = "var(--proof-subtle-bg)"; }}
      >
        <Search size={12} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 12, color: "var(--proof-text-muted)", fontFamily: "var(--font-sans)", letterSpacing: "-0.1px" }}>
          Search runs, tests, environments…
        </span>
        <kbd style={{
          fontSize: 9, border: "1px solid var(--proof-border-strong)", borderRadius: 4,
          padding: "1px 5px", fontFamily: "var(--font-mono)", color: "var(--proof-text-muted)",
          background: "var(--proof-subtle-bg2)", lineHeight: "14px", flexShrink: 0,
        }}>⌘K</kbd>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto", flexShrink: 0 }}>
        <EnvSelector
          variant="topbar"
          currentEnvIds={selectedEnvSnap.envIds}
          onEnvChange={(ids) => setSelectedEnvIds(ids)}
        />

        <button
          aria-label="Notifications"
          style={iconBtn}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--proof-console-nav-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--proof-text)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)"; }}
        >
          <Bell size={15} />
        </button>

        <button
          onClick={toggleTheme}
          title={isDark ? "Light mode" : "Dark mode"}
          style={iconBtn}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--proof-console-nav-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--proof-text)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)"; }}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <div style={{ width: 1, height: 18, background: "var(--proof-border)", margin: "0 2px" }} />

        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 11.5, fontWeight: 500, color: "var(--proof-text-secondary)",
            textDecoration: "none", padding: "4px 8px", borderRadius: 7,
            transition: "background 0.13s, color 0.13s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--proof-console-nav-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--proof-text)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)"; }}
        >
          GitHub <ExternalLink size={10} />
        </a>
      </div>
    </header>
  );
}
