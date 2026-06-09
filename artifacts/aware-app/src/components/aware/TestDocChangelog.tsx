import React from "react";
import { repo } from "@/lib/nav";
import { getTestChangelog } from "@/lib/data";
import { GitCommit, ExternalLink, History } from "lucide-react";
import type { TestCase } from "@/lib/types";
import { getGitHubUrl, cleanScriptPath } from "@/lib/utils";

function colorFromName(name: string) {
  const colors = ["#9c27b0", "#1976d2", "#e65100", "#2e7d32", "#c62828", "#558b2f", "#6a1b9a", "#283593"];
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
    : d.toLocaleDateString([], { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
  return <span style={{ fontSize: 12, color: "var(--gcp-text-secondary)" }}>{label}</span>;
}

export function TestDocChangelog({ testCase }: { testCase?: TestCase }) {
  const changelog = testCase ? getTestChangelog(testCase.id) : [];

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", paddingRight: 8, paddingBottom: 32, height: "calc(100vh - 150px)" }}>
      <div className="gcp-card" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ padding: 16, borderBottom: "1px solid var(--gcp-grey)", background: "var(--gcp-surface-hover)", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
          <h2 style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
            <GitCommit size={18} style={{ color: "var(--gcp-text-secondary)" }} />
            Change History
          </h2>
          <span style={{ fontSize: 11, background: "var(--gcp-grey)", color: "var(--gcp-text)", padding: "2px 8px", borderRadius: 12, fontWeight: 500 }}>
            v{testCase?.version ?? "?"}
          </span>
        </div>

        <div style={{ padding: 20, flex: 1 }}>
          {changelog.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 40, color: "var(--gcp-text-secondary)" }}>
              <History size={24} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: 13 }}>No change history</p>
            </div>
          ) : (
            <div style={{ position: "relative", borderLeft: "2px solid var(--gcp-grey)", marginLeft: 12, paddingLeft: 24, paddingBottom: 16, display: "flex", flexDirection: "column", gap: 32 }}>
              {changelog.map((entry, ei) => {
                const initials = entry.author.split(/[@\s_]/).filter(Boolean).map(s => s[0].toUpperCase()).slice(0, 2).join("");
                return (
                  <div key={entry.version} style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: -31, top: 4, width: 16, height: 16, borderRadius: "50%", background: ei === 0 ? "var(--gcp-blue)" : "var(--gcp-grey)", border: "4px solid var(--gcp-surface)", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--gcp-text-secondary)", fontWeight: 600 }}>v{entry.version}</span>
                          <Timestamp ts={entry.timestamp} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: colorFromName(entry.author), color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{initials}</div>
                          <span style={{ fontSize: 12, fontWeight: 500 }}>@{entry.author}</span>
                        </div>
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--gcp-text)" }}>{entry.summary}</p>

                      {entry.changes.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {entry.changes.map((change, ci) => (
                            <span key={ci} style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500, background: "var(--gcp-grey-bg)", color: "var(--gcp-text-secondary)", border: "1px solid var(--gcp-grey)" }}>{change}</span>
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
        <div className="gcp-card" style={{ padding: 12, background: "var(--gcp-surface-hover)", border: "1px dashed var(--gcp-grey)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", fontSize: 12 }}>
            <div style={{ color: "var(--gcp-text-secondary)" }}>File:</div>
            <a href={getGitHubUrl(testCase)} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: 11, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--gcp-blue)", textDecoration: "underline", textUnderlineOffset: 2 }} title={cleanScriptPath(testCase)}>{cleanScriptPath(testCase)}</a>

            <div style={{ color: "var(--gcp-text-secondary)" }}>Type:</div>
            <div style={{ textAlign: "right", textTransform: "capitalize" }}>{testCase.testType}</div>

            <div style={{ color: "var(--gcp-text-secondary)" }}>Last modified:</div>
            <div style={{ textAlign: "right" }}>{new Date(testCase.updatedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} by <span style={{ fontWeight: 500 }}>@{testCase.owner}</span></div>

            <div style={{ color: "var(--gcp-text-secondary)" }}>Version:</div>
            <div style={{ textAlign: "right" }}>v{testCase.version}</div>

            <div style={{ color: "var(--gcp-text-secondary)" }}>Status:</div>
            <div style={{ textAlign: "right", textTransform: "capitalize" }}>{testCase.status}</div>
          </div>
        </div>
      )}
    </div>
  );
}
