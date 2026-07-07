import React from "react";
import { AlertTriangle, ArrowUpRight, BarChart3 } from "lucide-react";
import type { TestResult } from "@/lib/types";
import { AssertionRow } from "./AssertionRow";

interface EvidencePanelProps {
  result: TestResult;
  onViewAnalytics?: (testId: string) => void;
  onViewDefinition?: (testId: string) => void;
  compact?: boolean;
}

export function EvidencePanel({ result, onViewAnalytics, onViewDefinition, compact }: EvidencePanelProps) {
  const r = result;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 16 : 24 }}>
      {r.error && (
        <div style={{ background: "var(--proof-red-bg)", border: "1px solid var(--proof-red-border)", borderRadius: 8, padding: compact ? 12 : 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--proof-red)", fontWeight: 600, marginBottom: 8, fontSize: compact ? 11 : 12 }}>
            <AlertTriangle size={compact ? 12 : 14} /> ERROR DETAILS
          </div>
          <pre style={{
            fontFamily: "var(--font-mono)", fontSize: compact ? 11 : 12, color: "var(--proof-red-bright)",
            whiteSpace: "pre-wrap", margin: 0
          }}>
            {r.error}
          </pre>
        </div>
      )}

      {r.assertions && r.assertions.length > 0 && (
        <div>
          <div style={{ fontSize: compact ? 11 : 12, fontWeight: 600, color: "var(--proof-text-muted)", marginBottom: compact ? 8 : 12 }}>
            ASSERTIONS ({r.assertions.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: compact ? 4 : 8 }}>
            {r.assertions.map((a, i) => (
              <AssertionRow key={a.assertion || i} a={a} />
            ))}
          </div>
        </div>
      )}

      {(onViewAnalytics || onViewDefinition) && (
        <div style={{ display: "flex", gap: compact ? 8 : 12 }}>
          {onViewAnalytics && (
            <button onClick={() => onViewAnalytics(r.id)} className="proof-btn proof-btn-ghost" style={{ fontSize: compact ? 11 : 12, padding: "4px 10px" }}>
              <BarChart3 size={compact ? 12 : 14} /> View Analytics <ArrowUpRight size={compact ? 10 : 12} />
            </button>
          )}
          {onViewDefinition && (
            <button onClick={() => onViewDefinition(r.id)} className="proof-btn proof-btn-ghost" style={{ fontSize: compact ? 11 : 12, padding: "4px 10px" }}>
              View Definition
            </button>
          )}
        </div>
      )}
    </div>
  );
}
