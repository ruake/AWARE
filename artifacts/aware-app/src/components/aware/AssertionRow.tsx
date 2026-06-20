import { XCircle, Check } from "lucide-react";
import type { TestAssertionResult } from "@/lib/types";

export function AssertionRow({ a }: { a: TestAssertionResult }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 8px",
        borderRadius: 4,
        background: a.passed ? "var(--proof-green-bg)" : "var(--proof-red-bg)",
        border: `1px solid ${a.passed ? "var(--proof-green)" : "var(--proof-red)"}`,
        fontSize: 12,
      }}
    >
      {a.passed ? (
        <Check size={13} style={{ color: "var(--proof-green)", flexShrink: 0 }} />
      ) : (
        <XCircle size={13} style={{ color: "var(--proof-red)", flexShrink: 0 }} />
      )}
      <span style={{ flex: 1, fontWeight: 500 }}>{a.assertion}</span>
      <span style={{ color: "var(--proof-text-secondary)", fontSize: 11 }}>
        Expected:{" "}
        <span
          style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--proof-text)" }}
        >
          {a.expected}
        </span>
      </span>
      {!a.passed && (
        <span style={{ color: "var(--proof-text-secondary)", fontSize: 11 }}>
          Actual:{" "}
          <span
            style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--proof-red)" }}
          >
            {a.actual}
          </span>
        </span>
      )}
    </div>
  );
}
