import React from "react";
import ReactMarkdown from "react-markdown";
import { Bot, User } from "lucide-react";
import type { Message, ProviderType } from "@/lib/copilot/types";
import ToolCallCard from "./ToolCallCard";
import AgentTrace from "./AgentTrace";
import { loadProviderType } from "@/lib/copilot/storage";

interface BubbleProps {
  message: Message;
}

// ── UserBubble ───────────────────────────────────────────────────────────────
export function UserBubble({ message }: BubbleProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 8,
        padding: "2px 0",
      }}
    >
      <div
        style={{
          maxWidth: "72%",
          background: "var(--proof-blue)",
          color: "#fff",
          borderRadius: "14px 14px 4px 14px",
          padding: "8px 12px",
          fontSize: 13,
          lineHeight: 1.5,
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
      >
        {message.content}
      </div>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "var(--proof-surface-2)",
          border: "1px solid var(--proof-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        <User size={14} style={{ color: "var(--proof-text-secondary)" }} />
      </div>
    </div>
  );
}

// ── AssistantBubble ──────────────────────────────────────────────────────────
export function AssistantBubble({ message }: BubbleProps) {
  const hasContent = message.content.length > 0;
  const hasToolCalls = (message.toolCalls?.length ?? 0) > 0;
  const isStreaming = !!message.streaming;

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: "2px 0",
        alignItems: "flex-start",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "var(--proof-blue)18",
          border: "1px solid var(--proof-blue)40",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        <Bot size={14} style={{ color: "var(--proof-blue)" }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Agent trace — shows tool call summary */}
        <AgentTrace
          toolCalls={message.toolCalls ?? []}
          providerType={loadProviderType()}
          streaming={isStreaming}
        />

        {/* Tool call cards */}
        {hasToolCalls && (
          <div style={{ marginBottom: hasContent ? 8 : 0 }}>
            {message.toolCalls!.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}

        {/* Text content */}
        {(hasContent || isStreaming) && (
          <div
            style={{
              background: "var(--proof-surface-2)",
              border: "1px solid var(--proof-border)",
              borderRadius: "4px 14px 14px 14px",
              padding: "8px 12px",
              fontSize: 13,
              lineHeight: 1.6,
              color: "var(--proof-text)",
              maxWidth: "90%",
            }}
          >
            {hasContent ? (
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p style={{ margin: "0 0 8px", lineHeight: 1.6 }}>{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul style={{ margin: "0 0 8px", paddingLeft: 16 }}>{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol style={{ margin: "0 0 8px", paddingLeft: 16 }}>{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li style={{ margin: "2px 0", lineHeight: 1.5 }}>{children}</li>
                  ),
                  code: ({ children, className }) => {
                    const isBlock = !!className;
                    return isBlock ? (
                      <pre
                        style={{
                          background: "var(--proof-surface)",
                          border: "1px solid var(--proof-border)",
                          borderRadius: 4,
                          padding: "6px 8px",
                          fontSize: 11,
                          overflowX: "auto",
                          margin: "4px 0",
                        }}
                      >
                        <code>{children}</code>
                      </pre>
                    ) : (
                      <code
                        style={{
                          background: "var(--proof-surface)",
                          border: "1px solid var(--proof-border)",
                          borderRadius: 3,
                          padding: "0 3px",
                          fontSize: 11,
                          fontFamily: "monospace",
                        }}
                      >
                        {children}
                      </code>
                    );
                  },
                  h3: ({ children }) => (
                    <h3 style={{ fontSize: 13, fontWeight: 700, margin: "8px 0 4px" }}>
                      {children}
                    </h3>
                  ),
                  strong: ({ children }) => (
                    <strong style={{ fontWeight: 700 }}>{children}</strong>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote
                      style={{
                        borderLeft: "3px solid var(--proof-blue)",
                        paddingLeft: 8,
                        margin: "4px 0",
                        color: "var(--proof-text-secondary)",
                        fontSize: 12,
                      }}
                    >
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : null}

            {/* Streaming cursor */}
            {isStreaming && (
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 13,
                  background: "var(--proof-blue)",
                  borderRadius: 1,
                  marginLeft: 2,
                  verticalAlign: "text-bottom",
                  animation: "blink 0.8s step-end infinite",
                }}
              />
            )}
          </div>
        )}

        {/* Error state */}
        {message.error && (
          <div
            style={{
              background: "#ef444420",
              border: "1px solid #ef4444",
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: 12,
              color: "#ef4444",
              marginTop: 4,
            }}
          >
            {message.error}
          </div>
        )}

        {/* Timestamp */}
        <div
          style={{
            fontSize: 10,
            color: "var(--proof-text-tertiary, var(--proof-text-secondary))",
            marginTop: 3,
            paddingLeft: 2,
          }}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
