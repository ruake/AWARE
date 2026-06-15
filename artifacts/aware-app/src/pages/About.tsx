import React from "react";
import {
  Zap,
  BarChart3,
  GitCompare,
  Activity,
  Shield,
  Globe,
  Book,
  Layers,
  TrendingUp,
  PieChart,
  Server,
  Cpu,
  Cloud,
  Lock,
  Route,
  Github,
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
      if (n >= target) {
        n = target;
        clearInterval(t);
      }
      setV(n);
    }, 20);
    return () => clearInterval(t);
  }, [target]);
  return v.toLocaleString();
}

const FEATURES = [
  {
    icon: BarChart3,
    title: "Dashboard",
    desc: "Real-time pass rate trends with anomaly detection",
    color: "#2563eb",
  },
  {
    icon: GitCompare,
    title: "Regression Compare",
    desc: "Baseline vs candidate diff with column filters",
    color: "#10b981",
  },
  {
    icon: Activity,
    title: "Run History",
    desc: "Filterable run table with detail panels",
    color: "#f59e0b",
  },
  {
    icon: Shield,
    title: "Promotion Gating",
    desc: "Gate deployments with pass-rate thresholds",
    color: "#f97316",
  },
  {
    icon: Layers,
    title: "Test Suites",
    desc: "Hierarchical tree with YAML export",
    color: "#ef4444",
  },
  {
    icon: Globe,
    title: "Cross-Env Testing",
    desc: "3 tiers × 2 networks, property version shown",
    color: "#06b6d4",
  },
  {
    icon: Book,
    title: "AI Copilot",
    desc: "Context-aware analysis with three LLM providers",
    color: "#8b5cf6",
  },
  {
    icon: TrendingUp,
    title: "Trends Analytics",
    desc: "Flakiness leaderboard, heatmaps, Z-score anomalies",
    color: "#84cc16",
  },
];

const ENV_ORDER = ["qa_staging", "qa_prod", "uat_staging", "uat_prod", "prod_staging", "prod_prod"];

export default function About() {
  const suites = getTestSuites();
  const tests = getAutoDiscoveredTests();
  const summary = getAutoDiscoverySummary();
  const promos = getAllPromotionDecisions();
  const freq = computeRunFrequency();
  const promoteCount = promos.filter((p) => p.decision === "promote").length;
  const promoPct = promos.length > 0 ? Math.round((promoteCount / promos.length) * 100) : 0;
  const cRuns = useCountUp(RUNS.length);
  const cTests = useCountUp(tests.length);
  const cSuites = useCountUp(suites.length);
  const overallRate =
    ENV_SUMMARY.length > 0
      ? Math.round(ENV_SUMMARY.reduce((s, e) => s + e.passRate, 0) / ENV_SUMMARY.length)
      : 0;
  const cRate = useCountUp(overallRate);
  const envs = getEnvConfigs();
  const cats = summary.byCategory ?? {};
  const runsPerDay = typeof freq === "object" ? `${freq.runsPerDay.toFixed(1)}/day` : String(freq);

  return (
    <div className="proof-page" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div
        className="proof-card"
        style={{ padding: "24px 20px", display: "flex", flexDirection: "column", gap: 6 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Zap size={22} style={{ color: "var(--proof-blue)" }} />
          <span style={{ fontSize: 18, fontWeight: 700, color: "var(--proof-text)" }}>
            A.W.A.R.E.
          </span>
          <span
            style={{
              fontSize: 11,
              color: "var(--proof-text-secondary)",
              fontFamily: "var(--font-mono)",
              background: "var(--proof-grey-bg)",
              padding: "2px 8px",
              borderRadius: 4,
            }}
          >
            v1.0.0
          </span>
        </div>
        <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", margin: 0, maxWidth: 600 }}>
          Akamai Web Analytics Regression Engine — CDN test observability dashboard. Monitors
          Playwright + pytest suites across QA → UAT → PROD, each with staging and production
          networks.
        </p>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <a
            href="https://github.com/ruake/AWARE"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 12,
              color: "var(--proof-blue)",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Github size={12} /> GitHub
          </a>
          <span style={{ color: "var(--proof-grey)", fontSize: 12 }}>|</span>
          <span style={{ fontSize: 12, color: "var(--proof-text-secondary)" }}>
            Built {new Date().toISOString().slice(0, 10)}
          </span>
        </div>
      </div>

      <PanelErrorBoundary label="Live stats">
        <div
          className="proof-card"
          style={{ padding: "16px 20px", display: "flex", gap: 16, flexWrap: "wrap" }}
        >
          {[
            { label: "Runs", value: cRuns, color: "var(--proof-blue)" },
            { label: "Tests", value: cTests, color: "var(--proof-green)" },
            { label: "Suites", value: cSuites, color: "var(--proof-yellow)" },
            { label: "Pass Rate", value: `${cRate}%`, color: "var(--proof-green)" },
            { label: "Promotions", value: `${promoPct}%`, color: "var(--proof-purple)" },
            { label: "Run Freq", value: runsPerDay, color: "var(--proof-text-secondary)" },
          ].map((s) => (
            <div key={s.label} style={{ minWidth: 100 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--proof-text-secondary)",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: s.color,
                  fontFamily: "var(--font-mono)",
                  lineHeight: 1.2,
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </PanelErrorBoundary>

      <PanelErrorBoundary label="Features">
        <div className="proof-card" style={{ padding: "16px 20px" }}>
          <div
            style={{ fontSize: 13, fontWeight: 600, color: "var(--proof-text)", marginBottom: 12 }}
          >
            Features
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 12,
            }}
          >
            {FEATURES.map((f) => {
              const I = f.icon;
              return (
                <div key={f.title} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: `${f.color}18`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <I size={14} style={{ color: f.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--proof-text)" }}>
                      {f.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--proof-text-secondary)",
                        lineHeight: 1.4,
                      }}
                    >
                      {f.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PanelErrorBoundary>

      <PanelErrorBoundary label="Environment status">
        <div className="proof-card" style={{ padding: "16px 20px" }}>
          <div
            style={{ fontSize: 13, fontWeight: 600, color: "var(--proof-text)", marginBottom: 12 }}
          >
            Environments
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 8,
            }}
          >
            {ENV_ORDER.map((id) => {
              const e = envs.find((x) => x.id === id);
              if (!e) return null;
              const rate =
                RUNS.filter((r) => r.envId === id).length > 0
                  ? Math.round(
                      (RUNS.filter((r) => r.envId === id && r.status === "PASS").length /
                        RUNS.filter((r) => r.envId === id).length) *
                        100,
                    )
                  : 0;
              return (
                <div
                  key={id}
                  style={{
                    background: "var(--proof-grey-bg)",
                    border: "1px solid var(--proof-grey)",
                    borderRadius: 4,
                    padding: "8px 10px",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--proof-text)" }}>
                    {e.label}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>
                    {e.target} / {e.network}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color:
                        rate >= 95
                          ? "var(--proof-green)"
                          : rate >= 80
                            ? "var(--proof-yellow)"
                            : "var(--proof-red)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {rate}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PanelErrorBoundary>

      <PanelErrorBoundary label="Test categories">
        <div className="proof-card" style={{ padding: "16px 20px" }}>
          <div
            style={{ fontSize: 13, fontWeight: 600, color: "var(--proof-text)", marginBottom: 12 }}
          >
            Test Categories ({Object.keys(cats).length})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {Object.entries(cats).map(([cat, count]) => {
              const pct = Math.round(((count as number) / tests.length) * 100);
              return (
                <div
                  key={cat}
                  style={{
                    background: "var(--proof-grey-bg)",
                    border: "1px solid var(--proof-grey)",
                    borderRadius: 4,
                    padding: "4px 10px",
                    fontSize: 11,
                    display: "flex",
                    gap: 4,
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "var(--proof-text)", fontWeight: 500 }}>{cat}</span>
                  <span style={{ color: "var(--proof-text-secondary)" }}>
                    {count as number} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </PanelErrorBoundary>

      <PanelErrorBoundary label="Architecture">
        <div className="proof-card" style={{ padding: "16px 20px" }}>
          <div
            style={{ fontSize: 13, fontWeight: 600, color: "var(--proof-text)", marginBottom: 12 }}
          >
            Architecture
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 12,
            }}
          >
            {[
              {
                icon: Server,
                title: "Frontend",
                desc: "React 19 + TypeScript 5.9 + Vite 7, wouter routing, recharts",
              },
              {
                icon: Cpu,
                title: "CI/CD",
                desc: "GitHub Actions, 6 env parallel Playwright + pytest, scheduler cron",
              },
              {
                icon: Cloud,
                title: "CDN",
                desc: "Akamai Property Manager, EdgeWorkers, 3 tier × 2 network matrix",
              },
              {
                icon: Lock,
                title: "Security",
                desc: "WAF, bot manager, TLS, CSP — tested in every regression run",
              },
              {
                icon: Route,
                title: "Promotion Gate",
                desc: "≥95% UAT pass rate required before PROD property activation",
              },
              {
                icon: PieChart,
                title: "Runtime Data",
                desc: "JSON fetched from GitHub raw, pub/sub stores, localStorage",
              },
            ].map((a) => {
              const I = a.icon;
              return (
                <div key={a.title} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: "var(--proof-grey-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <I size={14} style={{ color: "var(--proof-text-secondary)" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--proof-text)" }}>
                      {a.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--proof-text-secondary)",
                        lineHeight: 1.4,
                      }}
                    >
                      {a.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PanelErrorBoundary>
    </div>
  );
}
