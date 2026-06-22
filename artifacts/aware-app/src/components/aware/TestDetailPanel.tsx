import React from "react";
import { Bug, FolderTree, Code, ExternalLink, X, Info, Shield, Zap, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { TestCase, TestSuite } from "@/lib/types";
import { PRI_COLORS } from "@/lib/testColors";
import { repo } from "@/lib/nav";

interface TestDetailPanelProps {
  test: TestCase | null;
  parentSuite: TestSuite | null;
  onClose: () => void;
}

export function TestDetailPanel({ test, parentSuite, onClose }: TestDetailPanelProps) {
  const getGitHubUrl = (tc: TestCase) => tc.githubUrl || `${repo}/blob/main/${tc.scriptPath}`;
  
  const cleanScriptPath = (tc: TestCase) => {
    if (!tc.scriptPath) return tc.id;
    return tc.scriptPath.split("/").slice(-2).join("/");
  };

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("security")) return <Shield size={14} />;
    if (cat.includes("perf")) return <Zap size={14} />;
    if (cat.includes("api")) return <Terminal size={14} />;
    return <Bug size={14} />;
  };

  return (
    <AnimatePresence>
      {test && (
        <motion.div
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          exit={{ x: 400 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          style={{
            width: 400,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "var(--proof-surface)",
            borderLeft: "1px solid var(--proof-border)",
            zIndex: 10,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid var(--proof-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--proof-surface-2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "rgba(91, 138, 245, 0.1)",
                  color: "var(--proof-blue)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {getCategoryIcon(test.category)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--proof-text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {test.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--proof-text-secondary)",
                    fontFamily: "var(--font-mono)",
                    opacity: 0.7,
                  }}
                >
                  {test.id}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="proof-button"
              style={{ padding: 6, borderRadius: "50%", minWidth: "auto" }}
            >
              <X size={18} />
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflow: "auto",
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {/* Metadata Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="proof-card" style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                  Status
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: test.status === "active" ? "var(--proof-green)" : "var(--proof-yellow)",
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>
                    {test.status}
                  </span>
                </div>
              </div>
              <div className="proof-card" style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                  Priority
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: PRI_COLORS[test.priority] || "var(--proof-text)" }}>
                  {test.priority}
                </div>
              </div>
              <div className="proof-card" style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                  Category
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--proof-text)", textTransform: "capitalize" }}>
                  {test.category}
                </div>
              </div>
              <div className="proof-card" style={{ padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                  Type
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>
                  {test.testType}
                </div>
              </div>
            </div>

            {/* Suite Breadcrumb */}
            {parentSuite && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "var(--proof-surface-2)",
                  border: "1px solid var(--proof-border)",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--proof-text-secondary)",
                }}
              >
                <FolderTree size={14} style={{ color: "var(--proof-blue)" }} />
                <span>Suite:</span>
                <span style={{ fontWeight: 600, color: "var(--proof-text)" }}>{parentSuite.name}</span>
              </div>
            )}

            {/* Description */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <Info size={12} /> Description
              </div>
              <div
                className="proof-card"
                style={{
                  padding: 16,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "var(--proof-text)",
                  background: "var(--proof-surface-2)",
                }}
              >
                {test.description || "No description provided."}
              </div>
            </div>

            {/* Source Script */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 600, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <Code size={12} /> Source Script
              </div>
              <a
                href={getGitHubUrl(test)}
                target="_blank"
                rel="noopener noreferrer"
                className="proof-card"
                style={{
                  padding: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                    color: "var(--proof-blue)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {cleanScriptPath(test)}
                </span>
                <ExternalLink size={14} style={{ color: "var(--proof-text-secondary)" }} />
              </a>
            </div>

            {/* Assertions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Assertions ({test.assertions.length})
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {test.assertions.length > 0 ? (
                  test.assertions.map((a, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 6,
                        background: "var(--proof-surface-2)",
                        border: "1px solid var(--proof-border)",
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "var(--proof-blue)",
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <span style={{ color: "var(--proof-text-secondary)" }}>{a.field}</span>
                        <span style={{ margin: "0 6px", opacity: 0.5 }}>{a.operator}</span>
                        <span style={{ fontWeight: 600 }}>{a.expected}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: 12, color: "var(--proof-text-secondary)", fontStyle: "italic", padding: "10px 0" }}>
                    No assertions defined
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
