import { XCircle, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import React from "react";
import type { TestAssertionResult } from "@/lib/types";

export function AssertionRow({ a }: { a: TestAssertionResult }) {
  const [isExpanded, setIsExpanded] = React.useState(!a.passed);
  const hasDiff = a.expected !== undefined || a.actual !== undefined;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        borderRadius: 8,
        background: "var(--proof-surface)",
        border: "1px solid var(--proof-border)",
        borderLeft: `4px solid ${a.passed ? "var(--proof-green)" : "var(--proof-red)"}`,
        fontSize: 13,
        overflow: "hidden",
        transition: "all 0.2s ease",
        marginBottom: 8,
      }}
    >
      <button
        onClick={() => hasDiff && setIsExpanded(!isExpanded)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 14px",
          background: "none",
          border: "none",
          cursor: hasDiff ? "pointer" : "default",
          textAlign: "left",
          color: "var(--proof-text)",
        }}
      >
        <div style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: a.passed ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          {a.passed ? (
            <CheckCircle2 size={12} style={{ color: "var(--proof-green)" }} />
          ) : (
            <XCircle size={12} style={{ color: "var(--proof-red)" }} />
          )}
        </div>
        <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{a.assertion}</span>
        {hasDiff && (
          <div style={{
            fontSize: 10,
            color: "var(--proof-text-muted)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            background: "var(--proof-surface-hover)",
            padding: "2px 6px",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}>
            Details
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </div>
        )}
      </button>

      {isExpanded && hasDiff && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            margin: "0 14px 12px 46px",
            padding: "10px 14px",
            background: "var(--proof-surface-hover)",
            borderRadius: 6,
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            border: "1px solid var(--proof-border)",
            animation: "proof-slide-up 0.2s ease-out",
          }}
        >
          {a.expected !== undefined && (
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ color: "var(--proof-text-muted)", width: 60, flexShrink: 0 }}>Expected</span>
              <span style={{ color: "var(--proof-green)", fontWeight: 700, wordBreak: "break-all" }}>{String(a.expected)}</span>
            </div>
          )}
          {a.actual !== undefined && (
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ color: "var(--proof-text-muted)", width: 60, flexShrink: 0 }}>Actual</span>
              <span style={{ color: "var(--proof-red)", fontWeight: 700, wordBreak: "break-all" }}>{String(a.actual)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
