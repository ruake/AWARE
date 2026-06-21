import { XCircle, Check } from "lucide-react";
import type { TestAssertionResult } from "@/lib/types";

export function AssertionRow({ a }: { a: TestAssertionResult }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "8px 10px",
        borderRadius: 4,
        background: "var(--proof-surface)",
        border: "1px solid var(--proof-border)",
        borderLeft: `3px solid ${a.passed ? "var(--proof-green)" : "var(--proof-red)"}`,
        fontSize: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {a.passed ? (
          <Check
            size={13}
            style={{ color: "var(--proof-green)", flexShrink: 0 }}
            aria-label="Passed"
          />
        ) : (
          <XCircle
            size={13}
            style={{ color: "var(--proof-red)", flexShrink: 0 }}
            aria-label="Failed"
          />
        )}
        <span style={{ flex: 1, fontWeight: 500 }}>{a.assertion}</span>
      </div>

      {(a.expected !== undefined || a.actual !== undefined) && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            marginLeft: 21,
            padding: 6,
            background: "var(--proof-subtle-bg)",
            borderRadius: 4,
            fontSize: 10,
            fontFamily: "var(--font-mono)",
          }}
        >
          {a.expected !== undefined && (
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ color: "var(--proof-text-secondary)", width: 50 }}>Expected:</span>
              <span style={{ color: "var(--proof-green)", fontWeight: 600 }}>{String(a.expected)}</span>
            </div>
          )}
          {a.actual !== undefined && (
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ color: "var(--proof-text-secondary)", width: 50 }}>Actual:</span>
              <span style={{ color: "var(--proof-red)", fontWeight: 600 }}>{String(a.actual)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
