import React from "react";
import { repo } from "@/lib/nav";
import { getTestChangelog } from "@/lib/data";
import { GitCommit, ExternalLink, History } from "lucide-react";
import type { TestCase } from "@/lib/types";
import { getGitHubUrl, cleanScriptPath } from "@/lib/utils";

function colorFromName(name: string) {
  const colors = [
    "#9c27b0",
    "#1976d2",
    "#e65100",
    "#2e7d32",
    "#c62828",
    "#558b2f",
    "#6a1b9a",
    "#283593",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function Timestamp({ ts }: { ts: string }) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const label = isToday
    ? `Today ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : d.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
  return <span style={{ fontSize: 12, color: "var(--proof-text-secondary)" }}>{label}</span>;
}

export function TestDocChangelog({ testCase }: { testCase?: TestCase }) {
  const changelog = testCase ? getTestChangelog(testCase.id) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="proof-card" style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            padding: "10px 12px",
            borderBottom: "1px solid var(--proof-grey)",
            background: "var(--proof-surface-hover)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2
            style={{ fontWeight: 500, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
          >
            <GitCommit size={14} style={{ color: "var(--proof-text-secondary)" }} />
            Change History
          </h2>
          <span
            style={{
              fontSize: 10,
              background: "var(--proof-grey)",
              color: "var(--proof-text)",
              padding: "1px 6px",
              borderRadius: 10,
              fontWeight: 500,
            }}
          >
            v{testCase?.version ?? "?"}
          </span>
        </div>

        <div style={{ padding: 12 }}>
          {changelog.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: 24,
                color: "var(--proof-text-secondary)",
              }}
            >
              <History size={20} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: 12 }}>No change history</p>
            </div>
          ) : (
            <div
              style={{
                position: "relative",
                borderLeft: "2px solid var(--proof-grey)",
                marginLeft: 8,
                paddingLeft: 18,
                paddingBottom: 4,
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              {changelog.map((entry, ei) => {
                const initials = entry.author
                  .split(/[@\s_]/)
                  .filter(Boolean)
                  .map((s) => s[0].toUpperCase())
                  .slice(0, 2)
                  .join("");
                return (
                  <div key={entry.version} style={{ position: "relative" }}>
                    <div
                      style={{
                        position: "absolute",
                        left: -25,
                        top: 3,
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: ei === 0 ? "var(--proof-blue)" : "var(--proof-grey)",
                        border: "3px solid var(--proof-surface)",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                      }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 11,
                              color: "var(--proof-text-secondary)",
                              fontWeight: 600,
                            }}
                          >
                            v{entry.version}
                          </span>
                          <Timestamp ts={entry.timestamp} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <div
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              background: colorFromName(entry.author),
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 8,
                              fontWeight: 700,
                            }}
                          >
                            {initials}
                          </div>
                        </div>
                      </div>
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "var(--proof-text)",
                          lineHeight: 1.4,
                        }}
                      >
                        {entry.summary}
                      </p>

                      {entry.changes.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                          {entry.changes.map((change, ci) => (
                            <span
                              key={ci}
                              style={{
                                display: "inline-block",
                                padding: "1px 6px",
                                borderRadius: 3,
                                fontSize: 10,
                                fontWeight: 500,
                                background: "var(--proof-grey-bg)",
                                color: "var(--proof-text-secondary)",
                                border: "1px solid var(--proof-grey)",
                              }}
                            >
                              {change}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {testCase && (
        <div
          className="proof-card"
          style={{
            padding: "10px 12px",
            background: "var(--proof-surface-hover)",
            border: "1px dashed var(--proof-grey)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "6px 10px",
              fontSize: 11,
            }}
          >
            <div style={{ color: "var(--proof-text-secondary)" }}>File:</div>
            <a
              href={getGitHubUrl(testCase)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                textAlign: "right",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: "var(--proof-blue)",
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
              title={cleanScriptPath(testCase)}
            >
              {cleanScriptPath(testCase)}
            </a>

            <div style={{ color: "var(--proof-text-secondary)" }}>Type:</div>
            <div style={{ textAlign: "right", textTransform: "capitalize" }}>
              {testCase.testType}
            </div>

            <div style={{ color: "var(--proof-text-secondary)" }}>Last modified:</div>
            <div style={{ textAlign: "right" }}>
              {new Date(testCase.updatedAt).toLocaleDateString([], {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              by <span style={{ fontWeight: 500 }}>@{testCase.owner}</span>
            </div>

            <div style={{ color: "var(--proof-text-secondary)" }}>Version:</div>
            <div style={{ textAlign: "right" }}>v{testCase.version}</div>

            <div style={{ color: "var(--proof-text-secondary)" }}>Status:</div>
            <div style={{ textAlign: "right", textTransform: "capitalize" }}>{testCase.status}</div>
          </div>
        </div>
      )}
    </div>
  );
}
