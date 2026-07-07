import React from "react";
import { Share2 } from "lucide-react";
import { copyToClipboard } from "@/lib/nav";

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
}

export function ShareButton({ title, text, url }: ShareButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleShare = async () => {
    const shareUrl = url ?? window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }

    copyToClipboard(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tooltipStyle: React.CSSProperties = {
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
  };

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        className="proof-btn proof-btn-ghost"
        onClick={handleShare}
        aria-label={copied ? "Link copied" : "Share"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          fontSize: 12,
          fontWeight: 600,
          borderRadius: 6,
          border: "1px solid var(--proof-border)",
          color: copied ? "var(--proof-green)" : "var(--proof-text-secondary)",
          transition: "color 0.2s",
          cursor: "pointer",
        }}
      >
        <Share2 size={14} />
        {copied ? "Copied!" : "Share"}
      </button>
      {copied && (
        <div style={tooltipStyle} role="status" aria-live="polite">
          Link copied!
        </div>
      )}
    </div>
  );
}
