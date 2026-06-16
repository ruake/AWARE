import React from "react";
import { useLocation } from "wouter";
import { Search, Sun, Moon } from "lucide-react";

interface ConsoleTopBarProps {
  onSearchOpen: () => void;
}

export function ConsoleTopBar({ onSearchOpen }: ConsoleTopBarProps) {
  const [location] = useLocation();
  const [isDark, setIsDark] = React.useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("proof-theme");
      return saved !== null ? saved === "dark" : true;
    } catch {
      return true;
    }
  });

  const routeLabel = (() => {
    const path = location;
    if (path === "/") return "Dashboard";
    if (path.startsWith("/runs")) return path === "/runs" ? "Runs" : "Run Detail";
    if (path.startsWith("/compare")) return "Compare";
    if (path.startsWith("/trends")) return "Trends";
    if (path.startsWith("/copilot")) return "Copilot";
    if (path.startsWith("/about")) return "About";
    if (path.startsWith("/tests")) return "Tests";
    if (path.startsWith("/start")) return "Start Run";
    if (path.startsWith("/share")) return "Sharing";
    return "A.W.A.R.E.";
  })();

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    try {
      localStorage.setItem("proof-theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
    if (next) document.documentElement.classList.remove("light");
    else document.documentElement.classList.add("light");
  };

  return (
    <header
      style={{
        height: "var(--proof-title-bar-height)",
        minHeight: "var(--proof-title-bar-height)",
        background: "var(--proof-title-bar-bg)",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        gap: 8,
        flexShrink: 0,
        userSelect: "none",
        borderBottom: "1px solid var(--proof-border)",
      }}
    >
      {/* App title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
          fontSize: 12,
          fontWeight: 600,
          color: "var(--proof-text-secondary)",
          letterSpacing: "0.5px",
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: 3,
            background: "var(--proof-blue)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </span>
        <span style={{ color: "var(--proof-text)", fontWeight: 500 }}>A.W.A.R.E.</span>
      </div>

      {/* Separator */}
      <span style={{ color: "var(--proof-text-muted)", fontSize: 11, margin: "0 2px" }}>/</span>

      {/* Current route label */}
      <span style={{ fontSize: 12, color: "var(--proof-text)", fontWeight: 400 }}>
        {routeLabel}
      </span>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Search */}
      <button
        onClick={onSearchOpen}
        title="Search (⌘K)"
        aria-label="Search"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "2px 8px",
          fontSize: 12,
          cursor: "pointer",
          border: "1px solid var(--proof-border)",
          borderRadius: 4,
          background: "transparent",
          color: "var(--proof-text-secondary)",
          transition: "all 0.1s",
          lineHeight: "18px",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border-strong)";
          (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border)";
          (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)";
        }}
      >
        <Search size={11} />
        <span>Search</span>
        <kbd
          style={{
            fontSize: 9,
            border: "1px solid var(--proof-border)",
            borderRadius: 2,
            padding: "0 4px",
            fontFamily: "var(--font-mono)",
            lineHeight: "14px",
            opacity: 0.7,
          }}
        >
          ⌘K
        </kbd>
      </button>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={isDark ? "Light mode" : "Dark mode"}
        aria-label="Toggle theme"
        style={{
          padding: 4,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          color: "var(--proof-text-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 4,
          transition: "all 0.1s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
          (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)";
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }}
      >
        {isDark ? <Sun size={14} /> : <Moon size={14} />}
      </button>
    </header>
  );
}
