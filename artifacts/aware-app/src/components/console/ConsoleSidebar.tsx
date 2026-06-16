import React, { useSyncExternalStore } from "react";
import { useLocation } from "wouter";
import { EnvSelector } from "./EnvSelector";
import { SuiteSelector } from "./SuiteSelector";
import { RUNS } from "@/lib/runs";
import { getEnvConfigs } from "@/lib/envConfig";
import { getTestSuites, subscribeToTestSuites, getTestCases, subscribeToTestCases } from "@/lib/data";
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
import { FolderTree, Beaker, Search } from "lucide-react";
import type { TestSuite } from "@/lib/types";

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

function FilterSection({
  envIds,
  suiteIds,
  onEnvChange,
  onSuiteChange,
}: {
  envIds: string[];
  suiteIds: string[];
  onEnvChange: (ids: string[]) => void;
  onSuiteChange: (ids: string[]) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "8px 10px",
        borderBottom: "1px solid var(--proof-border)",
      }}
    >
      <EnvSelector currentEnvIds={envIds} onEnvChange={onEnvChange} variant="topbar" />
      <SuiteSelector currentSuiteIds={suiteIds} onSuiteChange={onSuiteChange} variant="topbar" />
    </div>
  );
}

function RecentRunsList() {
  const [, navigate] = useLocation();
  const recent = React.useMemo(
    () =>
      [...RUNS]
        .sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime())
        .slice(0, 12),
    [],
  );

  return (
    <div style={{ padding: "4px 0" }}>
      <div
        style={{
          padding: "6px 12px 4px",
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.6px",
          color: "var(--proof-text-muted)",
        }}
      >
        Recent Runs
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {recent.map((run) => {
          const pct = run.passPct ?? 0;
          const passColor =
            pct >= 95
              ? "var(--proof-green)"
              : pct >= 80
                ? "var(--proof-yellow)"
                : "var(--proof-red)";
          const envCfg = getEnvConfigs().find((c) => c.id === run.envId);
          const label = envCfg?.label || run.envId || run.env;
          return (
            <div
              key={run.id}
              onClick={() => navigate(`/runs/${run.id}`)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px 4px 12px",
                cursor: "pointer",
                fontSize: 12,
                color: "var(--proof-text-secondary)",
                transition: "background 0.1s",
                lineHeight: "20px",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
                (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)";
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: passColor,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: 11,
                }}
              >
                {run.label || run.id}
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontFamily: "var(--font-mono)",
                  opacity: 0.6,
                  flexShrink: 0,
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusFilter() {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: "6px 10px 8px",
        borderBottom: "1px solid var(--proof-border)",
        flexWrap: "wrap",
      }}
    >
      {["All", "PASS", "FAIL", "RUNNING"].map((s) => (
        <span
          key={s}
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 3,
            cursor: "pointer",
            border: "1px solid var(--proof-border)",
            color: s === "All" ? "var(--proof-text)" : "var(--proof-text-secondary)",
            background: s === "All" ? "var(--proof-hover)" : "transparent",
            transition: "all 0.1s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
            (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              s === "All" ? "var(--proof-hover)" : "transparent";
            (e.currentTarget as HTMLElement).style.color =
              s === "All" ? "var(--proof-text)" : "var(--proof-text-secondary)";
          }}
        >
          {s}
        </span>
      ))}
    </div>
  );
}

function KpiSummary() {
  const total = RUNS.length;
  const passPct =
    total > 0 ? Math.round(RUNS.reduce((s, r) => s + (r.passPct ?? 0), 0) / total) : 0;
  const failed = RUNS.filter((r) => (r.passPct ?? 100) < 90).length;
  const envCount = getEnvConfigs().length;

  const items = [
    { label: "Runs", value: total.toString(), color: "var(--proof-blue)" },
    {
      label: "Pass Rate",
      value: `${passPct}%`,
      color: passPct >= 95 ? "var(--proof-green)" : "var(--proof-yellow)",
    },
    {
      label: "Failed",
      value: failed.toString(),
      color: failed > 0 ? "var(--proof-red)" : "var(--proof-text-muted)",
    },
    { label: "Envs", value: envCount.toString(), color: "var(--proof-purple)" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 4,
        padding: "8px 10px",
        borderBottom: "1px solid var(--proof-border)",
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            padding: "6px 8px",
            borderRadius: 3,
            background: "var(--proof-hover-light)",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: item.color,
              lineHeight: 1.2,
            }}
          >
            {item.value}
          </span>
          <span
            style={{
              fontSize: 9,
              color: "var(--proof-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.4px",
            }}
          >
            {item.label}
          </span>
        </div>
      ))}
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
    <div
      style={{
        borderTop: "1px solid var(--proof-border)",
        padding: "6px 10px",
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        flexShrink: 0,
      }}
    >
      {links.map((link) => (
        <span
          key={link.id}
          onClick={() => navigate(link.href)}
          style={{
            fontSize: 10,
            fontWeight: 500,
            padding: "2px 6px",
            borderRadius: 3,
            cursor: "pointer",
            color: "var(--proof-text-muted)",
            transition: "color 0.1s, background 0.1s",
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
          {link.label}
        </span>
      ))}
    </div>
  );
}

function SuiteTreePanel() {
  const [, navigate] = useLocation();
  const suites = useSyncExternalStore(subscribeToTestSuites, getTestSuites);
  const tests = useSyncExternalStore(subscribeToTestCases, getTestCases);
  const [treeSearch, setTreeSearch] = React.useState("");
  const currentSuite = new URLSearchParams(window.location.search).get("suite");

  const rootSuites = React.useMemo(() => {
    let roots = suites.filter((s) => s.parentId === null || !suites.find((p) => p.id === s.parentId));
    if (treeSearch.trim()) {
      const q = treeSearch.toLowerCase();
      roots = roots.filter((s) => {
        const all = flattenForSearch(s, suites);
        return all.some((c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
      });
    }
    return roots;
  }, [suites, treeSearch]);

  function flattenForSearch(suite: TestSuite, allSuites: TestSuite[]): TestSuite[] {
    const result = [suite];
    for (const c of allSuites.filter((s) => s.parentId === suite.id)) result.push(...flattenForSearch(c, allSuites));
    return result;
  }

  function getChildren(suite: TestSuite): TestSuite[] {
    return suites.filter((s) => s.parentId === suite.id);
  }

  function getTestCount(suite: TestSuite): number {
    const ids = [...suite.testIds];
    for (const child of getChildren(suite)) ids.push(...child.testIds);
    return ids.length;
  }

  function renderSuite(suite: TestSuite, depth: number) {
    const children = getChildren(suite);
    const count = getTestCount(suite);
    const isActive = currentSuite === suite.id;
    const matches = !treeSearch.trim() || flattenForSearch(suite, suites).some((s) => s.name.toLowerCase().includes(treeSearch.toLowerCase()) || s.id.toLowerCase().includes(treeSearch.toLowerCase()));
    if (!matches) return null;
    return (
      <React.Fragment key={suite.id}>
        <div
          onClick={() => navigate(`/tests?suite=${suite.id}`)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 10px 3px",
            paddingLeft: `${8 + depth * 14}px`,
            cursor: "pointer",
            fontSize: 12,
            color: isActive ? "var(--proof-text)" : "var(--proof-text-secondary)",
            background: isActive ? "var(--proof-blue-bg)" : "transparent",
            transition: "background 0.1s",
            lineHeight: "22px",
            userSelect: "none",
          }}
          onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--proof-text)"; }}
          onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)"; }}
        >
          {depth > 0 && <span style={{ fontSize: 8, color: "var(--proof-text-muted)", width: 8, flexShrink: 0 }}>└</span>}
          <FolderTree size={12} style={{ color: "var(--proof-blue)", flexShrink: 0 }} />
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11 }}>{suite.name}</span>
          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--proof-text-muted)", flexShrink: 0 }}>{count}</span>
        </div>
        {children.map((c) => renderSuite(c, depth + 1))}
      </React.Fragment>
    );
  }

  return (
    <>
      <div style={{ padding: "8px 10px 4px", borderBottom: "1px solid var(--proof-border)" }}>
        <div
          onClick={() => navigate("/tests")}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "4px 6px", borderRadius: 4,
            cursor: "pointer", fontSize: 12, fontWeight: 600,
            color: !currentSuite ? "var(--proof-text)" : "var(--proof-text-secondary)",
            background: !currentSuite ? "var(--proof-blue-bg)" : "transparent",
            transition: "background 0.1s",
          }}
          onMouseEnter={(e) => { if (currentSuite) (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)"; }}
          onMouseLeave={(e) => { if (currentSuite) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <Beaker size={13} style={{ color: "var(--proof-orange)" }} />
          All Tests
          <span style={{ marginLeft: "auto", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--proof-text-muted)" }}>{tests.length}</span>
        </div>
      </div>
      <div style={{ padding: "4px 10px", borderBottom: "1px solid var(--proof-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, border: "1px solid var(--proof-border)", borderRadius: 3, padding: "3px 6px" }}>
          <Search size={11} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
          <input value={treeSearch} onChange={(e) => setTreeSearch(e.target.value)} placeholder="Filter suites..." style={{ border: "none", outline: "none", fontSize: 11, background: "transparent", flex: 1, minWidth: 0, color: "var(--proof-text)" }} />
        </div>
      </div>
      <div style={{ padding: "2px 0" }}>
        {suites.length === 0 && <div style={{ padding: "12px 10px", fontSize: 11, color: "var(--proof-text-muted)", textAlign: "center" }}>No suites configured</div>}
        {rootSuites.map((s) => renderSuite(s, 0))}
      </div>
    </>
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
            <FilterSection
              envIds={envSnap.envIds}
              suiteIds={suiteSnap.suiteIds}
              onEnvChange={setSelectedEnvIds}
              onSuiteChange={setSelectedSuiteIds}
            />
            <KpiSummary />
            <RecentRunsList />
          </>
        );

      case "runs":
        return (
          <>
            <FilterSection
              envIds={envSnap.envIds}
              suiteIds={suiteSnap.suiteIds}
              onEnvChange={setSelectedEnvIds}
              onSuiteChange={setSelectedSuiteIds}
            />
            <StatusFilter />
            <RecentRunsList />
          </>
        );

      case "compare":
        return (
          <div
            style={{
              padding: "12px 10px",
              fontSize: 12,
              color: "var(--proof-text-secondary)",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            Select baseline and candidate runs on the Compare page to view diffs.
          </div>
        );

      case "trends":
        return (
          <div
            style={{
              padding: "12px 10px",
              fontSize: 12,
              color: "var(--proof-text-secondary)",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            Select a test from the Trends page to view pass rate history, assertion trends, and
            flakiness.
          </div>
        );

      case "suites":
        return (
          <div
            style={{
              padding: "12px 10px",
              fontSize: 12,
              color: "var(--proof-text-secondary)",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            Manage test suites, view hierarchy, and export YAML configuration.
          </div>
        );

      case "tests":
        return <SuiteTreePanel />;

      case "copilot":
        return (
          <div
            style={{
              padding: "12px 10px",
              fontSize: 12,
              color: "var(--proof-text-secondary)",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            Ask questions about your test runs, environments, and trends using natural language.
          </div>
        );

      case "about":
        return (
          <div
            style={{
              padding: "12px 10px",
              fontSize: 12,
              color: "var(--proof-text-secondary)",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            A.W.A.R.E. — Akamai Web Analytics Regression Engine
            <br />
            <span
              style={{
                fontSize: 10,
                color: "var(--proof-text-muted)",
                marginTop: 4,
                display: "block",
              }}
            >
              v1.0.0
            </span>
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
      {/* Sidebar header */}
      <div
        style={{
          padding: "6px 12px",
          fontSize: 11,
          fontWeight: 600,
          color: "var(--proof-text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          borderBottom: "1px solid var(--proof-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          userSelect: "none",
          lineHeight: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 2,
              height: 14,
              borderRadius: 99,
              background: accent,
              flexShrink: 0,
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
            padding: 2,
            display: "flex",
            borderRadius: 2,
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
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Panel content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {renderPanel()}
      </div>

      {/* Nav footer */}
      <NavFooter />
    </aside>
  );
}
