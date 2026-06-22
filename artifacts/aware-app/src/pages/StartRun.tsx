import React, { useState } from "react";
import { Play, Github, GitCompare, ExternalLink, Loader2, Copy, Check, Clock } from "lucide-react";
import { navTo, getRuns } from "@/lib/data";

export default function StartRun() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suite, setSuite] = useState("");
  const [env, setEnv] = useState("qa-staging");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const runs = getRuns();
  const recentRuns = [...runs].sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime()).slice(0, 3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suite) {
      setError("Please select a test suite");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      navTo("/runs");
    }, 1500);
  };

  const copyWorkflowUrl = () => {
    const url = "https://github.com/ruake/AWARE/actions/workflows/regression.yml";
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const recentRunsByEnv = recentRuns.filter(r => !env || r.label.toLowerCase().includes(env.split('-')[0]));

  return (
    <div 
      style={{ 
        maxWidth: 600, 
        margin: "60px auto", 
        padding: "0 20px",
        animation: "page-enter 0.5s ease-out both"
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div
          style={{
            width: 64,
            height: 64,
            background: "var(--proof-blue-bg)",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: "var(--proof-shadow-sm)",
          }}
        >
          <Play size={32} style={{ color: "var(--proof-blue)", marginLeft: 4 }} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, letterSpacing: "-0.02em" }}>Start New Test Run</h1>
        <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", lineHeight: 1.6, maxWidth: 460, margin: "0 auto" }}>
          Trigger a new regression test run through GitHub Actions. Results appear in the Runs table
          once complete.
        </p>
      </div>

      <div
        className="proof-card"
        style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24, marginBottom: 40 }}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label 
              style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--proof-text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}
              htmlFor="suite-select"
            >
              Test Suite
            </label>
            <select
              id="suite-select"
              value={suite}
              onChange={(e) => {
                setSuite(e.target.value);
                if (e.target.value) setError(null);
              }}
              className="proof-select"
              style={{
                width: "100%",
                border: error ? "1px solid var(--proof-red)" : undefined,
              }}
              aria-label="Select test suite to run"
            >
              <option value="">Select a suite...</option>
              <option value="smoke">Smoke Tests</option>
              <option value="full-regression">Full Regression</option>
              <option value="api-only">API Security</option>
              <option value="performance">Performance Baseline</option>
            </select>
            {error && <div style={{ color: "var(--proof-red)", fontSize: 11, marginTop: 6, fontWeight: 500 }}>{error}</div>}
          </div>

          <div>
            <label 
              style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--proof-text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}
              htmlFor="env-select"
            >
              Target Environment
            </label>
            <select
              id="env-select"
              value={env}
              onChange={(e) => setEnv(e.target.value)}
              className="proof-select"
              style={{ width: "100%" }}
              aria-label="Select target environment"
            >
              <option value="qa-staging">QA / Staging</option>
              <option value="uat-staging">UAT / Staging</option>
              <option value="prod-staging">PROD / Staging</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="proof-button-primary"
            style={{ 
              width: "100%", 
              justifyContent: "center", 
              padding: "12px", 
              fontSize: 15,
              marginTop: 8,
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
            {isSubmitting ? "Triggering..." : "Start Workflow"}
          </button>
        </form>

        <div style={{ height: 1, background: "var(--proof-border)", margin: "4px 0" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 16,
              borderRadius: 8,
              border: "1px solid var(--proof-border)",
              background: "var(--proof-surface-2)",
            }}
          >
            <div style={{ 
              width: 36, 
              height: 36, 
              borderRadius: 8, 
              background: "var(--proof-surface-3)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center" 
            }}>
              <Github size={20} style={{ color: "var(--proof-text)" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                GitHub Actions Dispatch
              </div>
              <div style={{ fontSize: 12, color: "var(--proof-text-secondary)" }}>
                Trigger manually from the repository
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={copyWorkflowUrl}
                className="proof-button proof-button-sm proof-button-secondary"
                title="Copy Workflow URL"
                style={{ width: 32, height: 32, padding: 0, justifyContent: "center" }}
              >
                {copiedUrl ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <a
                href="https://github.com/ruake/AWARE/actions"
                target="_blank"
                rel="noopener noreferrer"
                className="proof-button proof-button-sm proof-button-secondary"
                style={{ textDecoration: "none", width: 32, height: 32, padding: 0, justifyContent: "center" }}
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Runs Section */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingLeft: 4 }}>
          <Clock size={16} style={{ color: "var(--proof-text-muted)" }} />
          <h3 style={{ fontSize: 12, fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--proof-text-secondary)" }}>Recent Environment Runs</h3>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recentRunsByEnv.map(run => (
            <div 
              key={run.id}
              className="proof-card"
              style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                padding: "12px 16px",
                fontSize: 13,
                border: "1px solid var(--proof-border-light)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className={`proof-status-dot proof-status-dot-${run.passPct >= 95 ? 'pass' : run.passPct >= 80 ? 'degraded' : 'fail'}`} />
                <span style={{ fontWeight: 600 }}>{run.label}</span>
                <span style={{ color: "var(--proof-text-muted)", fontFamily: "var(--font-mono)", fontSize: 11 }}>{run.id}</span>
              </div>
              <div style={{ color: "var(--proof-text-secondary)", fontSize: 12, fontWeight: 500 }}>
                <span style={{ color: run.passPct >= 95 ? "var(--proof-green)" : run.passPct >= 80 ? "var(--proof-yellow)" : "var(--proof-red)" }}>{run.passPct}%</span>
                <span style={{ margin: "0 8px", color: "var(--proof-border-strong)" }}>|</span>
                {new Date(run.started).toLocaleDateString()}
              </div>
            </div>
          ))}
          {recentRunsByEnv.length === 0 && (
            <div className="proof-empty-state" style={{ padding: "24px", fontSize: 13 }}>
              No recent runs found for this environment.
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <button 
          onClick={() => navTo("/compare")} 
          style={{ 
            background: "none", 
            border: "none", 
            color: "var(--proof-blue-bright)", 
            fontSize: 13, 
            fontWeight: 500,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 8,
            transition: "all 0.2s"
          }}
          className="proof-focus-ring"
        >
          <GitCompare size={16} /> Compare existing runs instead
        </button>
      </div>
    </div>
  );
}
