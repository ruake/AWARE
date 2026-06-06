import React from "react";
import { AppLayout } from "./_shared/AppLayout";
import { RUNS } from "./_shared/data";
import { navTo } from "./_shared/nav";
import "./_group.css";
import {
  Github, Check, Activity, ExternalLink,
  User, ChevronRight,
  LayoutDashboard, List, GitCompare,
  Search, Play, ArrowRight,
  FileJson, Eye, Globe,
  RefreshCw, Database, Zap
} from "lucide-react";

interface Stage {
  id: string; title: string; icon: React.ElementType;
  desc: string; detail: string;
  cta?: { label: string; path: string; icon: React.ElementType };
}

const STAGES: Stage[] = [
  { id: "gha", title: "GitHub Actions", icon: Github, desc: "Workflow completes and runs the status publish step", detail: "Post-test step in CI pipeline\n→ Generates status.json with run results\n→ Commits or uploads to static hosting" },
  { id: "publish", title: "Publish Status", icon: FileJson, desc: "CI pushes status.json to static file storage", detail: "pnpm publish:status\n→ Uploads to .well-known/aware/status.json\n→ CDN cache TTL: 60 seconds" },
  { id: "detect", title: "Portal Detects", icon: Eye, desc: "Aware portal polls for status.json updates", detail: "useLiveStatus() hook polls every 30s\n→ Compares ETag / last-modified\n→ New status detected → triggers notification" },
  { id: "parse", title: "Parse & Diff", icon: Database, desc: "Status file parsed and diff computed", detail: "JSON parsed → Run data hydrated\n→ Diff computed for Dashboard charts\n→ Regressions flagged for alerts" },
  { id: "notify", title: "Notify", icon: RefreshCw, desc: "UI updates with toast + bell badge", detail: "Toast: 'New run result available'\n→ Bell badge shows pending count\n→ Sidebar indicators update" },
  { id: "display", title: "Live Display", icon: LayoutDashboard, desc: "Dashboard, Runs & Compare reflect new data", cta: { label: "Open Dashboard", path: "Dashboard", icon: LayoutDashboard }, detail: "Charts re-render with latest run\n→ Run table updates\n→ Compare diffs refresh" },
];

const WORKFLOW_RUNS = [
  { id: "892", name: "Regression Suite", status: "running", duration: "3m 12s", branch: "main", actor: "devops-bot", sha: "a1b2c3d" },
  { id: "891", name: "Performance Tests", status: "queued", duration: "-", branch: "feature/cache-opt", actor: "engineer-1", sha: "e4f5g6h" },
  { id: "890", name: "Smoke Tests", status: "completed", duration: "1m 45s", branch: "main", actor: "devops-bot", sha: "i7j8k9l" },
  { id: "889", name: "Regression Suite", status: "completed", duration: "2m 38s", branch: "staging", actor: "engineer-2", sha: "m0n1o2p" },
  { id: "888", name: "Canary Tests", status: "failed", duration: "0m 52s", branch: "feature/new-edge", actor: "engineer-3", sha: "q3r4s5t" },
];

const YAML_SPEC = `name: aware-regression-test
on:
  push:
    branches: [main, staging]
  workflow_dispatch:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: pnpm test:regression

      # Publish status to static files
      - run: pnpm publish:status
      - uses: peaceiris/actions-gh-pages@v4
        with:
          publish_dir: ./status
          destination_dir: .well-known/aware
          keep_files: false`;

function StageCard({ stage, status }: { stage: Stage; status: "pending" | "active" | "completed" }) {
  const Icon = stage.icon;
  const isActive = status === "active";
  const isCompleted = status === "completed";
  const glassClass = isCompleted ? "stage-glass-completed" : isActive ? "stage-glass-active" : "stage-glass";
  return (
    <div className={`flex flex-col items-center gap-2 pipeline-stage-enter group ${isActive ? "scale-105" : ""}`}>
      <div className={`w-[88px] h-[88px] rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-500 ${glassClass} ${
        isActive ? "animate-[float_2s_ease-in-out_infinite]" : ""
      } ${!isActive && !isCompleted ? "opacity-70 hover:opacity-90" : ""}`}>
        {isCompleted ? (
          <div className="w-9 h-9 rounded-full bg-[var(--gcp-green)] flex items-center justify-center shadow-lg shadow-[var(--gcp-green-bg)] animate-[slide-up_0.3s_ease-out]">
            <Check size={18} className="text-white" />
          </div>
        ) : (
          <Icon size={24} className={`transition-colors duration-300 ${
            isActive ? "text-[var(--gcp-blue)]" : "text-[var(--gcp-text-secondary)] group-hover:text-[var(--gcp-text)]"
          }`} />
        )}
      </div>
      <span className={`text-[12px] font-medium text-center leading-tight max-w-[90px] transition-colors duration-300 ${
        isActive ? "text-[var(--gcp-blue)]" : isCompleted ? "text-[var(--gcp-green)]" : "text-[var(--gcp-text-secondary)]"
      }`}>{stage.title}</span>
      <span className={`inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-semibold transition-colors duration-300 ${
        isCompleted ? "text-[var(--gcp-green)]" : isActive ? "text-[var(--gcp-blue)]" : "text-[var(--gcp-text-secondary)]"
      }`}>
        {isCompleted ? (
          <><Check size={10} /> Done</>
        ) : isActive ? (
          <><span className="w-1.5 h-1.5 rounded-full bg-[var(--gcp-blue)] animate-[pulse-dot_0.8s_ease-in-out_infinite]" /> Running</>
        ) : "Pending"}
      </span>
    </div>
  );
}

function Connector({ status }: { status: "pending" | "active" | "completed" }) {
  const isCompleted = status === "completed";
  const isActive = status === "active";
  return (
    <div className="flex items-center flex-1 max-w-[44px] relative h-[3px]">
      <div className={`w-full h-full rounded-full transition-all duration-700 ${
        isCompleted ? "connector-gradient-completed" : isActive ? "connector-gradient" : "bg-[var(--gcp-grey)] opacity-40"
      }`} />
      {isActive && (
        <>
          <div className="absolute right-0 w-[10px] h-[10px] rounded-full bg-[var(--gcp-blue)] shadow-lg shadow-[var(--gcp-blue-bg)] animate-[pulse-dot_0.8s_ease-in-out_infinite] z-10" />
          <div className="absolute right-0 w-[10px] h-[10px] rounded-full bg-[var(--gcp-blue)] animate-[pulse-dot_0.8s_ease-in-out_infinite_0.4s] z-0 opacity-40" />
        </>
      )}
      {isCompleted && (
        <div className="absolute right-0 w-[6px] h-[6px] rounded-full bg-[var(--gcp-green)]" />
      )}
      <ChevronRight size={16} className={`absolute -right-[14px] transition-colors duration-700 ${
        isCompleted ? "text-[var(--gcp-green)]" : isActive ? "text-[var(--gcp-blue)]" : "text-[var(--gcp-grey)]"
      }`} />
    </div>
  );
}

export function Status() {
  const [currentStage, setCurrentStage] = React.useState(-1);
  const [showDetail, setShowDetail] = React.useState<string | null>(null);
  const [workflowFilter, setWorkflowFilter] = React.useState("all");
  const [restartKey, setRestartKey] = React.useState(0);

  const isCompleted = currentStage >= STAGES.length;
  const stageCount = STAGES.length;
  const progressPct = currentStage < 0 ? 0 : isCompleted ? 100 : Math.round((currentStage / (stageCount - 1)) * 100);

  React.useEffect(() => {
    if (isCompleted) {
      const timer = setTimeout(() => {
        setCurrentStage(-1);
        setRestartKey(k => k + 1);
      }, 5000);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      setCurrentStage(prev => prev + 1);
    }, 1100);
    return () => clearTimeout(timer);
  }, [currentStage, isCompleted, restartKey]);

  React.useEffect(() => {
    if (currentStage === -1 && restartKey === 0) {
      const timer = setTimeout(() => setCurrentStage(0), 600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [currentStage, restartKey]);

  const getStageStatus = (i: number): "pending" | "active" | "completed" => {
    if (isCompleted || i < currentStage) return "completed";
    if (i === currentStage) return "active";
    return "pending";
  };

  const particleLeft = currentStage < 0 ? -3 : Math.min((currentStage / (STAGES.length - 1)) * 100, 100);

  const filteredRuns = workflowFilter === "all"
    ? WORKFLOW_RUNS
    : WORKFLOW_RUNS.filter(r => r.status === workflowFilter);

  const getRunId = (i: number) => RUNS[i % RUNS.length]?.id ?? RUNS[0].id;

  return (
    <AppLayout activeTab="status">
      <div className="h-[calc(100vh-100px)] flex flex-col max-w-[1600px] mx-auto gap-4 overflow-auto">
        {/* Header */}
        <div className="gcp-card p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--gcp-blue)] to-[#4a90d9] flex items-center justify-center shadow-lg shadow-[var(--gcp-blue-bg)]">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Live Status</h1>
              <p className="text-[12px] text-[var(--gcp-text-secondary)] mt-0.5">GitHub Actions pushes status to static files — portal detects & displays in real-time</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Progress ring */}
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="16" fill="none" stroke="var(--gcp-grey)" strokeWidth="3" opacity="0.3" />
                <circle cx="20" cy="20" r="16" fill="none" stroke={isCompleted ? "var(--gcp-green)" : "var(--gcp-blue)"} strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 16}`}
                  strokeDashoffset={`${2 * Math.PI * 16 * (1 - progressPct / 100)}`}
                  className="transition-all duration-700 ease-in-out"
                />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${
                isCompleted ? "text-[var(--gcp-green)]" : "text-[var(--gcp-blue)]"
              }`}>{progressPct}%</span>
            </div>
            <div className="text-right">
              <div className="text-[13px] font-semibold">
                {isCompleted ? "Complete" : currentStage < 0 ? "Starting..." : `Stage ${currentStage + 1} of ${stageCount}`}
              </div>
              <div className="text-[10px] text-[var(--gcp-text-secondary)]">
                {isCompleted ? "Next cycle in 5s" : currentStage < 0 ? "Initializing..." : STAGES[currentStage]?.title ?? ""}
              </div>
            </div>
          </div>
        </div>

        {/* Quick-jump toolbar */}
        <div className="gcp-card p-3 flex items-center gap-2 shrink-0 bg-[var(--gcp-surface-hover)] rounded-lg">
          <span className="text-[10px] font-semibold text-[var(--gcp-text-secondary)] uppercase tracking-widest mr-1">Jump to</span>
          <div className="h-4 w-px bg-[var(--gcp-grey)] mx-1" />
          {([
            { icon: LayoutDashboard, label: "Dashboard", path: "Dashboard" },
            { icon: List, label: "Runs", path: "Runs" },
            { icon: GitCompare, label: "Compare", path: "Compare" },
            { icon: Search, label: "Search", path: "SearchDemo" },
          ] as const).map(item => (
            <button key={item.path} onClick={() => navTo(item.path)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-blue)] hover:bg-[var(--gcp-blue-bg)] rounded-lg transition-all duration-200"
            >
              <item.icon size={14} /> {item.label}
            </button>
          ))}
          <div className="h-4 w-px bg-[var(--gcp-grey)] mx-1" />
          <button onClick={() => navTo("StartRun")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[var(--gcp-blue)] bg-[var(--gcp-blue-bg)] hover:bg-[var(--gcp-blue)] hover:text-white rounded-lg transition-all duration-200 ml-auto"
          >
            <Play size={13} /> Start New Run
          </button>
        </div>

        {/* Flow Visualization */}
        <div className="gcp-card p-8 shrink-0 relative overflow-hidden rounded-xl">
          <div className="absolute inset-0 enterprise-dot-bg opacity-30" />
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[var(--gcp-blue)] to-transparent opacity-20" />

          {/* Progress bar */}
          <div className="mb-8">
            <div className="h-1.5 bg-[var(--gcp-grey)] opacity-20 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ease-in-out ${
                isCompleted ? "bg-[var(--gcp-green)]" : "bg-gradient-to-r from-[var(--gcp-blue)] to-[#4a90d9]"
              }`} style={{ width: `${isCompleted ? 100 : Math.max(progressPct, 2)}%` }} />
            </div>
          </div>

          <div className="relative flex items-center justify-between px-4">
            {/* Particle track */}
            <div className="absolute top-[64px] left-[52px] right-[52px] h-[2px] bg-[var(--gcp-grey)] opacity-30 z-0 rounded-full">
              <div
                className="absolute top-1/2 -translate-y-1/2 w-[18px] h-[18px] bg-gradient-to-br from-[var(--gcp-blue)] to-[#4a90d9] rounded-full z-10 transition-all duration-700 ease-in-out shadow-xl shadow-[var(--gcp-blue-bg)]"
                style={{ left: `calc(${particleLeft}% - 9px)` }}
              >
                <div className="absolute inset-1 rounded-full bg-white opacity-25" />
                <div className="absolute -inset-1 rounded-full bg-[var(--gcp-blue)] animate-[pulse-dot_1s_ease-in-out_infinite] opacity-30" />
              </div>
            </div>

            {/* Stages */}
            {STAGES.map((stage, i) => (
              <React.Fragment key={stage.id}>
                <div className="relative z-10">
                  <StageCard stage={stage} status={getStageStatus(i)} />
                  <button
                    onClick={() => setShowDetail(showDetail === stage.id ? null : stage.id)}
                    className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[9px] font-medium whitespace-nowrap transition-all duration-200 ${
                      showDetail === stage.id
                        ? "text-[var(--gcp-blue)] opacity-100"
                        : "text-[var(--gcp-text-secondary)] opacity-0 group-hover:opacity-100 hover:text-[var(--gcp-blue)]"
                    }`}
                  >
                    details ▾
                  </button>
                </div>
                {i < STAGES.length - 1 && (
                  <Connector status={getStageStatus(i) === "completed" ? "completed" : getStageStatus(i) === "active" ? "active" : "pending"} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Detail panel */}
          {showDetail && (() => {
            const stage = STAGES.find(s => s.id === showDetail);
            if (!stage) return null;
            const CtaIcon = stage.cta?.icon;
            return (
              <div className="mt-6 p-5 gcp-card bg-[var(--gcp-surface-hover)] animate-[slide-up_0.2s_ease-out] rounded-xl border-l-4 border-l-[var(--gcp-blue)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <stage.icon size={16} className="text-[var(--gcp-blue)]" />
                    <h4 className="text-sm font-semibold">{stage.title}</h4>
                  </div>
                  <button onClick={() => setShowDetail(null)} className="text-[11px] text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-blue)] font-medium transition-colors">Close</button>
                </div>
                <pre className="text-[12px] font-mono text-[var(--gcp-text-secondary)] whitespace-pre-wrap mb-3 leading-relaxed">{stage.detail}</pre>
                {stage.cta && CtaIcon && (
                  <button onClick={() => { setShowDetail(null); navTo(stage.cta!.path); }}
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-[var(--gcp-blue)] to-[#4a90d9] px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <CtaIcon size={14} /> {stage.cta.label} <ArrowRight size={13} />
                  </button>
                )}
              </div>
            );
          })()}

          {/* Completion banner */}
          {isCompleted && (
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 animate-[slide-up_0.3s_ease-out]">
              <div className="flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-[var(--gcp-green-bg)] to-transparent rounded-xl border border-[var(--gcp-green)] border-opacity-30">
                <div className="w-7 h-7 rounded-full bg-[var(--gcp-green)] flex items-center justify-center shadow-md">
                  <Check size={15} className="text-white" />
                </div>
                <span className="text-[13px] font-semibold text-[var(--gcp-green)]">Status update received — results now live</span>
              </div>
              <div className="h-6 w-px bg-[var(--gcp-grey)]" />
              <button onClick={() => navTo("Dashboard")} className="gcp-button gcp-button-primary text-[12px] flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium shadow-sm">
                <LayoutDashboard size={14} /> Dashboard
              </button>
              <button onClick={() => navTo("Runs")} className="gcp-button text-[12px] flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium">
                <List size={14} /> Runs
              </button>
              <button onClick={() => navTo("Compare")} className="gcp-button text-[12px] flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium">
                <GitCompare size={14} /> Compare
              </button>
              <button onClick={() => navTo("StartRun")} className="gcp-button text-[12px] flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium">
                <Play size={13} /> New Run
              </button>
            </div>
          )}
        </div>

        {/* Bottom split: Workflow Spec + GitHub Actions Runs */}
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Workflow Spec */}
          <div className="w-[38%] gcp-card flex flex-col overflow-hidden rounded-xl">
            <div className="p-4 border-b border-[var(--gcp-grey)] flex items-center justify-between shrink-0 bg-[var(--gcp-surface-hover)]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#24292f] flex items-center justify-center">
                  <Github size={14} className="text-white" />
                </div>
                <span className="text-sm font-semibold">Workflow Spec</span>
              </div>
              <span className="text-[10px] font-mono text-[var(--gcp-text-secondary)] bg-[var(--gcp-surface)] px-2 py-1 rounded border border-[var(--gcp-grey)]">.github/workflows/regression.yml</span>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-[var(--gcp-surface)]">
              <pre className="text-[12px] font-mono leading-relaxed text-[var(--gcp-text-secondary)]">
                {YAML_SPEC.split('\n').map((line, i) => (
                  <div key={i} className="whitespace-pre hover:bg-[var(--gcp-surface-hover)] -mx-1 px-1 rounded transition-colors">
                    {line.startsWith('  -') ? <span className="text-[var(--gcp-blue)]">{line}</span> :
                     line.startsWith('name:') || line.startsWith('on:') || line.startsWith('jobs:') ? <span className="text-[var(--gcp-text)] font-semibold">{line}</span> :
                     line.includes('#') ? <><span className="text-[var(--gcp-text)]">{line.split('#')[0]}</span><span className="text-[var(--gcp-text-secondary)] opacity-50">#{line.split('#')[1]}</span></> :
                     line.includes(":") ? <><span className="text-[var(--gcp-red)] font-medium">{line.split(':')[0]}</span>:{line.split(':').slice(1).join(':')}</> :
                     <span>{line}</span>}
                  </div>
                ))}
              </pre>
            </div>
            <div className="p-3 border-t border-[var(--gcp-grey)] bg-[var(--gcp-surface-hover)] flex items-center gap-2">
              <FileJson size={12} className="text-[var(--gcp-text-secondary)]" />
              <span className="text-[10px] text-[var(--gcp-text-secondary)]">The publish step generates <code className="font-mono bg-[var(--gcp-surface)] px-1 rounded">status.json</code></span>
            </div>
          </div>

          {/* GitHub Actions Runs */}
          <div className="flex-1 gcp-card flex flex-col overflow-hidden rounded-xl">
            <div className="p-4 border-b border-[var(--gcp-grey)] flex items-center justify-between shrink-0 bg-[var(--gcp-surface-hover)]">
              <div className="flex items-center gap-2.5">
                <Globe size={16} className="text-[var(--gcp-blue)]" />
                <span className="text-sm font-semibold">GitHub Actions Runs</span>
              </div>
              <div className="flex gap-1">
                {["all", "running", "completed", "failed"].map(f => (
                  <button key={f} onClick={() => setWorkflowFilter(f)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg font-semibold transition-all duration-200 ${
                      workflowFilter === f
                        ? "bg-[var(--gcp-blue)] text-white shadow-sm"
                        : "text-[var(--gcp-text-secondary)] hover:bg-[var(--gcp-surface)] border border-transparent hover:border-[var(--gcp-grey)]"
                    }`}
                  >{f.charAt(0).toUpperCase() + f.slice(1)}</button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="gcp-table">
                <thead className="sticky top-0 bg-[var(--gcp-surface)] z-10">
                  <tr>
                    <th className="text-[11px] font-semibold uppercase tracking-wider">Run</th>
                    <th className="text-[11px] font-semibold uppercase tracking-wider">Workflow</th>
                    <th className="text-[11px] font-semibold uppercase tracking-wider">Status</th>
                    <th className="text-[11px] font-semibold uppercase tracking-wider">Duration</th>
                    <th className="text-[11px] font-semibold uppercase tracking-wider">Branch</th>
                    <th className="text-[11px] font-semibold uppercase tracking-wider">Actor</th>
                    <th className="text-[11px] font-semibold uppercase tracking-wider">Commit</th>
                    <th className="text-[11px] font-semibold uppercase tracking-wider w-20 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRuns.map((run, i) => (
                    <tr key={run.id} className={`group transition-colors ${
                      i === 0 && run.status === "running" ? "bg-[var(--gcp-blue-bg)]" : ""
                    } hover:bg-[var(--gcp-surface-hover)]`}>
                      <td className="font-mono text-[12px]">
                        <span className="text-[var(--gcp-blue)] font-semibold">#{run.id}</span>
                      </td>
                      <td className="text-[12px] font-medium">{run.name}</td>
                      <td>
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                          run.status === "running" ? "bg-[var(--gcp-blue-bg)] text-[var(--gcp-blue)]" :
                          run.status === "completed" ? "bg-[var(--gcp-green-bg)] text-[var(--gcp-green)]" :
                          run.status === "failed" ? "bg-[var(--gcp-red-bg)] text-[var(--gcp-red)]" :
                          "bg-[var(--gcp-grey-bg)] text-[var(--gcp-text-secondary)]"
                        }`}>
                          {run.status === "running" && <><span className="w-1.5 h-1.5 rounded-full bg-[var(--gcp-blue)] animate-[pulse-dot_0.8s_ease-in-out_infinite]" /> Running</>}
                          {run.status === "completed" && <><Check size={10} /> Completed</>}
                          {run.status === "failed" && "Failed"}
                          {run.status === "queued" && "Queued"}
                        </span>
                      </td>
                      <td className="text-[12px] text-[var(--gcp-text-secondary)] font-mono">{run.duration}</td>
                      <td className="text-[12px]">
                        <code className="px-1.5 py-0.5 bg-[var(--gcp-grey-bg)] rounded-md text-[11px] font-mono font-medium">{run.branch}</code>
                      </td>
                      <td className="text-[12px] text-[var(--gcp-text-secondary)]">
                        <span className="flex items-center gap-1"><User size={11} className="opacity-60" /> {run.actor}</span>
                      </td>
                      <td className="font-mono text-[11px] text-[var(--gcp-text-secondary)]">
                        <code className="px-1 py-0.5 bg-[var(--gcp-grey-bg)] rounded text-[10px]">{run.sha}</code>
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => navTo(`RunDetail?runId=${getRunId(i)}`)}
                            className="p-1.5 text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-blue)] hover:bg-[var(--gcp-blue-bg)] rounded-lg transition-all duration-200"
                            title="View run details"
                          ><ExternalLink size={12} /></button>
                          <button onClick={() => navTo(`Compare?baseline=${RUNS[0].id}&candidate=${getRunId(i)}`)}
                            className="p-1.5 text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-blue)] hover:bg-[var(--gcp-blue-bg)] rounded-lg transition-all duration-200"
                            title="Compare this run"
                          ><GitCompare size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 border-t border-[var(--gcp-grey)] flex justify-between items-center text-[11px] text-[var(--gcp-text-secondary)] bg-[var(--gcp-surface-hover)]">
              <span className="font-medium">Showing {filteredRuns.length} of {WORKFLOW_RUNS.length} runs</span>
              <a href={`https://github.com/ruake/AWARE/actions`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[var(--gcp-blue)] hover:underline font-semibold transition-colors"
              >View all on GitHub <ExternalLink size={11} /></a>
            </div>
          </div>
        </div>

        {/* Architecture Explanation */}
        <div className="gcp-card p-5 shrink-0 rounded-xl">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--gcp-blue)] to-[#4a90d9] flex items-center justify-center shadow-sm">
              <FileJson size={13} className="text-white" />
            </div>
            <span className="text-sm font-semibold">How it works — Static File Status Pipeline</span>
          </div>
          <div className="grid grid-cols-3 gap-8 text-[12px] text-[var(--gcp-text-secondary)] leading-relaxed">
            {[
              { num: "1", title: "GitHub Actions publishes", desc: "After tests complete, the workflow runs ", code: "pnpm publish:status", desc2: " which generates ", code2: "status.json", desc3: " and pushes it to the ", code3: "gh-pages", desc4: " branch." },
              { num: "2", title: "Portal polls for changes", desc: "The ", code: "useLiveStatus", desc2: " hook polls ", code2: "status.json", desc3: " every 30s using fetch with ETag headers to detect updates." },
              { num: "3", title: "UI updates in real-time", desc: "Bell badge shows a count, a toast appears, and Dashboard/Runs/Compare pages re-render with fresh data — no page reload needed." },
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--gcp-blue)] to-[#4a90d9] flex items-center justify-center shrink-0 shadow-sm">
                  <span className="text-[11px] font-bold text-white">{item.num}</span>
                </div>
                <div>
                  <span className="font-semibold text-[var(--gcp-text)]">{item.title}</span><br />
                  {item.desc}
                  {item.code && <code className="px-1 bg-[var(--gcp-grey-bg)] rounded font-mono text-[11px]">{item.code}</code>}
                  {item.desc2}
                  {item.code2 && <code className="px-1 bg-[var(--gcp-grey-bg)] rounded font-mono text-[11px]">{item.code2}</code>}
                  {item.desc3}
                  {item.code3 && <code className="px-1 bg-[var(--gcp-grey-bg)] rounded font-mono text-[11px]">{item.code3}</code>}
                  {item.desc4}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
