import React from "react";
import { getTestChangelog } from "@/lib/data";
import { getGitHubUrl, cleanScriptPath } from "@/lib/utils";
import type { TestCase } from "@/lib/types";
import { TagBadge, TestCaseStatusBadge, priorityColor } from "@/components/aware/TestCard";
import { RepoStatusBadge } from "./RepoStatusBadge";
import { TestFlowDiagram } from "./TestFlowDiagram";
import { Beaker, Clock, BarChart3, FileText, Github, ExternalLink, Network } from "lucide-react";

export function TestManagerSidePanel({ tc, onClose, toast, navigate }: { tc: TestCase; onClose: () => void; toast: (m: string) => void; navigate: (h: string) => void }) {
  const [editingDoc, setEditingDoc] = React.useState(false);
  const [docText, setDocText] = React.useState(tc.documentation);
  const changelog = getTestChangelog(tc.id);

  const handleSaveDoc = () => {
    setEditingDoc(false);
  };

  const [showFlow, setShowFlow] = React.useState(false);

  return (
    <div style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden", borderLeft: "3px solid var(--proof-blue)", background: "var(--proof-surface)" }} className="gcp-card">
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--proof-grey)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--proof-blue-bg)", flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--proof-blue)", display: "flex", alignItems: "center", gap: 6 }}><Beaker size={13} /> {tc.id}</span>
        <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--proof-text-secondary)", fontSize: 18, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5, marginBottom: 6 }}>{tc.name}</div>
          <p style={{ fontSize: 12, color: "var(--proof-text-secondary)", lineHeight: 1.5 }}>{tc.description}</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <TestCaseStatusBadge s={tc.status} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: priorityColor(tc.priority) }}>{tc.priority}</span>
          <span style={{ fontSize: 11, background: "var(--proof-grey-bg)", padding: "2px 8px", borderRadius: 4, border: "1px solid var(--proof-grey)" }}>{tc.category}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--proof-text-secondary)" }}>v{tc.version}</span>
          {tc.automated && <span className="gcp-badge gcp-badge-pass" style={{ fontSize: 10 }}>Automated</span>}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{tc.tags.map(t => <TagBadge key={t} tagId={t} />)}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            ["Owner", tc.owner],
            ["Script", cleanScriptPath(tc)],
            ["Expected Status", String(tc.expectedStatus)],
            ["Predicates", `${tc.predicates.length} rules`],
            ["Updated", new Date(tc.updatedAt).toLocaleDateString()],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--proof-grey)", fontSize: 12 }}>
              <span style={{ color: "var(--proof-text-secondary)" }}>{k}</span>
              {k === "Script" && tc.scriptPath ? (
                <a href={getGitHubUrl(tc)} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--proof-blue)", textDecoration: "underline", textUnderlineOffset: 2 }}>{v}</a>
              ) : (
                <span style={{ fontFamily: k === "Script" || k === "Expected Status" ? "var(--font-mono)" : undefined, fontSize: 11 }}>{v}</span>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {Object.keys(tc.requestHeaders).length > 0 && <span className="gcp-badge gcp-badge-pass" style={{ fontSize: 10 }}>{Object.keys(tc.requestHeaders).length} headers</span>}
          {Object.keys(tc.cookies).length > 0 && <span className="gcp-badge gcp-badge-pass" style={{ fontSize: 10 }}>{Object.keys(tc.cookies).length} cookies</span>}
          {tc.captureResponseHeaders.length > 0 && <span className="gcp-badge gcp-badge-pass" style={{ fontSize: 10 }}>Capture {tc.captureResponseHeaders.length}</span>}
          {tc.filmstrip.enabled && <span className="gcp-badge gcp-badge-flaky" style={{ fontSize: 10 }}>Filmstrip {Math.round(tc.filmstrip.threshold * 100)}%</span>}
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Documentation</span>
            <button onClick={() => setEditingDoc(!editingDoc)} style={{ fontSize: 11, color: "var(--proof-blue)", background: "none", border: "none", cursor: "pointer" }}>{editingDoc ? "Preview" : "Edit"}</button>
          </div>
          {editingDoc ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <textarea className="gcp-input" style={{ width: "100%", minHeight: 120, fontFamily: "var(--font-mono)", fontSize: 12 }} value={docText} onChange={e => setDocText(e.target.value)} />
              <button onClick={handleSaveDoc} className="gcp-button gcp-button-primary gcp-button-sm" style={{ alignSelf: "flex-start" }}>Save</button>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "var(--proof-text-secondary)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{tc.documentation || "No documentation"}</div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={11} /> Changelog (v{tc.version})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {changelog.slice(0, 5).map(e => (
              <div key={e.version} style={{ display: "flex", gap: 8, fontSize: 12 }}>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--proof-blue)", flexShrink: 0 }}>v{e.version}</span>
                <div>
                  <p style={{ fontWeight: 600, margin: 0 }}>{e.summary}</p>
                  <p style={{ fontSize: 11, color: "var(--proof-text-secondary)", margin: 0 }}>{e.author} · {new Date(e.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Flow Visualization Toggle */}
        <div>
          <button
            onClick={() => setShowFlow(!showFlow)}
            style={{
              width: "100%",
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 0",
              fontSize: 12,
              fontWeight: 600,
              color: showFlow ? "var(--proof-blue)" : "var(--proof-text-secondary)",
            }}
          >
            <Network size={14} />
            Test Flow Diagram
            <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--proof-text-secondary)" }}>
              {showFlow ? "Hide" : "Show"}
            </span>
          </button>
          {showFlow && <div style={{ maxHeight: 500, overflowY: "auto" }}><TestFlowDiagram testCase={tc} /></div>}
        </div>

        {/* Repository Status */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Repository</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <RepoStatusBadge status={tc.repoStatus} />
            {tc.repoStatus === "synced" && tc.scriptPath && (
              <a href={getGitHubUrl(tc)} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "var(--proof-blue)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                <Github size={12} /> View <ExternalLink size={10} />
              </a>
            )}
          </div>
          {tc.lastSyncedAt && (
            <div style={{ fontSize: 10, color: "var(--proof-text-secondary)", marginTop: 4 }}>
              Last checked: {new Date(tc.lastSyncedAt).toLocaleString()}
            </div>
          )}
          {tc.repoStatus === "missing" && (
            <div style={{ fontSize: 10, color: "var(--proof-fail)", marginTop: 4, background: "var(--proof-fail-bg)", padding: "4px 8px", borderRadius: 4 }}>
              This test case is not checked into the repository and will not be executed by CI.
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => navigate(`/analytics?testId=${tc.id}`)} className="gcp-button gcp-button-sm" style={{ flex: 1 }}><BarChart3 size={13} /> Analytics</button>
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/tests/${tc.id}`); toast("Link copied"); }} className="gcp-button gcp-button-sm" style={{ flex: 1 }}><FileText size={13} /> Copy Link</button>
        </div>
      </div>
    </div>
  );
}
