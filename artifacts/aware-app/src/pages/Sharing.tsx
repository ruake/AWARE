import React from "react";
import { copyToClipboard } from "@/lib/nav";
import { Link2, Copy, Check, Github, Shield, Share2 } from "lucide-react";

export default function Sharing() {
  const copy = (text: string) => {
    copyToClipboard(text);
  };

  const [copiedUrl, setCopiedUrl] = React.useState(false);

  const currentUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 32,
        padding: "40px",
        animation: "page-enter 0.5s ease-out both"
      }}
    >
      <div className="glass-panel" style={{ padding: 60, textAlign: "center", borderRadius: "var(--proof-radius-xl)", position: "relative", overflow: "hidden" }}>
        <Share2 size={64} style={{ margin: "0 auto 32px", display: "block", color: "var(--proof-blue)", opacity: 0.2 }} />
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16, color: "var(--proof-text)" }}>TELEMETRY SHARING</h1>
        <p style={{ color: "var(--proof-text-secondary)", marginBottom: 40, maxWidth: 500, margin: "0 auto 40px", fontSize: 16, lineHeight: 1.6 }}>
          Secure deep-linking and encrypted report sharing features are currently offline for maintenance.
        </p>
        <div className="metric-number" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "color-mix(in srgb, var(--proof-blue) 15%, transparent)", color: "var(--proof-blue)", borderRadius: 9999, fontSize: 14, border: "1px solid rgba(0,196,255,0.3)", boxShadow: "var(--proof-glow-cyan)" }}>
          TRANSMISSION PENDING
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, opacity: 0.5, pointerEvents: "none" }}>
        <div
          className="glass-panel"
          style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24, borderRadius: "var(--proof-radius-lg)" }}
        >
          <h2
            className="metric-number"
            style={{
              fontSize: 14,
              color: "var(--proof-text)",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              paddingBottom: 16,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Link2 size={16} style={{ color: "var(--proof-blue)" }} /> PERMALINK
          </h2>
          <div>
            <div
              className="metric-number"
              style={{
                fontSize: 12,
                color: "var(--proof-text-muted)",
                marginBottom: 12,
              }}
            >
              CURRENT COORDINATES
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: "12px 16px",
              }}
            >
              <span
                className="metric-number"
                style={{
                  fontSize: 12,
                  color: "var(--proof-text)",
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {currentUrl}
              </span>
              <button
                onClick={() => {
                  copy(currentUrl);
                  setCopiedUrl(true);
                  setTimeout(() => setCopiedUrl(false), 2000);
                }}
                className="proof-btn proof-btn-ghost"
                style={{
                  color: copiedUrl ? "var(--proof-green)" : "var(--proof-blue)",
                  flexShrink: 0,
                  minWidth: 80,
                  padding: "6px 12px"
                }}
              >
                {copiedUrl ? <Check size={14} /> : <Copy size={14} />}
                {copiedUrl ? "COPIED" : "COPY"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
