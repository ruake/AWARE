import React from "react";
import { CheckCircle2, XCircle, Loader2, Timer } from "lucide-react";
import type { LangGraphExecutionState } from "@/lib/ai/langGraphTypes";

interface Props {
  lgState: LangGraphExecutionState | null;
  lgHistory: LangGraphExecutionState[];
  busy: boolean;
}

export default function ThinkingStepFeed({ lgState, lgHistory, busy }: Props) {
  if (!busy) return null;

  const allSteps: { label: string; detail?: string; status: string }[] = [];
  for (const s of lgHistory) {
    if (s.steps) {
      for (const st of s.steps) {
        allSteps.push(st);
      }
    }
  }
  if (lgState?.status === "running") {
    const hasRunning = allSteps.some((st) => st.status === "running");
    if (!hasRunning) {
      allSteps.push({ label: lgState.label, detail: lgState.description, status: "running" });
    }
  }
  const visible = allSteps.slice(-6);

  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: "4px 14px 14px 14px",
        fontSize: 13,
        background: "var(--proof-surface-2)",
        border: "1px solid var(--proof-border-strong)",
        boxShadow: "var(--proof-shadow-sm)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 200,
        alignSelf: "flex-start",
        maxWidth: "85%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {[0, 0.18, 0.36].map((delay, idx) => (
            <span
              key={idx}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--proof-blue)",
                animation: "thinkingBounce 1.2s ease-in-out infinite",
                animationDelay: `${delay}s`,
                display: "inline-block",
                boxShadow: "0 0 4px rgba(91,138,245,0.5)",
              }}
            />
          ))}
        </span>
        {lgState ? (
          <span style={{ color: "var(--proof-text-secondary)", fontSize: 11, fontWeight: 600 }}>
            {lgState.label}
          </span>
        ) : (
          <span style={{ color: "var(--proof-text-secondary)", fontSize: 12 }}>Analyzing…</span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {lgState && (
          <div style={{ fontSize: 10, color: "var(--proof-text-muted)", lineHeight: 1.4 }}>
            {lgState.description}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {visible.map((st, i) => (
            <div
              key={`${st.label}-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 10,
                lineHeight: 1.5,
                opacity: st.status === "running" ? 1 : 0.85,
              }}
            >
              {st.status === "completed" ? (
                <CheckCircle2 size={9} style={{ color: "var(--proof-green)", flexShrink: 0 }} />
              ) : st.status === "error" ? (
                <XCircle size={9} style={{ color: "var(--proof-red)", flexShrink: 0 }} />
              ) : (
                <Loader2
                  size={9}
                  style={{ color: "var(--proof-blue)", flexShrink: 0, animation: "spin 1s linear infinite" }}
                />
              )}
              <span
                style={{
                  color: "var(--proof-text)",
                  fontWeight: st.status === "running" ? 600 : 400,
                }}
              >
                {st.label}
              </span>
              {st.detail && (
                <span style={{ color: "var(--proof-text-muted)", fontSize: 9 }}>{st.detail}</span>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 2 }}>
          {lgHistory.map((s) => (
            <span
              key={s.nodeId}
              style={{
                fontSize: 8,
                padding: "1px 5px",
                borderRadius: 3,
                background:
                  s.status === "completed"
                    ? "#22c55e20"
                    : s.status === "running"
                      ? "#5b8af520"
                      : s.status === "error"
                        ? "#ef444420"
                        : "var(--proof-grey-bg)",
                color:
                  s.status === "completed"
                    ? "var(--proof-green)"
                    : s.status === "running"
                      ? "var(--proof-blue)"
                      : s.status === "error"
                        ? "var(--proof-red)"
                        : "var(--proof-text-muted)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              {s.status === "completed" ? (
                <CheckCircle2 size={7} />
              ) : s.status === "error" ? (
                <XCircle size={7} />
              ) : s.status === "running" ? (
                <Loader2 size={7} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <Timer size={7} />
              )}
              {s.nodeId.replace(/_/g, " ")}
              {s.duration !== undefined && <span style={{ opacity: 0.6 }}>{s.duration}ms</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
