import React, { useSyncExternalStore } from "react";
import { Search, Bell, Sun, Moon, ExternalLink, Menu } from "lucide-react";
import { ProofLogo } from "../aware/ProofLogo";
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

  return (
    <header
      style={{
        height: 48,
        background: "var(--proof-surface)",
        borderBottom: "1px solid var(--proof-border)",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        gap: 8,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        flexShrink: 0,
      }}
    >
      {/* Sidebar toggle */}
      {onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 6,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--proof-text-secondary)",
            borderRadius: 4,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--proof-surface-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <Menu size={18} />
        </button>
      )}

      {/* Logo + branding */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
          marginRight: 12,
        }}
      >
        <ProofLogo size={26} />
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: 14,
              color: "var(--proof-text)",
              letterSpacing: "0.5px",
              fontFamily: "var(--font-mono)",
            }}
          >
            PROOF
          </span>
        </div>
      </div>

      {/* Search bar — clickable to open CommandPalette */}
      <div
        onClick={onSearchOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onSearchOpen) onSearchOpen();
        }}
        style={{
          flex: 1,
          maxWidth: 480,
          display: "flex",
          alignItems: "center",
          gap: 6,
          border: "1px solid var(--proof-border-strong)",
          borderRadius: 6,
          padding: "0 10px",
          height: 30,
          background: "rgba(255,255,255,0.03)",
          margin: "0 auto",
          cursor: "pointer",
          transition: "border-color 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--proof-blue)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--proof-border-strong)";
        }}
      >
        <Search size={14} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
        <span
          className="proof-console-search-text"
          style={{
            flex: 1,
            fontSize: 12,
            color: "var(--proof-text-muted)",
            textAlign: "left",
            fontFamily: "var(--font-sans)",
          }}
        >
          Search services, features, docs...
        </span>
        <kbd
          style={{
            fontSize: 9,
            border: "1px solid var(--proof-border-strong)",
            borderRadius: 3,
            padding: "1px 4px",
            fontFamily: "var(--font-mono)",
            color: "var(--proof-text-muted)",
            background: "rgba(255,255,255,0.04)",
            lineHeight: "14px",
          }}
        >
          /
        </kbd>
      </div>

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
        {/* Environment selector */}
        <EnvSelector
          variant="topbar"
          currentEnvIds={selectedEnvSnap.envIds}
          onEnvChange={handleEnvChange}
        />

        {/* Notification bell */}
        <button
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
            borderRadius: 4,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--proof-surface-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <Bell size={16} />
        </button>

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
            borderRadius: 4,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--proof-surface-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* GitHub link */}
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            fontSize: 11,
            color: "var(--proof-blue)",
            textDecoration: "none",
            padding: "4px 6px",
            borderRadius: 4,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(37,99,235,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          GitHub <ExternalLink size={11} />
        </a>
      </div>
    </header>
  );
}
