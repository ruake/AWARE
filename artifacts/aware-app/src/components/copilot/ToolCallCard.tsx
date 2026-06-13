import React from "react";
import { CheckCircle2, XCircle, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import type { ToolCall } from "@/lib/copilot/types";
import ChartCard from "./ChartCard";

interface Props {
  toolCall: ToolCall;
}

const TOOL_LABELS: Record<string, { label: string; verb: string }> = {
  query_runs:            { label: "Run History",        verb: "Querying run history…"       },
  get_flaky_tests:       { label: "Flaky Tests",        verb: "Analyzing test flakiness…"   },
  compare_environments:  { label: "Env Comparison",     verb: "Comparing environments…"     },
  get_promotion_status:  { label: "Promotion Gate",     verb: "Checking promotion gate…"    },
  get_failure_breakdown: { label: "Failure Breakdown",  verb: "Breaking down failures…"     },
};

export default function ToolCallCard({ toolCall }: Props) {
  const [expanded, setExpanded] = React.useState(false);
  const meta = TOOL_LABELS[toolCall.name] ?? { label: toolCall.name, verb: `Running ${toolCall.name}…` };
  const isDone = toolCall.status === "done";
  const isError = toolCall.status === "error";
  const isRunning = toolCall.status === "running" || toolCall.status === "pending";
  const durationMs = isDone && toolCall.completedAt ? toolCall.completedAt - toolCall.startedAt : null;
  const hasChart = !!toolCall.result?.chartData;

  return (
    <div
      style={{
        margin: "4px 0",
        borderRadius: 8,
        border: `1px solid ${isError ? "#ef444440" : "var(--proof-border)"}`,
        background: isError ? "#ef444408" : "var(--proof-surface)",
        overflow: "hidden",
      }}
    >
      {/* Header row */}
      <button
        onClick={() => isDone && setExpanded((p) => !p)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          background: "none",
          border: "none",
          cursor: isDone ? "pointer" : "default",
          textAlign: "left",
        }}
      >
        {/* Status icon */}
        {isRunning && (
          <Loader2
            size={13}
            style={{ color: "var(--proof-blue)", flexShrink: 0, animation: "spin 1s linear infinite" }}
          />
        )}
        {isDone && <CheckCircle2 size={13} style={{ color: "#22c55e", flexShrink: 0 }} />}
        {isError && <XCircle size={13} style={{ color: "#ef4444", flexShrink: 0 }} />}

        {/* Label */}
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--proof-text-secondary)", flex: 1 }}>
          {isRunning ? meta.verb : meta.label}
        </span>

        {/* Duration */}
        {durationMs !== null && (
          <span style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>
            {durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(1)}s`}
          </span>
        )}

        {/* Expand chevron */}
        {isDone && (
          expanded
            ? <ChevronDown size={12} style={{ color: "var(--proof-text-secondary)", flexShrink: 0 }} />
            : <ChevronRight size={12} style={{ color: "var(--proof-text-secondary)", flexShrink: 0 }} />
        )}
      </button>

      {/* Chart (always visible when done) */}
      {isDone && hasChart && (
        <div style={{ padding: "0 10px 10px" }}>
          <ChartCard chartData={toolCall.result!.chartData!} />
        </div>
      )}

      {/* Expanded raw data */}
      {isDone && expanded && Boolean(toolCall.result?.data) && (
        <div
          style={{
            padding: "0 10px 10px",
            borderTop: "1px solid var(--proof-border)",
            marginTop: 2,
          }}
        >
          <pre
            style={{
              fontSize: 10,
              color: "var(--proof-text-secondary)",
              overflowX: "auto",
              maxHeight: 160,
              overflowY: "auto",
              margin: 0,
              paddingTop: 6,
              fontFamily: "monospace",
            }}
          >
            {JSON.stringify(toolCall.result!.data, null, 2).slice(0, 1200)}
          </pre>
        </div>
      )}

      {/* Error message */}
      {isError && (
        <div
          style={{
            padding: "4px 10px 8px",
            fontSize: 11,
            color: "#ef4444",
            borderTop: "1px solid #ef444430",
          }}
        >
          Tool execution failed
        </div>
      )}
    </div>
  );
}
