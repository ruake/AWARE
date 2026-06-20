import React from "react";
import { Send, Square } from "lucide-react";

interface Props {
  input: string;
  busy: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onSend: () => void;
  onStop?: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onInput: (val: string) => void;
}

export default function InputBar({
  input,
  busy,
  textareaRef,
  onSend,
  onStop,
  onKeyDown,
  onInput,
}: Props) {
  const canSend = input.trim().length > 0 && !busy;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  return (
    <div
      style={{
        padding: "10px 16px 14px",
        background: "rgba(2, 8, 23, 0.8)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--proof-border)",
        flexShrink: 0,
      }}
    >
      {/* Generating indicator */}
      {busy && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 4px 8px",
            fontSize: 11.5,
            color: "var(--proof-blue-bright)",
            fontWeight: 500,
          }}
        >
          <div style={{ display: "flex", gap: 3 }}>
            <span className="copilot-thinking-dot" style={{ width: 5, height: 5 }} />
            <span className="copilot-thinking-dot" style={{ width: 5, height: 5 }} />
            <span className="copilot-thinking-dot" style={{ width: 5, height: 5 }} />
          </div>
          <span>Generating response…</span>
          <button
            onClick={onStop}
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 10px",
              borderRadius: 6,
              border: "1px solid rgba(248,113,113,0.25)",
              background: "rgba(239,68,68,0.08)",
              color: "#f87171",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <Square size={9} fill="currentColor" /> Stop
          </button>
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
          onKeyDown={onKeyDown}
          placeholder={
            busy
              ? "Waiting for response…"
              : "Ask about tests, failures, flakiness, promotion status…"
          }
          rows={1}
          disabled={busy}
          style={{
            flex: 1,
            resize: "none",
            border: "none",
            background: "transparent",
            outline: "none",
            fontSize: 13.5,
            lineHeight: 1.55,
            color: "var(--proof-text)",
            fontFamily: "var(--font-sans)",
            minHeight: 26,
            maxHeight: 160,
            overflowY: "auto",
            padding: "4px 0",
            opacity: busy ? 0.5 : 1,
          }}
        />
        <button
          onClick={busy ? undefined : onSend}
          disabled={!canSend}
          title={busy ? "Generating…" : canSend ? "Send (Enter)" : "Type a message"}
          className={`copilot-send-btn ${canSend ? "copilot-send-btn-active" : "copilot-send-btn-inactive"}`}
        >
          <Send size={15} />
        </button>
      </div>

      {/* Hint */}
      <div
        style={{
          fontSize: 10,
          color: "var(--proof-text-muted)",
          marginTop: 6,
          textAlign: "center",
          letterSpacing: "0.2px",
        }}
      >
        <kbd
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--proof-border)",
            borderRadius: 3,
            padding: "1px 4px",
          }}
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
            padding: "1px 4px",
          }}
        >
          ⇧Enter
        </kbd>{" "}
        for new line
      </div>
    </div>
  );
}
