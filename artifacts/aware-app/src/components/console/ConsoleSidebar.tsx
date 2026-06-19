import React, { useSyncExternalStore } from "react";
import { useLocation } from "wouter";
import { EnvSelector } from "./EnvSelector";
import { SuiteSelector } from "./SuiteSelector";
import { subscribeToRuns, getRuns } from "@/lib/data";
import { getSelectedEnvSnapshot, subscribeToSelectedEnv, setSelectedEnvIds } from "@/lib/selectedEnv";
import { getSelectedSuiteSnapshot, subscribeToSelectedSuites, setSelectedSuiteIds } from "@/lib/filters";
import { RunsPanel } from "./sidebar/RunsPanel";
import { ComparePanel } from "./sidebar/ComparePanel";
import { TrendsPanel } from "./sidebar/TrendsPanel";
import { TestsPanel } from "./sidebar/TestsPanel";
import { CopilotPanel } from "./sidebar/CopilotPanel";
import { X } from "lucide-react";

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

/* ── Recent runs list — no duplicate KPI numbers ─────────────── */
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
    <div>
      <div style={{
        padding: "8px 12px 4px",
        fontSize: 9.5, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.6px", color: "var(--proof-text-muted)",
      }}>
        Recent Runs
      </div>
      {recent.map((run) => {
        const pct = run.passPct ?? 0;
        const c = pct >= 95 ? "var(--proof-green)" : pct >= 80 ? "var(--proof-yellow)" : "var(--proof-red)";
        const isSelected = run.id === selectedRunId;
        return (
          <div
            key={run.id}
            onClick={() => navigate(`/runs/${run.id}`)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "4px 12px", cursor: "pointer",
              background: isSelected ? "var(--proof-blue-bg)" : "transparent",
              transition: "background var(--proof-transition)",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
            }}
            onMouseLeave={(e) => {
              if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <span style={{
              width: 5, height: 5, borderRadius: "50%", background: c,
              flexShrink: 0, outline: isSelected ? `2px solid ${c}` : "none", outlineOffset: 2,
            }} />
            <span style={{
              flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              fontSize: 11.5, color: isSelected ? "var(--proof-text)" : "var(--proof-text-secondary)",
              fontWeight: isSelected ? 600 : 400,
            }}>
              {run.label || run.id}
            </span>
            <span style={{
              fontSize: 10.5, fontFamily: "var(--font-mono)", fontWeight: 700,
              color: c, letterSpacing: "-0.3px", flexShrink: 0,
            }}>
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ConsoleSidebar({ activePanel, visible, onClose }: ConsoleSidebarProps) {
  const envSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  const suiteSnap = useSyncExternalStore(subscribeToSelectedSuites, getSelectedSuiteSnapshot);

  if (!visible) return null;

  const headline = PANEL_LABELS[activePanel] || "Explorer";
  const accent = PANEL_ACCENTS[activePanel] || "var(--proof-blue)";

  const renderPanel = () => {
    switch (activePanel) {
      case "dashboard":
        return (
          <>
            {/* Filters only — no duplicate KPI grid */}
            <div style={{
              padding: "8px 10px 6px",
              borderBottom: "1px solid var(--proof-border)",
              display: "flex", flexDirection: "column", gap: 5,
            }}>
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
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <RecentRunsList />
            </div>
          </>
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
          <div style={{
            padding: "20px 16px", textAlign: "center",
            color: "var(--proof-text-secondary)", fontSize: 12, lineHeight: 1.6,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: "linear-gradient(135deg, var(--proof-blue) 0%, var(--proof-blue-bright) 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px", boxShadow: "0 4px 16px var(--proof-blue-glow)",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--proof-text)", marginBottom: 4 }}>
              A.W.A.R.E.
            </div>
            <div style={{ fontSize: 11, color: "var(--proof-text-muted)", lineHeight: 1.5 }}>
              Akamai Web Analytics<br />Regression Engine
            </div>
            <div style={{ fontSize: 10, color: "var(--proof-text-tertiary)", marginTop: 8 }}>v1.0.0</div>
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
      }}
    >
      {/* Header */}
      <div style={{
        padding: "0 12px",
        height: 34,
        fontSize: 10.5, fontWeight: 700,
        color: "var(--proof-text-muted)",
        textTransform: "uppercase", letterSpacing: "0.6px",
        borderBottom: "1px solid var(--proof-border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0, userSelect: "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 2, height: 12, borderRadius: 99, background: accent, flexShrink: 0 }} />
          <span>{headline}</span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close sidebar"
          style={{
            border: "none", background: "transparent", cursor: "pointer",
            color: "var(--proof-text-muted)", padding: 3, display: "flex",
            borderRadius: "var(--proof-radius-xs)", transition: "all var(--proof-transition)",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = "var(--proof-text)"; el.style.background = "var(--proof-hover)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = "var(--proof-text-muted)"; el.style.background = "transparent";
          }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Panel content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", overflowX: "hidden" }}>
        {renderPanel()}
      </div>
    </aside>
  );
}
