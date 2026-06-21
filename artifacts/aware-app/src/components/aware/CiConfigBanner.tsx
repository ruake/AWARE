import React from "react";
import { Download, FileText, GitCompare, ChevronDown, TerminalSquare, X } from "lucide-react";
import { downloadCiConfig } from "@/lib/ciConfig";

export function CiConfigBanner({ show, onDismiss }: { show: boolean; onDismiss: () => void }) {
  const [expanded, setExpanded] = React.useState(false);
  if (!show) return null;

  return (
    <div
      style={{
        background: "var(--proof-blue-bg)",
        border: "1px solid var(--proof-blue)",
        borderRadius: 6,
        overflow: "hidden",
        marginBottom: 14,
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
        <FileText size={15} style={{ color: "var(--proof-blue)", flexShrink: 0 }} />
        <span style={{ fontSize: 12, flex: 1, color: "var(--proof-text)" }}>
          <strong>CI config changed.</strong> Download the updated{" "}
          <code
            style={{
              fontSize: 11,
              background: "var(--proof-blue-bg)",
              padding: "1px 5px",
              borderRadius: 3,
              fontFamily: "var(--font-mono)",
            }}
          >
            proof-test-config.yml
          </code>{" "}
          and commit it to trigger GitHub Actions.
        </span>
        <button
          onClick={() => {
            downloadCiConfig();
          }}
          className="proof-button-primary proof-button-xs"
          aria-label="Download updated test configuration file"
        >
          <Download size={12} /> Download Config
        </button>
        <button
          onClick={() => {
            setExpanded(!expanded);
          }}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--proof-blue)",
            padding: 4,
          }}
          title="Show instructions"
        >
          <ChevronDown
            size={14}
            style={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.15s",
            }}
          />
        </button>
        <button
          onClick={onDismiss}
          aria-label="Close"
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--proof-text-secondary)",
            padding: 4,
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Expanded instructions */}
      {expanded && (
        <div
          style={{
            padding: "0 14px 12px",
            borderTop: "1px solid var(--proof-blue-border)",
            marginTop: 0,
          }}
        >
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", paddingTop: 10 }}>
            <div style={{ flex: "1 1 280px" }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--proof-text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <TerminalSquare size={12} /> Where to commit
              </div>
              <div
                style={{
                  background: "var(--proof-surface)",
                  borderRadius: 4,
                  padding: "8px 12px",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  lineHeight: 1.8,
                  color: "var(--proof-text)",
                }}
              >
                <div>
                  <span style={{ color: "var(--proof-blue-bright)" }}>$</span> mv
                  ~/Downloads/proof-test-config-*.yml config/proof-test-config.yml
                </div>
                <div>
                  <span style={{ color: "var(--proof-blue-bright)" }}>$</span> git add
                  config/proof-test-config.yml
                </div>
                <div>
                  <span style={{ color: "var(--proof-blue-bright)" }}>$</span> git commit -m "update
                  proof test config from AWARE"
                </div>
                <div>
                  <span style={{ color: "var(--proof-blue-bright)" }}>$</span> git push
                </div>
              </div>
            </div>
            <div style={{ flex: "1 1 280px" }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--proof-text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <GitCompare size={12} /> How GHA reads it
              </div>
              <div
                style={{
                  background: "var(--proof-surface)",
                  borderRadius: 4,
                  padding: "8px 12px",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  lineHeight: 1.8,
                  color: "var(--proof-text)",
                }}
              >
                <div style={{ color: "var(--proof-yellow)" }}>.github/workflows/controller.yml</div>
                <div style={{ color: "var(--proof-text-muted)" }}> └─ workflow_dispatch inputs</div>
                <div style={{ color: "var(--proof-text-muted)" }}>
                  {" "}
                  ├─ suite (reads from config)
                </div>
                <div style={{ color: "var(--proof-text-muted)" }}> ├─ target (Prod | UAT)</div>
                <div style={{ color: "var(--proof-text-muted)" }}>
                  {" "}
                  └─ environment (Production | Staging)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
