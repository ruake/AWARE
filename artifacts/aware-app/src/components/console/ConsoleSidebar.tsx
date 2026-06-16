import React, { useSyncExternalStore } from "react";
import { useLocation } from "wouter";
import { EnvSelector } from "./EnvSelector";
import { SuiteSelector } from "./SuiteSelector";
import { getEnvConfigs } from "@/lib/envConfig";
import { getTestCases, subscribeToRuns, getRuns, subscribeToDiffRows, getDiffRows } from "@/lib/data";
import { getSelectedEnvSnapshot, subscribeToSelectedEnv, setSelectedEnvIds } from "@/lib/selectedEnv";
import { getSelectedSuiteSnapshot, subscribeToSelectedSuites, setSelectedSuiteIds } from "@/lib/filters";
import { RunsPanel } from "./sidebar/RunsPanel";
import { ComparePanel } from "./sidebar/ComparePanel";
import { TrendsPanel } from "./sidebar/TrendsPanel";
import { TestsPanel } from "./sidebar/TestsPanel";
import { CopilotPanel } from "./sidebar/CopilotPanel";

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

function KpiSummary() {
  const [, navigate] = useLocation();
  const runs = useSyncExternalStore(subscribeToRuns, getRuns);
  const diffRows = useSyncExternalStore(subscribeToDiffRows, getDiffRows);
  const total = runs.length;
  const passPct = total > 0 ? Math.round(runs.reduce((s, r) => s + (r.passPct ?? 0), 0) / total) : 0;
  const failed = runs.filter((r) => (r.passPct ?? 100) < 90).length;
  const envCount = getEnvConfigs().length;
  const testCasesCount = getTestCases().length;
  const regressions = diffRows.filter((d) => d.state === "regression").length;

  const items = [
    { label: "Runs", value: total.toString(), color: "var(--proof-blue)", onClick: () => navigate("/runs") },
    { label: "Pass Rate", value: `${passPct}%`, color: passPct >= 95 ? "var(--proof-green)" : "var(--proof-yellow)", onClick: () => navigate("/trends") },
    { label: "Failed Runs", value: failed.toString(), color: failed > 0 ? "var(--proof-red)" : "var(--proof-text-muted)", onClick: failed > 0 ? () => navigate("/runs?status=FAIL") : undefined },
    { label: "Envs", value: envCount.toString(), color: "var(--proof-purple)" },
    { label: "Tests", value: testCasesCount.toString(), color: "var(--proof-cyan)" },
    { label: "Regressions", value: regressions.toString(), color: regressions > 0 ? "var(--proof-red)" : "var(--proof-text-muted)", onClick: regressions > 0 ? () => navigate("/compare") : undefined },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: "8px 10px", borderBottom: "1px solid var(--proof-border)" }}>
      {items.map((item) => (
        <div key={item.label} onClick={item.onClick} style={{ padding: "6px 8px", borderRadius: 3, background: "var(--proof-hover-light)", display: "flex", flexDirection: "column", gap: 1, cursor: item.onClick ? "pointer" : "default", transition: "background 0.1s" }}
          onMouseEnter={(e) => { if (item.onClick) (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--proof-hover-light)"; }}
        >
          <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color: item.color, lineHeight: 1.2 }}>{item.value}</span>
          <span style={{ fontSize: 9, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function RecentRunsList() {
  const [, navigate] = useLocation();
  const runs = useSyncExternalStore(subscribeToRuns, getRuns);
  const envSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  const envFilteredRuns = envSnap.envIds.length > 0 ? runs.filter((r) => envSnap.envIds.includes(r.envId)) : runs;
  const recent = [...envFilteredRuns].sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime()).slice(0, 12);

  return (
    <div style={{ padding: "4px 0" }}>
      <div style={{ padding: "6px 12px 4px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--proof-text-muted)" }}>Recent Runs</div>
      {recent.map((run) => {
        const pct = run.passPct ?? 0;
        const passColor = pct >= 95 ? "var(--proof-green)" : pct >= 80 ? "var(--proof-yellow)" : "var(--proof-red)";
        const envCfg = getEnvConfigs().find((c) => c.id === run.envId);
        const label = envCfg?.label || run.envId || run.env;
        return (
          <div key={run.id} onClick={() => navigate(`/runs/${run.id}`)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", cursor: "pointer", fontSize: 12, color: "var(--proof-text-secondary)", transition: "background 0.1s", lineHeight: "20px" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--proof-text)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)"; }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: passColor, flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11 }}>{run.label || run.id}</span>
            <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", opacity: 0.6, flexShrink: 0 }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function NavFooter() {
  const [, navigate] = useLocation();
  const links = [
    { id: "dashboard", label: "Dashboard", href: "/" },
    { id: "runs", label: "Runs", href: "/runs" },
    { id: "compare", label: "Compare", href: "/compare" },
    { id: "trends", label: "Trends", href: "/trends" },
    { id: "suites", label: "Suites", href: "/suites" },
    { id: "copilot", label: "Copilot", href: "/copilot" },
    { id: "about", label: "About", href: "/about" },
  ];

  return (
    <div style={{ borderTop: "1px solid var(--proof-border)", padding: "6px 10px", display: "flex", flexWrap: "wrap", gap: 2, flexShrink: 0 }}>
      {links.map((link) => (
        <span key={link.id} onClick={() => navigate(link.href)} style={{ fontSize: 10, fontWeight: 500, padding: "2px 6px", borderRadius: 3, cursor: "pointer", color: "var(--proof-text-muted)", transition: "color 0.1s, background 0.1s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--proof-text)"; (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--proof-text-muted)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          {link.label}
        </span>
      ))}
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
            <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "8px 10px", borderBottom: "1px solid var(--proof-border)" }}>
              <EnvSelector currentEnvIds={envSnap.envIds} onEnvChange={setSelectedEnvIds} variant="topbar" />
              <SuiteSelector currentSuiteIds={suiteSnap.suiteIds} onSuiteChange={setSelectedSuiteIds} variant="topbar" />
            </div>
            <KpiSummary />
            <RecentRunsList />
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
          <div style={{ padding: "12px 10px", fontSize: 12, color: "var(--proof-text-secondary)", textAlign: "center", lineHeight: 1.5 }}>
            A.W.A.R.E. — Akamai Web Analytics Regression Engine
            <br />
            <span style={{ fontSize: 10, color: "var(--proof-text-muted)", marginTop: 4, display: "block" }}>v1.0.0</span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <aside style={{ width: "var(--proof-sidebar-width)", minWidth: "var(--proof-sidebar-width)", background: "var(--proof-sidebar-bg)", borderRight: "1px solid var(--proof-border)", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", flexShrink: 0 }}>
      <div style={{ padding: "6px 12px", fontSize: 11, fontWeight: 600, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid var(--proof-border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, userSelect: "none", lineHeight: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 2, height: 14, borderRadius: 99, background: accent, flexShrink: 0 }} />
          <span>{headline}</span>
        </div>
        <button onClick={onClose} aria-label="Close sidebar" style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--proof-text-muted)", padding: 2, display: "flex", borderRadius: 2 }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--proof-text)"; (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--proof-text-muted)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {renderPanel()}
      </div>
      <NavFooter />
    </aside>
  );
}
