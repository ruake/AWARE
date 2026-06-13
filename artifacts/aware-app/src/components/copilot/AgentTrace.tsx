import React from "react";
import { ChevronDown, ChevronRight, Cpu } from "lucide-react";
import type { ToolCall, ProviderType } from "@/lib/copilot/types";

interface Props {
  toolCalls: ToolCall[];
  providerType: ProviderType;
  streaming: boolean;
}

const PROVIDER_LABEL: Record<ProviderType, string> = {
  webllm: "WebLLM / Llama-3.2-3B",
  openai: "OpenAI",
  chrome: "Chrome AI / Gemini Nano",
};

export default function AgentTrace({ toolCalls, providerType, streaming }: Props) {
  const [expanded, setExpanded] = React.useState(false);
  if (toolCalls.length === 0 && !streaming) return null;

  const done = toolCalls.filter((t) => t.status === "done").length;
  const total = toolCalls.length;
  const totalMs = toolCalls.reduce((acc, t) => {
    if (t.completedAt) return acc + (t.completedAt - t.startedAt);
    return acc;
  }, 0);

  return (
    <div
      style={{
        margin: "4px 0 8px",
        borderRadius: 6,
        background: "var(--proof-surface)",
        border: "1px solid var(--proof-border)",
        overflow: "hidden",
        fontSize: 11,
      }}
    >
      <button
        onClick={() => setExpanded((p) => !p)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 10px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <Cpu size={11} style={{ color: "var(--proof-text-secondary)", flexShrink: 0 }} />
        <span style={{ color: "var(--proof-text-secondary)", flex: 1 }}>
          {PROVIDER_LABEL[providerType]}
          {total > 0 && (
            <>
              {" · "}
              <strong>
                {done}/{total}
              </strong>{" "}
              tool{total !== 1 ? "s" : ""} called
              {totalMs > 0 && ` · ${(totalMs / 1000).toFixed(1)}s`}
            </>
          )}
          {streaming && " · generating…"}
        </span>
        {expanded ? (
          <ChevronDown size={11} style={{ color: "var(--proof-text-secondary)" }} />
        ) : (
          <ChevronRight size={11} style={{ color: "var(--proof-text-secondary)" }} />
        )}
      </button>

      {expanded && toolCalls.length > 0 && (
        <div
          style={{
            padding: "0 10px 8px",
            borderTop: "1px solid var(--proof-border)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {toolCalls.map((tc) => (
            <div
              key={tc.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "3px 0",
                fontFamily: "monospace",
              }}
            >
              <span
                style={{
                  color:
                    tc.status === "done"
                      ? "#22c55e"
                      : tc.status === "error"
                        ? "#ef4444"
                        : "var(--proof-blue)",
                  fontSize: 10,
                }}
              >
                {tc.status === "done" ? "✓" : tc.status === "error" ? "✗" : "⟳"}
              </span>
              <span style={{ color: "var(--proof-text)", fontSize: 11 }}>{tc.name}</span>
              <span style={{ color: "var(--proof-text-secondary)", fontSize: 10 }}>
                (
                {Object.keys(tc.args).length > 0 ? JSON.stringify(tc.args).slice(0, 40) : "no args"}
                )
              </span>
              {tc.completedAt && (
                <span
                  style={{ color: "var(--proof-text-secondary)", fontSize: 10, marginLeft: "auto" }}
                >
                  {tc.completedAt - tc.startedAt}ms
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
