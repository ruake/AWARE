import React, { useSyncExternalStore } from "react";
import { useLocation } from "wouter";
import { Search, Sun, Moon, WifiOff, Zap } from "lucide-react";
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
  if (path.startsWith("/settings")) return "Settings";
  if (path.startsWith("/about")) return "About";
  if (path.startsWith("/tests")) return "Tests";
  return "A.W.A.R.E.";
}

export function ConsoleTopBar({ onSearchOpen }: ConsoleTopBarProps) {
  const [location, navigate] = useLocation();
  const dataState = useDataInit();
  const envSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  const suiteSnap = useSyncExternalStore(subscribeToSelectedSuites, getSelectedSuiteSnapshot);

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
    } catch {
      /* ignore */
    }
    if (next) document.documentElement.classList.remove("light");
    else document.documentElement.classList.add("light");
  };

  const label = routeLabel(location);

  return (
    <header
      style={{
        height: 48,
        minHeight: 48,
        background: "var(--proof-title-bar-bg)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 12,
        flexShrink: 0,
        userSelect: "none",
        borderBottom: "1px solid var(--proof-border)",
        position: "relative",
        zIndex: 50,
      }}
    >
      {/* Subtle top highlight */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.3) 30%, rgba(96,165,250,0.2) 70%, transparent 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Logo */}
      <button
        onClick={() => navigate("/")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "4px 8px",
          borderRadius: 8,
          transition: "all 150ms ease",
        }}
        title="Dashboard"
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "var(--proof-surface-3)";
          el.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "transparent";
          el.style.transform = "translateY(0)";
        }}
      >
        {/* Logo icon */}
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: "linear-gradient(135deg, var(--proof-blue) 0%, var(--proof-blue-bright) 100%)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 4px 12px var(--proof-blue-glow)",
          }}
        >
          <svg
            width="14"
            height="14"
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

        <span
          className="proof-logo-text"
          style={{
            fontSize: 15,
            fontWeight: 800,
            background: "linear-gradient(to right, var(--proof-text), var(--proof-text-secondary))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.5px",
          }}
        >
          AWARE
        </span>
      </button>

      {/* Separator + breadcrumb */}
      <span style={{ color: "var(--proof-border-strong)", fontSize: 16, fontWeight: 300, opacity: 0.3 }}>
        /
      </span>
      <span
        style={{
          fontSize: 11,
          color: "var(--proof-text-secondary)",
          fontWeight: 600,
          letterSpacing: "0.2px",
          textTransform: "uppercase",
          background: "var(--proof-surface-2)",
          padding: "2px 10px",
          borderRadius: 99,
          border: "1px solid var(--proof-border)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
        }}
      >
        {label}
      </span>

      {/* Loading pill */}
      {dataState.loading && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "2px 8px",
            borderRadius: 99,
            background: "var(--proof-blue-bg)",
            border: "1px solid var(--proof-blue-border)",
            fontSize: 10,
            fontWeight: 600,
            color: "var(--proof-blue-bright)",
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "var(--proof-blue-bright)",
              display: "inline-block",
              animation: "badge-pulse 1s ease-in-out infinite",
            }}
          />
          Loading…
        </span>
      )}
      {!!dataState.error && !dataState.loading && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "2px 8px",
            borderRadius: 99,
            background: "var(--proof-red-bg)",
            border: "1px solid var(--proof-red-border)",
            fontSize: 10,
            fontWeight: 600,
            color: "var(--proof-red-bright)",
          }}
        >
          <WifiOff size={9} />
          Error
        </span>
      )}

      <div style={{ flex: 1 }} />

      {/* Filters cluster */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "var(--proof-surface-2)",
          border: "1px solid var(--proof-border)",
          borderRadius: 8,
          padding: "2px 6px",
          height: 32,
          boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
        }}
      >
        <EnvSelector
          currentEnvIds={envSnap.envIds}
          onEnvChange={setSelectedEnvIds}
          variant="topbar"
        />
        <div style={{ width: 1, height: 14, background: "var(--proof-border)", flexShrink: 0 }} />
        <SuiteSelector
          currentSuiteIds={suiteSnap.suiteIds}
          onSuiteChange={setSelectedSuiteIds}
          variant="topbar"
        />
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 18, background: "var(--proof-border)", flexShrink: 0 }} />

      {/* Tier selector */}
      <EnvTierSelector />

      {/* Divider */}
      <div style={{ width: 1, height: 18, background: "var(--proof-border)", flexShrink: 0 }} />

      {/* Search button */}
      <button
        onClick={onSearchOpen}
        title="Search (⌘K)"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 10px",
          fontSize: 11.5,
          cursor: "pointer",
          border: "1px solid var(--proof-border)",
          borderRadius: 8,
          background: "var(--proof-surface-2)",
          color: "var(--proof-text-muted)",
          transition: "all 120ms ease",
          fontFamily: "var(--font-sans)",
          height: 30,
          minWidth: 120,
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = "var(--proof-border-strong)";
          el.style.color = "var(--proof-text)";
          el.style.background = "var(--proof-surface-3)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = "var(--proof-border)";
          el.style.color = "var(--proof-text-muted)";
          el.style.background = "var(--proof-surface-2)";
        }}
      >
        <Search size={11} />
        <span style={{ flex: 1, textAlign: "left" }}>Search…</span>
        <kbd
          style={{
            fontSize: 9,
            border: "1px solid var(--proof-border-strong)",
            borderRadius: 4,
            padding: "0 4px",
            fontFamily: "var(--font-mono)",
            lineHeight: "14px",
            opacity: 0.5,
            background: "var(--proof-surface-3)",
          }}
        >
          ⌘K
        </kbd>
      </button>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={isDark ? "Light mode" : "Dark mode"}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        style={{
          width: 30,
          height: 30,
          padding: 0,
          border: "1px solid var(--proof-border)",
          background: "var(--proof-surface-2)",
          cursor: "pointer",
          color: "var(--proof-text-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          transition: "all 120ms ease",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.color = "var(--proof-text)";
          el.style.background = "var(--proof-surface-3)";
          el.style.borderColor = "var(--proof-border-strong)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.color = "var(--proof-text-muted)";
          el.style.background = "var(--proof-surface-2)";
          el.style.borderColor = "var(--proof-border)";
        }}
      >
        {isDark ? <Sun size={13} /> : <Moon size={13} />}
      </button>
    </header>
  );
}
