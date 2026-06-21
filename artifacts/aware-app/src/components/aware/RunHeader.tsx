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
  const envCfg = getEnvConfigById(run.envId);
  return (
    <div
      className="proof-card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "10px 16px",
        fontSize: 12,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background:
              run.env === "QA"
                ? "rgba(168,85,247,0.15)"
                : run.env === "UAT"
                  ? "rgba(245,158,11,0.15)"
                  : "rgba(34,197,94,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            color: run.env === "QA" ? "#a855f7" : run.env === "UAT" ? "#f59e0b" : "#22c55e",
            flexShrink: 0,
          }}
        >
          {run.env}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{envIdToLabel(run.envId)}</div>
          <div style={{ color: "var(--proof-text-secondary)", fontSize: 11 }}>{run.suiteId}</div>
        </div>
      </div>

      <div style={{ width: 1, height: 28, background: "var(--proof-grey)" }} />

      <div style={{ display: "flex", gap: 20 }}>
        <div>
          <div
            style={{
              fontSize: 10,
              color: "var(--proof-text-secondary)",
              marginBottom: 2,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Run ID
            <button
              onClick={copyId}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                color: copied ? "var(--proof-green)" : "var(--proof-text-muted)",
              }}
              title="Copy Run ID"
            >
              <Copy size={11} />
            </button>
          </div>
          <div
            style={{
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              color: "var(--proof-text-secondary)",
            }}
          >
            {run.id.slice(0, 8)}...
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, color: "var(--proof-text-secondary)", marginBottom: 2 }}>
            Network
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: run.network === "production" ? "#22c55e" : "#f59e0b",
              background:
                run.network === "production" ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
              padding: "1px 7px",
              borderRadius: 4,
            }}
          >
            {run.network}
          </span>
        </div>

        <div>
          <div style={{ fontSize: 10, color: "var(--proof-text-secondary)", marginBottom: 2 }}>
            Pass Rate
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: run.passPct === 100 ? "#22c55e" : run.passPct >= 80 ? "#f59e0b" : "#ef4444",
            }}
          >
            {run.passPct}%
          </span>
        </div>

        <div>
          <div style={{ fontSize: 10, color: "var(--proof-text-secondary)", marginBottom: 2 }}>
            Status
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {run.status === "RUNNING" && (
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#3b82f6",
                  boxShadow: "0 0 8px #3b82f6",
                  animation: "proof-pulse 1.5s infinite",
                }}
              />
            )}
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color:
                  run.status === "PASS" ? "#22c55e" : run.status === "RUNNING" ? "#3b82f6" : "#ef4444",
              }}
            >
              {run.status}
            </span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, color: "var(--proof-text-secondary)", marginBottom: 2 }}>
            Duration
          </div>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--proof-text-secondary)",
            }}
          >
            {run.duration}
          </span>
        </div>

        <div>
          <div style={{ fontSize: 10, color: "var(--proof-text-secondary)", marginBottom: 2 }}>
            Started
          </div>
          <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
            {new Date(run.started).toLocaleString()}
          </span>
        </div>
      </div>

      {envCfg && (
        <>
          <div style={{ width: 1, height: 28, background: "var(--proof-grey)" }} />
          <div style={{ display: "flex", gap: 20 }}>
            <div>
              <div style={{ fontSize: 10, color: "var(--proof-text-secondary)", marginBottom: 2 }}>
                Property
              </div>
              <span style={{ fontSize: 11, fontWeight: 500 }}>
                {envCfg.property} v{envCfg.propertyVersion}
              </span>
            </div>
            {envCfg.baseUrl && (
              <div>
                <div
                  style={{ fontSize: 10, color: "var(--proof-text-secondary)", marginBottom: 2 }}
                >
                  Base URL
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    color: "var(--proof-text-secondary)",
                  }}
                >
                  {envCfg.baseUrl}
                </span>
              </div>
            )}
            {run.build && (
              <div>
                <div
                  style={{ fontSize: 10, color: "var(--proof-text-secondary)", marginBottom: 2 }}
                >
                  Build
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    color: "var(--proof-text-secondary)",
                  }}
                >
                  {run.build}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
