import { Copy } from "lucide-react";
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
  const _envCfg = getEnvConfigById(run.envId);

  // Calculate stroke-dasharray for the ring gauge
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (run.passPct / 100) * circumference;
  const passColor = run.passPct >= 95 ? "var(--proof-green)" : run.passPct >= 80 ? "var(--proof-yellow)" : "var(--proof-red)";
  const passGlow = run.passPct >= 95 ? "var(--proof-glow-green)" : run.passPct >= 80 ? "var(--proof-glow-amber)" : "var(--proof-glow-red)";

  return (
    <div
      className="glass-panel"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 32,
        padding: "20px 32px",
        fontSize: 14,
        flexShrink: 0,
        borderRadius: 20,
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: passColor, boxShadow: passGlow }} />

      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 24, color: "var(--proof-text)", fontFamily: "var(--font-mono)", letterSpacing: "-0.02em" }}>{envIdToLabel(run.envId)}</div>
          <div style={{ color: "var(--proof-text-secondary)", fontSize: 13, fontWeight: 600, marginTop: 4 }}>{run.suiteId}</div>
        </div>
      </div>

      <div style={{ width: 1, height: 48, background: "var(--proof-border)" }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, auto)", gap: 40, flex: 1 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
            Run ID
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontFamily: "var(--font-mono)", color: "var(--proof-blue)", fontWeight: 700 }}>
              {run.id.slice(0, 8)}
            </span>
            <button
              onClick={copyId}
              style={{
                background: "transparent",
                border: "1px solid var(--proof-border)",
                cursor: "pointer",
                padding: 6,
                borderRadius: 6,
                display: "flex",
                color: copied ? "var(--proof-green)" : "var(--proof-text-muted)",
                transition: "all 0.2s ease"
              }}
              title="Copy Run ID"
              aria-label="Copy Run ID"
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--proof-surface-hover)"; e.currentTarget.style.color = "var(--proof-text)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = copied ? "var(--proof-green)" : "var(--proof-text-muted)"; }}
            >
              <Copy size={14} />
            </button>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
            Network
          </div>
          <span
            className={`proof-badge ${run.network === "production" ? "proof-badge-pass" : "proof-badge-flaky"}`}
            style={{ fontSize: 11, fontWeight: 800, padding: "4px 10px" }}
          >
            {run.network}
          </span>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
            Status
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {run.status === "RUNNING" ? (
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "var(--proof-blue)",
                  boxShadow: "0 0 16px var(--proof-blue)",
                  animation: "proof-pulse 2s infinite",
                }}
              />
            ) : (
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: run.status === "PASS" ? "var(--proof-green)" : (run.status as string) === "RUNNING" ? "var(--proof-blue)" : "var(--proof-red)",
                  boxShadow: `0 0 12px ${run.status === "PASS" ? "var(--proof-green)" : "var(--proof-red)"}`,
                }}
              />
            )}
            <span
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: run.status === "PASS" ? "var(--proof-green)" : (run.status as string) === "RUNNING" ? "var(--proof-blue)" : "var(--proof-red)",
              }}
            >
              {run.status}
            </span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
            Duration
          </div>
          <span style={{ fontSize: 14, fontFamily: "var(--font-mono)", color: "var(--proof-text)", fontWeight: 700 }}>
            {run.duration}
          </span>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
            Started
          </div>
          <span style={{ fontSize: 13, color: "var(--proof-text-secondary)", fontWeight: 600 }}>
            {new Date(run.started).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            <span style={{ opacity: 0.6, marginLeft: 6 }}>
              {new Date(run.started).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </span>
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingLeft: 24, borderLeft: "1px solid var(--proof-border)" }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--proof-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
            Pass Rate
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: passColor, fontFamily: "var(--font-mono)" }}>
            {run.passPct}%
          </div>
        </div>
        <div style={{ position: 'relative', width: 56, height: 56, transform: 'rotate(-90deg)' }}>
          <svg width="56" height="56">
            <circle
              cx="28"
              cy="28"
              r={radius}
              fill="transparent"
              stroke="var(--proof-surface-hover)"
              strokeWidth="6"
            />
            <circle
              cx="28"
              cy="28"
              r={radius}
              fill="transparent"
              stroke={passColor}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
