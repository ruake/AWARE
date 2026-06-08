import React from "react";
import { Download, FileText, GitCompare, ChevronDown, TerminalSquare, X } from "lucide-react";
import { generateCiConfigYaml, downloadCiConfig } from "@/lib/ciConfig";

export function CiConfigBanner({ show, onDismiss }: { show: boolean; onDismiss: () => void }) {
  const [expanded, setExpanded] = React.useState(false);
  if (!show) return null;

  return (
    <div style={{ background: "var(--gcp-blue-bg)", border: "1px solid var(--gcp-blue)", borderRadius: 6, overflow: "hidden", marginBottom: 14 }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px" }}>
        <FileText size={15} style={{ color: "var(--gcp-blue)", flexShrink: 0 }} />
        <span style={{ fontSize: 12, flex: 1, color: "var(--gcp-text)" }}>
          <strong>CI config changed.</strong> Download the updated <code style={{ fontSize: 11, background: "rgba(26,115,232,0.1)", padding: "1px 5px", borderRadius: 3, fontFamily: "var(--font-mono)" }}>proof-test-config.yml</code> and commit it to trigger GitHub Actions.
        </span>
        <button onClick={() => { downloadCiConfig(); }} className="gcp-button-primary" style={{ fontSize: 11, padding: "5px 12px", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5 }}>
          <Download size={12} /> Download Config
        </button>
        <button onClick={() => { setExpanded(!expanded); }} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--gcp-blue)", padding: 4 }} title="Show instructions">
          <ChevronDown size={14} style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }} />
        </button>
        <button onClick={onDismiss} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--gcp-text-secondary)", padding: 4, fontSize: 16, lineHeight: 1 }}>×</button>
      </div>

      {/* Expanded instructions */}
      {expanded && (
        <div style={{ padding: "0 14px 12px", borderTop: "1px solid rgba(26,115,232,0.2)", marginTop: 0 }}>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", paddingTop: 10 }}>
            <div style={{ flex: "1 1 280px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                <TerminalSquare size={12} /> Where to commit
              </div>
              <div style={{ background: "#1e293b", borderRadius: 4, padding: "8px 12px", fontFamily: "var(--font-mono)", fontSize: 10, lineHeight: 1.8, color: "#e2e8f0" }}>
                <div><span style={{ color: "#60a5fa" }}>$</span> mv ~/Downloads/proof-test-config-*.yml config/proof-test-config.yml</div>
                <div><span style={{ color: "#60a5fa" }}>$</span> git add config/proof-test-config.yml</div>
                <div><span style={{ color: "#60a5fa" }}>$</span> git commit -m "update proof test config from PROOF"</div>
                <div><span style={{ color: "#60a5fa" }}>$</span> git push</div>
              </div>
            </div>
            <div style={{ flex: "1 1 280px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                <GitCompare size={12} /> How GHA reads it
              </div>
              <div style={{ background: "#1e293b", borderRadius: 4, padding: "8px 12px", fontFamily: "var(--font-mono)", fontSize: 10, lineHeight: 1.8, color: "#e2e8f0" }}>
                <div style={{ color: "#f59e0b" }}>.github/workflows/run-tests.yml</div>
                <div style={{ color: "#6b7280" }}>  └─ workflow_dispatch inputs</div>
                <div style={{ color: "#6b7280" }}>       ├─ suite (reads from config)</div>
                <div style={{ color: "#6b7280" }}>       ├─ target (Prod | UAT)</div>
                <div style={{ color: "#6b7280" }}>       └─ environment (Production | Staging)</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
