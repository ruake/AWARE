import React from "react";
import { AppLayout } from "./_shared/AppLayout";
import { useSyncRuns, useSyncDiffs } from "./_shared/hooks";
import { repo } from "./_shared/nav";
import "./_group.css";
import { Info, GitCompare, List, FileText, LayoutDashboard, ExternalLink, Github, Shield, Users, Zap, BarChart3 } from "lucide-react";

const FEATURES = [
  { icon: LayoutDashboard, label: "Cross-Target Dashboard", desc: "Gauge + trend charts showing pass-rate health across Prod/Staging and UAT environments." },
  { icon: List, label: "Runs Browser", desc: "Searchable, filterable table of all test runs with status badges, pass percentages, and one-click navigation." },
  { icon: FileText, label: "Run Detail Viewer", desc: "Split-panel view showing test results alongside raw HTTP evidence — request, response headers, PM variables. Keyboard-navigable." },
  { icon: GitCompare, label: "Comparison Engine", desc: "Side-by-side diff of any two runs. Detects regressions, fixes, and duration changes. Click any test for full run-history analytics." },
  { icon: BarChart3, label: "Test Analytics", desc: "Per-test pass-rate trend, flakiness score, duration timeline, and environment breakdown powered by Google Charts." },
  { icon: Zap, label: "Global Search", desc: "Quick-search across tests, runs, and comparisons via ⌘K palette. Filter by type and navigate instantly." },
];

export function About() {
  const runs = useSyncRuns();
  const diffs = useSyncDiffs();
  const STATS = [
    { label: "Total Runs Indexed", value: runs.length, suffix: "+" },
    { label: "Tests Tracked", value: "280", suffix: "+" },
    { label: "Environments", value: "4", suffix: "" },
    { label: "Avg Pass Rate", value: "86", suffix: "%" },
    { label: "Regressions (last 30d)", value: diffs.filter(d => d.state === "regression").length, suffix: "" },
    { label: "Duration Regressions", value: diffs.filter(d => d.state === "duration").length, suffix: "" },
  ];

  return (
    <AppLayout activeTab="about">
      <div className="max-w-[1200px] mx-auto space-y-6">

        {/* Hero */}
        <div className="gcp-card p-8 bg-gradient-to-br from-[var(--gcp-blue-bg)] to-transparent">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-xl bg-[var(--gcp-blue)] flex items-center justify-center text-white font-bold text-2xl tracking-tighter shrink-0">
              AW
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[var(--gcp-text)]">A.W.A.K.E.</h1>
              <p className="text-lg text-[var(--gcp-text-secondary)]">
                Akamai Web Analyser &amp; Kit for Evaluations
              </p>
              <p className="text-[var(--gcp-text-secondary)] text-[13px] mt-3 leading-relaxed max-w-[640px]">
                A mockup concept for a cross-target test observability platform. Browse runs, inspect
                failing HTTP evidence, compare any two runs side-by-side, and drill into per-test
                analytics — all within a single-window workflow.
              </p>
              <div className="flex items-center gap-4 mt-4 text-sm">
                <span className="flex items-center gap-1.5 text-[var(--gcp-text-secondary)]">
                  <span className="w-2 h-2 rounded-full bg-[var(--gcp-green)]" /> v2.0.0-mockup
                </span>
                <span className="flex items-center gap-1.5 text-[var(--gcp-text-secondary)]">
                  <BarChart3 size={14} /> Google Charts
                </span>
                <a href={repo} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[var(--gcp-blue)] hover:underline">
                  <Github size={14} /> View source <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-6 gap-3">
          {STATS.map(s => (
            <div key={s.label} className="gcp-card p-3 text-center">
              <div className="text-sm text-[var(--gcp-text-secondary)] truncate" title={s.label}>{s.label}</div>
              <div className="text-2xl font-bold text-[var(--gcp-blue)] mt-1">{s.value}{s.suffix}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div>
          <h2 className="text-base font-medium text-[var(--gcp-text)] mb-3 flex items-center gap-2">
            <Zap size={16} className="text-[var(--gcp-blue)]" /> Features
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {FEATURES.map(f => (
              <div key={f.label} className="gcp-card p-4 hover:bg-[var(--gcp-surface-hover)] transition-colors">
                <f.icon size={18} className="text-[var(--gcp-blue)] mb-2" />
                <h3 className="font-medium text-sm text-[var(--gcp-text)]">{f.label}</h3>
                <p className="text-[12px] text-[var(--gcp-text-secondary)] mt-1 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="gcp-card p-5">
          <h2 className="text-base font-medium text-[var(--gcp-text)] mb-3 flex items-center gap-2">
            <Shield size={16} className="text-[var(--gcp-blue)]" /> Tech Stack
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[var(--gcp-text-secondary)] text-[12px] mb-1">Framework</div>
              <div className="font-medium">React + TypeScript + Vite</div>
            </div>
            <div>
              <div className="text-[var(--gcp-text-secondary)] text-[12px] mb-1">Charts</div>
              <div className="font-medium">react-google-charts (Gauge, Line, Bar, Column)</div>
            </div>
            <div>
              <div className="text-[var(--gcp-text-secondary)] text-[12px] mb-1">Icons</div>
              <div className="font-medium">lucide-react</div>
            </div>
            <div>
              <div className="text-[var(--gcp-text-secondary)] text-[12px] mb-1">Styling</div>
              <div className="font-medium">Custom CSS variables + Tailwind-like utility classes</div>
            </div>
            <div>
              <div className="text-[var(--gcp-text-secondary)] text-[12px] mb-1">Design Pattern</div>
              <div className="font-medium">Shared data context via _shared/data.ts module</div>
            </div>
            <div>
              <div className="text-[var(--gcp-text-secondary)] text-[12px] mb-1">Navigation</div>
              <div className="font-medium">Client-side via window.location.href + history.replaceState</div>
            </div>
          </div>
        </div>

        {/* Mockup Disclaimer */}
        <div className="gcp-card p-4 border-l-4 border-l-[var(--gcp-yellow)] bg-[var(--gcp-yellow-bg)]">
          <div className="flex items-start gap-3">
            <Info size={16} className="text-[var(--gcp-yellow)] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--gcp-text)]">Mockup / Demo</p>
              <p className="text-[12px] text-[var(--gcp-text-secondary)] mt-1">
                This is a frontend-only simulation. All run data, test results, and comparison diffs are
                generated deterministically from shared mock data. No real API calls, databases, or
                background workers are involved.
              </p>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
