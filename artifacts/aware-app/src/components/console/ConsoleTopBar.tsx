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
import { ProofLogo } from "../aware/ProofLogo";

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
        height: 44,
        minHeight: 44,
        background: "var(--proof-surface)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 12,
        flexShrink: 0,
        userSelect: "none",
        borderBottom: "1px solid var(--proof-border-strong)",
        position: "relative",
        zIndex: 50,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: "linear-gradient(90deg, transparent 0%, var(--proof-blue-border) 40%, var(--proof-blue-bright) 70%, transparent 100%)",
        }}
      />

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
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "transparent";
        }}
      >
        <ProofLogo size={20} />
        <span
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: "var(--proof-text)",
            letterSpacing: "-0.3px",
            fontFamily: "var(--font-mono)",
          }}
        >
          A.W.A.R.E.
        </span>
      </button>

      <span style={{ color: "var(--proof-border-strong)", fontSize: 16, fontWeight: 300, opacity: 0.3 }}>
        /
      </span>
      <span
        style={{
          fontSize: 10,
          color: "var(--proof-text)",
          fontWeight: 700,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          background: "var(--proof-surface-2)",
          padding: "4px 10px",
          borderRadius: "var(--proof-radius-sm)",
          border: "1px solid var(--proof-border)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {label}
      </span>

      {dataState.loading && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 8px",
            borderRadius: 4,
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
          LOADING
        </span>
      )}
      {!!dataState.error && !dataState.loading && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 8px",
            borderRadius: 4,
            background: "var(--proof-red-bg)",
            border: "1px solid var(--proof-red-border)",
            fontSize: 10,
            fontWeight: 600,
            color: "var(--proof-red-bright)",
          }}
        >
          <WifiOff size={10} />
          ERROR
        </span>
      )}

      <div style={{ flex: 1 }} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "var(--proof-surface)",
          border: "1px solid var(--proof-border-strong)",
          borderRadius: "var(--proof-radius-sm)",
          padding: "2px 6px",
          height: 28,
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

      <div style={{ width: 1, height: 18, background: "var(--proof-border)", flexShrink: 0 }} />
      <EnvTierSelector />
      <div style={{ width: 1, height: 18, background: "var(--proof-border)", flexShrink: 0 }} />

      <button
        onClick={onSearchOpen}
        title="Search (⌘K)"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          fontSize: 11,
          cursor: "pointer",
          border: "1px solid var(--proof-border)",
          borderRadius: "var(--proof-radius-sm)",
          background: "var(--proof-surface-2)",
          color: "var(--proof-text-muted)",
          transition: "all 120ms ease",
          fontFamily: "var(--font-mono)",
          height: 28,
          minWidth: 140,
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = "var(--proof-blue-border)";
          el.style.color = "var(--proof-text)";
          el.style.boxShadow = "var(--proof-glow-cyan)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = "var(--proof-border)";
          el.style.color = "var(--proof-text-muted)";
          el.style.boxShadow = "none";
        }}
      >
        <Search size={12} />
        <span style={{ flex: 1, textAlign: "left" }}>SEARCH...</span>
        <kbd
          style={{
            fontSize: 9,
            border: "1px solid var(--proof-border-strong)",
            borderRadius: 2,
            padding: "0 4px",
            fontFamily: "var(--font-mono)",
            lineHeight: "14px",
            opacity: 0.6,
          }}
        >
          ⌘K
        </kbd>
      </button>

      <button
        onClick={toggleTheme}
        title={isDark ? "Light mode" : "Dark mode"}
        style={{
          width: 28,
          height: 28,
          padding: 0,
          border: "1px solid var(--proof-border)",
          background: "transparent",
          cursor: "pointer",
          color: "var(--proof-text-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--proof-radius-sm)",
          transition: "all 120ms ease",
          flexShrink: 0,
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
        {isDark ? <Sun size={12} /> : <Moon size={12} />}
      </button>
    </header>
  );
}
