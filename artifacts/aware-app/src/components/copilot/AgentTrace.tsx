import React from "react";
import { Cpu, ChevronDown, ChevronRight, Zap, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { ToolCall, ProviderType } from "@/lib/copilot/types";

interface Props {
  toolCalls: ToolCall[];
  providerType: ProviderType;
  streaming: boolean;
}

const PROVIDER_LABEL: Record<ProviderType, { label: string; color: string }> = {
  webllm: { label: "WebLLM · Llama-3.2-3B", color: "#a78bfa" },
  openai: { label: "OpenAI", color: "#34d399" },
  chrome: { label: "Chrome AI · Gemini Nano", color: "#fbbf24" },
};

export default function AgentTrace({ toolCalls, providerType, streaming }: Props) {
  const [expanded, setExpanded] = React.useState(false);
  if (toolCalls.length === 0 && !streaming) return null;

  const done = toolCalls.filter(t => t.status === "done").length;
  const total = toolCalls.length;
  const totalMs = toolCalls.reduce((acc, t) => t.completedAt ? acc + (t.completedAt - t.startedAt) : acc, 0);
  const { label, color } = PROVIDER_LABEL[providerType] ?? { label: providerType, color: "var(--proof-blue-bright)" };

  return (
    <div style={{
      margin: "0 0 6px",
      borderRadius: 8,
      background: "rgba(10,22,40,0.6)",
      border: "1px solid var(--proof-border)",
      overflow: "hidden", fontSize: 11,
    }}>
      <button
        onClick={() => setExpanded(p => !p)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 6,
          padding: "6px 10px", background: "none", border: "none",
          cursor: "pointer", textAlign: "left",
        }}
      >
        <Cpu size={11} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
        <span style={{ color, fontSize: 10.5, fontWeight: 600 }}>{label}</span>
        {total > 0 && (
          <span style={{ color: "var(--proof-text-muted)", fontSize: 10.5 }}>
            ·{" "}
            <span style={{ color: "var(--proof-text-secondary)", fontWeight: 600 }}>{done}/{total}</span>
            {" "}tool{total !== 1 ? "s" : ""}
            {totalMs > 0 && ` · ${(totalMs / 1000).toFixed(1)}s`}
          </span>
        )}
        {streaming && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#60a5fa", fontSize: 10.5 }}>
            <Loader2 size={9} style={{ animation: "spin 1s linear infinite" }} />
            generating
          </span>
        )}
        <div style={{ marginLeft: "auto" }}>
          {expanded
            ? <ChevronDown size={11} style={{ color: "var(--proof-text-muted)" }} />
            : <ChevronRight size={11} style={{ color: "var(--proof-text-muted)" }} />
          }
        </div>
      </button>

      {expanded && toolCalls.length > 0 && (
        <div style={{ padding: "4px 10px 8px", borderTop: "1px solid var(--proof-border)", display: "flex", flexDirection: "column", gap: 3 }}>
          {toolCalls.map(tc => (
            <div key={tc.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
              {tc.status === "done"
                ? <CheckCircle2 size={10} style={{ color: "#34d399", flexShrink: 0 }} />
                : tc.status === "error"
                ? <XCircle size={10} style={{ color: "#f87171", flexShrink: 0 }} />
                : <Loader2 size={10} style={{ color: "#60a5fa", flexShrink: 0, animation: "spin 1s linear infinite" }} />
              }
              <span style={{ color: "var(--proof-text)", fontSize: 10.5, fontFamily: "var(--font-mono)", fontWeight: 500 }}>{tc.name}</span>
              {Object.keys(tc.args).length > 0 && (
                <span style={{ color: "var(--proof-text-muted)", fontSize: 10, fontFamily: "var(--font-mono)" }}>
                  ({JSON.stringify(tc.args).slice(0, 36)}{JSON.stringify(tc.args).length > 36 ? "…" : ""})
                </span>
              )}
              {tc.completedAt && (
                <span style={{ color: "var(--proof-text-muted)", fontSize: 9.5, marginLeft: "auto" }}>
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
