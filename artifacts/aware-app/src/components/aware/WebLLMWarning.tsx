import React from "react";
import { AlertTriangle, Download, X } from "lucide-react";

interface WebLLMWarningProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function WebLLMWarning({ onConfirm, onCancel }: WebLLMWarningProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="webllm-warning-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 24,
      }}
    >
      <div
        style={{
          background: "var(--proof-surface-2)",
          border: "1px solid var(--proof-border-strong)",
          borderRadius: "var(--proof-radius-xl)",
          padding: 32,
          maxWidth: 480,
          width: "100%",
          boxShadow: "var(--proof-shadow-xl)",
          position: "relative",
        }}
      >
        <button
          onClick={onCancel}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--proof-text-muted)",
            padding: 4,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
          }}
        >
          <X size={16} />
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "var(--proof-yellow-bg)",
              border: "1px solid var(--proof-yellow-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} style={{ color: "var(--proof-yellow)" }} />
          </div>
          <h2
            id="webllm-warning-title"
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "var(--proof-text)",
              margin: 0,
            }}
          >
            Large Download Required
          </h2>
        </div>

        <p
          style={{
            fontSize: 14,
            color: "var(--proof-text-secondary)",
            lineHeight: 1.6,
            marginBottom: 12,
          }}
        >
          Running the AI model locally requires downloading{" "}
          <strong style={{ color: "var(--proof-text)" }}>~4 GB</strong> of model weights to your
          browser. This is a one-time download that enables fully private, offline AI processing — no
          data leaves your device.
        </p>

        <p
          style={{
            fontSize: 13,
            color: "var(--proof-text-muted)",
            lineHeight: 1.5,
            marginBottom: 24,
          }}
        >
          The download will be cached locally. Requires WebGPU support (Chrome 113+, Edge 113+).
          Alternatively, use <strong>OpenAI</strong> mode with your own API key.
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: 600,
              background: "var(--proof-surface-3)",
              color: "var(--proof-text-secondary)",
              border: "1px solid var(--proof-border)",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: 600,
              background: "var(--proof-blue)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Download size={14} />
            Download & Enable (~4 GB)
          </button>
        </div>
      </div>
    </div>
  );
}
