import { Copy, Clock, Globe, Activity, GitBranch, Terminal } from "lucide-react";
import React from "react";
import type { Run } from "@/lib/types";
import { getEnvConfigById, envIdToLabel } from "@/lib/envConfig";

export function RunHeader({ run }: { run: Run }) {
  const [copied, setCopied] = React.useState(false);
  const copyId = () => {
    navigator.clipboard.writeText(run.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const envCfg = getEnvConfigById(run.envId);

  // Calculate stroke-dasharray for the ring gauge
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (run.passPct / 100) * circumference;
  const passColor = run.passPct === 100 ? "var(--proof-green)" : run.passPct >= 80 ? "var(--proof-yellow)" : "var(--proof-red)";

  return (
    <div
      className="proof-card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "12px 20px",
        fontSize: 13,
        flexShrink: 0,
        background: "var(--proof-surface)",
        border: "1px solid var(--proof-border)",
        borderRadius: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background:
              run.env === "QA"
                ? "rgba(168,85,247,0.1)"
                : run.env === "UAT"
                  ? "rgba(245,158,11,0.1)"
                  : "rgba(34,197,94,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 800,
            color: run.env === "QA" ? "var(--proof-purple)" : run.env === "UAT" ? "var(--proof-orange)" : "var(--proof-green)",
            flexShrink: 0,
            border: `1px solid ${run.env === "QA" ? "rgba(168,85,247,0.2)" : run.env === "UAT" ? "rgba(245,158,11,0.2)" : "rgba(34,197,94,0.2)"}`,
          }}
        >
          {run.env}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--proof-text)" }}>{envIdToLabel(run.envId)}</div>
          <div style={{ color: "var(--proof-text-secondary)", fontSize: 11, fontWeight: 500, marginTop: 1 }}>{run.suiteId}</div>
        </div>
      </div>

      <div style={{ width: 1, height: 32, background: "var(--proof-border)" }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, auto)", gap: 24, flex: 1 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            Run ID
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--proof-text-secondary)", fontWeight: 600 }}>
              {run.id.slice(0, 8)}
            </span>
            <button
              onClick={copyId}
              style={{
                background: "var(--proof-surface-hover)",
                border: "none",
                cursor: "pointer",
                padding: 4,
                borderRadius: 4,
                display: "flex",
                color: copied ? "var(--proof-green)" : "var(--proof-text-muted)",
                transition: "all 0.2s ease"
              }}
              title="Copy Run ID"
            >
              <Copy size={12} />
            </button>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            Network
          </div>
          <span
            className={`proof-badge ${run.network === "production" ? "proof-badge-pass" : "proof-badge-flaky"}`}
            style={{ fontSize: 10, fontWeight: 700 }}
          >
            {run.network}
          </span>
        </div>

        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            Status
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {run.status === "RUNNING" ? (
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--proof-blue)",
                  boxShadow: "0 0 12px var(--proof-blue)",
                  animation: "proof-pulse 2s infinite",
                }}
              />
            ) : (
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: run.status === "PASS" ? "var(--proof-green)" : (run.status as string) === "RUNNING" ? "var(--proof-blue)" : "var(--proof-red)",
                }}
              />
            )}
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: run.status === "PASS" ? "var(--proof-green)" : (run.status as string) === "RUNNING" ? "var(--proof-blue)" : "var(--proof-red)",
              }}
            >
              {run.status}
            </span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            Duration
          </div>
          <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--proof-text)", fontWeight: 600 }}>
            {run.duration}
          </span>
        </div>

        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
            Started
          </div>
          <span style={{ fontSize: 11, color: "var(--proof-text-secondary)", fontWeight: 500 }}>
            {new Date(run.started).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            <span style={{ opacity: 0.6, marginLeft: 4 }}>
              {new Date(run.started).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 12, borderLeft: "1px solid var(--proof-border)" }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--proof-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
            Pass Rate
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: passColor }}>
            {run.passPct}%
          </div>
        </div>
        <div style={{ position: 'relative', width: 36, height: 36, transform: 'rotate(-90deg)' }}>
          <svg width="36" height="36">
            <circle
              cx="18"
              cy="18"
              r={radius}
              fill="transparent"
              stroke="var(--proof-border)"
              strokeWidth="4"
            />
            <circle
              cx="18"
              cy="18"
              r={radius}
              fill="transparent"
              stroke={passColor}
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
