import React from "react";
import { Download, Copy, Check, X, FileText, Code, File } from "lucide-react";
import type { Thread, Message, ExportFormat } from "@/lib/copilot/types";

interface ExportDialogProps {
  thread: Thread | null;
  onClose: () => void;
}

function formatAsMarkdown(thread: Thread, includeTimestamps: boolean, includeMetadata: boolean): string {
  const parts: string[] = [];
  if (includeMetadata) {
    parts.push(`# Conversation: ${thread.title}`);
    parts.push(`Date: ${new Date(thread.createdAt).toLocaleString()}`);
    parts.push(`Messages: ${thread.messageCount}`);
    parts.push("---");
  }
  for (const msg of thread.messages) {
    const heading = msg.role === "user" ? "## User" : "## Assistant";
    parts.push(heading);
    if (includeTimestamps) {
      parts.push(`*${new Date(msg.timestamp).toLocaleString()}*`);
    }
    parts.push("");
    parts.push(msg.content || "*empty*");
    if (msg.toolCalls && msg.toolCalls.length > 0) {
      parts.push("");
      parts.push("**Tool Calls:**");
      for (const tc of msg.toolCalls) {
        parts.push(`- \`${tc.name}\` — ${tc.status}`);
      }
    }
    parts.push("");
  }
  return parts.join("\n");
}

function formatAsJSON(thread: Thread, includeTimestamps: boolean, includeToolCalls: boolean, includeMetadata: boolean): string {
  const obj: Record<string, unknown> = {};
  if (includeMetadata) {
    obj.title = thread.title;
    obj.createdAt = includeTimestamps ? thread.createdAt : undefined;
    obj.updatedAt = includeTimestamps ? thread.updatedAt : undefined;
    obj.messageCount = thread.messageCount;
    obj.providerType = thread.providerType;
    obj.pinned = thread.pinned;
  }
  obj.messages = thread.messages.map((msg) => {
    const m: Record<string, unknown> = {
      role: msg.role,
      content: msg.content,
    };
    if (includeTimestamps) m.timestamp = msg.timestamp;
    if (includeToolCalls && msg.toolCalls) m.toolCalls = msg.toolCalls;
    if (msg.error) m.error = msg.error;
    return m;
  });
  return JSON.stringify(obj, null, 2);
}

function formatAsText(thread: Thread, includeTimestamps: boolean, includeMetadata: boolean): string {
  const parts: string[] = [];
  if (includeMetadata) {
    parts.push(`Conversation: ${thread.title}`);
    parts.push(`Date: ${new Date(thread.createdAt).toLocaleString()}`);
    parts.push("---");
  }
  for (const msg of thread.messages) {
    const prefix = msg.role === "user" ? "[User]" : "[Assistant]";
    const stamp = includeTimestamps ? ` (${new Date(msg.timestamp).toLocaleString()})` : "";
    parts.push(`${prefix}${stamp}`);
    parts.push(msg.content || "*empty*");
    parts.push("");
  }
  return parts.join("\n");
}

function formatExport(
  thread: Thread,
  format: ExportFormat,
  includeTimestamps: boolean,
  includeToolCalls: boolean,
  includeMetadata: boolean,
): string {
  switch (format) {
    case "markdown":
      return formatAsMarkdown(thread, includeTimestamps, includeMetadata);
    case "json":
      return formatAsJSON(thread, includeTimestamps, includeToolCalls, includeMetadata);
    case "text":
      return formatAsText(thread, includeTimestamps, includeMetadata);
  }
}

function getExtension(format: ExportFormat): string {
  switch (format) {
    case "markdown": return ".md";
    case "json": return ".json";
    case "text": return ".txt";
  }
}

function getPreviewLines(content: string, maxLines: number = 6): string {
  const lines = content.split("\n");
  const preview = lines.slice(0, maxLines);
  if (lines.length > maxLines) preview.push("…");
  return preview.join("\n");
}

const FORMAT_META: Record<ExportFormat, { label: string; icon: React.ReactNode }> = {
  markdown: { label: "Markdown", icon: <FileText size={14} /> },
  json: { label: "JSON", icon: <Code size={14} /> },
  text: { label: "Plain Text", icon: <File size={14} /> },
};

export default function ExportDialog({ thread, onClose }: ExportDialogProps) {
  const [format, setFormat] = React.useState<ExportFormat>("markdown");
  const [includeTimestamps, setIncludeTimestamps] = React.useState(false);
  const [includeToolCalls, setIncludeToolCalls] = React.useState(false);
  const [includeMetadata, setIncludeMetadata] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  const content = thread
    ? formatExport(thread, format, includeTimestamps, includeToolCalls, includeMetadata)
    : "";

  const preview = content ? getPreviewLines(content) : "";

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDownload = () => {
    if (!thread || !content) return;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${thread.title.replace(/[^a-zA-Z0-9-_ ]/g, "")}${getExtension(format)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!thread) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 500,
          maxHeight: "90vh",
          overflow: "auto",
          background: "var(--proof-surface-2)",
          border: "1px solid var(--proof-border)",
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          padding: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--proof-border)",
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--proof-text)" }}>
              Export Conversation
            </div>
            <div style={{ fontSize: 12, color: "var(--proof-text-secondary)", marginTop: 2 }}>
              {thread.title}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--proof-text-secondary)",
              padding: 4,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Format selector */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--proof-text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Format
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {(Object.keys(FORMAT_META) as ExportFormat[]).map((key) => {
                const meta = FORMAT_META[key];
                const active = key === format;
                return (
                  <button
                    key={key}
                    onClick={() => setFormat(key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 14px",
                      borderRadius: 20,
                      border: active ? "1px solid var(--proof-blue)" : "1px solid var(--proof-border)",
                      background: active ? "var(--proof-blue)" : "var(--proof-surface)",
                      color: active ? "#fff" : "var(--proof-text)",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: active ? 600 : 400,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {meta.icon}
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Options */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--proof-text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Options
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--proof-text)" }}>
                <input
                  type="checkbox"
                  checked={includeTimestamps}
                  onChange={(e) => setIncludeTimestamps(e.target.checked)}
                  style={{ accentColor: "var(--proof-blue)" }}
                />
                Include timestamps
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--proof-text)" }}>
                <input
                  type="checkbox"
                  checked={includeToolCalls}
                  onChange={(e) => setIncludeToolCalls(e.target.checked)}
                  style={{ accentColor: "var(--proof-blue)" }}
                />
                Include tool calls
                <span style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>(JSON only)</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--proof-text)" }}>
                <input
                  type="checkbox"
                  checked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                  style={{ accentColor: "var(--proof-blue)" }}
                />
                Include metadata
                <span style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>(thread info header)</span>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--proof-text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Preview
            </div>
            <pre
              style={{
                margin: 0,
                padding: 12,
                borderRadius: 8,
                background: "var(--proof-surface)",
                border: "1px solid var(--proof-border)",
                fontSize: 11,
                lineHeight: 1.5,
                color: "var(--proof-text)",
                maxHeight: 160,
                overflow: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
              }}
            >
              {preview || "Nothing to preview"}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 8,
            padding: "12px 20px",
            borderTop: "1px solid var(--proof-border)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid var(--proof-border)",
              background: "var(--proof-surface)",
              color: "var(--proof-text)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCopy}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid var(--proof-border)",
              background: copied ? "#16a34a" : "var(--proof-surface)",
              color: copied ? "#fff" : "var(--proof-text)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
              transition: "all 0.15s ease",
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={handleDownload}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              background: "var(--proof-blue)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Download size={14} />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
