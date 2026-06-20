import React from "react";
import { X } from "lucide-react";

interface CopilotSettingsProps {
  endpointConfig: { apiKey: string; apiUrl: string; model: string };
  onSave: (cfg: { apiKey: string; apiUrl: string; model: string }) => void;
  onClose: () => void;
}

function SettingsForm({
  config,
  onSave,
}: {
  config: { apiKey: string; apiUrl: string; model: string };
  onSave: (cfg: { apiKey: string; apiUrl: string; model: string }) => void;
}) {
  const [apiKey, setApiKey] = React.useState(config.apiKey);
  const [apiUrl, setApiUrl] = React.useState(config.apiUrl);
  const [model, setModel] = React.useState(config.model);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 11, color: "var(--proof-text-secondary)", fontWeight: 600 }}>
          API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          className="proof-input"
          style={{ fontSize: 12 }}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 11, color: "var(--proof-text-secondary)", fontWeight: 600 }}>
          API URL
        </label>
        <input
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          placeholder="http://localhost:11434/v1  (Ollama, LM Studio, …)"
          className="proof-input"
          style={{ fontSize: 12 }}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={{ fontSize: 11, color: "var(--proof-text-secondary)", fontWeight: 600 }}>
          Model
        </label>
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="llama3, mistral, phi3 … (leave blank for server default)"
          className="proof-input"
          style={{ fontSize: 12 }}
        />
      </div>
      <button
        onClick={() => onSave({ apiKey, apiUrl, model })}
        className="proof-button-primary"
        style={{ alignSelf: "flex-end", padding: "6px 16px", fontSize: 12 }}
      >
        Save Settings
      </button>
    </div>
  );
}

export function CopilotSettings({ endpointConfig, onSave, onClose }: CopilotSettingsProps) {
  return (
    <div
      style={{
        borderBottom: "1px solid var(--proof-border)",
        padding: "14px 18px",
        background: "var(--proof-overlay)",
        backdropFilter: "blur(10px)",
        flexShrink: 0,
        animation: "slide-down 0.15s ease-out",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--proof-text)" }}>
          Custom Endpoint Settings
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--proof-text-muted)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <X size={14} />
        </button>
      </div>
      <SettingsForm config={endpointConfig} onSave={onSave} />
    </div>
  );
}
