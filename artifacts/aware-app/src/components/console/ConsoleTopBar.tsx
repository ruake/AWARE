import React, { useSyncExternalStore } from "react";
import { Search, Bell, Sun, Moon, ExternalLink, Menu, Zap } from "lucide-react";
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
  sidebarCollapsed: _sidebarCollapsed,
  onSearchOpen,
}: ConsoleTopBarProps) {
  const [isDark, setIsDark] = React.useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("proof-theme");
      return saved !== null ? saved === "dark" : true;
    } catch {
      return true;
    }
  });

  const selectedEnvSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);

  const handleEnvChange = (envIds: string[]) => {
    setSelectedEnvIds(envIds);
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    try {
      localStorage.setItem("proof-theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
    if (next) {
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
    }
  };

  const iconBtnStyle: React.CSSProperties = {
    padding: 7,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: "var(--proof-text-secondary)",
    display: "flex",
    alignItems: "center",
    borderRadius: 8,
    transition: "background 0.15s, color 0.15s",
  };

  return (
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
        gap: 8,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        flexShrink: 0,
        boxShadow: "0 1px 0 rgba(59,130,246,0.08), 0 4px 16px rgba(0,0,0,0.4)",
      }}
    >
      {/* Hamburger */}
      {onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
          style={iconBtnStyle}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "var(--proof-text)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)"; }}
        >
          <Menu size={18} />
        </button>
      )}

      {/* Logo + branding */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0, marginRight: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: "linear-gradient(135deg, #2563eb, #3b82f6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(59,130,246,0.4)",
          flexShrink: 0,
        }}>
          <Zap size={14} style={{ color: "white" }} fill="white" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span style={{
            fontWeight: 800, fontSize: 13,
            color: "var(--proof-text)",
            letterSpacing: "1.5px",
            fontFamily: "var(--font-mono)",
          }}>
            A.W.A.R.E.
          </span>
          <span style={{
            fontSize: 7.5, color: "var(--proof-blue-bright)",
            textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 600,
          }}>
            CDN Observability
          </span>
        </div>
      </div>

      {/* Search bar — opens CommandPalette */}
      <div
        onClick={onSearchOpen}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter" && onSearchOpen) onSearchOpen(); }}
        style={{
          flex: 1, maxWidth: 460,
          display: "flex", alignItems: "center", gap: 7,
          border: "1px solid var(--proof-border)",
          borderRadius: 9, padding: "0 11px", height: 32,
          background: "rgba(255,255,255,0.025)",
          margin: "0 auto", cursor: "pointer",
          transition: "border-color 0.15s, background 0.15s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(59,130,246,0.35)"; (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.04)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)"; }}
      >
        <Search size={13} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 12, color: "var(--proof-text-muted)", fontFamily: "var(--font-sans)" }}>
          Search runs, tests, environments…
        </span>
        <div style={{ display: "flex", gap: 3 }}>
          <kbd style={{ fontSize: 9, border: "1px solid var(--proof-border)", borderRadius: 4, padding: "1px 5px", fontFamily: "var(--font-mono)", color: "var(--proof-text-muted)", background: "rgba(255,255,255,0.03)", lineHeight: "14px" }}>⌘K</kbd>
        </div>
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: "auto", flexShrink: 0 }}>
        <EnvSelector
          variant="topbar"
          currentEnvIds={selectedEnvSnap.envIds}
          onEnvChange={handleEnvChange}
        />

        <button
          aria-label="Notifications"
          style={iconBtnStyle}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "var(--proof-text)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)"; }}
        >
          <Bell size={16} />
        </button>

        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          style={iconBtnStyle}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "var(--proof-text)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)"; }}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", gap: 3,
            fontSize: 11.5, fontWeight: 500, color: "var(--proof-blue-bright)",
            textDecoration: "none", padding: "5px 8px", borderRadius: 8,
            transition: "background 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.08)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          GitHub <ExternalLink size={11} />
        </a>
      </div>
    </header>
  );
}
