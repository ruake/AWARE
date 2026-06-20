import React from "react";
import { useLocation } from "wouter";
import {
  Check,
  ExternalLink,
  Loader2,
  Github,
  Activity,
} from "lucide-react";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { RUNS } from "@/lib/data";
import type { Run } from "@/lib/types";
import { PulseFeed, PulseFilterBar } from "@/components/aware";
const GH_ACTIONS_URL = `https://github.com/ruake/AWARE/actions`;

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
  const total = RUNS.length;

  const filtered = activeTab === "all" ? RUNS : RUNS.filter((r) => r.status === activeTab);

  const tabCounts: Record<string, number> = { all: total };
  for (const s of ["PASS", "FAIL", "FLAKY", "PARTIAL", "RUNNING"] as Run["status"][]) {
    tabCounts[s] = RUNS.filter((r) => r.status === s).length;
  }

  return (
    <div className="proof-page" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div className="proof-page-header" style={{ alignItems: "flex-start" }}>
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "var(--proof-text)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              letterSpacing: "-0.5px",
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
            Activity
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: running.length > 0 ? "var(--proof-blue-hover)" : "var(--proof-green)",
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
                  background: running.length > 0 ? "var(--proof-blue-hover)" : "var(--proof-green)",
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
        </div>
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
            borderLeft: "3px solid var(--proof-blue-hover)",
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
            <Loader2
              size={14}
              style={{ color: "var(--proof-blue-hover)", animation: "spin 1s linear infinite" }}
            />
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
              color: "var(--proof-blue-hover)",
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
            <Check size={14} style={{ color: "var(--proof-green)" }} />
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
              color: "var(--proof-green)",
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
      <PulseFilterBar />

      {/* Workflow history */}
      <PulseFeed
        filtered={filtered}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        tabCounts={tabCounts}
        onRunClick={(id) => navigate(`/runs/${id}`)}
      />

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
      {Toast}
    </div>
  );
}
