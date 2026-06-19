import React from "react";
import { useLocation } from "wouter";
import { Search, Sun, Moon, WifiOff } from "lucide-react";
import { useDataInit } from "@/lib/hooks/useData";

interface ConsoleTopBarProps {
  onSearchOpen: () => void;
}

function routeLabel(path: string): string {
  if (path === "/") return "Dashboard";
  if (path.startsWith("/runs/")) return "Run Detail";
  if (path.startsWith("/runs")) return "Runs";
  if (path.startsWith("/compare")) return "Compare";
  if (path.startsWith("/trends")) return "Trends";
  if (path.startsWith("/copilot")) return "Copilot";
  if (path.startsWith("/about")) return "About";
  if (path.startsWith("/tests")) return "Tests";
  if (path.startsWith("/start")) return "Start Run";
  if (path.startsWith("/share")) return "Sharing";
  return "A.W.A.R.E.";
}

export function ConsoleTopBar({ onSearchOpen }: ConsoleTopBarProps) {
  const [location] = useLocation();
  const dataState = useDataInit();

  const [isDark, setIsDark] = React.useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("proof-theme");
      return saved !== null ? saved === "dark" : true;
    } catch {
      return true;
    }
  });

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    try {
      localStorage.setItem("proof-theme", next ? "dark" : "light");
    } catch { /* ignore */ }
    if (next) document.documentElement.classList.remove("light");
    else document.documentElement.classList.add("light");
  };

  const label = routeLabel(location);

  return (
    <header
      style={{
        height: "var(--proof-title-bar-height)",
        minHeight: "var(--proof-title-bar-height)",
        background: "var(--proof-title-bar-bg)",
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        gap: 8,
        flexShrink: 0,
        userSelect: "none",
        borderBottom: "1px solid var(--proof-border)",
      }}
    >
      {/* App logo + title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: 5,
            background: "var(--proof-blue)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </span>
        <span
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: "var(--proof-text)",
            letterSpacing: "-0.2px",
          }}
        >
          A.W.A.R.E.
        </span>
      </div>

      {/* Separator + breadcrumb */}
      <span style={{ color: "var(--proof-border-strong)", fontSize: 14, margin: "0 1px", fontWeight: 300 }}>
        /
      </span>
      <span
        style={{
          fontSize: 12.5,
          color: "var(--proof-text-secondary)",
          fontWeight: 500,
          letterSpacing: "-0.1px",
        }}
      >
        {label}
      </span>

      {/* Data status indicator */}
      {dataState.loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "2px 8px",
            borderRadius: "var(--proof-radius-full)",
            background: "var(--proof-blue-bg)",
            border: "1px solid var(--proof-blue-border)",
            fontSize: 10.5,
            fontWeight: 500,
            color: "var(--proof-blue-bright)",
            marginLeft: 4,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "var(--proof-blue-bright)",
              animation: "badge-pulse 1s ease-in-out infinite",
              display: "inline-block",
            }}
          />
          Loading data…
        </div>
      )}
      {!!dataState.error && !dataState.loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "2px 8px",
            borderRadius: "var(--proof-radius-full)",
            background: "var(--proof-red-bg)",
            border: "1px solid var(--proof-red-border)",
            fontSize: 10.5,
            fontWeight: 500,
            color: "var(--proof-red-bright)",
            marginLeft: 4,
          }}
        >
          <WifiOff size={10} />
          Data error
        </div>
      )}
      {dataState.loaded && !dataState.error && dataState.loaded && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 7px",
            borderRadius: "var(--proof-radius-full)",
            background: "var(--proof-green-bg)",
            fontSize: 10,
            fontWeight: 600,
            color: "var(--proof-green)",
            marginLeft: 4,
            letterSpacing: "0.2px",
          }}
        >
          <span
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "var(--proof-green)",
              display: "inline-block",
            }}
          />
          Live
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Search trigger */}
      <button
        onClick={onSearchOpen}
        title="Search (⌘K)"
        aria-label="Open command palette"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "3px 10px",
          fontSize: 12,
          cursor: "pointer",
          border: "1px solid var(--proof-border)",
          borderRadius: "var(--proof-radius)",
          background: "var(--proof-surface-2)",
          color: "var(--proof-text-secondary)",
          transition: "all var(--proof-transition)",
          lineHeight: "16px",
          fontFamily: "var(--font-sans)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border-strong)";
          (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
          (e.currentTarget as HTMLElement).style.background = "var(--proof-surface-3)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border)";
          (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)";
          (e.currentTarget as HTMLElement).style.background = "var(--proof-surface-2)";
        }}
      >
        <Search size={11} />
        <span>Search</span>
        <kbd
          style={{
            fontSize: 9,
            border: "1px solid var(--proof-border-strong)",
            borderRadius: 3,
            padding: "0 4px",
            fontFamily: "var(--font-mono)",
            lineHeight: "14px",
            opacity: 0.6,
            background: "var(--proof-surface-3)",
          }}
        >
          ⌘K
        </kbd>
      </button>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        aria-label="Toggle theme"
        style={{
          width: 28,
          height: 28,
          padding: 0,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          color: "var(--proof-text-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--proof-radius)",
          transition: "all var(--proof-transition)",
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
        {isDark ? <Sun size={13} /> : <Moon size={13} />}
      </button>
    </header>
  );
}
