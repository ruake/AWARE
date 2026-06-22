import React from "react";
import { CheckCircle2, XCircle, Loader2, Zap, Brain, Wrench, Sparkles, Flag } from "lucide-react";
import type { GraphNodeId, GraphNodeState, ProviderType } from "@/lib/copilot/types";

interface Props {
  nodes: GraphNodeState[];
  streaming: boolean;
  providerType: ProviderType;
}

const NODE_DEFS: Array<{
  id: GraphNodeId;
  label: string;
  Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color: string;
}> = [
  { id: "classify", label: "Classify", Icon: Brain, color: "#a78bfa" },
  { id: "plan", label: "Plan", Icon: Zap, color: "#60a5fa" },
  { id: "execute", label: "Execute", Icon: Wrench, color: "#f59e0b" },
  { id: "synthesize", label: "Synthesize", Icon: Sparkles, color: "#34d399" },
  { id: "done", label: "Done", Icon: Flag, color: "#22c55e" },
];

const PROVIDER_META: Record<ProviderType, { label: string; color: string }> = {
  chrome: { label: "Chrome AI · Gemini Nano", color: "#fbbf24" },
};

function NodePill({
  def,
  state,
  isLast,
}: {
  def: (typeof NODE_DEFS)[number];
  state: GraphNodeState | undefined;
  isLast: boolean;
}) {
  const status = state?.status ?? "pending";
  const isRunning = status === "running";
  const isDone = status === "completed";
  const isError = status === "error";
  const isPending = status === "pending" || status === "skipped";

  const borderColor = isRunning
    ? def.color
    : isDone
      ? "rgba(52,211,153,0.35)"
      : isError
        ? "rgba(239,68,68,0.35)"
        : "rgba(255,255,255,0.06)";

  const bg = isRunning
    ? `${def.color}18`
    : isDone
      ? "rgba(52,211,153,0.06)"
      : "rgba(255,255,255,0.03)";

  const labelColor = isRunning
    ? def.color
    : isDone
      ? "var(--proof-text)"
      : "var(--proof-text-muted)";

  const { Icon } = def;
  const durationMs =
    state?.startedAt && state?.completedAt ? state.completedAt - state.startedAt : null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      {/* Node pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          borderRadius: 20,
          border: `1px solid ${borderColor}`,
          background: bg,
          transition: "all 0.2s ease",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Running glow sweep */}
        {isRunning && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(90deg, transparent, ${def.color}20, transparent)`,
              animation: "shimmer 1.5s infinite",
              borderRadius: "inherit",
            }}
          />
        )}

        {/* Status icon */}
        {isRunning && (
          <Loader2
            size={10}
            style={{ color: def.color, animation: "spin 0.8s linear infinite", flexShrink: 0 }}
          />
        )}
        {isDone && <CheckCircle2 size={10} style={{ color: "#34d399", flexShrink: 0 }} />}
        {isError && <XCircle size={10} style={{ color: "#f87171", flexShrink: 0 }} />}
        {isPending && (
          <Icon
            size={10}
            style={{ color: "var(--proof-text-muted)", flexShrink: 0, opacity: 0.4 }}
          />
        )}

        {/* Label */}
        <span
          style={{
            fontSize: 10.5,
            fontWeight: isRunning || isDone ? 600 : 400,
            color: labelColor,
            whiteSpace: "nowrap",
            fontFamily: "var(--font-mono)",
          }}
        >
          {def.label}
        </span>

        {/* Duration */}
        {isDone && durationMs !== null && (
          <span
            style={{
              fontSize: 9,
              color: "var(--proof-text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(1)}s`}
          </span>
        )}

        {/* Tool names for execute node */}
        {isDone && state?.toolNames && state.toolNames.length > 0 && (
          <span
            style={{
              fontSize: 9,
              color: "var(--proof-text-muted)",
              fontFamily: "var(--font-mono)",
              maxWidth: 80,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            [{state.toolNames.join(", ")}]
          </span>
        )}
      </div>

      {/* Edge line */}
      {!isLast && (
        <div
          style={{
            width: 16,
            height: 1,
            background: isDone ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.08)",
            flexShrink: 0,
            position: "relative",
          }}
        >
          {/* Animated pulse for active edge */}
          {isRunning && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "50%",
                height: "100%",
                background: `linear-gradient(90deg, transparent, ${def.color})`,
                animation: "edgePulse 1s linear infinite",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function LangGraphPanel({ nodes, streaming, providerType }: Props) {
  const provider = PROVIDER_META[providerType] ?? {
    label: providerType,
    color: "var(--proof-blue)",
  };

  // Map node id → state from the events array (last state wins)
  const nodeMap = React.useMemo(() => {
    const m = new Map<string, GraphNodeState>();
    for (const n of nodes) m.set(n.id, n);
    return m;
  }, [nodes]);

  const hasActivity = nodes.length > 0 || streaming;
  if (!hasActivity) return null;

  const activeCount = nodes.filter((n) => n.status === "completed").length;
  const totalExpected = NODE_DEFS.length;
  const isComplete = nodeMap.get("done")?.status === "completed";

  return (
    <div
      style={{
        marginBottom: 8,
        borderRadius: 10,
        background: "var(--proof-overlay)",
        backdropFilter: "blur(8px)",
        border: "1px solid var(--proof-border)",
        overflow: "hidden",
        fontSize: 11,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 12px",
          borderBottom: nodes.length > 0 ? "1px solid var(--proof-border)" : "none",
        }}
      >
        {/* Provider badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 9.5,
            fontWeight: 600,
            color: provider.color,
            background: `${provider.color}12`,
            border: `1px solid ${provider.color}30`,
            borderRadius: 12,
            padding: "2px 7px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: provider.color,
              animation: streaming ? "pulse 1.5s ease-in-out infinite" : "none",
            }}
          />
          {provider.label}
        </div>

        {/* LangGraph label */}
        <span
          style={{
            fontSize: 9.5,
            color: "var(--proof-text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          LangGraph
        </span>

        {/* Node pipeline */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            marginLeft: "auto",
            flexWrap: "nowrap",
            overflow: "hidden",
          }}
        >
          {NODE_DEFS.map((def, i) => (
            <NodePill
              key={def.id}
              def={def}
              state={nodeMap.get(def.id)}
              isLast={i === NODE_DEFS.length - 1}
            />
          ))}
        </div>

        {/* Progress / complete badge */}
        {isComplete ? (
          <span
            style={{
              fontSize: 9.5,
              color: "#34d399",
              fontWeight: 600,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            ✓ done
          </span>
        ) : streaming ? (
          <span style={{ fontSize: 9.5, color: "#60a5fa", whiteSpace: "nowrap", flexShrink: 0 }}>
            {activeCount}/{totalExpected}
          </span>
        ) : null}
      </div>

      {/* Running node detail */}
      {!isComplete &&
        nodes.length > 0 &&
        (() => {
          const running = [...nodeMap.values()].find((n) => n.status === "running");
          if (!running) return null;
          const def = NODE_DEFS.find((d) => d.id === running.id);
          return (
            <div style={{ padding: "4px 12px 6px", display: "flex", alignItems: "center", gap: 6 }}>
              <Loader2
                size={9}
                style={{
                  color: def?.color ?? "var(--proof-blue)",
                  animation: "spin 0.8s linear infinite",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  color: "var(--proof-text-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {running.label}
                {running.detail ? ` · ${running.detail}` : ""}
              </span>
            </div>
          );
        })()}
    </div>
  );
}
