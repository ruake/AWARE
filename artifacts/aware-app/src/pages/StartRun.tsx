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
    <div style={{ maxWidth: 600, margin: "60px auto", padding: "0 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div
          style={{
            width: 52,
            height: 52,
            background: "var(--proof-blue-bg)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <Play size={26} style={{ color: "var(--proof-blue)" }} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Start a New Test Run</h1>
        <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", lineHeight: 1.6 }}>
          Trigger a new regression test run through GitHub Actions. Results appear in the Runs table
          once complete.
        </p>
      </div>

      <div
        className="proof-card"
        style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20, marginBottom: 32 }}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label 
              style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--proof-text-secondary)", marginBottom: 6 }}
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
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: error ? "1px solid var(--proof-red)" : "1px solid var(--proof-border)",
                background: "var(--proof-surface-2)",
                color: "var(--proof-text)",
                fontSize: 13,
              }}
              aria-label="Select test suite to run"
            >
              <option value="">Select a suite...</option>
              <option value="smoke">Smoke Tests</option>
              <option value="full-regression">Full Regression</option>
              <option value="api-only">API Security</option>
              <option value="performance">Performance Baseline</option>
            </select>
            {error && <div style={{ color: "var(--proof-red)", fontSize: 11, marginTop: 4 }}>{error}</div>}
          </div>

          <div>
            <label 
              style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--proof-text-secondary)", marginBottom: 6 }}
              htmlFor="env-select"
            >
              Target Environment
            </label>
            <select
              id="env-select"
              value={env}
              onChange={(e) => setEnv(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid var(--proof-border)",
                background: "var(--proof-surface-2)",
                color: "var(--proof-text)",
                fontSize: 13,
              }}
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
              padding: "10px", 
              fontSize: 14,
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
              gap: 12,
              padding: 12,
              borderRadius: 6,
              border: "1px solid var(--proof-border)",
              background: "var(--proof-subtle-bg)",
            }}
          >
            <Github size={20} style={{ color: "var(--proof-text-secondary)" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                GitHub Actions Dispatch
              </div>
              <div style={{ fontSize: 12, color: "var(--proof-text-secondary)" }}>
                Trigger manually from the repository
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={copyWorkflowUrl}
                className="proof-button proof-button-sm"
                title="Copy Workflow URL"
              >
                {copiedUrl ? <Check size={12} /> : <Copy size={12} />}
              </button>
              <a
                href="https://github.com/ruake/AWARE/actions"
                target="_blank"
                rel="noopener noreferrer"
                className="proof-button proof-button-sm"
                style={{ textDecoration: "none" }}
              >
                Open <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Runs Section */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Clock size={16} style={{ color: "var(--proof-text-secondary)" }} />
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Recent Runs</h3>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {recentRunsByEnv.map(run => (
            <div 
              key={run.id}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "var(--proof-surface)",
                border: "1px solid var(--proof-border)",
                borderRadius: 8,
                fontSize: 12
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: "50%", 
                  background: run.passPct >= 95 ? "var(--proof-green)" : run.passPct >= 80 ? "var(--proof-yellow)" : "var(--proof-red)"
                }} />
                <span style={{ fontWeight: 600 }}>{run.label}</span>
                <span style={{ color: "var(--proof-text-muted)", fontFamily: "var(--font-mono)", fontSize: 11 }}>{run.id}</span>
              </div>
              <div style={{ color: "var(--proof-text-secondary)" }}>
                {run.passPct}% • {new Date(run.started).toLocaleDateString()}
              </div>
            </div>
          ))}
          {recentRuns.length === 0 && (
            <div style={{ textAlign: "center", padding: 20, color: "var(--proof-text-muted)", fontSize: 12, border: "1px dashed var(--proof-border)", borderRadius: 8 }}>
              No recent runs found.
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
            fontSize: 12, 
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 4
          }}
        >
          <GitCompare size={14} /> Compare existing runs instead
        </button>
      </div>
    </div>
  );
}
