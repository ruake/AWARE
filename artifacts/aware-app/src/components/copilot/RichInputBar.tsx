import React, { useState, useRef, useCallback } from "react";
import { Send, Square, Bold, Italic, Code, Paperclip, FileText, X, Image } from "lucide-react";
import type { Attachment } from "../../lib/copilot/types";

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".pdf",
  ".txt",
  ".log",
  ".json",
  ".csv",
  ".yaml",
  ".yml",
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function wrapSelection(textarea: HTMLTextAreaElement, before: string, after: string): string {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end);
  const isWrapped = selected.startsWith(before) && selected.endsWith(after);
  if (isWrapped) {
    return (
      textarea.value.slice(0, start) +
      selected.slice(before.length, selected.length - after.length) +
      textarea.value.slice(end)
    );
  }
  return textarea.value.slice(0, start) + before + selected + after + textarea.value.slice(end);
}

interface RichInputBarProps {
  input: string;
  busy: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  attachments: Attachment[];
  onSend: () => void;
  onStop: () => void;
  onInput: (val: string) => void;
  onAttach: (files: FileList | null) => void;
  onRemoveAttachment: (id: string) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onTemplateSelect: () => void;
}

export default function RichInputBar({
  input,
  busy,
  textareaRef,
  attachments,
  onSend,
  onStop,
  onInput,
  onAttach,
  onRemoveAttachment,
  onPaste,
  onTemplateSelect}: RichInputBarProps) {
  const canSend = input.trim().length > 0 && !busy;
  const [dragging, setDragging] = useState(false);
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInput(e.target.value);
    e.target.style.height = "auto";
    const newHeight = Math.min(e.target.scrollHeight, 130); // ~5-6 lines
    e.target.style.height = `${newHeight}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend();
    }
  };

  const applyFormat = useCallback(
    (before: string, after: string) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const updated = wrapSelection(ta, before, after);
      onInput(updated);
      ta.focus();
    },
    [textareaRef, onInput],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const oversized = Array.from(files).filter((f) => f.size > MAX_ATTACHMENT_SIZE);
    if (oversized.length > 0) {
      setSizeWarning(`"${oversized[0].name}" exceeds the 10 MB limit`);
      setTimeout(() => setSizeWarning(null), 4000);
      return;
    }
    setSizeWarning(null);
    onAttach(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const oversized = Array.from(files).filter((f) => f.size > MAX_ATTACHMENT_SIZE);
      if (oversized.length > 0) {
        setSizeWarning(`"${oversized[0].name}" exceeds the 10 MB limit`);
        setTimeout(() => setSizeWarning(null), 4000);
        return;
      }
      setSizeWarning(null);
      onAttach(files);
    }
  };

  const hiddenInputStyle: React.CSSProperties = { display: "none" };
  const toolBtnBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    borderRadius: 6,
    border: "1px solid transparent",
    background: "transparent",
    color: "var(--proof-text-muted)",
    cursor: "pointer",
    transition: "all 0.12s"};

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        padding: "10px 16px 14px",
        background: "rgba(2, 8, 23, 0.8)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--proof-border)",
        flexShrink: 0,
        position: "relative"}}
    >
      {/* Drag overlay */}
      {dragging && (
        <div
          aria-live="polite"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(59, 130, 246, 0.08)",
            border: "2px dashed var(--proof-blue)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            color: "var(--proof-blue-bright)",
            fontWeight: 600,
            letterSpacing: "0.3px",
            zIndex: 10,
            pointerEvents: "none"}}
        >
          Drop files here
        </div>
      )}

      {/* Generating indicator */}
      {busy && (
        <div
          role="status"
          aria-live="polite"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 4px 8px",
            fontSize: 11.5,
            color: "var(--proof-blue-bright)",
            fontWeight: 500}}
        >
          <div style={{ display: "flex", gap: 3 }} aria-hidden="true">
            <span className="copilot-thinking-dot" style={{ width: 5, height: 5 }} />
            <span className="copilot-thinking-dot" style={{ width: 5, height: 5 }} />
            <span className="copilot-thinking-dot" style={{ width: 5, height: 5 }} />
          </div>
          <span>Generating response…</span>
          <button
            onClick={onStop}
            aria-label="Stop generating"
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 10px",
              borderRadius: 6,
              border: "1px solid rgba(248,113,113,0.25)",
              background: "rgba(239,68,68,0.08)",
              color: "var(--proof-red)",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600}}
          >
            <Square size={9} fill="currentColor" /> Stop
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          paddingBottom: 8}}
      >
        <button
          title="Bold (select text first)"
          aria-label="Bold"
          onClick={() => applyFormat("**", "**")}
          style={toolBtnBase}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--proof-hover)";
            e.currentTarget.style.color = "var(--proof-text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--proof-text-muted)";
          }}
        >
          <Bold size={14} />
        </button>
        <button
          title="Italic (select text first)"
          aria-label="Italic"
          onClick={() => applyFormat("_", "_")}
          style={toolBtnBase}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--proof-hover)";
            e.currentTarget.style.color = "var(--proof-text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--proof-text-muted)";
          }}
        >
          <Italic size={14} />
        </button>
        <button
          title="Inline code (select text first)"
          aria-label="Code"
          onClick={() => applyFormat("`", "`")}
          style={toolBtnBase}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--proof-hover)";
            e.currentTarget.style.color = "var(--proof-text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--proof-text-muted)";
          }}
        >
          <Code size={14} />
        </button>

        <div style={{ width: 1, height: 20, background: "var(--proof-border)" }} />

        <button
          title="Attach file"
          aria-label="Attach file"
          onClick={() => fileInputRef.current?.click()}
          style={toolBtnBase}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--proof-hover)";
            e.currentTarget.style.color = "var(--proof-text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--proof-text-muted)";
          }}
        >
          <Paperclip size={14} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(",")}
          onChange={handleFileSelect}
          style={hiddenInputStyle}
          aria-hidden="true"
          tabIndex={-1}
        />

        <button
          title="Use a prompt template"
          aria-label="Use template"
          onClick={onTemplateSelect}
          style={toolBtnBase}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--proof-hover)";
            e.currentTarget.style.color = "var(--proof-text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--proof-text-muted)";
          }}
        >
          <FileText size={14} />
        </button>

        <div style={{ flex: 1 }} />

        {/* Send/Stop button — always in DOM to prevent layout shift */}
        {busy ? (
          <button
            onClick={onStop}
            aria-label="Stop generating"
            title="Stop generating"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid rgba(248,113,113,0.3)",
              background: "rgba(239,68,68,0.1)",
              color: "var(--proof-red)",
              cursor: "pointer",
              flexShrink: 0,
              transition: "all 0.15s"}}
          >
            <Square size={13} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={onSend}
            disabled={!canSend}
            aria-label={canSend ? "Send message" : "Type a message to send"}
            title={canSend ? "Send (Enter)" : "Type a message"}
            className={`copilot-send-btn ${canSend ? "copilot-send-btn-active" : "copilot-send-btn-inactive"}`}
          >
            <Send size={15} />
          </button>
        )}
      </div>

      {/* File size warning */}
      {sizeWarning && (
        <div
          role="alert"
          style={{
            fontSize: 11,
            color: "var(--proof-red-bright)",
            padding: "0 4px 6px",
            display: "flex",
            alignItems: "center",
            gap: 6}}
        >
          <button
            aria-label="Dismiss warning"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              color: "inherit"}}
            onClick={() => setSizeWarning(null)}
          >
            <X size={12} />
          </button>
          {sizeWarning}
        </div>
      )}

      {/* Attachment chips */}
      {attachments.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            paddingBottom: 8}}
        >
          {attachments.map((att) => (
            <div
              key={att.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 8px 4px 4px",
                borderRadius: 8,
                background: "var(--proof-surface-2)",
                border: "1px solid var(--proof-border)",
                maxWidth: 240}}
            >
              {att.type === "image" || att.type === "screenshot" ? (
                att.data ? (
                  <img
                    src={att.data}
                    alt={att.name}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 4,
                      objectFit: "cover",
                      flexShrink: 0}}
                  />
                ) : (
                  <Image
                    size={16}
                    style={{ flexShrink: 0, color: "var(--proof-text-muted)" }}
                    aria-hidden="true"
                  />
                )
              ) : (
                <FileText
                  size={16}
                  style={{ flexShrink: 0, color: "var(--proof-text-muted)" }}
                  aria-hidden="true"
                />
              )}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--proof-text)",
                    lineHeight: 1.3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"}}
                >
                  {att.name}
                </div>
                <div style={{ fontSize: 9.5, color: "var(--proof-text-muted)" }}>
                  {formatSize(att.size)}
                </div>
              </div>
              <button
                onClick={() => onRemoveAttachment(att.id)}
                title={`Remove ${att.name}`}
                aria-label={`Remove ${att.name}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  border: "none",
                  background: "transparent",
                  color: "var(--proof-text-muted)",
                  cursor: "pointer",
                  flexShrink: 0,
                  marginLeft: "auto"}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--proof-hover)";
                  e.currentTarget.style.color = "var(--proof-red-bright)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--proof-text-muted)";
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div
        className="copilot-input-wrap"
        style={{ display: "flex", alignItems: "flex-end", gap: 8 }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={onPaste}
          placeholder="Ask about tests, failures, flakiness, promotion status…"
          rows={1}
          aria-label="Message input"
          aria-multiline="true"
          style={{
            flex: 1,
            resize: "none",
            border: "none",
            background: "transparent",
            fontSize: 13.5,
            lineHeight: 1.55,
            color: "var(--proof-text)",
            fontFamily: "var(--font-sans)",
            minHeight: 26,
            maxHeight: 160,
            overflowY: "auto",
            padding: "4px 0"}}
        />
      </div>

      {/* Hint */}
      <div
        style={{
          fontSize: 10,
          color: "var(--proof-text-muted)",
          marginTop: 6,
          textAlign: "center",
          letterSpacing: "0.2px"}}
      >
        <kbd
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--proof-border)",
            borderRadius: 3,
            padding: "1px 4px"}}
        >
          Enter
        </kbd>{" "}
        to send
        {" · "}
        <kbd
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--proof-border)",
            borderRadius: 3,
            padding: "1px 4px"}}
        >
          ⇧Enter
        </kbd>{" "}
        new line
        {" · "}
        <kbd
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--proof-border)",
            borderRadius: 3,
            padding: "1px 4px"}}
        >
          ⌘F
        </kbd>{" "}
        search
      </div>
    </div>
  );
}
