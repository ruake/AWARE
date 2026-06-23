import React, { useState } from "react";
import { Play, Loader2, Clock, Rocket } from "lucide-react";
import { navTo, getRuns, getTestSuites, getEnvConfigs } from "@/lib/data";

export default function StartRun() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suiteId, setSuiteId] = useState("");
  const [envId, setEnvId] = useState("qa-staging");
  const runs = getRuns();
  const suites = getTestSuites();
  const envConfigs = getEnvConfigs();
  const recentRuns = [...runs].sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime()).slice(0, 3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suiteId) {
      setError("Please select a test suite");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      navTo("/runs");
    }, 1500);
  };

  const recentRunsByEnv = recentRuns.filter(r => !envId || r.label.toLowerCase().includes(envId.split('-')[0]));

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
            width: 80,
            height: 80,
            background: "color-mix(in srgb, var(--proof-blue) 15%, transparent)",
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "var(--proof-glow-cyan)",
            border: "1px solid rgba(0,196,255,0.3)"
          }}
        >
          <Rocket size={40} style={{ color: "var(--proof-blue)" }} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12, letterSpacing: "-0.02em", color: "var(--proof-text)" }}>LAUNCH REGRESSION</h1>
        <p style={{ fontSize: 14, color: "var(--proof-text-secondary)", lineHeight: 1.6, maxWidth: 460, margin: "0 auto" }}>
          Trigger a new regression test run through GitHub Actions. Results will be populated in the Runs table upon completion.
        </p>
      </div>

      <div
        className="glass-panel"
        style={{ padding: 40, display: "flex", flexDirection: "column", gap: 24, marginBottom: 40, borderRadius: "var(--proof-radius-xl)" }}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <label 
              style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--proof-text)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}
              htmlFor="suite-select"
            >
              Test Suite
            </label>
            <select
              id="suite-select"
              value={suiteId}
              onChange={(e) => {
                setSuiteId(e.target.value);
                if (e.target.value) setError(null);
              }}
              className="proof-select metric-number"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: error ? "1px solid var(--proof-red)" : "1px solid rgba(255,255,255,0.1)",
                background: "rgba(0,0,0,0.3)"
              }}
              aria-label="Select test suite to run"
            >
              <option value="">Select a suite...</option>
              {suites.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {error && <div style={{ color: "var(--proof-red)", fontSize: 12, marginTop: 8, fontWeight: 500 }}>{error}</div>}
          </div>

          <div>
            <label 
              style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--proof-text)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}
              htmlFor="env-select"
            >
              Target Environment
            </label>
            <select
              id="env-select"
              value={envId}
              onChange={(e) => setEnvId(e.target.value)}
              className="proof-select metric-number"
              style={{ width: "100%", padding: "12px 16px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)" }}
              aria-label="Select target environment"
            >
              {envConfigs.map(e => (
                <option key={e.id} value={e.id}>{e.label}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="proof-btn proof-btn-primary"
            style={{ 
              width: "100%", 
              justifyContent: "center", 
              padding: "16px", 
              fontSize: 16,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginTop: 16,
              boxShadow: "var(--proof-glow-cyan)",
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} /> : <Play size={20} />}
            {isSubmitting ? "INITIATING..." : "LAUNCH RUN"}
          </button>
        </form>
      </div>

      <div style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingLeft: 4 }}>
          <Clock size={16} style={{ color: "var(--proof-text-muted)" }} />
          <h3 className="metric-number" style={{ fontSize: 12, margin: 0, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--proof-text-secondary)" }}>RECENT LAUNCHES</h3>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recentRunsByEnv.map(run => (
            <div 
              key={run.id}
              className="glass-panel"
              style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                padding: "16px 20px",
                borderRadius: "var(--proof-radius-lg)",
                borderLeft: `4px solid ${run.passPct >= 95 ? "var(--proof-green)" : run.passPct >= 80 ? "var(--proof-yellow)" : "var(--proof-red)"}`
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span className="metric-number" style={{ fontWeight: 600, color: "var(--proof-text)" }}>{run.label}</span>
                <span className="metric-number" style={{ color: "var(--proof-text-muted)", fontSize: 12 }}>{run.id}</span>
              </div>
              <div className="metric-number" style={{ color: "var(--proof-text-secondary)", fontSize: 14 }}>
                <span style={{ color: run.passPct >= 95 ? "var(--proof-green)" : run.passPct >= 80 ? "var(--proof-yellow)" : "var(--proof-red)" }}>{run.passPct}%</span>
              </div>
            </div>
          ))}
          {recentRunsByEnv.length === 0 && (
            <div className="glass-panel" style={{ padding: "32px", fontSize: 14, textAlign: "center", color: "var(--proof-text-muted)" }}>
              No recent runs found for this environment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
