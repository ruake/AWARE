import React from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Database,
  Clock,
} from "lucide-react";
import type { ToolCall } from "@/lib/copilot/types";
import ChartCard from "./ChartCard";

interface Props {
  toolCall: ToolCall;
}

const TOOL_META: Record<string, { label: string; verb: string; color: string; icon: string }> = {
  query_runs: { label: "Run History", verb: "Querying run history…", color: "#3b82f6", icon: "📊" },
  get_flaky_tests: {
    label: "Flaky Tests",
    verb: "Analyzing flakiness…",
    color: "#f59e0b",
    icon: "⚡",
  },
  compare_environments: {
    label: "Env Comparison",
    verb: "Comparing environments…",
    color: "#8b5cf6",
    icon: "🔀",
  },
  get_promotion_status: {
    label: "Promotion Gate",
    verb: "Checking promotion gate…",
    color: "#10b981",
    icon: "🛡️",
  },
  get_failure_breakdown: {
    label: "Failure Breakdown",
    verb: "Breaking down failures…",
    color: "#ef4444",
    icon: "🔍",
  },
};

export default function ToolCallCard({ toolCall }: Props) {
  const [expanded, setExpanded] = React.useState(false);
  const meta = TOOL_META[toolCall.name] ?? {
    label: toolCall.name,
    verb: `Running ${toolCall.name}…`,
    color: "var(--proof-blue)",
    icon: "⚙️",
  };
  const isDone = toolCall.status === "done";
  const isError = toolCall.status === "error";
  const isRunning = toolCall.status === "running" || toolCall.status === "pending";
  const durationMs =
    isDone && toolCall.completedAt ? toolCall.completedAt - toolCall.startedAt : null;
  const hasChart = !!toolCall.result?.chartData;

  return (
    <div className="copilot-tool-card">
      {/* Header */}
      <button
        onClick={() => isDone && setExpanded((p) => !p)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          background: "none",
          border: "none",
          cursor: isDone ? "pointer" : "default",
          textAlign: "left",
        }}
      >
        {/* Status icon */}
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: isRunning
              ? "rgba(59,130,246,0.1)"
              : isDone
                ? "rgba(52,211,153,0.1)"
                : "rgba(248,113,113,0.1)",
            border: `1px solid ${isRunning ? "rgba(59,130,246,0.2)" : isDone ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {isRunning && (
            <Loader2 size={11} style={{ color: "#60a5fa", animation: "spin 1s linear infinite" }} />
          )}
          {isDone && <CheckCircle2 size={11} style={{ color: "#34d399" }} />}
          {isError && <XCircle size={11} style={{ color: "#f87171" }} />}
        </div>

        {/* Emoji + label */}
        <span style={{ fontSize: 12, flexShrink: 0 }}>{meta.icon}</span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: isRunning ? "#60a5fa" : isDone ? "var(--proof-text)" : "#f87171",
            flex: 1,
          }}
        >
          {isRunning ? meta.verb : meta.label}
        </span>

        {/* Duration */}
        {durationMs !== null && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              fontSize: 10,
              color: "var(--proof-text-muted)",
            }}
          >
            <Clock size={9} />
            {durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(1)}s`}
          </span>
        )}

        {/* Expand chevron */}
        {isDone &&
          (expanded ? (
            <ChevronDown size={12} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
          ) : (
            <ChevronRight size={12} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
          ))}
      </button>

      {/* Chart — always visible when done and has chart */}
      {isDone && hasChart && (
        <div style={{ padding: "0 12px 12px" }}>
          <ChartCard chartData={toolCall.result!.chartData!} />
        </div>
      )}

      {/* Expanded raw data */}
      {isDone && expanded && !!toolCall.result?.data && (
        <div style={{ padding: "0 12px 12px", borderTop: "1px solid var(--proof-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 0 6px" }}>
            <Database size={10} style={{ color: "var(--proof-text-muted)" }} />
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 600,
                color: "var(--proof-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Raw Data
            </span>
          </div>
          <pre
            style={{
              fontSize: 10.5,
              color: "var(--proof-text-secondary)",
              overflowX: "auto",
              maxHeight: 180,
              overflowY: "auto",
              margin: 0,
              fontFamily: "var(--font-mono)",
              background: "rgba(0,0,0,0.3)",
              borderRadius: 8,
              padding: "8px 10px",
              border: "1px solid var(--proof-border)",
              lineHeight: 1.5,
            }}
          >
            {JSON.stringify(toolCall.result!.data, null, 2).slice(0, 1500)}
          </pre>
        </div>
      )}

      {/* Error message */}
      {isError && (
        <div style={{ padding: "6px 12px 10px", fontSize: 11.5, color: "#f87171" }}>
          Tool execution failed. Please retry or rephrase your query.
        </div>
      )}
    </div>
  );
}
