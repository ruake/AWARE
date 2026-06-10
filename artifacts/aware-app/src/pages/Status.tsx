import React from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/aware/AppLayout";
import {
  Github,
  Check,
  LayoutDashboard,
  List,
  GitCompare,
  Play,
  FileJson,
  Eye,
  Database,
  RefreshCw,
  ChevronRight,
  Code2,
  Copy,
} from "lucide-react";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { HeatmapCalendar } from "@/components/aware/HeatmapCalendar";
import { computeRunFrequency } from "@/lib/data";

interface Stage {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  desc: string;
  detail: string;
  cta?: {
    label: string;
    href: string;
    icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  };
}

const STAGES: Stage[] = [
  {
    id: "gha",
    title: "GitHub Actions",
    icon: Github,
    desc: "Workflow runs regression tests on every config change",
    detail:
      "Post-test step in CI pipeline\n→ Generates status.json with run results\n→ Commits or uploads to static hosting",
  },
  {
    id: "publish",
    title: "Publish Status",
    icon: FileJson,
    desc: "CI pushes status.json to static file storage",
    detail:
      "pnpm publish:status\n→ Uploads to .well-known/aware/status.json\n→ CDN cache TTL: 60 seconds",
  },
  {
    id: "detect",
    title: "Portal Detects",
    icon: Eye,
    desc: "PROOF portal polls for status.json updates every 30 seconds",
    detail:
      "useLiveStatus() hook polls every 30s\n→ Compares ETag / last-modified\n→ New status detected → triggers notification",
  },
  {
    id: "parse",
    title: "Parse & Diff",
    icon: Database,
    desc: "Status file parsed and regression diff computed",
    detail:
      "JSON parsed → Run data hydrated\n→ Diff computed for Dashboard charts\n→ Regressions flagged for promotion block",
  },
  {
    id: "notify",
    title: "Alert Team",
    icon: RefreshCw,
    desc: "UI updates: toast notification + bell badge + inline banners",
    detail:
      "Toast: 'New run result available'\n→ Bell badge shows pending count\n→ Promotion banner updates automatically",
  },
  {
    id: "display",
    title: "Promotion Decision",
    icon: LayoutDashboard,
    desc: "Dashboard shows promotion readiness — approve or block deploy",
    detail:
      "Charts re-render with latest run\n→ Promotion banner: Approve / Block CTA\n→ Decision recorded in localStorage",
    cta: { label: "Open Dashboard", href: "/", icon: LayoutDashboard },
  },
];

const YAML_SPEC = `name: aware-regression-test
on:
  push:
    branches: [main, staging]
  workflow_dispatch:
    inputs:
      suite:
        description: 'Test suite to run'
        required: true
        default: 'full_suite'
      target:
        description: 'Target environment'
        required: true
        default: 'Prod/Production'
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: pnpm test:regression --suite=\${{ inputs.suite }}

      # Publish status to PROOF portal
      - run: pnpm publish:status
      - uses: peaceiris/actions-gh-pages@v4
        with:
          publish_dir: ./status
          destination_dir: .well-known/aware
          keep_files: false`;

const WORKFLOW_RUNS = [
  {
    id: "892",
    name: "Regression Suite",
    status: "running",
    duration: "3m 12s",
    branch: "main",
    actor: "devops-bot",
  },
  {
    id: "891",
    name: "Geo Gating Tests",
    status: "queued",
    duration: "—",
    branch: "feature/cache-opt",
    actor: "engineer-1",
  },
  {
    id: "890",
    name: "Smoke Tests",
    status: "completed",
    duration: "1m 45s",
    branch: "main",
    actor: "devops-bot",
  },
  {
    id: "889",
    name: "Regression Suite",
    status: "completed",
    duration: "2m 38s",
    branch: "staging",
    actor: "engineer-2",
  },
  {
    id: "888",
    name: "Canary Tests",
    status: "failed",
    duration: "0m 52s",
    branch: "feature/new-edge",
    actor: "engineer-3",
  },
];

export default function Status() {
  const { Toast } = useSimpleToast();
  const [activeStage, setActiveStage] = React.useState(2);
  const [yamlCopied, setYamlCopied] = React.useState(false);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveStage((s) => (s + 1) % STAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const freq = React.useMemo(() => computeRunFrequency(), []);

  const copyYaml = () => {
    navigator.clipboard.writeText(YAML_SPEC).then(() => {
      setYamlCopied(true);
      setTimeout(() => setYamlCopied(false), 2000);
    });
  };

  return (
    <AppLayout activeHref="/ci-pipeline">
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--proof-text)" }}>
            How PROOF Works
          </h1>
          <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", marginTop: 3 }}>
            End-to-end pipeline: GitHub Actions → test results → promotion decision
          </p>
        </div>

        {/* Pipeline visualization */}
        <div className="proof-card" style={{ padding: 24 }}>
          <h2
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--proof-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 20,
            }}
          >
            CI/CD → Promotion Pipeline
          </h2>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 0,
              overflowX: "auto",
              paddingBottom: 8,
            }}
          >
            {STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const isActive = activeStage === idx;
              const isCompleted = activeStage > idx;
              return (
                <React.Fragment key={stage.id}>
                  <div
                    className="pipeline-stage-enter"
                    onClick={() => setActiveStage(idx)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      minWidth: 100,
                    }}
                  >
                    <div
                      className={`${isCompleted ? "stage-glass-completed" : isActive ? "stage-glass-active" : "stage-glass"}`}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 16,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        transition: "all 0.4s",
                        transform: isActive ? "scale(1.08)" : "scale(1)",
                        animation: isActive ? "float 2s ease-in-out infinite" : "none",
                      }}
                    >
                      {isCompleted ? (
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "var(--proof-green)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Check size={16} color="white" />
                        </div>
                      ) : (
                        <Icon
                          size={20}
                          style={{
                            color: isActive ? "var(--proof-blue)" : "var(--proof-text-secondary)",
                            transition: "color 0.3s",
                          }}
                        />
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive
                          ? "var(--proof-blue)"
                          : isCompleted
                            ? "var(--proof-green)"
                            : "var(--proof-text-secondary)",
                        textAlign: "center",
                        lineHeight: 1.3,
                      }}
                    >
                      {stage.title}
                    </span>
                  </div>
                  {idx < STAGES.length - 1 && (
                    <div
                      className={
                        isCompleted ? "connector-gradient-completed" : "connector-gradient"
                      }
                      style={{
                        flex: 1,
                        height: 3,
                        minWidth: 20,
                        borderRadius: 2,
                        margin: "0 4px",
                        marginBottom: 24,
                        opacity: isCompleted ? 1 : 0.5,
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Active stage detail */}
          <div
            style={{
              marginTop: 16,
              padding: 14,
              background: "var(--proof-blue-bg)",
              borderRadius: 6,
              border: "1px solid var(--proof-blue)",
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
            }}
          >
            {React.createElement(STAGES[activeStage].icon, {
              size: 18,
              style: { color: "var(--proof-blue)", flexShrink: 0, marginTop: 2 },
            })}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: "var(--proof-blue)",
                  marginBottom: 4,
                }}
              >
                {STAGES[activeStage].title}
              </div>
              <div style={{ fontSize: 12, color: "var(--proof-text-secondary)", marginBottom: 6 }}>
                {STAGES[activeStage].desc}
              </div>
              <pre
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--proof-text)",
                  whiteSpace: "pre-line",
                  margin: 0,
                }}
              >
                {STAGES[activeStage].detail}
              </pre>
            </div>
            {STAGES[activeStage].cta && (
              <Link href={STAGES[activeStage].cta!.href}>
                <a className="proof-button-primary" style={{ flexShrink: 0 }}>
                  {React.createElement(STAGES[activeStage].cta!.icon, { size: 13 })}
                  {STAGES[activeStage].cta!.label}
                </a>
              </Link>
            )}
          </div>
        </div>

        {/* Live GHA runs + YAML side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* GitHub Actions runs */}
          <div className="proof-card" style={{ overflow: "hidden" }}>
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--proof-grey)",
                background: "var(--proof-grey-bg)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ fontSize: 13, fontWeight: 600 }}>Live GitHub Actions Runs</h3>
              <a
                href="https://github.com/ruake/PROOF/actions"
                target="_blank"
                rel="noopener"
                className="proof-button proof-button-xs"
              >
                <Github size={11} /> View all
              </a>
            </div>
            <table className="proof-table">
              <thead>
                <tr>
                  <th>Run</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {WORKFLOW_RUNS.map((run) => (
                  <tr key={run.id}>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{run.name}</div>
                      <div style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>
                        by {run.actor}
                      </div>
                    </td>
                    <td
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--proof-blue)",
                      }}
                    >
                      {run.branch}
                    </td>
                    <td>
                      <span
                        className={`proof-badge ${
                          run.status === "completed"
                            ? "proof-badge-pass"
                            : run.status === "failed"
                              ? "proof-badge-fail"
                              : run.status === "running"
                                ? "proof-badge-running"
                                : "proof-badge-skip"
                        }`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--proof-text-secondary)",
                      }}
                    >
                      {run.duration}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* YAML spec */}
          <div
            className="proof-card"
            style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--proof-grey)",
                background: "var(--proof-grey-bg)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Code2 size={14} /> regression.yml
              </h3>
              <button
                onClick={copyYaml}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  color: yamlCopied ? "var(--proof-green)" : "var(--proof-blue)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {yamlCopied ? <Check size={11} /> : <Copy size={11} />}
                {yamlCopied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre
              style={{
                flex: 1,
                overflowY: "auto",
                margin: 0,
                padding: 14,
                background: "#1e1e1e",
                color: "#d4d4d4",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                lineHeight: 1.65,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {YAML_SPEC}
            </pre>
          </div>
        </div>

        {/* Quick nav */}
        <div className="proof-card" style={{ padding: "14px 18px" }}>
          <h3
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--proof-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 12,
            }}
          >
            Quick Navigation
          </h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              {
                href: "/",
                label: "Dashboard",
                icon: LayoutDashboard,
                desc: "Promotion readiness overview",
              },
              { href: "/runs", label: "All Runs", icon: List, desc: "GitHub Actions run history" },
              {
                href: "/compare",
                label: "Compare",
                icon: GitCompare,
                desc: "Baseline vs candidate diff",
              },
              { href: "/start", label: "Start Run", icon: Play, desc: "Trigger regression suite" },
            ].map((nav) => {
              const Icon = nav.icon;
              return (
                <Link
                  key={nav.href}
                  href={nav.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 14px",
                    borderRadius: 4,
                    border: "1px solid var(--proof-grey)",
                    background: "var(--proof-surface)",
                    textDecoration: "none",
                    transition: "all 0.15s",
                    minWidth: 160,
                  }}
                  onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.borderColor = "var(--proof-blue)";
                    e.currentTarget.style.background = "var(--proof-blue-bg)";
                  }}
                  onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.currentTarget.style.borderColor = "var(--proof-grey)";
                    e.currentTarget.style.background = "var(--proof-surface)";
                  }}
                >
                  <Icon size={16} style={{ color: "var(--proof-blue)" }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--proof-text)" }}>
                      {nav.label}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
                      {nav.desc}
                    </div>
                  </div>
                  <ChevronRight
                    size={14}
                    style={{ color: "var(--proof-text-secondary)", marginLeft: "auto" }}
                  />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Run Frequency Heatmap */}
        <div className="proof-card" style={{ padding: 16 }}>
          <h3
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--proof-text)",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>📅</span> Run Frequency
            <span
              style={{
                fontSize: 11,
                fontWeight: 400,
                color: "var(--proof-text-secondary)",
                marginLeft: "auto",
              }}
            >
              {freq.totalRuns} runs · avg {freq.runsPerDay}/day · ~{freq.avgIntervalHours}h between
            </span>
          </h3>
          <HeatmapCalendar
            data={freq.byDay}
            onDayClick={(day) => {
              if (day) {
                Object.entries(day.envs)
                  .map(([env, count]) => `${env}: ${count}`)
                  .join(", ");
              }
            }}
          />
        </div>
      </div>
      {Toast}
    </AppLayout>
  );
}
