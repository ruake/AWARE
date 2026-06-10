import React from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/aware/AppLayout";
import {
  Activity,
  Check,
  X,
  Clock,
  Play,
  GitCompare,
  BarChart3,
  ExternalLink,
  AlertTriangle,
  Loader2,
  Github,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { RUNS } from "@/lib/data";
import type { Run } from "@/lib/types";
import { repo } from "@/lib/nav";

const GH_ACTIONS_URL = `${repo}/actions`;

const STATUS_CONFIG: Record<
  Run["status"],
  {
    label: string;
    color: string;
    bg: string;
    icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  }
> = {
  PASS: { label: "Passed", color: "#22c55e", bg: "rgba(34,197,94,0.10)", icon: Check },
  FAIL: { label: "Failed", color: "#ef4444", bg: "rgba(239,68,68,0.10)", icon: X },
  PARTIAL: { label: "Partial", color: "#f59e0b", bg: "rgba(245,158,11,0.10)", icon: AlertTriangle },
  FLAKY: { label: "Flaky", color: "#f97316", bg: "rgba(247,147,26,0.10)", icon: AlertTriangle },
  RUNNING: { label: "Running", color: "#3b82f6", bg: "rgba(59,130,246,0.10)", icon: Loader2 },
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60000);
  const s = Math.round((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function StatusBadge({ status }: { status: Run["status"] }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
      }}
    >
      <Icon size={11} className={status === "RUNNING" ? "animate-spin" : ""} />
      {cfg.label}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  color,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        borderRadius: 8,
        border: `1px solid ${color}20`,
        background: `${color}08`,
        minWidth: 140,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--proof-text)", lineHeight: 1.2 }}>
          {value}
        </div>
        <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", lineHeight: 1.3 }}>
          {label}
        </div>
        {sub && (
          <div
            style={{
              fontSize: 10,
              color: "var(--proof-text-secondary)",
              opacity: 0.7,
              marginTop: 1,
            }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

function RunRow({ run, onClick }: { run: Run; onClick: (id: string) => void }) {
  return (
    <tr
      onClick={() => onClick(run.id)}
      style={{ cursor: "pointer" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--proof-grey-bg)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--proof-text)" }}>
              {run.label}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--proof-text-secondary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {run.id.slice(-12)}
            </div>
          </div>
        </div>
      </td>
      <td>
        <StatusBadge status={run.status} />
      </td>
      <td>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 600,
            color:
              run.passPct === 100
                ? "var(--proof-green)"
                : run.passPct < 90
                  ? "var(--proof-red)"
                  : "var(--proof-text)",
          }}
        >
          {run.passPct}%
        </span>
      </td>
      <td>
        <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
          {run.suite} · {run.env}
        </span>
      </td>
      <td>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--proof-text-secondary)",
          }}
        >
          {formatDuration(run.durationMs)}
        </span>
      </td>
      <td>
        <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
          {timeAgo(run.started)}
        </span>
      </td>
      <td>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--proof-text-secondary)",
            background: "var(--proof-grey-bg)",
            padding: "1px 5px",
            borderRadius: 3,
          }}
        >
          {run.build?.slice(0, 7) || "—"}
        </span>
      </td>
    </tr>
  );
}

export default function Pulse() {
  const { show, Toast } = useSimpleToast();
  const [activeTab, setActiveTab] = React.useState<"all" | Run["status"]>("all");
  const [, setRefresh] = React.useState(0);

  // Simulate live updates (re-render every 10s to refresh timeAgo)
  React.useEffect(() => {
    const interval = setInterval(() => setRefresh((n) => n + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  const running = RUNS.filter((r) => r.status === "RUNNING");
  const passed = RUNS.filter((r) => r.status === "PASS").length;
  const failed = RUNS.filter((r) => r.status === "FAIL" || r.status === "FLAKY").length;
  const total = RUNS.length;
  const avgPassRate = total > 0 ? Math.round(RUNS.reduce((s, r) => s + r.passPct, 0) / total) : 0;
  const avgDuration =
    total > 0 ? Math.round(RUNS.reduce((s, r) => s + r.durationMs, 0) / total) : 0;

  const filtered = activeTab === "all" ? RUNS : RUNS.filter((r) => r.status === activeTab);

  const statusTabs: { key: "all" | Run["status"]; label: string }[] = [
    { key: "all", label: "All" },
    { key: "RUNNING", label: "Running" },
    { key: "PASS", label: "Passed" },
    { key: "FAIL", label: "Failed" },
    { key: "FLAKY", label: "Flaky" },
    { key: "PARTIAL", label: "Partial" },
  ];

  const tabCounts: Record<string, number> = { all: total };
  for (const s of ["PASS", "FAIL", "FLAKY", "PARTIAL", "RUNNING"] as Run["status"][]) {
    tabCounts[s] = RUNS.filter((r) => r.status === s).length;
  }

  return (
    <AppLayout activeHref="/pulse">
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "var(--proof-text)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Activity size={20} style={{ color: "var(--proof-blue)" }} />
              Pulse
            </h1>
            <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", marginTop: 3 }}>
              Live GitHub Actions workflow status — powered by CI runs
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <a
              href={GH_ACTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid var(--proof-border-strong)",
                background: "var(--proof-surface)",
                color: "var(--proof-text)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              <Github size={13} />
              GitHub Actions
              <ExternalLink size={11} />
            </a>
            <Link href="/ci-pipeline">
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "1px solid var(--proof-border-strong)",
                  background: "var(--proof-surface)",
                  color: "var(--proof-text-secondary)",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                <BarChart3 size={13} />
                CI Pipeline
                <ExternalLink size={11} />
              </button>
            </Link>
          </div>
        </div>

        {/* Summary cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: 10,
          }}
        >
          <SummaryCard label="Total Workflows" value={total} color="#5b8af5" icon={Activity} />
          <SummaryCard label="Running Now" value={running.length} color="#3b82f6" icon={Loader2} />
          <SummaryCard label="Passed" value={passed} color="#22c55e" icon={Check} />
          <SummaryCard label="Failed / Flaky" value={failed} color="#ef4444" icon={X} />
          <SummaryCard
            label="Avg Pass Rate"
            value={`${avgPassRate}%`}
            sub={`across ${total} workflows`}
            color={avgPassRate >= 80 ? "#22c55e" : avgPassRate >= 50 ? "#f59e0b" : "#ef4444"}
            icon={BarChart3}
          />
          <SummaryCard
            label="Avg Duration"
            value={avgDuration > 0 ? formatDuration(avgDuration) : "—"}
            color="#a855f7"
            icon={Clock}
          />
        </div>

        {/* Running workflows banner */}
        {running.length > 0 && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.2)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Loader2
              size={16}
              className="animate-spin"
              style={{ color: "var(--proof-blue)", flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--proof-text)" }}>
              {running.length} workflow{running.length > 1 ? "s" : ""} running in GitHub Actions
            </span>
            <a
              href={GH_ACTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginLeft: "auto",
                fontSize: 12,
                color: "var(--proof-blue)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              View on GitHub <ExternalLink size={11} />
            </a>
          </div>
        )}

        {/* No running workflows — link to Actions */}
        {running.length === 0 && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 8,
              background: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.15)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Check size={16} style={{ color: "var(--proof-green)", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "var(--proof-text)" }}>
              All workflows idle. No runs in progress.
            </span>
            <a
              href={GH_ACTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginLeft: "auto",
                fontSize: 12,
                color: "var(--proof-blue)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              Open GitHub Actions <ExternalLink size={11} />
            </a>
          </div>
        )}

        {/* Quick actions */}
        <div
          style={{
            padding: "13px 18px",
            borderRadius: 8,
            border: "1px solid var(--proof-grey)",
            background: "var(--proof-grey-bg)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: "var(--proof-text-secondary)",
              letterSpacing: "0.6px",
              textTransform: "uppercase",
              marginRight: 2,
            }}
          >
            Quick Links
          </span>
          <div
            style={{ width: 1, height: 16, background: "var(--proof-border)", marginRight: 2 }}
          />
          <Link href="/">
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid var(--proof-border-strong)",
                background: "var(--proof-surface)",
                color: "var(--proof-text)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              <BarChart3 size={13} /> Dashboard
            </button>
          </Link>
          <Link href="/runs">
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid var(--proof-border-strong)",
                background: "var(--proof-surface)",
                color: "var(--proof-text)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              <Activity size={13} /> All Runs
            </button>
          </Link>
          <Link href="/compare">
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid var(--proof-border-strong)",
                background: "var(--proof-surface)",
                color: "var(--proof-text)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              <GitCompare size={13} /> Compare Runs
            </button>
          </Link>
          <Link href="/start">
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 14px",
                borderRadius: 6,
                border: "none",
                background: "var(--proof-blue)",
                color: "white",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <Play size={13} /> Trigger New Run
            </button>
          </Link>
        </div>

        {/* Workflow history */}
        <div style={{ borderRadius: 8, border: "1px solid var(--proof-grey)", overflow: "hidden" }}>
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--proof-grey)",
              background: "var(--proof-grey-bg)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, marginRight: 8 }}>Workflow History</h3>
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 12,
                    border: "none",
                    background: activeTab === tab.key ? "var(--proof-blue)" : "transparent",
                    color: activeTab === tab.key ? "white" : "var(--proof-text-secondary)",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 500,
                    transition: "all 0.15s",
                  }}
                >
                  {tab.label}
                  {tabCounts[tab.key] > 0 && (
                    <span style={{ marginLeft: 4, opacity: 0.8 }}>({tabCounts[tab.key]})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "var(--proof-text-secondary)",
                fontSize: 13,
              }}
            >
              <Activity size={24} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
              No workflows found.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                <thead>
                  <tr
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--proof-text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}
                  >
                    <th style={{ textAlign: "left", padding: "10px 16px" }}>Workflow</th>
                    <th style={{ textAlign: "left", padding: "10px 8px" }}>Status</th>
                    <th style={{ textAlign: "left", padding: "10px 8px" }}>Pass %</th>
                    <th style={{ textAlign: "left", padding: "10px 8px" }}>Suite · Env</th>
                    <th style={{ textAlign: "left", padding: "10px 8px" }}>Duration</th>
                    <th style={{ textAlign: "left", padding: "10px 8px" }}>When</th>
                    <th style={{ textAlign: "left", padding: "10px 8px" }}>Build</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((run) => (
                    <RunRow
                      key={run.id}
                      run={run}
                      onClick={(id) => (window.location.href = `/runs/${id}`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length > 0 && (
            <div
              style={{
                padding: "8px 16px",
                borderTop: "1px solid var(--proof-grey)",
                fontSize: 11,
                color: "var(--proof-text-secondary)",
                textAlign: "right",
              }}
            >
              {filtered.length} workflow{filtered.length > 1 ? "s" : ""}{" "}
              <a
                href={GH_ACTIONS_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "var(--proof-blue)",
                  textDecoration: "none",
                  marginLeft: 8,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                View all on GitHub <ExternalLink size={10} />
              </a>
            </div>
          )}
        </div>

        {/* GitHub Actions info card */}
        <div
          style={{
            padding: "14px 18px",
            borderRadius: 8,
            border: "1px solid var(--proof-grey)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: "rgba(91,138,245,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Github size={20} style={{ color: "var(--proof-blue)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--proof-text)" }}>
              GitHub Actions
            </div>
            <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginTop: 2 }}>
              Workflows are triggered on push, PR, and schedule. Monitor live runs, review test
              results, and compare environments.
            </div>
          </div>
          <a
            href={GH_ACTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid var(--proof-blue)",
              background: "var(--proof-blue-bg)",
              color: "var(--proof-blue)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            Open Actions <ExternalLink size={12} />
          </a>
        </div>
      </div>
      {Toast}
    </AppLayout>
  );
}
