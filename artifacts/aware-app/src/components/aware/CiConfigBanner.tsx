import React from "react";
import { Download, FileText, GitCompare, ChevronDown, TerminalSquare, X } from "lucide-react";
import { downloadCiConfig } from "@/lib/ciConfig";
import { motion, AnimatePresence } from "framer-motion";

export function CiConfigBanner({ show, onDismiss }: { show: boolean; onDismiss: () => void }) {
  const [expanded, setExpanded] = React.useState(false);
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="glass-panel"
      style={{
        borderLeft: "4px solid var(--proof-blue)",
        borderRadius: 8,
        overflow: "hidden",
        marginBottom: 16,
        boxShadow: "var(--proof-shadow-md)",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
        <FileText size={16} style={{ color: "var(--proof-blue)", flexShrink: 0, filter: "drop-shadow(var(--proof-glow-cyan))" }} />
        <span style={{ fontSize: 13, flex: 1, color: "var(--proof-text)" }}>
          <strong style={{ color: "var(--proof-blue-bright)" }}>CI config changed.</strong> Download the updated{" "}
          <code
            style={{
              fontSize: 11,
              background: "rgba(255,255,255,0.1)",
              padding: "2px 6px",
              borderRadius: 4,
              fontFamily: "var(--font-mono)",
              color: "var(--proof-blue-bright)",
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
          className="proof-button-primary proof-button-sm glow-border-cyan"
          aria-label="Download updated test configuration file"
          style={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", fontSize: 11 }}
        >
          <Download size={14} style={{ marginRight: 4 }}/> Download Config
        </button>
        <button
          onClick={() => {
            setExpanded(!expanded);
          }}
          style={{
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6,
            background: "rgba(255,255,255,0.05)",
            cursor: "pointer",
            color: "var(--proof-text)",
            padding: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Show instructions"
          aria-label="Show instructions"
        >
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={14} />
          </motion.div>
        </button>
        <button
          onClick={onDismiss}
          aria-label="Close"
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--proof-text-secondary)",
            padding: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Expanded instructions */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{
              overflow: "hidden",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 280px" }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--proof-text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <TerminalSquare size={14} /> Where to commit
                  </div>
                  <div
                    style={{
                      background: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: 6,
                      padding: "12px 16px",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
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
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--proof-text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <GitCompare size={14} /> How GHA reads it
                  </div>
                  <div
                    style={{
                      background: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: 6,
                      padding: "12px 16px",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
