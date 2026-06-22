import React from "react";
import { Info, ExternalLink } from "lucide-react";

export function WebLLMWarning() {
  return (
    <div
      style={{
        padding: 16,
        background: "var(--proof-blue-bg)",
        border: "1px solid var(--proof-blue-border)",
        borderRadius: 8,
        display: "flex",
        gap: 12,
        marginBottom: 20,
      }}
    >
      <Info size={20} style={{ color: "var(--proof-blue)", flexShrink: 0 }} />
      <div>
        <h4 style={{ margin: "0 0 4px 0", fontSize: 14, fontWeight: 600, color: "var(--proof-text)" }}>
          Chrome AI Required
        </h4>
        <p style={{ margin: 0, fontSize: 13, color: "var(--proof-text-secondary)", lineHeight: 1.5 }}>
          This copilot uses Gemini Nano via Chrome's built-in AI API. 
          Please ensure you are using <strong>Chrome 138+</strong> and have the Prompt API enabled in 
          <code style={{ background: "var(--proof-surface-3)", padding: "2px 4px", borderRadius: 4, marginLeft: 4 }}>
            chrome://flags/#prompt-api-for-gemini-nano
          </code>.
        </p>
        <a 
          href="https://developer.chrome.com/docs/ai/built-in-ai" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: 4, 
            marginTop: 8, 
            fontSize: 12, 
            color: "var(--proof-blue)", 
            textDecoration: "none",
            fontWeight: 500
          }}
        >
          Setup Instructions <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
