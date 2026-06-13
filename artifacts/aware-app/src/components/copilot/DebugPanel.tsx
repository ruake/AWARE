import React from "react";
import { Terminal, EyeOff, XCircle, Loader2 } from "lucide-react";
import type { DebugLogEntry } from "@/lib/ai/langGraphTypes";

interface Props {
  show: boolean;
  logs: DebugLogEntry[];
  logEndRef: React.RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onClear: () => void;
}

const LEVEL_COLOR: Record<string, string> = {
  info: "var(--proof-text-muted)",
  warn: "#f59e0b",
  error: "#ef4444",
  debug: "#5b8af5",
};

export default function DebugPanel({ show, logs, logEndRef, onToggle, onClear }: Props) {
  return (
    <>
      <button
        onClick={onToggle}
        title="Toggle debug log panel"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "4px 8px",
          borderRadius: 6,
          fontSize: 10,
          fontWeight: 600,
          cursor: "pointer",
          border: `1px solid ${show ? "#22c55e44" : "var(--proof-border)"}`,
          background: show ? "#22c55e20" : "var(--proof-surface)",
          color: show ? "#22c55e" : "var(--proof-text-secondary)",
        }}
      >
        {show ? <EyeOff size={11} /> : <Terminal size={11} />}
        Debug
      </button>
      {show && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            right: 0,
            width: 520,
            maxHeight: 320,
            background: "#0d1117",
            border: "1px solid #30363d",
            borderRadius: "8px 0 0 0",
            display: "flex",
            flexDirection: "column",
            zIndex: 999,
            fontSize: 11,
            fontFamily: "'SF Mono', 'Fira Code', monospace",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              borderBottom: "1px solid #30363d",
              color: "#8b949e",
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Debug Log
            <button
              onClick={onClear}
              style={{
                background: "none",
                border: "none",
                color: "#8b949e",
                cursor: "pointer",
                fontSize: 10,
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              Clear
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
            {logs.length === 0 ? (
              <div style={{ color: "#484f58", padding: 8, textAlign: "center" }}>
                No logs yet
              </div>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 6,
                    padding: "2px 4px",
                    borderRadius: 3,
                    lineHeight: 1.6,
                    color: LEVEL_COLOR[log.level] || "var(--proof-text-muted)",
                  }}
                >
                  <span style={{ color: "#484f58", flexShrink: 0, width: 50 }}>
                    {log.timestamp.slice(11, 19)}
                  </span>
                  <span style={{ color: "#58a6ff", flexShrink: 0, width: 60 }}>
                    {log.node}
                  </span>
                  <span style={{ flex: 1 }}>{log.event}</span>
                  {log.details && (
                    <span style={{ color: "#484f58", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {log.details}
                    </span>
                  )}
                  {log.duration !== undefined && (
                    <span style={{ color: "#d2a8ff", flexShrink: 0 }}>{log.duration}ms</span>
                  )}
                  {log.level === "error" && <XCircle size={10} style={{ color: "#ef4444", flexShrink: 0 }} />}
                  {log.level === "warn" && <span style={{ color: "#f59e0b" }}>⚠</span>}
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      )}
    </>
  );
}
