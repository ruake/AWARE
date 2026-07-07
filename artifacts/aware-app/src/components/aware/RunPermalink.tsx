import React from "react";
import { Link2 } from "lucide-react";
import { copyToClipboard } from "@/lib/nav";

interface RunPermalinkProps {
  runId: string;
}

export function RunPermalink({ runId }: RunPermalinkProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    const url = `${window.location.origin}${window.location.pathname.replace(/\/+$/, "")}/runs/${runId}`;
    copyToClipboard(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        className="proof-btn-ghost"
        onClick={handleCopy}
        aria-label="Copy link to this run"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 8,
          padding: 0,
          border: "1px solid var(--proof-border)",
          cursor: "pointer",
          color: copied ? "var(--proof-green)" : "var(--proof-text-secondary)",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--proof-hover-light)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        <Link2 size={14} />
      </button>
      {copied && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--proof-surface-3)",
            color: "var(--proof-text-primary)",
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: 6,
            border: "1px solid var(--proof-border)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
          role="status"
          aria-live="polite"
        >
          Link copied!
        </div>
      )}
    </div>
  );
}
