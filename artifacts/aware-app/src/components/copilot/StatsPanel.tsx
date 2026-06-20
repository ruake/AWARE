import React from "react";
import {
  X,
  BarChart3,
  MessageSquare,
  Cpu,
  Clock,
  Activity,
  Copy,
  Hash,
  User,
  Bot,
  Wrench,
} from "lucide-react";
import type { Thread, Message } from "@/lib/copilot/types";

interface StatsPanelProps {
  thread: Thread | null;
  onClose: () => void;
}

interface ComputedStats {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  totalTokens: number;
  durationMs: number;
  totalToolCalls: number;
  toolCallBreakdown: Record<string, number>;
  avgResponseLength: number;
  messagesPerMinute: number;
  firstTimestamp: number;
  lastTimestamp: number;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "0s";
  const totalSec = Math.floor(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return `${h}h ${remM}m`;
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 0) return "just now";
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function computeStats(messages: Message[]): ComputedStats {
  const userMessages = messages.filter((m) => m.role === "user").length;
  const assistantMessages = messages.filter((m) => m.role === "assistant").length;
  const totalTokens = messages.reduce((acc, m) => acc + Math.ceil(m.content.length / 4), 0);

  const timestamps = messages.map((m) => m.timestamp).filter(Boolean);
  const firstTimestamp = timestamps.length > 0 ? Math.min(...timestamps) : 0;
  const lastTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : 0;
  const durationMs = lastTimestamp - firstTimestamp;

  const assistantMsgs = messages.filter((m) => m.role === "assistant");
  const totalResponseLength = assistantMsgs.reduce((acc, m) => acc + m.content.length, 0);
  const avgResponseLength = assistantMsgs.length > 0 ? totalResponseLength / assistantMsgs.length : 0;

  const toolCallBreakdown: Record<string, number> = {};
  let totalToolCalls = 0;
  for (const m of messages) {
    if (m.toolCalls) {
      for (const tc of m.toolCalls) {
        toolCallBreakdown[tc.name] = (toolCallBreakdown[tc.name] || 0) + 1;
        totalToolCalls++;
      }
    }
  }

  const durationMin = durationMs / 60000 || 1;
  const messagesPerMinute = messages.length / durationMin;

  return {
    totalMessages: messages.length,
    userMessages,
    assistantMessages,
    totalTokens,
    durationMs,
    totalToolCalls,
    toolCallBreakdown,
    avgResponseLength,
    messagesPerMinute,
    firstTimestamp,
    lastTimestamp,
  };
}

function buildCopyText(stats: ComputedStats, thread: Thread): string {
  const lines = [
    `Conversation Stats: ${thread.title}`,
    `───`,
    `Messages: ${stats.totalMessages} (${stats.userMessages} user · ${stats.assistantMessages} assistant)`,
    `Tokens (est.): ${stats.totalTokens}`,
    `Duration: ${formatDuration(stats.durationMs)}`,
    `Tool Calls: ${stats.totalToolCalls}`,
    ...Object.entries(stats.toolCallBreakdown)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => `  ${name}: ${count}`),
    `Avg Response Length: ${Math.round(stats.avgResponseLength)} chars`,
    `Rate: ${stats.messagesPerMinute.toFixed(1)} msg/min`,
    `───`,
    `Created: ${formatDate(thread.createdAt)}`,
    `Last Active: ${formatDate(thread.updatedAt)}`,
  ];
  return lines.join("\n");
}

const statCardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid var(--proof-border)",
  background: "var(--proof-surface)",
};

const statIconStyle: React.CSSProperties = {
  flexShrink: 0,
  color: "var(--proof-text-muted)",
};

const statValueStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "var(--proof-text)",
  fontFamily: "var(--font-mono)",
  lineHeight: 1.1,
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 9.5,
  color: "var(--proof-text-muted)",
  lineHeight: 1.2,
};

export default function StatsPanel({ thread, onClose }: StatsPanelProps) {
  if (!thread) return null;

  const stats = computeStats(thread.messages);
  const userRatio = stats.totalMessages > 0 ? stats.userMessages / stats.totalMessages : 0;
  const assistantRatio = stats.totalMessages > 0 ? stats.assistantMessages / stats.totalMessages : 0;
  const toolNames = Object.keys(stats.toolCallBreakdown);
  const maxToolCount = Math.max(1, ...Object.values(stats.toolCallBreakdown));

  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(buildCopyText(stats, thread)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: 320,
        height: "100%",
        background: "var(--proof-bg)",
        borderLeft: "1px solid var(--proof-border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 999,
        fontSize: 12,
        boxShadow: "-4px 0 20px rgba(0,0,0,0.3)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          borderBottom: "1px solid var(--proof-border)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <BarChart3 size={14} style={{ color: "var(--proof-blue)" }} />
          <span style={{ fontWeight: 600, color: "var(--proof-text)", fontSize: 12 }}>
            Conversation Stats
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "var(--proof-text-muted)",
            cursor: "pointer",
            padding: 4,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Thread info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid var(--proof-border)",
            background: "var(--proof-surface)",
          }}
        >
          <div style={{ fontSize: 9.5, color: "var(--proof-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Thread
          </div>
          <div style={{ fontSize: 11, color: "var(--proof-text)", fontWeight: 500, lineHeight: 1.3 }}>
            {thread.title}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 2 }}>
            <span style={{ fontSize: 9.5, color: "var(--proof-text-muted)" }}>
              Created {formatRelativeTime(thread.createdAt)}
            </span>
            <span style={{ fontSize: 9.5, color: "var(--proof-text-muted)" }}>
              Updated {formatRelativeTime(thread.updatedAt)}
            </span>
          </div>
        </div>

        {/* Messages stats card */}
        <div style={statCardStyle}>
          <MessageSquare size={14} style={statIconStyle} />
          <div style={{ flex: 1 }}>
            <div style={statValueStyle}>{stats.totalMessages}</div>
            <div style={statLabelStyle}>Messages</div>
            <div style={{ fontSize: 9, color: "var(--proof-text-muted)", marginTop: 1 }}>
              {stats.userMessages} user · {stats.assistantMessages} assistant
            </div>
          </div>
        </div>

        {/* Tokens card */}
        <div style={statCardStyle}>
          <Cpu size={14} style={statIconStyle} />
          <div style={{ flex: 1 }}>
            <div style={statValueStyle}>{stats.totalTokens.toLocaleString()}</div>
            <div style={statLabelStyle}>Tokens (est.)</div>
          </div>
        </div>

        {/* Duration card */}
        <div style={statCardStyle}>
          <Clock size={14} style={statIconStyle} />
          <div style={{ flex: 1 }}>
            <div style={statValueStyle}>{formatDuration(stats.durationMs)}</div>
            <div style={statLabelStyle}>Duration</div>
          </div>
        </div>

        {/* Tool Calls card */}
        <div style={statCardStyle}>
          <Wrench size={14} style={statIconStyle} />
          <div style={{ flex: 1 }}>
            <div style={statValueStyle}>{stats.totalToolCalls}</div>
            <div style={statLabelStyle}>Tool Calls</div>
          </div>
        </div>

        {/* Avg Response Length card */}
        <div style={statCardStyle}>
          <Activity size={14} style={statIconStyle} />
          <div style={{ flex: 1 }}>
            <div style={statValueStyle}>{Math.round(stats.avgResponseLength)}</div>
            <div style={statLabelStyle}>Avg Response Length (chars)</div>
          </div>
        </div>

        {/* Rate card */}
        <div style={statCardStyle}>
          <Hash size={14} style={statIconStyle} />
          <div style={{ flex: 1 }}>
            <div style={statValueStyle}>{stats.messagesPerMinute.toFixed(1)}</div>
            <div style={statLabelStyle}>Messages / min</div>
          </div>
        </div>

        {/* Message breakdown bar */}
        <div
          style={{
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid var(--proof-border)",
            background: "var(--proof-surface)",
          }}
        >
          <div
            style={{
              fontSize: 9.5,
              color: "var(--proof-text-muted)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 6,
            }}
          >
            Message Breakdown
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              height: 18,
              borderRadius: 4,
              overflow: "hidden",
              background: "rgba(255,255,255,0.06)",
            }}
          >
            {userRatio > 0 && (
              <div
                style={{
                  height: "100%",
                  width: `${userRatio * 100}%`,
                  background: "var(--proof-blue)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: userRatio > 0.1 ? undefined : 0,
                }}
              >
                {userRatio > 0.1 && (
                  <User size={9} style={{ color: "#fff", flexShrink: 0 }} />
                )}
              </div>
            )}
            {assistantRatio > 0 && (
              <div
                style={{
                  height: "100%",
                  width: `${assistantRatio * 100}%`,
                  background: "#22c55e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: assistantRatio > 0.1 ? undefined : 0,
                }}
              >
                {assistantRatio > 0.1 && (
                  <Bot size={9} style={{ color: "#fff", flexShrink: 0 }} />
                )}
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 9, color: "var(--proof-blue)", fontWeight: 600 }}>
              User: {stats.userMessages}
            </span>
            <span style={{ fontSize: 9, color: "#22c55e", fontWeight: 600 }}>
              Assistant: {stats.assistantMessages}
            </span>
          </div>
        </div>

        {/* Tool usage breakdown */}
        {toolNames.length > 0 && (
          <div
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid var(--proof-border)",
              background: "var(--proof-surface)",
            }}
          >
            <div
              style={{
                fontSize: 9.5,
                color: "var(--proof-text-muted)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 6,
              }}
            >
              Tool Usage
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {toolNames.map((name) => {
                const count = stats.toolCallBreakdown[name];
                const pct = (count / maxToolCount) * 100;
                return (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        fontSize: 9.5,
                        color: "var(--proof-text)",
                        width: 80,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {name}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: 12,
                        borderRadius: 3,
                        background: "rgba(255,255,255,0.06)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: "var(--proof-blue)",
                          borderRadius: 3,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 9.5,
                        color: "var(--proof-text-muted)",
                        fontFamily: "var(--font-mono)",
                        width: 24,
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div
          style={{
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid var(--proof-border)",
            background: "var(--proof-surface)",
          }}
        >
          <div
            style={{
              fontSize: 9.5,
              color: "var(--proof-text-muted)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 6,
            }}
          >
            Timeline
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 140, overflowY: "auto" }}>
            {thread.messages.map((msg, i) => (
              <div key={msg.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: msg.role === "user" ? "var(--proof-blue)" : "#22c55e",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 9,
                    color: "var(--proof-text-muted)",
                    fontFamily: "var(--font-mono)",
                    width: 50,
                    flexShrink: 0,
                  }}
                >
                  {formatRelativeTime(msg.timestamp)}
                </span>
                <span
                  style={{
                    fontSize: 9.5,
                    color: "var(--proof-text)",
                    fontWeight: msg.role === "assistant" ? 500 : 400,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                  }}
                >
                  {msg.role === "user" ? (
                    <span style={{ color: "var(--proof-blue)" }}>User</span>
                  ) : (
                    <span style={{ color: "#22c55e" }}>Assistant</span>
                  )}
                  {msg.content.length > 40
                    ? `: ${msg.content.slice(0, 40)}…`
                    : `: ${msg.content}`}
                </span>
              </div>
            ))}
            {thread.messages.length === 0 && (
              <div style={{ fontSize: 9.5, color: "var(--proof-text-muted)" }}>
                No messages yet
              </div>
            )}
          </div>
        </div>

        {/* Thread info footer */}
        <div
          style={{
            padding: "8px 10px",
            borderRadius: 6,
            border: "1px solid var(--proof-border)",
            background: "var(--proof-surface)",
          }}
        >
          <div
            style={{
              fontSize: 9.5,
              color: "var(--proof-text-muted)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: 4,
            }}
          >
            Thread Info
          </div>
          <div style={{ fontSize: 10, color: "var(--proof-text-muted)", lineHeight: 1.6 }}>
            <div>Created: {formatDate(thread.createdAt)}</div>
            <div>Last Active: {formatDate(thread.updatedAt)}</div>
            <div>Messages: {thread.messageCount}</div>
          </div>
        </div>
      </div>

      {/* Copy button */}
      <div
        style={{
          padding: "10px 12px",
          borderTop: "1px solid var(--proof-border)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleCopy}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            width: "100%",
            padding: "7px 0",
            borderRadius: 6,
            border: `1px solid var(--proof-border)`,
            background: copied ? "rgba(52,211,153,0.1)" : "var(--proof-surface)",
            color: copied ? "#22c55e" : "var(--proof-text-secondary)",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 500,
            transition: "all 0.15s ease",
          }}
        >
          <Copy size={12} />
          {copied ? "Copied!" : "Copy Stats as Text"}
        </button>
      </div>
    </div>
  );
}
