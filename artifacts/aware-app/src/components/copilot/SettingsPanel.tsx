import React from "react";

interface Props {
  show: boolean;
  apiKey: string;
  apiUrl: string;
  model: string;
  saved: boolean;
  onApiKeyChange: (val: string) => void;
  onApiUrlChange: (val: string) => void;
  onModelChange: (val: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function SettingsPanel({
  show,
  apiKey,
  apiUrl,
  model,
  saved,
  onApiKeyChange,
  onApiUrlChange,
  onModelChange,
  onSave,
  onClose,
}: Props) {
  if (!show) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 44,
        right: 0,
        width: 320,
        background: "var(--proof-surface-2)",
        border: "1px solid var(--proof-border-strong)",
        borderRadius: 10,
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        padding: 16,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text)" }}>
        OpenAI Settings
      </div>
      <label
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "var(--proof-text-secondary)",
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        API Key
        <input
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          type="password"
          placeholder="sk-…"
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid var(--proof-border)",
            background: "var(--proof-surface)",
            color: "var(--proof-text)",
            fontSize: 12,
            outline: "none",
          }}
        />
      </label>
      <label
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "var(--proof-text-secondary)",
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        API URL
        <input
          value={apiUrl}
          onChange={(e) => onApiUrlChange(e.target.value)}
          placeholder="https://api.openai.com/v1"
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid var(--proof-border)",
            background: "var(--proof-surface)",
            color: "var(--proof-text)",
            fontSize: 12,
            outline: "none",
          }}
        />
      </label>
      <label
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "var(--proof-text-secondary)",
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        Model
        <input
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          placeholder="gpt-4o-mini"
          style={{
            padding: "6px 10px",
            borderRadius: 6,
            border: "1px solid var(--proof-border)",
            background: "var(--proof-surface)",
            color: "var(--proof-text)",
            fontSize: 12,
            outline: "none",
          }}
        />
      </label>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={onSave}
          style={{
            flex: 1,
            padding: "6px 12px",
            borderRadius: 6,
            border: "none",
            background: "var(--proof-blue)",
            color: "white",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {saved ? "Saved!" : "Save"}
        </button>
        <button
          onClick={onClose}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid var(--proof-border)",
            background: "transparent",
            color: "var(--proof-text-secondary)",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
