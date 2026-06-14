import React from "react";
import { copyToClipboard } from "@/lib/nav";
import "../_group.css";
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
          gap: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 500 }}>Sharing & Permalinks</h1>
            <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", marginTop: 2 }}>
              Deep links, export formats, and embeddable badges
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: "var(--proof-text-secondary)",
              background: "var(--proof-grey-bg)",
              padding: "6px 12px",
              borderRadius: 4,
              border: "1px solid var(--proof-grey)",
            }}
          >
            <Shield size={12} /> Links expire per token configuration
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          <div
            className="proof-card"
            style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}
          >
            <h2
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--proof-text-secondary)",
                textTransform: "uppercase",
                borderBottom: "1px solid var(--proof-grey)",
                paddingBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Link2 size={12} /> Permalink
            </h2>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--proof-text-secondary)",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Current URL
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "var(--proof-grey-bg)",
                  border: "1px solid var(--proof-grey)",
                  borderRadius: 4,
                  padding: "8px 10px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
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
                  className="proof-button proof-button-xs"
                  style={{
                    color: copiedUrl ? "var(--proof-green)" : "var(--proof-blue)",
                    flexShrink: 0,
                  }}
                >
                  {copiedUrl ? <Check size={11} /> : <Copy size={11} />}
                  {copiedUrl ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--proof-text-secondary)",
                lineHeight: 1.6,
                padding: "8px 0",
              }}
            >
              Share a link to the current view. Open it in any browser to see the same comparison,
              run detail, or test documentation.
            </div>
          </div>

          <div
            className="proof-card"
            style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}
          >
            <h2
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--proof-text-secondary)",
                textTransform: "uppercase",
                borderBottom: "1px solid var(--proof-grey)",
                paddingBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Share2 size={12} /> Export
            </h2>
            <div
              style={{
                fontSize: 12,
                color: "var(--proof-text-secondary)",
                lineHeight: 1.6,
                padding: "8px 0",
              }}
            >
              Export formats are available from the Compare and Runs pages. Use the share buttons on
              those pages to generate Slack messages, GitHub issues, or email summaries.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: "💬", label: "Slack Message" },
                { icon: <Github size={13} />, label: "GitHub Issue" },
                { icon: "📧", label: "Email Body" },
              ].map((fmt) => (
                <div
                  key={fmt.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 10px",
                    borderRadius: 4,
                    border: "1px solid var(--proof-grey)",
                    background: "var(--proof-grey-bg)",
                    fontSize: 12,
                    color: "var(--proof-text-secondary)",
                  }}
                >
                  <span>{fmt.icon}</span>
                  <span>{fmt.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="proof-card"
            style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}
          >
            <h2
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--proof-text-secondary)",
                textTransform: "uppercase",
                borderBottom: "1px solid var(--proof-grey)",
                paddingBottom: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Embed / Badge
            </h2>
            <div
              style={{
                fontSize: 12,
                color: "var(--proof-text-secondary)",
                lineHeight: 1.6,
                padding: "8px 0",
              }}
            >
              Status badges can be embedded from the Dashboard or Compare page when runs are
              available. Badge URLs follow the pattern{" "}
              <code style={{ fontSize: 11 }}>/badges/{"{env}"}.svg</code>.
            </div>
          </div>
        </div>
      </div>
  );
}
