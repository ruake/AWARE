import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, User, RefreshCw, Copy, Check } from "lucide-react";
import type { Message } from "@/lib/copilot/types";
import ToolCallCard from "./ToolCallCard";
import AgentTrace from "./AgentTrace";
import LangGraphPanel from "./LangGraphPanel";
import DataTable from "./DataTable";
import { loadProviderType } from "@/lib/copilot/storage";

interface BubbleProps {
  message: Message;
  onRetry?: (messageId: string) => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      title="Copy"
      style={{
        padding: "3px 7px", borderRadius: 6, border: "1px solid var(--proof-border)",
        background: "rgba(255,255,255,0.04)", cursor: "pointer",
        color: copied ? "#34d399" : "var(--proof-text-muted)",
        display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5,
        transition: "all 0.15s",
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function UserBubble({ message }: BubbleProps) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "4px 0", alignItems: "flex-end" }}>
      <div className="copilot-user-bubble">{message.content}</div>
      <div style={{
        width: 30, height: 30, borderRadius: "50%",
        background: "linear-gradient(135deg, #1e3a5f, #2d4f7f)",
        border: "2px solid rgba(59,130,246,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <User size={13} style={{ color: "#60a5fa" }} />
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4,
      padding: "12px 16px",
      background: "rgba(15,31,56,0.5)", borderRadius: "4px 18px 18px 18px",
      border: "1px solid var(--proof-border)", maxWidth: 80,
    }}>
      <span className="copilot-thinking-dot" />
      <span className="copilot-thinking-dot" />
      <span className="copilot-thinking-dot" />
    </div>
  );
}

export function AssistantBubble({ message, onRetry }: BubbleProps) {
  const hasContent = message.content.length > 0;
  const hasToolCalls = (message.toolCalls?.length ?? 0) > 0;
  const isStreaming = !!message.streaming;
  const hasError = !!message.error;
  const isEmptyStreaming = isStreaming && !hasContent && !hasToolCalls;
  const providerType = loadProviderType();

  // Collect all tableData from completed tool calls
  const tables = (message.toolCalls ?? [])
    .filter(tc => tc.status === "done" && tc.result?.tableData)
    .map(tc => tc.result!.tableData!);

  const graphNodes = message.graphNodes ?? [];
  const hasGraph = graphNodes.length > 0 || (isStreaming && hasToolCalls);

  return (
    <div className="copilot-assistant-bubble" style={{ display: "flex", gap: 10, padding: "4px 0", alignItems: "flex-start" }}>
      {/* Avatar */}
      <div style={{
        width: 30, height: 30, borderRadius: "50%",
        background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.1))",
        border: "2px solid rgba(59,130,246,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, marginTop: 2,
        boxShadow: isStreaming ? "0 0 12px rgba(59,130,246,0.3)" : "none",
        transition: "box-shadow 0.3s",
      }}>
        <Bot size={14} style={{ color: "#60a5fa" }} />
      </div>

      <div style={{ flex: 1, minWidth: 0, maxWidth: "88%" }}>
        {/* Thinking dots when no content yet */}
        {isEmptyStreaming && !hasGraph && <ThinkingDots />}

        {/* LangGraph live panel — shows 5-node pipeline progress */}
        {hasGraph && (
          <LangGraphPanel
            nodes={graphNodes}
            streaming={isStreaming}
            providerType={providerType}
          />
        )}

        {/* Legacy agent trace (collapsible tool call list) — shown when no graph nodes */}
        {!hasGraph && (
          <AgentTrace
            toolCalls={message.toolCalls ?? []}
            providerType={providerType}
            streaming={isStreaming}
          />
        )}

        {/* Tool call cards */}
        {hasToolCalls && (
          <div style={{ marginBottom: hasContent || tables.length > 0 ? 8 : 0, display: "flex", flexDirection: "column", gap: 4 }}>
            {message.toolCalls!.map(tc => <ToolCallCard key={tc.id} toolCall={tc} />)}
          </div>
        )}

        {/* Dynamic data tables rendered from tool results */}
        {tables.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: hasContent ? 8 : 0 }}>
            {tables.map((table, i) => (
              <DataTable key={i} table={table} />
            ))}
          </div>
        )}

        {/* Text content */}
        {(hasContent || (isStreaming && hasToolCalls)) && (
          <div style={{
            background: hasError ? "rgba(239,68,68,0.06)" : "rgba(15,31,56,0.5)",
            border: `1px solid ${hasError ? "rgba(248,113,113,0.2)" : "var(--proof-border)"}`,
            borderRadius: "4px 18px 18px 18px",
            padding: "12px 16px",
            fontSize: 13.5,
            lineHeight: 1.65,
            color: "var(--proof-text)",
            backdropFilter: "blur(8px)",
          }}>
            {hasContent && (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p style={{ margin: "0 0 10px", lineHeight: 1.65 }}>{children}</p>,
                  ul: ({ children }) => <ul style={{ margin: "0 0 10px", paddingLeft: 18 }}>{children}</ul>,
                  ol: ({ children }) => <ol style={{ margin: "0 0 10px", paddingLeft: 18 }}>{children}</ol>,
                  li: ({ children }) => <li style={{ margin: "3px 0", lineHeight: 1.6 }}>{children}</li>,
                  code: ({ children, className }) => {
                    const isBlock = !!className;
                    return isBlock ? (
                      <pre style={{
                        background: "rgba(0,0,0,0.35)",
                        border: "1px solid var(--proof-border)",
                        borderRadius: 8, padding: "10px 12px",
                        fontSize: 12, overflowX: "auto", margin: "8px 0",
                        fontFamily: "var(--font-mono)",
                      }}>
                        <code style={{ fontFamily: "var(--font-mono)", color: "#a5f3fc" }}>{children}</code>
                      </pre>
                    ) : (
                      <code style={{
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid var(--proof-border)",
                        borderRadius: 4, padding: "1px 5px",
                        fontSize: 12, fontFamily: "var(--font-mono)",
                        color: "#a5f3fc",
                      }}>{children}</code>
                    );
                  },
                  h1: ({ children }) => <h1 style={{ fontSize: 17, fontWeight: 700, margin: "12px 0 6px", letterSpacing: "-0.3px" }}>{children}</h1>,
                  h2: ({ children }) => <h2 style={{ fontSize: 15, fontWeight: 700, margin: "10px 0 5px", letterSpacing: "-0.2px" }}>{children}</h2>,
                  h3: ({ children }) => <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: "8px 0 4px" }}>{children}</h3>,
                  strong: ({ children }) => <strong style={{ fontWeight: 700, color: "var(--proof-text)" }}>{children}</strong>,
                  em: ({ children }) => <em style={{ color: "var(--proof-text-secondary)", fontStyle: "italic" }}>{children}</em>,
                  blockquote: ({ children }) => (
                    <blockquote style={{
                      borderLeft: "3px solid var(--proof-blue)",
                      paddingLeft: 12, margin: "8px 0",
                      color: "var(--proof-text-secondary)",
                      fontSize: 13,
                      background: "rgba(59,130,246,0.05)",
                      borderRadius: "0 6px 6px 0",
                      padding: "8px 12px",
                    }}>{children}</blockquote>
                  ),
                  table: ({ children }) => (
                    <div style={{ overflowX: "auto", margin: "8px 0" }}>
                      <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>{children}</table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th style={{
                      padding: "6px 10px",
                      borderBottom: "2px solid var(--proof-border)",
                      textAlign: "left", fontWeight: 600,
                      fontSize: 11, color: "var(--proof-text-secondary)",
                      textTransform: "uppercase", letterSpacing: "0.5px",
                    }}>{children}</th>
                  ),
                  td: ({ children }) => (
                    <td style={{ padding: "6px 10px", borderBottom: "1px solid var(--proof-border)", fontSize: 12 }}>{children}</td>
                  ),
                  a: ({ children, href }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--proof-blue-bright)", textDecoration: "underline", textDecorationColor: "rgba(59,130,246,0.4)" }}>{children}</a>
                  ),
                  hr: () => <hr style={{ border: "none", borderTop: "1px solid var(--proof-border)", margin: "12px 0" }} />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}

            {/* Streaming cursor */}
            {isStreaming && (
              <span style={{
                display: "inline-block", width: 2, height: 16,
                background: "var(--proof-blue)", borderRadius: 1,
                marginLeft: 2, verticalAlign: "text-bottom",
                animation: "blink 0.8s step-end infinite",
              }} />
            )}
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(248,113,113,0.2)",
            borderRadius: 10, padding: "8px 12px", fontSize: 12.5, color: "#f87171", marginTop: 6,
          }}>
            ⚠ {message.error}
          </div>
        )}

        {/* Footer: timestamp + actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, paddingLeft: 2 }}>
          <span style={{ fontSize: 10, color: "var(--proof-text-muted)" }}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {!isStreaming && hasContent && <CopyButton text={message.content} />}
          {!isStreaming && hasError && onRetry && (
            <button
              onClick={() => onRetry(message.id)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "3px 8px", borderRadius: 6,
                border: "1px solid var(--proof-border)",
                background: "rgba(255,255,255,0.04)",
                cursor: "pointer", fontSize: 11,
                color: "var(--proof-text-secondary)", fontWeight: 600,
              }}
            >
              <RefreshCw size={11} /> Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
