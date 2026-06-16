import React from "react";
import {
  Zap,
  BarChart3,
  GitCompare,
  Activity,
  Shield,
  Globe,
  Layers,
  TrendingUp,
  Server,
  Cpu,
  Cloud,
  Lock,
  Route,
  Github,
  ExternalLink,
  ArrowUpRight,
  CheckCircle2,
  Bot,
  Clock,
  Network,
} from "lucide-react";
import { RUNS, ENV_SUMMARY, computeRunFrequency } from "@/lib/data";
import { getAutoDiscoveredTests, getAutoDiscoverySummary } from "@/lib/data";
import { getTestSuites } from "@/lib/data";
import { getAllPromotionDecisions } from "@/lib/data";
import { PanelErrorBoundary } from "@/components/aware/PanelErrorBoundary";
import { getEnvConfigs } from "@/lib/envConfig";

function useCountUp(target: number): string {
  const [v, setV] = React.useState(0);
  React.useEffect(() => {
    let n = 0;
    const step = Math.max(1, Math.floor(target / 35));
    const t = setInterval(() => {
      n += step;
      if (n >= target) { n = target; clearInterval(t); }
      setV(n);
    }, 20);
    return () => clearInterval(t);
  }, [target]);
  return v.toLocaleString();
}

const FEATURES = [
  { icon: BarChart3, title: "Dashboard", desc: "Real-time pass rate trends with anomaly detection", color: "#3b82f6" },
  { icon: GitCompare, title: "Regression Compare", desc: "Baseline vs candidate diff with column filters", color: "#10b981" },
  { icon: Activity, title: "Run History", desc: "Filterable run table with detail panels", color: "#f59e0b" },
  { icon: Shield, title: "Promotion Gating", desc: "Gate deployments with ≥95% pass-rate thresholds", color: "#f97316" },
  { icon: Layers, title: "Test Suites", desc: "Hierarchical tree with YAML export", color: "#ef4444" },
  { icon: Globe, title: "Cross-Env Testing", desc: "3 tiers × 2 networks, property version shown", color: "#06b6d4" },
  { icon: Bot, title: "AI Copilot", desc: "Context-aware analysis with three LLM providers", color: "#8b5cf6" },
  { icon: TrendingUp, title: "Trends Analytics", desc: "Flakiness leaderboard, heatmaps, Z-score anomalies", color: "#84cc16" },
];

const STACK = [
  { label: "React 19", sub: "UI framework", color: "var(--proof-blue)" },
  { label: "TypeScript 5", sub: "Type safety", color: "var(--proof-purple)" },
  { label: "Vite 7", sub: "Build tool", color: "var(--proof-yellow)" },
  { label: "Recharts", sub: "Data viz", color: "var(--proof-green)" },
  { label: "GitHub Actions", sub: "CI/CD", color: "var(--proof-text-secondary)" },
  { label: "Playwright", sub: "E2E testing", color: "var(--proof-cyan)" },
  { label: "pytest", sub: "API testing", color: "var(--proof-orange)" },
  { label: "wouter", sub: "Routing", color: "var(--proof-red)" },
];

const ENV_ORDER = ["qa_staging", "qa_prod", "uat_staging", "uat_prod", "prod_staging", "prod_prod"];

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 8,
      padding: "20px 22px",
      background: "var(--proof-surface)",
      border: "1px solid var(--proof-border)",
      borderRadius: 14,
      transition: "border-color 0.15s, transform 0.15s",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border-accent)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border)"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>{label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center", color }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: "var(--proof-text)", fontFamily: "var(--font-mono)", letterSpacing: "-2px", lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

export default function About() {
  const suites = getTestSuites();
  const tests = getAutoDiscoveredTests();
  const summary = getAutoDiscoverySummary();
  const promos = getAllPromotionDecisions();
  const freq = computeRunFrequency();
  const promoteCount = promos.filter(p => p.decision === "promote").length;
  const promoPct = promos.length > 0 ? Math.round((promoteCount / promos.length) * 100) : 0;
  const cRuns = useCountUp(RUNS.length);
  const cTests = useCountUp(tests.length);
  const cSuites = useCountUp(suites.length);
  const overallRate = ENV_SUMMARY.length > 0
    ? Math.round(ENV_SUMMARY.reduce((s, e) => s + e.passRate, 0) / ENV_SUMMARY.length)
    : 0;
  const cRate = useCountUp(overallRate);
  const envs = getEnvConfigs();
  const cats = summary.byCategory ?? {};
  const runsPerDay = typeof freq === "object" ? `${freq.runsPerDay.toFixed(1)}/day` : String(freq);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "page-enter 0.22s ease-out both" }}>

      {/* ── Hero ── */}
      <div style={{
        padding: "32px 36px",
        background: "var(--proof-surface)",
        border: "1px solid var(--proof-border)",
        borderRadius: 16,
        position: "relative", overflow: "hidden",
      }}>
        {/* Mesh gradient accent */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.5,
          background: "radial-gradient(ellipse at top right, rgba(59,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at bottom left, rgba(139,92,246,0.06) 0%, transparent 60%)",
        }} />

        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Logo + name */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #06b6d4 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 20px rgba(59,130,246,0.4)",
            }}>
              <Activity size={24} style={{ color: "white" }} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 26, fontWeight: 900, color: "var(--proof-text)", letterSpacing: "-1px" }}>
                  A.W.A.R.E.
                </span>
                <span style={{ fontSize: 11, color: "var(--proof-text-muted)", fontFamily: "var(--font-mono)", background: "var(--proof-subtle-bg2)", border: "1px solid var(--proof-border)", padding: "2px 8px", borderRadius: 5 }}>
                  v1.0.0
                </span>
              </div>
              <div style={{ fontSize: 13, color: "var(--proof-text-secondary)", letterSpacing: "-0.1px", marginTop: 2 }}>
                Akamai Web Analytics Regression Engine
              </div>
            </div>
          </div>

          <p style={{ fontSize: 14, color: "var(--proof-text-secondary)", margin: 0, maxWidth: 680, lineHeight: 1.6, letterSpacing: "-0.1px" }}>
            CDN test observability dashboard. Monitors Playwright + pytest suites across{" "}
            <strong style={{ color: "var(--proof-text)" }}>QA → UAT → PROD</strong>, each with staging and
            production networks, and enforces a{" "}
            <strong style={{ color: "var(--proof-green)" }}>≥95% pass-rate promotion gate</strong>{" "}
            before each tier advances.
          </p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600,
                color: "var(--proof-text)", background: "var(--proof-subtle-bg2)", border: "1px solid var(--proof-border-strong)",
                borderRadius: 8, padding: "6px 14px", textDecoration: "none",
                transition: "border-color 0.13s, background 0.13s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border-accent)"; (e.currentTarget as HTMLElement).style.background = "var(--proof-blue-bg)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border-strong)"; (e.currentTarget as HTMLElement).style.background = "var(--proof-subtle-bg2)"; }}
            >
              <Github size={14} /> GitHub Repo <ExternalLink size={10} style={{ opacity: 0.6 }} />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 600,
                color: "var(--proof-blue-bright)", background: "var(--proof-blue-bg)", border: "1px solid var(--proof-border-accent)",
                borderRadius: 8, padding: "6px 14px", textDecoration: "none",
                transition: "border-color 0.13s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-blue)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--proof-border-accent)"; }}
            >
              CI Workflow <ArrowUpRight size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* ── Live Stats ── */}
      <PanelErrorBoundary label="Live stats">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <StatCard label="Total Runs" value={cRuns} color="var(--proof-blue)" icon={<Activity size={14} />} />
          <StatCard label="Tests" value={cTests} color="var(--proof-green)" icon={<CheckCircle2 size={14} />} />
          <StatCard label="Suites" value={cSuites} color="var(--proof-yellow)" icon={<Layers size={14} />} />
          <StatCard label="Pass Rate" value={`${cRate}%`} color="var(--proof-green)" icon={<TrendingUp size={14} />} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 12 }}>
          <StatCard label="Promotions" value={`${promoPct}%`} color="var(--proof-purple)" icon={<Shield size={14} />} />
          <StatCard label="Run Frequency" value={runsPerDay} color="var(--proof-text-secondary)" icon={<Clock size={14} />} />
          <StatCard label="Environments" value={envs.length} color="var(--proof-cyan)" icon={<Globe size={14} />} />
        </div>
      </PanelErrorBoundary>

      {/* ── Features grid ── */}
      <PanelErrorBoundary label="Features">
        <div style={{
          background: "var(--proof-surface)",
          border: "1px solid var(--proof-border)",
          borderRadius: 14, overflow: "hidden",
        }}>
          <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid var(--proof-border)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 3, height: 18, borderRadius: 99, background: "var(--proof-blue)", boxShadow: "0 0 8px var(--proof-blue-glow)" }} />
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--proof-text)", letterSpacing: "-0.2px" }}>Features</span>
            <span style={{ fontSize: 11, color: "var(--proof-text-muted)", background: "var(--proof-subtle-bg2)", border: "1px solid var(--proof-border)", borderRadius: 999, padding: "1px 8px" }}>{FEATURES.length} modules</span>
          </div>
          <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {FEATURES.map(f => {
              const I = f.icon;
              return (
                <div key={f.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 9,
                    background: `${f.color}18`, border: `1px solid ${f.color}28`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <I size={15} style={{ color: f.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--proof-text)", letterSpacing: "-0.1px" }}>{f.title}</div>
                    <div style={{ fontSize: 11.5, color: "var(--proof-text-secondary)", lineHeight: 1.45, marginTop: 2 }}>{f.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PanelErrorBoundary>

      {/* ── Environment map + Stack ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Env map */}
        <div style={{ background: "var(--proof-surface)", border: "1px solid var(--proof-border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid var(--proof-border)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 3, height: 18, borderRadius: 99, background: "var(--proof-green)", boxShadow: "0 0 8px rgba(34,197,94,0.4)" }} />
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--proof-text)", letterSpacing: "-0.2px" }}>Environment Map</span>
          </div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { tier: "QA", color: "#22c55e", desc: "First gate — daily Playwright + pytest", envs: ["QA / Staging", "QA / Production"] },
              { tier: "UAT", color: "#f59e0b", desc: "Stakeholder acceptance environment", envs: ["UAT / Staging", "UAT / Production"] },
              { tier: "PROD", color: "#ef4444", desc: "Live edge — Akamai property active", envs: ["PROD / Staging", "PROD / Production"] },
            ].map(t => (
              <div key={t.tier} style={{
                display: "flex", flexDirection: "column", gap: 6,
                padding: "14px 16px", borderRadius: 10,
                border: "1px solid var(--proof-border)",
                background: "var(--proof-subtle-bg)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: t.color }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--proof-text)" }}>{t.tier}</span>
                  <span style={{ fontSize: 11, color: "var(--proof-text-muted)", marginLeft: "auto" }}>{t.desc}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {t.envs.map(e => (
                    <span key={e} style={{ fontSize: 10.5, fontWeight: 600, color: "var(--proof-text-secondary)", background: "var(--proof-subtle-bg2)", border: "1px solid var(--proof-border)", borderRadius: 5, padding: "2px 8px", display: "flex", alignItems: "center", gap: 3 }}>
                      <Network size={9} style={{ opacity: 0.5 }} /> {e}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech stack */}
        <div style={{ background: "var(--proof-surface)", border: "1px solid var(--proof-border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid var(--proof-border)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 3, height: 18, borderRadius: 99, background: "var(--proof-purple)", boxShadow: "0 0 8px rgba(139,92,246,0.4)" }} />
            <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--proof-text)", letterSpacing: "-0.2px" }}>Tech Stack</span>
          </div>
          <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {STACK.map(s => (
              <div key={s.label} style={{
                display: "flex", flexDirection: "column", gap: 2,
                padding: "10px 12px", borderRadius: 8,
                border: "1px solid var(--proof-border)",
                background: "var(--proof-subtle-bg)",
              }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: s.color }}>{s.label}</span>
                <span style={{ fontSize: 11, color: "var(--proof-text-muted)" }}>{s.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Test category breakdown ── */}
      {Object.keys(cats).length > 0 && (
        <PanelErrorBoundary label="Test categories">
          <div style={{ background: "var(--proof-surface)", border: "1px solid var(--proof-border)", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid var(--proof-border)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 3, height: 18, borderRadius: 99, background: "var(--proof-cyan)" }} />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--proof-text)", letterSpacing: "-0.2px" }}>Test Coverage by Category</span>
            </div>
            <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
              {Object.entries(cats).map(([cat, count]) => {
                const total = Object.values(cats).reduce((s, c) => s + (c as number), 0);
                const pct = Math.round(((count as number) / total) * 100);
                return (
                  <div key={cat} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--proof-text-secondary)", textTransform: "capitalize" }}>{cat}</span>
                      <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--proof-text-muted)" }}>{String(count)}</span>
                    </div>
                    <div style={{ height: 4, background: "var(--proof-bar-track)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: "var(--proof-blue)", borderRadius: 99 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </PanelErrorBoundary>
      )}

      {/* Footer */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px", borderRadius: 10,
        background: "var(--proof-subtle-bg)", border: "1px solid var(--proof-border)",
        fontSize: 11.5, color: "var(--proof-text-muted)",
      }}>
        <span>A.W.A.R.E. CDN Observability Dashboard</span>
        <span style={{ fontFamily: "var(--font-mono)" }}>Built {new Date().toISOString().slice(0, 10)}</span>
      </div>
    </div>
  );
}
