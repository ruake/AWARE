import { XCircle, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import React from "react";
import type { TestAssertionResult } from "@/lib/types";

export function AssertionRow({ a }: { a: TestAssertionResult }) {
  const [isExpanded, setIsExpanded] = React.useState(!a.passed);
  const hasDiff = a.expected !== undefined || a.actual !== undefined;
  
  const accent = a.passed ? "var(--proof-green)" : "var(--proof-red)";
  const bg = a.passed ? "rgba(0, 229, 160, 0.05)" : "rgba(255, 51, 85, 0.05)";
  const border = a.passed ? "rgba(0, 229, 160, 0.2)" : "rgba(255, 51, 85, 0.3)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        borderRadius: 8,
        background: bg,
        border: `1px solid ${border}`,
        borderLeft: `4px solid ${accent}`,
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
          padding: "12px 16px",
          background: "none",
          border: "none",
          cursor: hasDiff ? "pointer" : "default",
          textAlign: "left",
          color: "var(--proof-text)",
        }}
      >
        <div style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: a.passed ? "rgba(0, 229, 160, 0.15)" : "rgba(255, 51, 85, 0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: `0 0 12px ${a.passed ? "rgba(0, 229, 160, 0.3)" : "rgba(255, 51, 85, 0.4)"}`
        }}>
          {a.passed ? (
            <CheckCircle2 size={14} style={{ color: "var(--proof-green)" }} />
          ) : (
            <XCircle size={14} style={{ color: "var(--proof-red)" }} />
          )}
        </div>
        <span style={{ flex: 1, fontWeight: 600, fontSize: 13, fontFamily: "var(--font-mono)" }}>{a.assertion}</span>
        {hasDiff && (
          <div style={{
            fontSize: 10,
            color: accent,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            background: `color-mix(in srgb, ${accent} 15%, transparent)`,
            border: `1px solid color-mix(in srgb, ${accent} 30%, transparent)`,
            padding: "4px 8px",
            borderRadius: 6,
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
            margin: "0 16px 16px 48px",
            padding: "12px 16px",
            background: "rgba(0, 0, 0, 0.3)",
            borderRadius: 6,
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            border: "1px solid var(--proof-border-light)",
            animation: "proof-slide-up 0.2s ease-out",
          }}
        >
          {a.expected !== undefined && (
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ color: "var(--proof-text-muted)", width: 64, flexShrink: 0, textTransform: "uppercase", fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", marginTop: 2 }}>Expected</span>
              <span style={{ color: "var(--proof-green)", fontWeight: 700, wordBreak: "break-all" }}>{String(a.expected)}</span>
            </div>
          )}
          {a.actual !== undefined && (
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ color: "var(--proof-text-muted)", width: 64, flexShrink: 0, textTransform: "uppercase", fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", marginTop: 2 }}>Actual</span>
              <span style={{ color: "var(--proof-red)", fontWeight: 700, wordBreak: "break-all" }}>{String(a.actual)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
