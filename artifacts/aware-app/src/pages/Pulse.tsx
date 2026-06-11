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
} from "lucide-react";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { RUNS } from "@/lib/data";
import type { Run } from "@/lib/types";
const GH_ACTIONS_URL = `${window.location.origin}/ruake/PROOF/actions`;

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
        flexDirection: "column",
        padding: "14px 16px 12px",
        borderRadius: 10,
        border: `1px solid ${color}22`,
        background: `linear-gradient(160deg, ${color}0d 0%, rgba(19,23,40,0) 100%)`,
        borderTop: `2px solid ${color}55`,
        position: "relative",
        overflow: "hidden",
        minWidth: 120,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 10,
          right: 12,
          width: 28,
          height: 28,
          borderRadius: 7,
          background: `${color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={14} style={{ color }} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "var(--proof-text)", lineHeight: 1, letterSpacing: "-0.5px" }}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontWeight: 500, color: "var(--proof-text-secondary)", lineHeight: 1.3, marginTop: 5 }}>
        {label}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 9.5,
            color: "var(--proof-text-muted)",
            marginTop: 2,
            lineHeight: 1.3,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function RunRow({ run, onClick }: { run: Run; onClick: (id: string) => void }) {
  return (
    <tr
      onClick={() => onClick(run.id)}
      style={{ cursor: "pointer", transition: "background 0.12s" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--proof-surface-hover)")}
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
  const { Toast } = useSimpleToast();
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
                gap: 10,
                letterSpacing: "-0.3px",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, rgba(91,138,245,0.2) 0%, rgba(59,130,246,0.15) 100%)",
                  border: "1px solid rgba(91,138,245,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Activity size={16} style={{ color: "var(--proof-blue)" }} />
              </div>
              Pulse
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: running.length > 0 ? "#3b82f6" : "#22c55e",
                  background: running.length > 0 ? "rgba(59,130,246,0.1)" : "rgba(34,197,94,0.1)",
                  border: `1px solid ${running.length > 0 ? "rgba(59,130,246,0.25)" : "rgba(34,197,94,0.25)"}`,
                  borderRadius: 999,
                  padding: "2px 8px 2px 6px",
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: running.length > 0 ? "#3b82f6" : "#22c55e",
                    animation: running.length > 0 ? "pulseDot 1.5s ease-in-out infinite" : "none",
                    display: "inline-block",
                  }}
                />
                {running.length > 0 ? `${running.length} running` : "all idle"}
              </span>
            </h1>
            <p style={{ fontSize: 12, color: "var(--proof-text-secondary)", marginTop: 4 }}>
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
                borderRadius: 7,
                border: "1px solid var(--proof-border-strong)",
                background: "var(--proof-surface-2)",
                color: "var(--proof-text)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              <Github size={13} />
              GitHub Actions
              <ExternalLink size={10} style={{ opacity: 0.6 }} />
            </a>
            <Link href="/ci-pipeline">
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 12px",
                  borderRadius: 7,
                  border: "1px solid var(--proof-border-strong)",
                  background: "var(--proof-surface-2)",
                  color: "var(--proof-text-secondary)",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                <BarChart3 size={13} />
                CI Pipeline
                <ExternalLink size={10} style={{ opacity: 0.6 }} />
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
              padding: "12px 18px",
              borderRadius: 10,
              background: "linear-gradient(90deg, rgba(59,130,246,0.1) 0%, rgba(91,138,245,0.06) 100%)",
              border: "1px solid rgba(59,130,246,0.25)",
              borderLeft: "3px solid #3b82f6",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "rgba(59,130,246,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Loader2 size={14} className="animate-spin" style={{ color: "#3b82f6" }} />
            </div>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--proof-text)" }}>
                {running.length} workflow{running.length > 1 ? "s" : ""} currently running
              </span>
              <span style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginLeft: 8 }}>
                GitHub Actions in progress
              </span>
            </div>
            <a
              href={GH_ACTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginLeft: "auto",
                fontSize: 11,
                fontWeight: 600,
                color: "#3b82f6",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "5px 10px",
                borderRadius: 6,
                background: "rgba(59,130,246,0.12)",
                border: "1px solid rgba(59,130,246,0.2)",
              }}
            >
              View on GitHub <ExternalLink size={10} />
            </a>
          </div>
        )}

        {/* No running workflows — link to Actions */}
        {running.length === 0 && (
          <div
            style={{
              padding: "12px 18px",
              borderRadius: 10,
              background: "linear-gradient(90deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.03) 100%)",
              border: "1px solid rgba(34,197,94,0.18)",
              borderLeft: "3px solid #22c55e",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "rgba(34,197,94,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Check size={14} style={{ color: "#22c55e" }} />
            </div>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--proof-text)" }}>
                All workflows idle
              </span>
              <span style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginLeft: 8 }}>
                No runs currently in progress
              </span>
            </div>
            <a
              href={GH_ACTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginLeft: "auto",
                fontSize: 11,
                fontWeight: 600,
                color: "#22c55e",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "5px 10px",
                borderRadius: 6,
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.18)",
              }}
            >
              Open GitHub Actions <ExternalLink size={10} />
            </a>
          </div>
        )}

        {/* Quick actions */}
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid var(--proof-border)",
            background: "var(--proof-surface)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--proof-text-muted)",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              marginRight: 4,
            }}
          >
            Navigate
          </span>
          <div
            style={{ width: 1, height: 14, background: "var(--proof-border-strong)", marginRight: 4 }}
          />
          {[
            { href: "/", icon: BarChart3, label: "Dashboard" },
            { href: "/runs", icon: Activity, label: "All Runs" },
            { href: "/compare", icon: GitCompare, label: "Compare" },
          ].map(({ href, icon: Ic, label }) => (
            <Link key={href} href={href}>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 11px",
                  borderRadius: 6,
                  border: "1px solid var(--proof-border-strong)",
                  background: "var(--proof-surface-2)",
                  color: "var(--proof-text-secondary)",
                  cursor: "pointer",
                  fontSize: 11,
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
                <Ic size={12} /> {label}
              </button>
            </Link>
          ))}
          <Link href="/start" style={{ marginLeft: "auto" }}>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 13px",
                borderRadius: 6,
                border: "none",
                background: "linear-gradient(135deg, #5b8af5 0%, #7c6af5 100%)",
                color: "white",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 600,
                boxShadow: "0 1px 8px rgba(91,138,245,0.3)",
              }}
            >
              <Play size={12} /> Trigger New Run
            </button>
          </Link>
        </div>

        {/* Workflow history */}
        <div style={{ borderRadius: 10, border: "1px solid var(--proof-border)", overflow: "hidden" }}>
          <div
            style={{
              padding: "11px 16px",
              borderBottom: "1px solid var(--proof-border)",
              background: "var(--proof-surface)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginRight: 6, color: "var(--proof-text)" }}>Workflow History</h3>
              <div style={{ width: 1, height: 14, background: "var(--proof-border-strong)", marginRight: 2 }} />
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 999,
                    border: activeTab === tab.key ? "none" : "1px solid transparent",
                    background: activeTab === tab.key
                      ? "linear-gradient(135deg, #5b8af5 0%, #7c6af5 100%)"
                      : "transparent",
                    color: activeTab === tab.key ? "white" : "var(--proof-text-secondary)",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: activeTab === tab.key ? 600 : 500,
                    transition: "all 0.15s",
                    boxShadow: activeTab === tab.key ? "0 1px 6px rgba(91,138,245,0.3)" : "none",
                  }}
                >
                  {tab.label}
                  {tabCounts[tab.key] > 0 && (
                    <span style={{ marginLeft: 4, opacity: activeTab === tab.key ? 0.85 : 0.6 }}>
                      {tabCounts[tab.key]}
                    </span>
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
