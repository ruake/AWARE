import React from "react";
import { Bug, FolderTree, Code, ExternalLink, X } from "lucide-react";
import type { TestCase, TestSuite } from "@/lib/types";
import { PRI_COLORS } from "@/lib/testColors";
import { repo } from "@/lib/nav";

interface TestDetailPanelProps {
  test: TestCase;
  parentSuite: TestSuite | null;
  onClose: () => void;
}

export function TestDetailPanel({ test, parentSuite, onClose }: TestDetailPanelProps) {
  const getGitHubUrl = (tc: TestCase) => tc.githubUrl || `${repo}/blob/main/${tc.scriptPath}`;
  const cleanScriptPath = (tc: TestCase) => {
    if (!tc.scriptPath) return tc.id;
    return tc.scriptPath.split("/").slice(-2).join("/");
  };

  return (
    <div
      style={{
        width: 380,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "var(--proof-surface)",
        borderLeft: "1px solid var(--proof-border)",
        borderTop: "1px solid var(--proof-border)",
      }}
    >
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid var(--proof-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Bug size={14} style={{ color: "var(--proof-blue)", flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {test.name}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--proof-text-secondary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {test.id}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            color: "var(--proof-text-secondary)",
            padding: 2,
            flexShrink: 0,
          }}
        >
          <X size={16} />
        </button>
      </div>
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div className="proof-card" style={{ padding: "8px 10px" }}>
            <div
              style={{
                fontSize: 9,
                color: "var(--proof-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                marginBottom: 1,
              }}
            >
              Status
            </div>
            <span
              className={`proof-badge ${test.status === "active" ? "proof-badge-pass" : "proof-badge-fail"}`}
              style={{ fontSize: 10 }}
            >
              {test.status}
            </span>
          </div>
          <div className="proof-card" style={{ padding: "8px 10px" }}>
            <div
              style={{
                fontSize: 9,
                color: "var(--proof-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                marginBottom: 1,
              }}
            >
              Priority
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: PRI_COLORS[test.priority] || "var(--proof-text-secondary)",
              }}
            >
              {test.priority}
            </span>
          </div>
          <div className="proof-card" style={{ padding: "8px 10px" }}>
            <div
              style={{
                fontSize: 9,
                color: "var(--proof-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                marginBottom: 1,
              }}
            >
              Category
            </div>
            <span
              style={{
                fontSize: 11,
                color: "var(--proof-text-secondary)",
                textTransform: "capitalize",
              }}
            >
              {test.category}
            </span>
          </div>
          <div className="proof-card" style={{ padding: "8px 10px" }}>
            <div
              style={{
                fontSize: 9,
                color: "var(--proof-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                marginBottom: 1,
              }}
            >
              Type
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>
              {test.testType}
            </span>
          </div>
        </div>
        {parentSuite && (
          <div
            style={{
              fontSize: 11,
              color: "var(--proof-text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <FolderTree size={11} /> Suite: {parentSuite.name}
          </div>
        )}
        <div className="proof-card" style={{ padding: 10 }}>
          <h4
            style={{
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--proof-text-secondary)",
              fontWeight: 600,
              margin: "0 0 4px 0",
            }}
          >
            Description
          </h4>
          <p style={{ fontSize: 12, color: "var(--proof-text)", lineHeight: 1.5, margin: 0 }}>
            {test.description || "No description"}
          </p>
        </div>
        <div className="proof-card" style={{ padding: 10 }}>
          <h4
            style={{
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--proof-text-secondary)",
              fontWeight: 600,
              margin: "0 0 4px 0",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Code size={10} /> Script
          </h4>
          <a
            href={getGitHubUrl(test)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "var(--proof-blue)",
              textDecoration: "underline",
              textUnderlineOffset: 2,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            {cleanScriptPath(test)} <ExternalLink size={10} />
          </a>
        </div>
        {test.predicates.length > 0 && (
          <div className="proof-card" style={{ padding: 10 }}>
            <h4
              style={{
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "var(--proof-text-secondary)",
                fontWeight: 600,
                margin: "0 0 4px 0",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Code size={10} /> Predicates ({test.predicates.length})
            </h4>
            <div
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                color: "var(--proof-text)",
                lineHeight: 1.7,
              }}
            >
              {test.predicates.map((p, i) => (
                <div key={i}>
                  <span style={{ color: "var(--proof-blue)" }}>{p.field}</span> {p.operator}{" "}
                  <span style={{ color: "var(--proof-green)" }}>{p.expected}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="proof-card" style={{ padding: 10 }}>
          <h4
            style={{
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--proof-text-secondary)",
              fontWeight: 600,
              margin: "0 0 4px 0",
            }}
          >
            Assertions
          </h4>
          {test.assertions.length > 0 ? (
            <div style={{ fontSize: 11, lineHeight: 1.8 }}>
              {test.assertions.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 6 }}>
                  <span
                    style={{
                      color:
                        a.operator === "equals"
                          ? "var(--proof-green)"
                          : "var(--proof-text-secondary)",
                    }}
                  >
                    {a.operator}
                  </span>
                  <span style={{ color: "var(--proof-text-secondary)" }}>{a.field}</span>
                  <span>{a.expected}</span>
                </div>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
              No assertions defined
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
