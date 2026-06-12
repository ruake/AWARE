import React from "react";
import { Link, useLocation } from "wouter";
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
import { CTAStatCard } from "@/components/aware/CTAStatCard";
import { RUNS } from "@/lib/data";
import type { Run } from "@/lib/types";
const GH_ACTIONS_URL = `https://github.com/your-org/your-repo/actions`;

const STATUS_CONFIG: Record<
  Run["status"],
  {
    label: string;
    color: string;
    bg: string;
    icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  }
> = {
  PASS: { label: "Passed", color: "var(--proof-green)", bg: "var(--proof-green-bg)", icon: Check },
  FAIL: { label: "Failed", color: "var(--proof-red)", bg: "var(--proof-red-bg)", icon: X },
  PARTIAL: { label: "Partial", color: "var(--proof-yellow)", bg: "var(--proof-yellow-bg)", icon: AlertTriangle },
  FLAKY: { label: "Flaky", color: "var(--proof-orange)", bg: "var(--proof-orange-bg)", icon: AlertTriangle },
  RUNNING: { label: "Running", color: "var(--proof-blue)", bg: "var(--proof-blue-bg)", icon: Loader2 },
  PENDING: { label: "Pending", color: "var(--proof-text-secondary)", bg: "rgba(126,138,158,0.10)", icon: Clock },
  ERROR: { label: "Error", color: "var(--proof-red)", bg: "var(--proof-red-bg)", icon: X },
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

function RunRow({ run, onClick }: { run: Run; onClick: (id: string) => void }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <tr
      onClick={() => onClick(run.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: "pointer",
        background: hovered ? "rgba(255,255,255,0.025)" : undefined,
        transition: "background 0.1s ease",
      }}
    >
      {/* Workflow: label + short ID */}
      <td style={{ verticalAlign: "middle" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--proof-text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {run.label}
          </span>
          <span
            style={{
              fontSize: 10,
              color: "var(--proof-text-secondary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {run.id.slice(-12)}
          </span>
        </div>
      </td>
      {/* Status */}
      <td style={{ verticalAlign: "middle" }}>
        <StatusBadge status={run.status} />
      </td>
      {/* Pass % */}
      <td style={{ verticalAlign: "middle" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            fontWeight: 700,
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
      {/* Suite · Env */}
      <td style={{ verticalAlign: "middle" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {run.suiteId}
          </span>
          <span
            style={{ fontSize: 10, color: "var(--proof-text-secondary)", whiteSpace: "nowrap" }}
          >
            {run.env}
            {run.network && (
              <span
                style={{
                  marginLeft: 5,
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: run.network === "production" ? "var(--proof-green)" : "#d97706",
                  background:
                    run.network === "production"
                      ? "var(--proof-green-bg)"
                      : "var(--proof-yellow-bg)",
                  padding: "1px 4px",
                  borderRadius: 3,
                }}
              >
                {run.network}
              </span>
            )}
          </span>
        </div>
      </td>
      {/* Duration */}
      <td style={{ verticalAlign: "middle" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--proof-text-secondary)",
            whiteSpace: "nowrap",
          }}
        >
          {formatDuration(run.durationMs)}
        </span>
      </td>
      {/* When */}
      <td style={{ verticalAlign: "middle" }}>
        <span style={{ fontSize: 11, color: "var(--proof-text-secondary)", whiteSpace: "nowrap" }}>
          {timeAgo(run.started)}
        </span>
      </td>
      {/* Build */}
      <td style={{ verticalAlign: "middle" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--proof-text-secondary)",
            background: "var(--proof-grey-bg)",
            border: "1px solid var(--proof-border)",
            padding: "2px 6px",
            borderRadius: 3,
            whiteSpace: "nowrap",
          }}
        >
          {run.build?.slice(0, 7) || "—"}
        </span>
      </td>
    </tr>
  );
}

export default function Pulse() {
  const [, navigate] = useLocation();
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
                  background:
                    "linear-gradient(135deg, rgba(91,138,245,0.2) 0%, rgba(59,130,246,0.15) 100%)",
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

        {/* Summary cards — clickable to filter the workflow table */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 10,
          }}
        >
          <CTAStatCard
            label="Total"
            value={total}
            subtitle="all environments"
            accentColor="var(--proof-blue)"
            icon={<Activity size={16} />}
            onClick={() => setActiveTab("all")}
            active={activeTab === "all"}
          />
          <CTAStatCard
            label="Running"
            value={running.length}
            subtitle="in progress"
            accentColor="#3b82f6"
            icon={<Loader2 size={16} />}
            onClick={() => setActiveTab("RUNNING")}
            active={activeTab === "RUNNING"}
          />
          <CTAStatCard
            label="Passed"
            value={passed}
            subtitle="successful"
            accentColor="var(--proof-green)"
            icon={<Check size={16} />}
            onClick={() => setActiveTab("PASS")}
            active={activeTab === "PASS"}
          />
          <CTAStatCard
            label="Failed / Flaky"
            value={failed}
            subtitle="need attention"
            accentColor="var(--proof-red)"
            icon={<X size={16} />}
            onClick={() => setActiveTab("FAIL")}
            active={activeTab === "FAIL"}
          />
          <CTAStatCard
            label="Avg Pass Rate"
            value={`${avgPassRate}%`}
            subtitle={`${total} workflows`}
            accentColor={
              avgPassRate >= 80
                ? "var(--proof-green)"
                : avgPassRate >= 50
                  ? "var(--proof-yellow)"
                  : "var(--proof-red)"
            }
            icon={<BarChart3 size={16} />}
          />
          <CTAStatCard
            label="Avg Duration"
            value={avgDuration > 0 ? formatDuration(avgDuration) : "—"}
            subtitle="per workflow"
            accentColor="var(--proof-purple)"
            icon={<Clock size={16} />}
          />
        </div>

        {/* Running workflows banner */}
        {running.length > 0 && (
          <div
            style={{
              padding: "12px 18px",
              borderRadius: 10,
              background:
                "linear-gradient(90deg, rgba(59,130,246,0.1) 0%, rgba(91,138,245,0.06) 100%)",
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
              background:
                "linear-gradient(90deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.03) 100%)",
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
            style={{
              width: 1,
              height: 14,
              background: "var(--proof-border-strong)",
              marginRight: 4,
            }}
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
        <div
          style={{ borderRadius: 10, border: "1px solid var(--proof-border)", overflow: "hidden" }}
        >
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
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  marginRight: 6,
                  color: "var(--proof-text)",
                }}
              >
                Workflow History
              </h3>
              <div
                style={{
                  width: 1,
                  height: 14,
                  background: "var(--proof-border-strong)",
                  marginRight: 2,
                }}
              />
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: "3px 10px",
                    borderRadius: 999,
                    border: activeTab === tab.key ? "none" : "1px solid transparent",
                    background:
                      activeTab === tab.key
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
              <table
                className="proof-table"
                style={{ minWidth: 820, tableLayout: "fixed", width: "100%" }}
              >
                <colgroup>
                  <col />
                  <col style={{ width: 110 }} />
                  <col style={{ width: 72 }} />
                  <col style={{ width: 200 }} />
                  <col style={{ width: 90 }} />
                  <col style={{ width: 80 }} />
                  <col style={{ width: 75 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Workflow</th>
                    <th>Status</th>
                    <th>Pass %</th>
                    <th>Suite · Env</th>
                    <th>Duration</th>
                    <th>When</th>
                    <th>Build</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((run) => (
                    <RunRow key={run.id} run={run} onClick={(id) => navigate(`/runs/${id}`)} />
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
