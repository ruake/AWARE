import React from "react";
import { Copy, Check } from "lucide-react";

export function MarkdownCode({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  const [copied, setCopied] = React.useState(false);
  
  const isInline = !className;
  const content = String(children).trim();

  if (isInline) {
    return (
      <code
        style={{
          background: "var(--proof-surface-3)",
          color: "var(--proof-blue-bright)",
          padding: "2px 6px",
          borderRadius: 4,
          fontFamily: "var(--font-mono)",
          fontSize: "0.9em"
        }}
        {...props}
      >
        {children}
      </code>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: "relative", margin: "16px 0", borderRadius: 8, overflow: "hidden", border: "1px solid var(--proof-border-strong)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#000", padding: "6px 12px", borderBottom: "1px solid var(--proof-border)" }}>
        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--proof-text-muted)" }}>{className?.replace('language-', '') || 'code'}</span>
        <button
          onClick={handleCopy}
          style={{ background: "transparent", border: "none", color: "var(--proof-text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 10, textTransform: "uppercase" }}
        >
          {copied ? <Check size={12} style={{ color: "var(--proof-green)" }} /> : <Copy size={12} />}
        </button>
      </div>
      <pre style={{ margin: 0, padding: 16, background: "#050608", overflowX: "auto", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--proof-text)" }}>
        <code {...props}>{children}</code>
      </pre>
    </div>
  );
}
