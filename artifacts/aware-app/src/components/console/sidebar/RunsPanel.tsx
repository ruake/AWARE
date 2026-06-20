import React, { useSyncExternalStore } from "react";
import { useLocation, useParams } from "wouter";
import { useSyncedUrlState } from "@/lib/urlState";
import { getRunById, getTestResultsForRun, subscribeToRuns, getRuns } from "@/lib/data";
import { getSelectedEnvSnapshot, subscribeToSelectedEnv } from "@/lib/selectedEnv";
import type { Run, TestResult } from "@/lib/types";
import { repo } from "@/lib/nav";

import {
  Search,
  X,
  Loader2,
  Check,
  ExternalLink,
  Github,
  BarChart3,
  GitCompare,
  ArrowLeft,
  Share2,
  ChevronDown,
} from "lucide-react";

const GH_ACTIONS_URL = `${repo}/actions`;

function RunsStatSummary({ envFilteredRuns }: { envFilteredRuns: Run[] }) {
  const [, navigate] = useLocation();
  const total = envFilteredRuns.length;
  const running = envFilteredRuns.filter((r) => r.status === "RUNNING");
  const passed = envFilteredRuns.filter((r) => r.status === "PASS").length;
  const failed = envFilteredRuns.filter((r) => r.status === "FAIL" || r.status === "FLAKY").length;
  const avgPassRate =
    total > 0 ? Math.round(envFilteredRuns.reduce((s, r) => s + r.passPct, 0) / total) : 0;
  const avgMs = total > 0 ? envFilteredRuns.reduce((s, r) => s + r.durationMs, 0) / total : 0;
  const avgDurationStr =
    avgMs < 60000 ? `${(avgMs / 1000).toFixed(1)}s` : `${Math.round(avgMs / 60000)}m`;

  const items = [
    {
      label: "Total",
      value: total.toString(),
      color: "var(--proof-blue)",
      onClick: () => navigate("/runs"),
    },
    {
      label: "Running",
      value: running.length.toString(),
      color: "var(--proof-blue-hover)",
      onClick: () => navigate("/runs?status=RUNNING"),
    },
    {
      label: "Passed",
      value: passed.toString(),
      color: "var(--proof-green)",
      onClick: () => navigate("/runs?status=PASS"),
    },
    {
      label: "Failed",
      value: failed.toString(),
      color: "var(--proof-red)",
      onClick: () => navigate("/runs?status=FAIL"),
    },
    {
      label: "Pass Rate",
      value: `${avgPassRate}%`,
      color:
        avgPassRate >= 80
          ? "var(--proof-green)"
          : avgPassRate >= 50
            ? "var(--proof-yellow)"
            : "var(--proof-red)",
      onClick: () => navigate("/trends"),
    },
    {
      label: "Duration",
      value: avgDurationStr,
      color: "var(--proof-purple)",
      onClick: () => navigate("/runs"),
    },
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
          onClick={item.onClick}
          style={{
            padding: "6px 8px",
            borderRadius: 3,
            background: "var(--proof-hover-light)",
            display: "flex",
            flexDirection: "column",
            gap: 1,
            cursor: "pointer",
            transition: "background 0.1s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--proof-hover-light)";
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

function RunsListBanner({ running }: { running: Run[] }) {
  return running.length > 0 ? (
    <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--proof-border)" }}>
      <div
        style={{
          padding: "8px 10px",
          borderRadius: 6,
          background: "linear-gradient(90deg, rgba(59,130,246,0.1) 0%, rgba(91,138,245,0.06) 100%)",
          border: "1px solid rgba(59,130,246,0.25)",
          borderLeft: "3px solid var(--proof-blue-hover)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Loader2
          size={12}
          style={{
            color: "var(--proof-blue-hover)",
            animation: "spin 1s linear infinite",
            flexShrink: 0,
          }}
        />
        <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: "var(--proof-text)" }}>
          {running.length} running
        </span>
        <a
          href={GH_ACTIONS_URL}
          target="_blank" rel="noopener noreferrer"
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: "var(--proof-blue-hover)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          View <ExternalLink size={8} />
        </a>
      </div>
    </div>
  ) : (
    <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--proof-border)" }}>
      <div
        style={{
          padding: "8px 10px",
          borderRadius: 6,
          background: "linear-gradient(90deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.03) 100%)",
          border: "1px solid rgba(34,197,94,0.18)",
          borderLeft: "3px solid #22c55e",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Check size={12} style={{ color: "var(--proof-green)", flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: "var(--proof-text)" }}>
          All idle
        </span>
        <a
          href={GH_ACTIONS_URL}
          target="_blank" rel="noopener noreferrer"
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: "var(--proof-green)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          Actions <ExternalLink size={8} />
        </a>
      </div>
    </div>
  );
}

function RunsQuickNav() {
  const [, navigate] = useLocation();
  const items = [
    { href: "/", icon: BarChart3, label: "Dashboard" },
    { href: "/compare", icon: GitCompare, label: "Compare" },
    { href: "/trends", icon: BarChart3, label: "Trends" },
  ];
  return (
    <div
      style={{
        padding: "6px 10px",
        borderBottom: "1px solid var(--proof-border)",
        display: "flex",
        gap: 4,
        flexWrap: "wrap",
      }}
    >
      {items.map(({ href, icon: Ic, label }) => (
        <button
          key={href}
          onClick={() => navigate(href)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 8px",
            borderRadius: 4,
            border: "1px solid var(--proof-border-strong)",
            background: "var(--proof-surface-2)",
            color: "var(--proof-text-secondary)",
            cursor: "pointer",
            fontSize: 10,
            fontWeight: 500,
            transition: "all 0.12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--proof-text)";
            e.currentTarget.style.borderColor = "rgba(91,138,245,0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--proof-text-secondary)";
            e.currentTarget.style.borderColor = "var(--proof-border-strong)";
          }}
        >
          <Ic size={11} /> {label}
        </button>
      ))}
    </div>
  );
}

function RunsListFilters() {
  const [search, setSearch] = useSyncedUrlState("q", "");
  const [statusFilter, setStatusFilter] = useSyncedUrlState("status", "all");
  const [suiteFilter, setSuiteFilter] = useSyncedUrlState("suite", "all");
  const [envFilter, setEnvFilter] = useSyncedUrlState("env", "all");

  const allRuns = useSyncExternalStore(subscribeToRuns, getRuns);
  const envs = [...new Set(allRuns.map((r) => r.env))].sort();
  const suites = [...new Set(allRuns.map((r) => r.suiteId))].sort();
  const selectedEnvIds = useSyncExternalStore(
    subscribeToSelectedEnv,
    getSelectedEnvSnapshot,
  ).envIds;
  const base =
    selectedEnvIds.length > 0 ? allRuns.filter((r) => selectedEnvIds.includes(r.envId)) : allRuns;
  const filtered = base.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (suiteFilter !== "all" && r.suiteId !== suiteFilter) return false;
    if (envFilter !== "all" && r.env !== envFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.id.toLowerCase().includes(q) &&
        !r.env.toLowerCase().includes(q) &&
        !r.suiteId.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const hasActiveFilters =
    statusFilter !== "all" || suiteFilter !== "all" || envFilter !== "all" || search !== "";
  const clearFilters = () => {
    setStatusFilter("all");
    setSuiteFilter("all");
    setEnvFilter("all");
    setSearch("");
  };

  return (
    <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--proof-border)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          border: "1px solid var(--proof-border)",
          borderRadius: 4,
          padding: "3px 6px",
          marginBottom: 6,
        }}
      >
        <Search size={11} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search runs..."
          style={{
            border: "none",
            outline: "none",
            fontSize: 11,
            background: "transparent",
            flex: 1,
            minWidth: 0,
            color: "var(--proof-text)",
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            fontSize: 10,
            padding: "2px 5px",
            border: "1px solid var(--proof-border)",
            borderRadius: 3,
            background: "var(--proof-surface)",
            color: "var(--proof-text)",
            flex: 1,
            minWidth: 0,
          }}
        >
          <option value="all">All status</option>
          <option value="PASS">PASS</option>
          <option value="FAIL">FAIL</option>
          <option value="PARTIAL">PARTIAL</option>
          <option value="FLAKY">FLAKY</option>
          <option value="RUNNING">RUNNING</option>
        </select>
        <select
          value={suiteFilter}
          onChange={(e) => setSuiteFilter(e.target.value)}
          style={{
            fontSize: 10,
            padding: "2px 5px",
            border: "1px solid var(--proof-border)",
            borderRadius: 3,
            background: "var(--proof-surface)",
            color: "var(--proof-text)",
            flex: 1,
            minWidth: 0,
          }}
        >
          <option value="all">All suites</option>
          {suites.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={envFilter}
          onChange={(e) => setEnvFilter(e.target.value)}
          style={{
            fontSize: 10,
            padding: "2px 5px",
            border: "1px solid var(--proof-border)",
            borderRadius: 3,
            background: "var(--proof-surface)",
            color: "var(--proof-text)",
            flex: 1,
            minWidth: 0,
          }}
        >
          <option value="all">All envs</option>
          {envs.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              fontSize: 10,
              color: "var(--proof-red-bright)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 4px",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <X size={10} /> Clear
          </button>
        )}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 4,
        }}
      >
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
          {statusFilter !== "all" && (
            <FilterBadge label={`status=${statusFilter}`} onRemove={() => setStatusFilter("all")} />
          )}
          {suiteFilter !== "all" && (
            <FilterBadge label={`suite=${suiteFilter}`} onRemove={() => setSuiteFilter("all")} />
          )}
          {envFilter !== "all" && (
            <FilterBadge label={`env=${envFilter}`} onRemove={() => setEnvFilter("all")} />
          )}
          {search && <FilterBadge label={`"${search}"`} onRemove={() => setSearch("")} />}
        </div>
        <span
          style={{ fontSize: 10, color: "var(--proof-text-muted)", fontFamily: "var(--font-mono)" }}
        >
          {filtered.length}/{base.length}
        </span>
      </div>
    </div>
  );
}

function FilterBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        fontSize: 9,
        padding: "1px 5px",
        borderRadius: 3,
        background: "var(--proof-hover)",
        border: "1px solid var(--proof-border)",
        color: "var(--proof-text-secondary)",
        cursor: "pointer",
      }}
      onClick={onRemove}
    >
      {label} <X size={8} />
    </span>
  );
}

function RunsGhActions() {
  return (
    <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--proof-border)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px",
          borderRadius: 6,
          border: "1px solid var(--proof-grey)",
        }}
      >
        <Github size={16} style={{ color: "var(--proof-blue)", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--proof-text)" }}>
            GitHub Actions
          </div>
          <div style={{ fontSize: 9, color: "var(--proof-text-secondary)", marginTop: 1 }}>
            Monitor live runs & review results
          </div>
        </div>
        <a
          href={GH_ACTIONS_URL}
          target="_blank" rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            padding: "4px 8px",
            borderRadius: 4,
            border: "1px solid var(--proof-blue)",
            background: "var(--proof-blue-bg)",
            color: "var(--proof-blue)",
            cursor: "pointer",
            fontSize: 9,
            fontWeight: 600,
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          Open <ExternalLink size={8} />
        </a>
      </div>
    </div>
  );
}

function RunDetailBreadcrumb({ run }: { run: Run }) {
  const [, navigate] = useLocation();
  const results = getTestResultsForRun(run.id);
  const passCount = results.filter((r) => r.status === "PASS").length;
  const failCount = results.filter((r) => r.status === "FAIL").length;
  const passRate = results.length > 0 ? Math.round((passCount / results.length) * 100) : 0;

  return (
    <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--proof-border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
        <button
          onClick={() => navigate("/runs")}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--proof-text-secondary)",
            padding: 0,
            display: "flex",
            alignItems: "center",
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={11} /> Runs
        </button>
        <span style={{ color: "var(--proof-border-strong)", fontSize: 11 }}>/</span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            fontWeight: 600,
            color: "var(--proof-text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          }}
        >
          {run.id}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: 9,
            padding: "1px 6px",
            borderRadius: 3,
            fontWeight: 600,
            background:
              run.status === "PASS"
                ? "rgba(34,197,94,0.12)"
                : run.status === "FAIL"
                  ? "rgba(239,68,68,0.12)"
                  : "rgba(234,179,8,0.12)",
            color:
              run.status === "PASS"
                ? "var(--proof-green)"
                : run.status === "FAIL"
                  ? "var(--proof-red)"
                  : "var(--proof-yellow)",
          }}
        >
          {run.status}
        </span>
        <span
          style={{
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            color:
              passRate === 100
                ? "var(--proof-green)"
                : passRate < 90
                  ? "var(--proof-red)"
                  : "var(--proof-yellow)",
          }}
        >
          {passRate}%
        </span>
        <span
          style={{
            fontSize: 9,
            color: "var(--proof-text-secondary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          +{passCount}/-{failCount}
        </span>
        <span
          style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--proof-text-muted)" }}
        >
          {run.duration}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
        <span
          style={{
            fontSize: 9,
            fontFamily: "var(--font-mono)",
            color: "var(--proof-text-muted)",
            padding: "1px 5px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--proof-border)",
            borderRadius: 3,
          }}
        >
          {run.env} · {run.envId} · build {run.build}
        </span>
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
          }}
          style={{
            border: "1px solid var(--proof-border)",
            background: "var(--proof-surface)",
            cursor: "pointer",
            padding: "2px 6px",
            borderRadius: 3,
            color: "var(--proof-text-secondary)",
            display: "flex",
            alignItems: "center",
            gap: 3,
            fontSize: 9,
          }}
        >
          <Share2 size={9} /> Share
        </button>
        <button
          onClick={() => navigate(`/compare?candidate=${run.id}&baseline=${getRuns().at(-1)?.id}`)}
          style={{
            border: "1px solid var(--proof-border)",
            background: "var(--proof-surface)",
            cursor: "pointer",
            padding: "2px 6px",
            borderRadius: 3,
            color: "var(--proof-text-secondary)",
            display: "flex",
            alignItems: "center",
            gap: 3,
            fontSize: 9,
          }}
        >
          <GitCompare size={9} /> Diff
        </button>
        <a
          href={`${repo}/actions/runs/${run.id}`}
          target="_blank" rel="noopener noreferrer"
          style={{
            border: "1px solid var(--proof-border)",
            background: "var(--proof-surface)",
            cursor: "pointer",
            padding: "2px 6px",
            borderRadius: 3,
            color: "var(--proof-text-secondary)",
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            fontSize: 9,
          }}
        >
          <Github size={9} />
        </a>
      </div>
    </div>
  );
}

function RunDetailKpis({ run, results }: { run: Run; results: TestResult[] }) {
  const [, navigate] = useLocation();
  const passCount = results.filter((r) => r.status === "PASS").length;
  const failCount = results.filter((r) => r.status === "FAIL").length;
  const passRate = results.length > 0 ? Math.round((passCount / results.length) * 100) : 0;
  const avgDuration =
    results.length > 0
      ? Math.round(results.reduce((s, r) => s + r.duration, 0) / results.length)
      : 0;
  const categories = [...new Set(results.map((r) => r.category))];
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--proof-border)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: collapsed ? 0 : 6,
        }}
      >
        {!collapsed && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: "var(--proof-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.4px",
            }}
          >
            Run KPIs
          </span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--proof-text-secondary)",
            padding: 2,
            display: "flex",
            marginLeft: "auto",
          }}
        >
          <ChevronDown
            size={12}
            style={{
              transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
              transition: "transform 0.15s",
            }}
          />
        </button>
      </div>
      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            onClick={() => navigate(`/trends`)}
            style={{
              padding: "6px 8px",
              borderRadius: 4,
              background:
                passRate === 100
                  ? "rgba(34,197,94,0.08)"
                  : passRate < 90
                    ? "rgba(239,68,68,0.08)"
                    : "rgba(234,179,8,0.08)",
              border: `1px solid ${passRate === 100 ? "rgba(34,197,94,0.2)" : passRate < 90 ? "rgba(239,68,68,0.2)" : "rgba(234,179,8,0.2)"}`,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                fontSize: 8,
                color: "var(--proof-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
              }}
            >
              Pass Rate
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 18,
                fontWeight: 700,
                color:
                  passRate === 100
                    ? "var(--proof-green)"
                    : passRate < 90
                      ? "var(--proof-red)"
                      : "var(--proof-yellow)",
              }}
            >
              {passRate}%
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            {[
              {
                label: "Total",
                value: results.length,
                color: "var(--proof-text)",
                onClick: () => navigate(`/runs/${run.id}`),
              },
              {
                label: "Failed",
                value: failCount,
                color: failCount > 0 ? "var(--proof-red)" : "var(--proof-text-secondary)",
                onClick: failCount > 0 ? () => navigate(`/runs/${run.id}?status=FAIL`) : undefined,
              },
              {
                label: "Passed",
                value: passCount,
                color: "var(--proof-green)",
                onClick: passCount > 0 ? () => navigate(`/runs/${run.id}?status=PASS`) : undefined,
              },
              {
                label: "Avg Dur",
                value: `${avgDuration}ms`,
                color: "var(--proof-text)",
                onClick: () => navigate(`/trends`),
              },
            ].map((s) => (
              <div
                key={s.label}
                onClick={s.onClick}
                style={{
                  padding: "5px 6px",
                  borderRadius: 4,
                  background: "var(--proof-grey-bg)",
                  border: "1px solid var(--proof-grey)",
                  cursor: s.onClick ? "pointer" : "default",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (s.onClick)
                    (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--proof-grey-bg)";
                }}
              >
                <div
                  style={{
                    fontSize: 8,
                    color: "var(--proof-text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    fontWeight: 700,
                    color: s.color,
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
          {categories.length > 0 && (
            <div
              style={{
                padding: "6px 8px",
                borderRadius: 4,
                border: "1px solid var(--proof-grey)",
                background: "var(--proof-grey-bg)",
              }}
            >
              <div
                style={{
                  fontSize: 8,
                  color: "var(--proof-text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  marginBottom: 2,
                }}
              >
                By Category
              </div>
              {categories.map((cat) => {
                const catResults = results.filter((r) => r.category === cat);
                const pct = Math.round(
                  (catResults.filter((r) => r.status === "PASS").length / catResults.length) * 100,
                );
                return (
                  <div
                    key={cat}
                    onClick={() => navigate(`/runs/${run.id}?cat=${encodeURIComponent(cat)}`)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      marginTop: 2,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.opacity = "0.8";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.opacity = "1";
                    }}
                  >
                    <span
                      style={{
                        fontSize: 8,
                        color: "var(--proof-text-muted)",
                        fontFamily: "var(--font-mono)",
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {cat}
                    </span>
                    <div
                      style={{
                        width: 50,
                        height: 4,
                        borderRadius: 2,
                        background: "var(--proof-grey)",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          borderRadius: 2,
                          background:
                            pct === 100
                              ? "var(--proof-green)"
                              : pct < 80
                                ? "var(--proof-red)"
                                : "var(--proof-yellow)",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 7,
                        color: "var(--proof-text-muted)",
                        fontFamily: "var(--font-mono)",
                        minWidth: 16,
                        textAlign: "right",
                      }}
                    >
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RunDetailFilters() {
  const [search, setSearch] = useSyncedUrlState("q", "");
  const [statusFilter, setStatusFilter] = useSyncedUrlState("status", "all");
  const [catFilter, setCatFilter] = useSyncedUrlState("cat", "all");
  const params = useParams<{ runId: string }>();
  const run = params.runId ? getRunById(params.runId) : null;
  const results = run ? getTestResultsForRun(run.id) : [];
  const categories = [...new Set(results.map((r) => r.category))];

  const filtered = results.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (catFilter !== "all" && r.category !== catFilter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--proof-border)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          border: "1px solid var(--proof-border)",
          borderRadius: 4,
          padding: "3px 6px",
          marginBottom: 4,
        }}
      >
        <Search size={11} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tests..."
          style={{
            border: "none",
            outline: "none",
            fontSize: 11,
            background: "transparent",
            flex: 1,
            minWidth: 0,
            color: "var(--proof-text)",
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            fontSize: 10,
            padding: "2px 5px",
            border: "1px solid var(--proof-border)",
            borderRadius: 3,
            background: "var(--proof-surface)",
            color: "var(--proof-text)",
            flex: 1,
            minWidth: 0,
          }}
        >
          <option value="all">All status</option>
          <option value="PASS">PASS</option>
          <option value="FAIL">FAIL</option>
        </select>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          style={{
            fontSize: 10,
            padding: "2px 5px",
            border: "1px solid var(--proof-border)",
            borderRadius: 3,
            background: "var(--proof-surface)",
            color: "var(--proof-text)",
            flex: 1,
            minWidth: 0,
          }}
        >
          <option value="all">All cats</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span
          style={{
            fontSize: 9,
            color: "var(--proof-text-muted)",
            fontFamily: "var(--font-mono)",
            flexShrink: 0,
          }}
        >
          {filtered.length}/{results.length}
        </span>
      </div>
    </div>
  );
}

function RecentRunsList({ envFilteredRuns }: { envFilteredRuns: Run[] }) {
  const [location, navigate] = useLocation();
  const recent = [...envFilteredRuns]
    .sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime())
    .slice(0, 20);
  const selectedRunId = location.split("/runs/")[1]?.split(/[?/]/)[0] ?? "";

  return (
    <div style={{ padding: "4px 0" }}>
      <div
        style={{
          padding: "4px 12px 2px",
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color: "var(--proof-text-muted)",
        }}
      >
        Recent Runs
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {recent.map((run, i) => {
          const pct = run.passPct ?? 0;
          const passColor =
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
              title={`${run.label || run.id} (${pct}%)`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "1px 0",
                cursor: "pointer",
                lineHeight: "14px",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <div
                style={{
                  width: 14,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flexShrink: 0,
                }}
              >
                {i > 0 && (
                  <div
                    style={{
                      width: 1,
                      height: 2,
                      background: "var(--proof-border)",
                      flexShrink: 0,
                    }}
                  />
                )}
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: passColor,
                    flexShrink: 0,
                    outline: isSelected ? `2px solid ${passColor}` : "none",
                    outlineOffset: 2,
                  }}
                />
                {i < recent.length - 1 && (
                  <div
                    style={{
                      width: 1,
                      height: 2,
                      background: "var(--proof-border)",
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: 9,
                  color: "var(--proof-text-secondary)",
                }}
              >
                {run.label || run.id}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RunsPanel() {
  const [_location] = useLocation();
  const params = useParams<{ runId?: string }>();
  const isDetail = !!params.runId;
  const envSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  const allRuns = useSyncExternalStore(subscribeToRuns, getRuns);
  const envFilteredRuns =
    envSnap.envIds.length > 0 ? allRuns.filter((r) => envSnap.envIds.includes(r.envId)) : allRuns;
  const running = envFilteredRuns.filter((r) => r.status === "RUNNING");

  const run = isDetail && params.runId ? getRunById(params.runId) : null;
  const results = run ? getTestResultsForRun(run.id) : [];

  return (
    <>
      <RunsStatSummary envFilteredRuns={envFilteredRuns} />
      {isDetail && run ? (
        <>
          <RunDetailBreadcrumb run={run} />
          <RunDetailKpis run={run} results={results} />
          <RunDetailFilters />
        </>
      ) : (
        <>
          <RunsListBanner running={running} />
          <RunsQuickNav />
          <RunsListFilters />
          <RunsGhActions />
        </>
      )}
      <RecentRunsList envFilteredRuns={envFilteredRuns} />
    </>
  );
}
