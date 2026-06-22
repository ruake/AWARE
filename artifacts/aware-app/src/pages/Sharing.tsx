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
        maxWidth: 1400,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        animation: "page-enter 0.5s ease-out both"
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>Sharing & Permalinks</h1>
          <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", marginTop: 4 }}>
            Deep links, export formats, and embeddable status badges.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "var(--proof-text-secondary)",
            background: "var(--proof-surface-2)",
            padding: "8px 16px",
            borderRadius: 100,
            border: "1px solid var(--proof-border)",
          }}
        >
          <Shield size={14} style={{ color: "var(--proof-blue)" }} /> 
          Token Encrypted Access
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        <div
          className="proof-card"
          style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}
        >
          <h2
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--proof-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              borderBottom: "1px solid var(--proof-border)",
              paddingBottom: 12,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Link2 size={14} style={{ color: "var(--proof-blue)" }} /> Permalink
          </h2>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--proof-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
              }}
            >
              Current Environment URL
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "var(--proof-surface-2)",
                border: "1px solid var(--proof-border-strong)",
                borderRadius: 8,
                padding: "10px 12px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
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
                className="proof-button proof-button-xs proof-button-secondary"
                style={{
                  color: copiedUrl ? "var(--proof-green)" : "var(--proof-blue-bright)",
                  flexShrink: 0,
                  minWidth: 70
                }}
              >
                {copiedUrl ? <Check size={12} /> : <Copy size={12} />}
                {copiedUrl ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--proof-text-secondary)",
              lineHeight: 1.6,
            }}
          >
            Share a link to the current view. Open it in any browser to see the same comparison, run
            detail, or test documentation state.
          </div>
        </div>

        <div
          className="proof-card"
          style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}
        >
          <h2
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--proof-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              borderBottom: "1px solid var(--proof-border)",
              paddingBottom: 12,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Share2 size={14} style={{ color: "var(--proof-purple)" }} /> Quick Export
          </h2>
          <div
            style={{
              fontSize: 13,
              color: "var(--proof-text-secondary)",
              lineHeight: 1.6,
            }}
          >
            Export formats are available from the Compare and Runs pages. Use the share buttons on
            those pages to generate notifications.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: "💬", label: "Slack Webhook Message" },
              { icon: <Github size={14} />, label: "GitHub Issue Template" },
              { icon: "📧", label: "Email Summary Body" },
            ].map((fmt) => (
              <div
                key={fmt.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--proof-border-light)",
                  background: "var(--proof-surface-2)",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "var(--proof-text)",
                }}
              >
                <span style={{ fontSize: 14, display: "flex", alignItems: "center" }}>{fmt.icon}</span>
                <span>{fmt.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="proof-card"
          style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}
        >
          <h2
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--proof-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              borderBottom: "1px solid var(--proof-border)",
              paddingBottom: 12,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Check size={14} style={{ color: "var(--proof-green)" }} /> Embed Badge
          </h2>
          <div
            style={{
              fontSize: 13,
              color: "var(--proof-text-secondary)",
              lineHeight: 1.6,
            }}
          >
            Status badges can be embedded from the Dashboard or Compare page when runs are
            available. Badge URLs follow the pattern below:
          </div>
          <div style={{ 
            background: "var(--proof-surface-3)", 
            padding: "12px", 
            borderRadius: 8, 
            border: "1px solid var(--proof-border)",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--proof-blue-bright)"
          }}>
            /badges/{"{envId}"}.svg
          </div>
          <div style={{ fontSize: 11, color: "var(--proof-text-muted)", fontStyle: "italic" }}>
            * Requires authentication if private mode is enabled.
          </div>
        </div>
      </div>
    </div>
  );
}
