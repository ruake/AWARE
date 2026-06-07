import React from "react";
import { DIFF_ROWS } from "@/lib/data";
import { navTo } from "@/lib/nav";
import { ArrowLeft, Pin, Github, ExternalLink, Search } from "lucide-react";

export function TestDocTopBar({ testId, testName, testStatus, testCategory, testSuite }: {
  testId: string; testName: string; testStatus: string; testCategory: string; testSuite: string;
}) {
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
            onChange={e => navTo(`TestDoc?testId=${e.target.value}`)}
          >
            <option value="">Jump to test...</option>
            {DIFF_ROWS.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div style={{ width: 1, height: 24, background: "var(--gcp-grey)" }} />
        <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "-0.5px" }}>{testName}</h1>
        <span className={`gcp-badge ${testStatus === "PASS" ? "gcp-badge-pass" : "gcp-badge-fail"}`} style={{ fontSize: 13, fontWeight: 700, boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>{testStatus}</span>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ padding: "4px 8px", background: "var(--gcp-grey-bg)", fontSize: 12, fontWeight: 500, borderRadius: 4, color: "var(--gcp-text-secondary)", border: "1px solid var(--gcp-grey)" }}>{testCategory}</span>
          <span style={{ padding: "4px 8px", background: "var(--gcp-grey-bg)", fontSize: 12, fontWeight: 500, borderRadius: 4, color: "var(--gcp-text-secondary)", border: "1px solid var(--gcp-grey)" }}>{testSuite}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button style={{ padding: 8, border: "none", background: "none", cursor: "pointer", color: "var(--gcp-text-secondary)", borderRadius: "50%" }} title="Pin Test">
          <Pin size={18} />
        </button>
        <button className="gcp-button" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Github size={16} />
          View in GitHub
          <ExternalLink size={14} />
        </button>
      </div>
    </div>
  );
}
