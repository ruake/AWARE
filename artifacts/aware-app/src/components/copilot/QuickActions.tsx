import React, { useState, useMemo } from "react";
import {
  Activity,
  RefreshCw,
  Layers,
  ArrowRight,
  Bug,
  Rocket,
  Heart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Zap,
  Shield,
  ShieldOff,
  CheckCircle2,
  XCircle,
  Lock,
  AlertCircle,
  Monitor,
  Code2,
  Cloud,
  Server,
  Database,
  Globe,
  Search,
  History,
  Target,
  BarChart2,
  GitBranch,
  Cpu,
  Wifi,
  FileText,
  Flame,
  ThumbsUp,
  Filter,
  Play,
  FlaskConical,
  X,
} from "lucide-react";

interface Action {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  message: string;
}

interface ActionGroup {
  id: string;
  label: string;
  actions: Action[];
}

const GROUPS: ActionGroup[] = [
  // ── Test Runs ──────────────────────────────────────────────────────────────
  {
    id: "runs",
    label: "Test Runs",
    actions: [
      {
        id: "latest-runs",
        label: "Latest Runs",
        description: "Pass rates for the last 10 runs",
        icon: <Activity size={13} />,
        message: "Show me the last 10 test runs with pass rates and failure counts.",
      },
      {
        id: "qa-runs",
        label: "QA Runs",
        description: "Latest runs in QA only",
        icon: <Play size={13} />,
        message: "Show the latest QA test runs with pass rates and failure counts.",
      },
      {
        id: "uat-runs",
        label: "UAT Runs",
        description: "Latest runs in UAT only",
        icon: <Play size={13} />,
        message: "Show the latest UAT test runs with pass rates and failure counts.",
      },
      {
        id: "prod-runs",
        label: "PROD Runs",
        description: "Latest runs in PROD only",
        icon: <Play size={13} />,
        message: "Show the latest PROD test runs with pass rates and failure counts.",
      },
      {
        id: "trend-20",
        label: "20-Run Trend",
        description: "Pass rate trend over 20 runs",
        icon: <TrendingUp size={13} />,
        message: "Show pass rate trend over the last 20 test runs.",
      },
      {
        id: "worst-runs",
        label: "Worst Runs",
        description: "Runs with lowest pass rates",
        icon: <TrendingDown size={13} />,
        message: "Show the 10 runs with the worst (lowest) pass rates.",
      },
      {
        id: "best-runs",
        label: "Best Runs",
        description: "Runs with highest pass rates",
        icon: <ThumbsUp size={13} />,
        message: "Show the 10 runs with the highest pass rates.",
      },
      {
        id: "low-pass-runs",
        label: "Low-Pass Runs",
        description: "Runs below 90% pass rate",
        icon: <AlertTriangle size={13} />,
        message: "List all test runs where the pass rate fell below 90%.",
      },
      {
        id: "run-history",
        label: "Run History",
        description: "Complete run history all envs",
        icon: <History size={13} />,
        message: "How many test runs have been executed? Show full run history.",
      },
    ],
  },

  // ── Flakiness ──────────────────────────────────────────────────────────────
  {
    id: "flakiness",
    label: "Flakiness",
    actions: [
      {
        id: "flaky-tests",
        label: "Flaky Tests",
        description: "Tests flipping PASS↔FAIL",
        icon: <RefreshCw size={13} />,
        message: "Which tests are flaky? Analyze the last 5 runs and rank by flakiness score.",
      },
      {
        id: "top-15-flaky",
        label: "Top 15 Flaky",
        description: "Worst 15 flaky tests ranked",
        icon: <Flame size={13} />,
        message: "Show the top 15 flakiest tests ranked by flakiness score.",
      },
      {
        id: "stable-tests",
        label: "Stable Tests",
        description: "Tests that never fail",
        icon: <Shield size={13} />,
        message: "Which tests are the most stable and reliable? Find tests that never fail.",
      },
      {
        id: "high-risk-tests",
        label: "High-Risk Tests",
        description: "Flakiness score above 50%",
        icon: <AlertCircle size={13} />,
        message: "Show high-risk flaky tests with a flakiness score above 50%.",
      },
      {
        id: "qa-flakiness",
        label: "QA Flakiness",
        description: "Flaky tests in QA runs",
        icon: <Zap size={13} />,
        message: "Show flaky tests from QA environment runs.",
      },
      {
        id: "uat-flakiness",
        label: "UAT Flakiness",
        description: "Flaky tests in UAT runs",
        icon: <Zap size={13} />,
        message: "Show flaky tests from UAT environment runs.",
      },
      {
        id: "flip-history",
        label: "Flip History",
        description: "Tests flipping the most",
        icon: <RefreshCw size={13} />,
        message: "Which tests are flipping between PASS and FAIL the most often?",
      },
      {
        id: "flakiness-overview",
        label: "Flakiness Overview",
        description: "How many tests unstable?",
        icon: <BarChart2 size={13} />,
        message: "Flakiness overview — how many tests are currently unstable?",
      },
    ],
  },

  // ── Environments ───────────────────────────────────────────────────────────
  {
    id: "environments",
    label: "Environments",
    actions: [
      {
        id: "compare-envs",
        label: "Compare Envs",
        description: "QA vs UAT vs PROD health",
        icon: <Layers size={13} />,
        message: "Compare pass rates and failure counts across QA, UAT, and PROD environments.",
      },
      {
        id: "env-health",
        label: "Env Health",
        description: "Overall environment status",
        icon: <Heart size={13} />,
        message:
          "Give me a health summary of all three environments. Compare pass rates and flag any that need attention.",
      },
      {
        id: "qa-deep-dive",
        label: "QA Deep Dive",
        description: "QA health vs UAT and PROD",
        icon: <Server size={13} />,
        message: "QA environment health deep dive — compare QA to UAT and PROD.",
      },
      {
        id: "uat-status",
        label: "UAT Status",
        description: "Current UAT avg pass rate",
        icon: <Server size={13} />,
        message: "What is the current UAT environment status? Show avg pass rate.",
      },
      {
        id: "prod-status",
        label: "PROD Status",
        description: "Current PROD failures",
        icon: <Server size={13} />,
        message: "What is the current PROD environment status and pass rate?",
      },
      {
        id: "qa-vs-prod",
        label: "QA vs PROD Gap",
        description: "Quality gap between QA & PROD",
        icon: <GitBranch size={13} />,
        message: "Compare QA vs PROD quality gap — how far is QA from production?",
      },
      {
        id: "worst-env",
        label: "Worst Env",
        description: "Environment with lowest pass rate",
        icon: <TrendingDown size={13} />,
        message: "Which environment has the worst pass rate right now?",
      },
      {
        id: "env-trend",
        label: "Env Trend",
        description: "Any environments degrading?",
        icon: <TrendingDown size={13} />,
        message: "Are any environments degrading in pass rate over time?",
      },
    ],
  },

  // ── Promotion Gate ─────────────────────────────────────────────────────────
  {
    id: "promotion",
    label: "Promotion Gate",
    actions: [
      {
        id: "promotion-gate",
        label: "Promotion Gate",
        description: "UAT → PROD readiness",
        icon: <ArrowRight size={13} />,
        message: "What is the current UAT → PROD promotion gate status? Show recent decisions.",
      },
      {
        id: "release-ready",
        label: "Release Ready?",
        description: "Can we deploy to PROD?",
        icon: <Rocket size={13} />,
        message:
          "Is the current build ready for PROD? Check the latest UAT run pass rate against the ≥95% promotion threshold and recent promotion gate decisions.",
      },
      {
        id: "gate-history",
        label: "Gate History",
        description: "All promote & block decisions",
        icon: <History size={13} />,
        message: "Show the full promotion gate history — all promote and block decisions.",
      },
      {
        id: "block-rate",
        label: "Block Rate",
        description: "% of promotions blocked",
        icon: <XCircle size={13} />,
        message: "What is the promotion gate block rate? What percentage were blocked?",
      },
      {
        id: "uat-gate-check",
        label: "UAT Gate Check",
        description: "Is UAT above 95% threshold?",
        icon: <CheckCircle2 size={13} />,
        message: "Is UAT currently above the 95% promotion gate threshold?",
      },
      {
        id: "last-block",
        label: "Last Block",
        description: "Why was gate last blocked?",
        icon: <Lock size={13} />,
        message: "Why was the promotion gate last blocked? Show the most recent block decision.",
      },
      {
        id: "promotions-won",
        label: "Promotions Won",
        description: "Successful PROD promotions",
        icon: <CheckCircle2 size={13} />,
        message: "How many successful promotions to PROD have been completed?",
      },
      {
        id: "gate-trend",
        label: "Gate Trend",
        description: "Is blocking more frequent?",
        icon: <TrendingUp size={13} />,
        message: "Is the promotion gate blocking more often lately? Show gate trend.",
      },
    ],
  },

  // ── Failure Analysis ───────────────────────────────────────────────────────
  {
    id: "failures",
    label: "Failure Analysis",
    actions: [
      {
        id: "failure-breakdown",
        label: "Failure Breakdown",
        description: "Categories failing in latest run",
        icon: <Bug size={13} />,
        message: "Break down test failures by category for the latest run. What's failing most?",
      },
      {
        id: "top-categories",
        label: "Top Categories",
        description: "Most-failing test categories",
        icon: <Target size={13} />,
        message: "Which test categories have the most failures? Rank all categories.",
      },
      {
        id: "zero-pass-cats",
        label: "Zero-Pass Cats",
        description: "Categories with 0% pass rate",
        icon: <XCircle size={13} />,
        message: "Show test categories with zero pass rate — completely failing.",
      },
      {
        id: "security-failures",
        label: "Security Failures",
        description: "Security & WAF failures",
        icon: <ShieldOff size={13} />,
        message: "Show security and WAF test failures in the latest run.",
      },
      {
        id: "waf-tests",
        label: "WAF Tests",
        description: "Web app firewall results",
        icon: <Shield size={13} />,
        message: "Show WAF and web application firewall test results.",
      },
      {
        id: "bot-manager",
        label: "Bot Manager",
        description: "Bot protection test results",
        icon: <Cpu size={13} />,
        message: "Show bot manager and bot protection test results.",
      },
      {
        id: "tls-failures",
        label: "TLS Failures",
        description: "Certificate & TLS failures",
        icon: <Lock size={13} />,
        message: "Show TLS and certificate validation test failures.",
      },
      {
        id: "performance-fails",
        label: "Performance Fails",
        description: "Timing & performance failures",
        icon: <Clock size={13} />,
        message: "Show performance and timing test failures in the latest run.",
      },
      {
        id: "regression-alert",
        label: "Regression Alert",
        description: "Tests that newly broke",
        icon: <AlertTriangle size={13} />,
        message: "Regression alert — which tests newly failed in the latest run?",
      },
    ],
  },

  // ── Playwright & pytest ────────────────────────────────────────────────────
  {
    id: "runners",
    label: "Playwright & pytest",
    actions: [
      {
        id: "playwright-status",
        label: "Playwright Status",
        description: "Browser test pass rate",
        icon: <Monitor size={13} />,
        message: "What is the Playwright browser test pass rate in the latest run?",
      },
      {
        id: "pytest-status",
        label: "pytest Status",
        description: "API test pass rate",
        icon: <FlaskConical size={13} />,
        message: "What is the pytest test pass rate and results?",
      },
      {
        id: "web-vs-api",
        label: "Web vs API",
        description: "Playwright vs pytest results",
        icon: <Code2 size={13} />,
        message: "Compare Playwright browser tests vs pytest API test results.",
      },
      {
        id: "suite-overview",
        label: "Suite Overview",
        description: "All test suites & pass rates",
        icon: <Layers size={13} />,
        message: "Show all test suites with their pass rates and run counts.",
      },
      {
        id: "suite-failures",
        label: "Suite Failures",
        description: "Suites with highest failures",
        icon: <Bug size={13} />,
        message: "Which test suites have the highest failure counts?",
      },
      {
        id: "category-heatmap",
        label: "Category Heatmap",
        description: "All categories by pass rate",
        icon: <BarChart2 size={13} />,
        message: "Show all test categories ranked by pass rate as a heatmap.",
      },
      {
        id: "test-count",
        label: "Test Count",
        description: "Total tests in latest run",
        icon: <Filter size={13} />,
        message: "How many tests were run in the latest test run? Show test volume.",
      },
    ],
  },

  // ── Akamai CDN ────────────────────────────────────────────────────────────
  {
    id: "cdn",
    label: "Akamai CDN",
    actions: [
      {
        id: "edgeworker-tests",
        label: "EdgeWorker Tests",
        description: "EdgeWorker pass rates",
        icon: <Cpu size={13} />,
        message: "Show EdgeWorker test results and pass rates.",
      },
      {
        id: "cache-tests",
        label: "Cache Tests",
        description: "CDN cache behavior results",
        icon: <Database size={13} />,
        message: "Show CDN cache behavior and cache-hit test results.",
      },
      {
        id: "cdn-health",
        label: "CDN Health",
        description: "Overall Akamai CDN summary",
        icon: <Cloud size={13} />,
        message: "Give me an overall CDN health summary across all Akamai environments.",
      },
      {
        id: "staging-network",
        label: "Staging Network",
        description: "QA & UAT staging status",
        icon: <Wifi size={13} />,
        message: "How is the staging network performing? QA and UAT status.",
      },
      {
        id: "prod-network",
        label: "PROD Network",
        description: "Production network health",
        icon: <Globe size={13} />,
        message: "How is the production network performing? PROD environment status.",
      },
      {
        id: "api-failures",
        label: "API Failures",
        description: "HTTP & API endpoint failures",
        icon: <FileText size={13} />,
        message: "Show HTTP and API endpoint test failures by category.",
      },
      {
        id: "property-health",
        label: "Property Health",
        description: "Akamai property health",
        icon: <Shield size={13} />,
        message: "What is the overall Akamai property health across environments?",
      },
      {
        id: "full-cdn-report",
        label: "Full CDN Report",
        description: "All envs, suites, & recent runs",
        icon: <FileText size={13} />,
        message: "Generate a full CDN test report covering all environments and recent runs.",
      },
    ],
  },
];

interface Props {
  onAction: (message: string) => void;
  busy: boolean;
}

export default function QuickActions({ onAction, busy }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return GROUPS;
    return GROUPS.map((g) => ({
      ...g,
      actions: g.actions.filter(
        (a) =>
          a.label.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.message.toLowerCase().includes(q),
      ),
    })).filter((g) => g.actions.length > 0);
  }, [search]);

  return (
    <div
      style={{
        width: 185,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid var(--proof-border)",
        background: "var(--proof-surface)",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 10px 6px",
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--proof-text-secondary)",
          flexShrink: 0,
        }}
      >
        Quick Actions
      </div>

      {/* Search */}
      <div style={{ padding: "0 8px 6px", flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 7px",
            borderRadius: 5,
            border: "1px solid var(--proof-border)",
            background: "var(--proof-surface-2)",
          }}
        >
          <Search size={10} style={{ color: "var(--proof-text-secondary)", flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter…"
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              fontSize: 11,
              color: "var(--proof-text)",
              width: "100%",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Close"
              style={{
                border: "none",
                background: "none",
                padding: 0,
                cursor: "pointer",
                color: "var(--proof-text-secondary)",
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Groups */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}>
        {filtered.map((group) => (
          <div key={group.id}>
            {/* Category header */}
            <div
              style={{
                padding: "8px 10px 3px",
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--proof-text-secondary)",
                opacity: 0.7,
              }}
            >
              {group.label}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 1, padding: "0 6px" }}>
              {group.actions.map((action) => (
                <button
                  key={action.id}
                  disabled={busy}
                  onClick={() => onAction(action.message)}
                  title={action.description}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 7,
                    padding: "6px 7px",
                    borderRadius: 5,
                    border: "none",
                    background: "none",
                    cursor: busy ? "not-allowed" : "pointer",
                    textAlign: "left",
                    opacity: busy ? 0.45 : 1,
                    transition: "background 0.1s",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    if (!busy)
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "var(--proof-surface-2)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "none";
                  }}
                >
                  <span
                    style={{
                      color: "var(--proof-blue)",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    {action.icon}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--proof-text)",
                        lineHeight: 1.2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {action.label}
                    </div>
                    <div
                      style={{
                        fontSize: 9.5,
                        color: "var(--proof-text-secondary)",
                        lineHeight: 1.3,
                        marginTop: 1,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {action.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div
            style={{
              padding: "20px 12px",
              fontSize: 11,
              color: "var(--proof-text-secondary)",
              textAlign: "center",
            }}
          >
            No actions match "{search}"
          </div>
        )}
      </div>
    </div>
  );
}
