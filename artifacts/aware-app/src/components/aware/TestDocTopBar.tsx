import React from "react";
import { useLocation } from "wouter";
import { DIFF_ROWS } from "@/lib/data";
import { ArrowLeft, Pin, Github, ExternalLink, Search } from "lucide-react";
import { RepoStatusBadge } from "./RepoStatusBadge";
import { getGitHubUrl } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import type { TestCase, DiffRow } from "@/lib/types";

export function TestDocTopBar({ testId, testName, testStatus, testCategory, testSuite, testCase }: {
  testId: string; testName: string; testStatus: DiffRow["candStatus"]; testCategory: string; testSuite: string; testCase?: TestCase;
}) {
  const [, navigate] = useLocation();
  return (
    <div className="gcp-card" style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, position: "sticky", top: 0, zIndex: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => window.history.back()} style={{ color: "var(--gcp-text-secondary)", background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: "50%", display: "flex", alignItems: "center", gap: 4 }}>
          <ArrowLeft size={18} />
          <span style={{ fontSize: 13 }}>Back</span>
        </button>
        <div style={{ width: 1, height: 24, background: "var(--gcp-grey)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
          <Search size={14} style={{ color: "var(--gcp-text-secondary)" }} />
          <select
            className="gcp-input"
            style={{ fontSize: 13, fontFamily: "var(--font-mono)", maxWidth: 300 }}
            value={testId}
            onChange={e => navigate(`/testdoc?testId=${e.target.value}`)}
          >
            <option value="">Jump to test...</option>
            {DIFF_ROWS.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div style={{ width: 1, height: 24, background: "var(--gcp-grey)" }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "-0.5px" }}>{testName}</h1>
        <StatusBadge status={testStatus} />
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ padding: "4px 8px", background: "var(--gcp-grey-bg)", fontSize: 12, fontWeight: 500, borderRadius: 4, color: "var(--gcp-text-secondary)", border: "1px solid var(--gcp-grey)" }}>{testCategory}</span>
          <span style={{ padding: "4px 8px", background: "var(--gcp-grey-bg)", fontSize: 12, fontWeight: 500, borderRadius: 4, color: "var(--gcp-text-secondary)", border: "1px solid var(--gcp-grey)" }}>{testSuite}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button style={{ padding: 8, border: "none", background: "none", cursor: "pointer", color: "var(--gcp-text-secondary)", borderRadius: "50%" }} title="Pin Test">
          <Pin size={18} />
        </button>
        <RepoStatusBadge status={testCase?.repoStatus} />
        {testCase?.repoStatus === "synced" && testCase?.scriptPath ? (
          <a href={getGitHubUrl(testCase)} target="_blank" rel="noreferrer" className="gcp-button" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <Github size={16} />
            View in GitHub
            <ExternalLink size={14} />
          </a>
        ) : (
          <span className="gcp-button" style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.5, cursor: "not-allowed" }}>
            <Github size={16} />
            Not in Repo
          </span>
        )}
      </div>
    </div>
  );
}
