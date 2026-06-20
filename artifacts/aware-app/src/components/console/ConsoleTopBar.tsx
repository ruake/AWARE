import React, { useSyncExternalStore } from "react";
import { useLocation } from "wouter";
import { Search, Sun, Moon, WifiOff } from "lucide-react";
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
        height: "var(--proof-title-bar-height)",
        minHeight: "var(--proof-title-bar-height)",
        background: "var(--proof-title-bar-bg)",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        gap: 6,
        flexShrink: 0,
        userSelect: "none",
        borderBottom: "1px solid var(--proof-border)",
      }}
    >
      {/* Logo */}
      <button
        onClick={() => navigate("/")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          flexShrink: 0,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "2px 4px",
          borderRadius: "var(--proof-radius-sm)",
        }}
        title="Dashboard"
      >
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: 6,
            background:
              "linear-gradient(135deg, var(--proof-blue) 0%, var(--proof-blue-bright) 100%)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 2px 6px var(--proof-blue-glow)",
          }}
        >
          <svg
            width="11"
            height="11"
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
            fontSize: 13,
            fontWeight: 800,
            color: "var(--proof-text)",
            letterSpacing: "-0.4px",
          }}
        >
          A.W.A.R.E.
        </span>
      </button>

      {/* Breadcrumb */}
      <span
        style={{ color: "var(--proof-border-strong)", fontSize: 13, fontWeight: 300, opacity: 0.6 }}
      >
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

      {/* Data status */}
      {dataState.loading && (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 7px",
            borderRadius: "var(--proof-radius-full)",
            background: "var(--proof-blue-bg)",
            border: "1px solid var(--proof-blue-border)",
            fontSize: 10,
            fontWeight: 600,
            color: "var(--proof-blue-bright)",
            marginLeft: 2,
          }}
        >
          <span
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "var(--proof-blue-bright)",
              animation: "badge-pulse 1s ease-in-out infinite",
              display: "inline-block",
            }}
          />
          Loading…
        </span>
      )}
      {!!dataState.error && !dataState.loading && (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 7px",
            borderRadius: "var(--proof-radius-full)",
            background: "var(--proof-red-bg)",
            border: "1px solid var(--proof-red-border)",
            fontSize: 10,
            fontWeight: 600,
            color: "var(--proof-red-bright)",
            marginLeft: 2,
          }}
        >
          <WifiOff size={9} />
          Error
        </span>
      )}

      <div style={{ flex: 1 }} />

      {/* Global env + suite filters */}
      <EnvSelector
        currentEnvIds={envSnap.envIds}
        onEnvChange={setSelectedEnvIds}
        variant="topbar"
      />
      <SuiteSelector
        currentSuiteIds={suiteSnap.suiteIds}
        onSuiteChange={setSelectedSuiteIds}
        variant="topbar"
      />

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 16,
          background: "var(--proof-border)",
          margin: "0 4px",
          flexShrink: 0,
        }}
      />

      {/* Env tier selector (includes pass rates) */}
      <EnvTierSelector />

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 16,
          background: "var(--proof-border)",
          margin: "0 4px",
          flexShrink: 0,
        }}
      />

      {/* Search */}
      <button
        onClick={onSearchOpen}
        title="Search (⌘K)"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "3px 10px",
          fontSize: 11.5,
          cursor: "pointer",
          border: "1px solid var(--proof-border)",
          borderRadius: "var(--proof-radius-sm)",
          background: "var(--proof-surface-2)",
          color: "var(--proof-text-muted)",
          transition: "all var(--proof-transition)",
          fontFamily: "var(--font-sans)",
          lineHeight: "16px",
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
        <span>Search</span>
        <kbd
          style={{
            fontSize: 9,
            border: "1px solid var(--proof-border-strong)",
            borderRadius: 3,
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
          borderRadius: "var(--proof-radius-sm)",
          transition: "all var(--proof-transition)",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.color = "var(--proof-text)";
          el.style.background = "var(--proof-hover)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.color = "var(--proof-text-muted)";
          el.style.background = "transparent";
        }}
      >
        {isDark ? <Sun size={13} /> : <Moon size={13} />}
      </button>
    </header>
  );
}
