import React, { useSyncExternalStore } from "react";
import { useLocation } from "wouter";
import { subscribeToRuns, getRuns } from "@/lib/data";
import { getSelectedEnvSnapshot, subscribeToSelectedEnv } from "@/lib/selectedEnv";
import { getSelectedSuiteSnapshot, subscribeToSelectedSuites } from "@/lib/filters";
import { RunsPanel } from "./sidebar/RunsPanel";
import { ComparePanel } from "./sidebar/ComparePanel";
import { TrendsPanel } from "./sidebar/TrendsPanel";
import { TestsPanel } from "./sidebar/TestsPanel";
import { CopilotPanel } from "./sidebar/CopilotPanel";
import { X, Activity, ChevronRight } from "lucide-react";

interface ConsoleSidebarProps {
  activePanel: string;
  visible: boolean;
  onClose: () => void;
}

const PANEL_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  runs: "Runs",
  compare: "Compare",
  trends: "Trends",
  suites: "Test Suites",
  tests: "Tests",
  copilot: "Copilot",
  about: "About",
};

const PANEL_ACCENTS: Record<string, string> = {
  dashboard: "var(--proof-blue)",
  runs: "var(--proof-green)",
  compare: "var(--proof-purple)",
  trends: "var(--proof-yellow)",
  suites: "var(--proof-cyan)",
  tests: "var(--proof-orange)",
  copilot: "var(--proof-orange)",
  about: "var(--proof-text-secondary)",
};

/* ── Compact run-health mini-bar ───────────────────────────────── */
function RunHealthBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div
      style={{
        width: 32,
        height: 3,
        borderRadius: 99,
        background: "var(--proof-bar-track)",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: 99,
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
}

/* ── Recent runs list ───────────────────────────────────────────── */
function RecentRunsList() {
  const [location, navigate] = useLocation();
  const runs = useSyncExternalStore(subscribeToRuns, getRuns);
  const envSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  const envFilteredRuns =
    envSnap.envIds.length > 0 ? runs.filter((r) => envSnap.envIds.includes(r.envId)) : runs;
  const recent = [...envFilteredRuns]
    .sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime())
    .slice(0, 25);
  const selectedRunId = location.split("/runs/")[1]?.split(/[?/]/)[0] ?? "";

  if (recent.length === 0) return null;

  return (
    <div style={{ paddingBottom: 8 }}>
      <div
        style={{
          padding: "10px 14px 6px",
          fontSize: 9.5,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          color: "var(--proof-text-muted)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Activity size={9} />
        Recent Runs
      </div>
      {recent.map((run) => {
        const pct = run.passPct ?? 0;
        const c =
          pct >= 95
            ? "var(--proof-green)"
            : pct >= 80
              ? "var(--proof-yellow)"
              : "var(--proof-red)";
        const isSelected = run.id === selectedRunId;
        return (
          <div
            key={run.id}
            onClick={() => navigate(`/runs/${run.id}`)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 14px",
              cursor: "pointer",
              background: isSelected
                ? "linear-gradient(90deg, var(--proof-blue-bg), transparent)"
                : "transparent",
              borderLeft: isSelected ? "2px solid var(--proof-blue)" : "2px solid transparent",
              transition: "all 120ms ease",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }
            }}
          >
            {/* Status dot */}
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: c,
                flexShrink: 0,
                boxShadow: isSelected ? `0 0 6px ${c}` : "none",
              }}
            />

            {/* Label */}
            <span
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: 11.5,
                color: isSelected ? "var(--proof-text)" : "var(--proof-text-secondary)",
                fontWeight: isSelected ? 600 : 400,
              }}
            >
              {run.label || run.id}
            </span>

            {/* Mini health bar */}
            <RunHealthBar pct={pct} color={c} />

            {/* Percentage */}
            <span
              style={{
                fontSize: 10.5,
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                color: c,
                letterSpacing: "-0.3px",
                flexShrink: 0,
                minWidth: 30,
                textAlign: "right",
              }}
            >
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ConsoleSidebar({ activePanel, visible, onClose }: ConsoleSidebarProps) {
  const _envSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  const _suiteSnap = useSyncExternalStore(subscribeToSelectedSuites, getSelectedSuiteSnapshot);

  if (!visible) return null;

  const headline = PANEL_LABELS[activePanel] || "Explorer";
  const accent = PANEL_ACCENTS[activePanel] || "var(--proof-blue)";

  const renderPanel = () => {
    switch (activePanel) {
      case "dashboard":
        return (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <RecentRunsList />
          </div>
        );
      case "runs":
        return <RunsPanel />;
      case "compare":
        return <ComparePanel />;
      case "trends":
        return <TrendsPanel />;
      case "suites":
      case "tests":
        return <TestsPanel />;
      case "copilot":
        return <CopilotPanel />;
      case "about":
        return (
          <div
            style={{
              padding: "24px 16px",
              textAlign: "center",
              color: "var(--proof-text-secondary)",
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: "linear-gradient(135deg, var(--proof-blue) 0%, var(--proof-blue-bright) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
                boxShadow: "0 0 0 6px var(--proof-blue-bg), 0 8px 24px var(--proof-blue-glow)",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div style={{ fontWeight: 800, fontSize: 14, color: "var(--proof-text)", marginBottom: 4, letterSpacing: "-0.3px" }}>
              A.W.A.R.E.
            </div>
            <div style={{ fontSize: 11, color: "var(--proof-text-muted)", lineHeight: 1.6 }}>
              Akamai Web Analytics
              <br />
              Regression Engine
            </div>
            <div style={{ fontSize: 10, color: "var(--proof-text-tertiary)", marginTop: 10 }}>
              v1.0.0
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <aside
      style={{
        width: "var(--proof-sidebar-width)",
        minWidth: "var(--proof-sidebar-width)",
        background: "var(--proof-sidebar-bg)",
        borderRight: "1px solid var(--proof-border)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {/* Accent top stripe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${accent}, transparent)`,
          opacity: 0.6,
        }}
      />

      {/* Header */}
      <div
        style={{
          padding: "0 14px",
          height: 38,
          fontSize: 11,
          fontWeight: 700,
          color: "var(--proof-text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.7px",
          borderBottom: "1px solid var(--proof-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: accent,
              boxShadow: `0 0 8px ${accent}`,
              flexShrink: 0,
              display: "inline-block",
            }}
          />
          <span>{headline}</span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close sidebar"
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--proof-text-muted)",
            padding: 4,
            display: "flex",
            borderRadius: 6,
            transition: "all 120ms ease",
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
          <X size={12} />
        </button>
      </div>

      {/* Panel content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {renderPanel()}
      </div>
    </aside>
  );
}
