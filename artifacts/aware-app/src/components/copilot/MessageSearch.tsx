import React from "react";
import { Search, X, MessageSquare, User, Bot, ChevronRight } from "lucide-react";
import type { SearchResult, Thread } from "@/lib/copilot/types";

interface MessageSearchProps {
  threads: Thread[];
  onResultSelect: (threadId: string, messageId?: string) => void;
  onClose: () => void;
}

function extractPreview(content: string, query: string): string {
  const lower = content.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return content.slice(0, 80);
  const start = Math.max(0, idx - 40);
  const end = Math.min(content.length, idx + query.length + 40);
  let preview = content.slice(start, end);
  if (start > 0) preview = "\u2026" + preview;
  if (end < content.length) preview = preview + "\u2026";
  return preview;
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let idx = lowerText.indexOf(lowerQuery, lastIndex);
  while (idx !== -1) {
    if (idx > lastIndex) {
      parts.push(text.slice(lastIndex, idx));
    }
    parts.push(
      <strong key={idx} style={{ fontWeight: 700, color: "var(--proof-blue)" }}>
        {text.slice(idx, idx + query.length)}
      </strong>,
    );
    lastIndex = idx + query.length;
    idx = lowerText.indexOf(lowerQuery, lastIndex);
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : text;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function MessageSearch({ threads, onResultSelect, onClose }: MessageSearchProps) {
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const found: SearchResult[] = [];
    for (const thread of threads) {
      for (const msg of thread.messages) {
        if (msg.content.toLowerCase().includes(q)) {
          found.push({
            messageId: msg.id,
            threadId: thread.id,
            threadTitle: thread.title,
            content: msg.content,
            matchPreview: extractPreview(msg.content, q),
            role: msg.role,
            timestamp: msg.timestamp,
          });
        }
      }
    }
    return found;
  }, [query, threads]);

  const groupedResults = React.useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    for (const r of results) {
      if (!groups[r.threadId]) groups[r.threadId] = [];
      groups[r.threadId].push(r);
    }
    return groups;
  }, [results]);

  const flatResults = React.useMemo(() => Object.values(groupedResults).flat(), [groupedResults]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (flatResults.length > 0) {
        const idx = Math.min(selectedIndex, flatResults.length - 1);
        onResultSelect(flatResults[idx].threadId, flatResults[idx].messageId);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(2, 8, 23, 0.92)",
        backdropFilter: "blur(24px)",
        borderRadius: "inherit",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
        overflow: "hidden",
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Header / Search Input */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          borderBottom: "1px solid var(--proof-border)",
          flexShrink: 0,
        }}
      >
        <Search size={16} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          placeholder="Search messages\u2026"
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            outline: "none",
            fontSize: 13.5,
            color: "var(--proof-text)",
            fontFamily: "var(--font-sans)",
          }}
        />
        {query.trim() ? (
          <span
            style={{
              fontSize: 11,
              color: "var(--proof-text-muted)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {results.length > 0
              ? `${results.length} result${results.length !== 1 ? "s" : ""}`
              : "No results"}
          </span>
        ) : null}
        <button
          onClick={onClose}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 26,
            height: 26,
            borderRadius: 6,
            border: "none",
            background: "transparent",
            color: "var(--proof-text-muted)",
            cursor: "pointer",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Results */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "var(--proof-border) transparent",
        }}
      >
        {!query.trim() ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--proof-text-muted)",
              fontSize: 12.5,
              padding: 32,
            }}
          >
            Type to search across all conversations
          </div>
        ) : results.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 10,
              padding: 32,
            }}
          >
            <Search size={28} style={{ color: "var(--proof-text-muted)", opacity: 0.4 }} />
            <div style={{ fontSize: 13, color: "var(--proof-text-muted)" }}>
              No results for <strong style={{ color: "var(--proof-text)" }}>"{query}"</strong>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--proof-text-muted)", opacity: 0.7 }}>
              Try a different search term
            </div>
          </div>
        ) : (
          <div>
            {Object.entries(groupedResults).map(([threadId, groupResults]) => (
              <div key={threadId}>
                {/* Thread header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 14px 6px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--proof-text-muted)",
                    borderBottom: "1px solid var(--proof-border)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <MessageSquare size={12} style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {groupResults[0].threadTitle}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--proof-text-muted)",
                      opacity: 0.6,
                      flexShrink: 0,
                    }}
                  >
                    {groupResults.length}
                  </span>
                  <ChevronRight size={12} style={{ flexShrink: 0, opacity: 0.5 }} />
                </div>
                {/* Result items */}
                {groupResults.map((r) => {
                  const flatIdx = flatResults.indexOf(r);
                  const isSelected = flatIdx === selectedIndex;
                  return (
                    <div
                      key={r.messageId}
                      onClick={() => onResultSelect(r.threadId, r.messageId)}
                      style={{
                        padding: "8px 14px 8px 16px",
                        cursor: "pointer",
                        background: isSelected ? "rgba(59,130,246,0.08)" : "transparent",
                        borderLeft: isSelected
                          ? "2px solid var(--proof-blue)"
                          : "2px solid transparent",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          (e.currentTarget as HTMLElement).style.background =
                            "rgba(255,255,255,0.03)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          (e.currentTarget as HTMLElement).style.background = "transparent";
                        }
                      }}
                    >
                      {/* Role badge + timestamp */}
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "1px 6px",
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600,
                            background:
                              r.role === "user" ? "rgba(59,130,246,0.12)" : "rgba(139,92,246,0.12)",
                            color: r.role === "user" ? "#60a5fa" : "#a78bfa",
                          }}
                        >
                          {r.role === "user" ? <User size={10} /> : <Bot size={10} />}
                          {r.role === "user" ? "User" : "Assistant"}
                        </span>
                        <span
                          style={{ fontSize: 10, color: "var(--proof-text-muted)", opacity: 0.6 }}
                        >
                          {formatTime(r.timestamp)}
                        </span>
                      </div>
                      {/* Match preview with highlights */}
                      <div
                        style={{
                          fontSize: 12,
                          lineHeight: 1.5,
                          color: "var(--proof-text-secondary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {highlightText(r.matchPreview, query)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
