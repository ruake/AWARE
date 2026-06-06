import React from "react";
import { AppLayout } from "./_shared/AppLayout";
import "./_group.css";
import {
  Play, Copy, Check, TerminalSquare, AlertCircle,
  ChevronUp, ChevronDown, Minus, Plus, Zap, Clock,
} from "lucide-react";

const SUITES = [
  { id: "full_suite",    label: "full_suite",    desc: "All tests" },
  { id: "geo_gating",    label: "geo_gating",    desc: "Geo rules" },
  { id: "locale_match",  label: "locale_match",  desc: "Locale" },
  { id: "cache_key",     label: "cache_key",     desc: "Cache" },
  { id: "edgeworker",    label: "edgeworker",    desc: "EW" },
  { id: "smoke",         label: "smoke",         desc: "Smoke" },
];

const TARGETS = ["Prod/Production", "Prod/Staging", "UAT/Production", "UAT/Staging"];

const RECENT = [
  { label: "pm-892-ew-2341.1.0", suite: "full_suite",  target: "Prod/Production", status: "PASS", ago: "2h" },
  { label: "pm-891-ew-2340.0.1", suite: "geo_gating",  target: "Prod/Production", status: "FAIL", ago: "6h" },
  { label: "pm-892-ew-2341.1.0", suite: "smoke",       target: "UAT/Staging",     status: "PASS", ago: "1d" },
];

type TabId = "gh" | "curl" | "python";

function Stepper({
  value, onChange, min = 1, max = 32,
}: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-0 border border-[var(--gcp-grey)] rounded overflow-hidden h-8">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="px-2 h-full flex items-center text-[var(--gcp-text-secondary)] hover:bg-[var(--gcp-grey-bg)] transition-colors border-r border-[var(--gcp-grey)]"
      >
        <Minus size={11} />
      </button>
      <span className="px-3 text-[13px] font-mono font-medium text-[var(--gcp-text)] min-w-[2.5rem] text-center">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="px-2 h-full flex items-center text-[var(--gcp-text-secondary)] hover:bg-[var(--gcp-grey-bg)] transition-colors border-l border-[var(--gcp-grey)]"
      >
        <Plus size={11} />
      </button>
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none ${
        on ? "bg-[var(--gcp-blue)]" : "bg-[var(--gcp-grey)]"
      }`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 mt-0.5 ${on ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

export function StartRun() {
  const [suite, setSuite]           = React.useState("full_suite");
  const [target, setTarget]         = React.useState("Prod/Production");
  const [pmVersion, setPmVersion]   = React.useState("892");
  const [ewVersion, setEwVersion]   = React.useState("2341.1.0");
  const [label, setLabel]           = React.useState("");
  const [parallelism, setParallelism] = React.useState(4);
  const [retries, setRetries]       = React.useState(1);
  const [failFast, setFailFast]     = React.useState(true);
  const [tab, setTab]               = React.useState<TabId>("gh");
  const [copiedTab, setCopiedTab]   = React.useState<TabId | null>(null);
  const [triggered, setTriggered]   = React.useState(false);

  const effectiveLabel = label.trim() || `pm-${pmVersion}-ew-${ewVersion}`;

  const ghCmd = [
    `gh workflow run regression.yml \\`,
    `  --field suite=${suite} \\`,
    `  --field target="${target}" \\`,
    `  --field pm_version=${pmVersion} \\`,
    `  --field ew_version=${ewVersion} \\`,
    `  --field label="${effectiveLabel}" \\`,
    `  --field parallelism=${parallelism} \\`,
    `  --field fail_fast=${failFast} \\`,
    `  --field retries=${retries}`,
  ].join("\n");

  const curlCmd = `curl -sX POST \\
  -H "Authorization: Bearer $GH_TOKEN" \\
  -H "Accept: application/vnd.github+json" \\
  https://api.github.com/repos/salesforce/aware/actions/workflows/regression.yml/dispatches \\
  -d '{"ref":"main","inputs":{"suite":"${suite}","target":"${target}","pm_version":"${pmVersion}","ew_version":"${ewVersion}","label":"${effectiveLabel}","parallelism":"${parallelism}","fail_fast":"${failFast}","retries":"${retries}"}}'`;

  const pyCmd = `import requests, os

requests.post(
    "https://api.github.com/repos/salesforce/aware/actions/workflows/regression.yml/dispatches",
    headers={
        "Authorization": f"Bearer {os.environ['GH_TOKEN']}",
        "Accept": "application/vnd.github+json",
    },
    json={
        "ref": "main",
        "inputs": {
            "suite": "${suite}",
            "target": "${target}",
            "pm_version": "${pmVersion}",
            "ew_version": "${ewVersion}",
            "label": "${effectiveLabel}",
            "parallelism": "${parallelism}",
            "fail_fast": "${failFast}",
            "retries": "${retries}",
        },
    },
).raise_for_status()`;

  const cmdMap: Record<TabId, string> = { gh: ghCmd, curl: curlCmd, python: pyCmd };

  const handleCopy = (t: TabId) => {
    setCopiedTab(t);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const handleTrigger = () => {
    setTriggered(true);
    setTimeout(() => setTriggered(false), 3000);
  };

  const GhLine = ({ line }: { line: string }) => {
    if (line.startsWith("gh")) return <span className="text-[#569cd6]">{line}{"\n"}</span>;
    const m = line.match(/^(\s+--field )(\w+)(=)(.+?)(\\?)(\s*)$/);
    if (m) return (
      <span>
        <span className="text-[#9cdcfe]">{m[1]}</span>
        <span className="text-[#4ec9b0]">{m[2]}</span>
        <span className="text-[#d4d4d4]">=</span>
        <span className="text-[#ce9178]">{m[4]}</span>
        {m[5] && <span className="text-[#569cd6]">{m[5]}</span>}
        {"\n"}
      </span>
    );
    return <span>{line}{"\n"}</span>;
  };

  const CurlLine = ({ line }: { line: string }) => {
    if (line.includes("curl")) return <span className="text-[#569cd6]">{line}{"\n"}</span>;
    if (line.startsWith("  -H")) return <span className="text-[#4ec9b0]">{line}{"\n"}</span>;
    if (line.startsWith("  https")) return <span className="text-[#9cdcfe]">{line}{"\n"}</span>;
    if (line.startsWith("  -d")) return <span className="text-[#ce9178]">{line}{"\n"}</span>;
    return <span>{line}{"\n"}</span>;
  };

  const PyLine = ({ line }: { line: string }) => {
    if (line.startsWith("import")) return <span><span className="text-[#c586c0]">import</span><span className="text-[#d4d4d4]">{line.slice(6)}</span>{"\n"}</span>;
    if (line.includes('"""') || (line.trim().startsWith('"') && line.trim().endsWith('",'))) return <span className="text-[#ce9178]">{line}{"\n"}</span>;
    if (line.trim().startsWith("#")) return <span className="text-[#6a9955]">{line}{"\n"}</span>;
    if (line.includes("requests.post")) return <span><span className="text-[#dcdcaa]">requests</span><span className="text-[#d4d4d4]">.post(</span>{"\n"}</span>;
    if (line.includes("raise_for_status")) return <span><span className="text-[#d4d4d4]">{line.replace("raise_for_status", "")}</span><span className="text-[#dcdcaa]">raise_for_status</span><span className="text-[#d4d4d4]">()</span>{"\n"}</span>;
    if (line.includes('": "') || line.includes('": {')) {
      const keyMatch = line.match(/^(\s*)"(\w+)"(:\s*)(.*)$/);
      if (keyMatch) return (
        <span>
          {keyMatch[1]}
          <span className="text-[#9cdcfe]">"{keyMatch[2]}"</span>
          <span className="text-[#d4d4d4]">{keyMatch[3]}</span>
          <span className="text-[#ce9178]">{keyMatch[4]}</span>
          {"\n"}
        </span>
      );
    }
    return <span>{line}{"\n"}</span>;
  };

  return (
    <AppLayout activeTab="runs">
      <div className="flex flex-col gap-4 max-w-[1400px] mx-auto h-[calc(100vh-92px)]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-[20px] font-medium text-[var(--gcp-text)] leading-tight">Start Regression Run</h1>
            <p className="text-[12px] text-[var(--gcp-text-secondary)] mt-0.5">
              Configure and dispatch a GitHub Actions workflow
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--gcp-text-secondary)] bg-[var(--gcp-grey-bg)] border border-[var(--gcp-grey)] rounded px-3 py-1.5 font-mono">
            <TerminalSquare size={12} /> regression.yml
          </div>
        </div>

        {/* ── Suite Selector ── */}
        <div className="gcp-card p-4 shrink-0">
          <div className="text-[11px] font-semibold text-[var(--gcp-text-secondary)] uppercase tracking-widest mb-3">Test Suite</div>
          <div className="flex gap-2 flex-wrap">
            {SUITES.map(s => (
              <button
                key={s.id}
                onClick={() => setSuite(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded border text-[13px] font-medium transition-all duration-150 ${
                  suite === s.id
                    ? "bg-[var(--gcp-blue)] border-[var(--gcp-blue)] text-white shadow-sm"
                    : "bg-[var(--gcp-surface)] border-[var(--gcp-grey)] text-[var(--gcp-text-secondary)] hover:border-[var(--gcp-blue)] hover:text-[var(--gcp-blue)] hover:bg-[var(--gcp-blue-bg)]"
                }`}
              >
                <span className="font-mono text-[12px]">{s.label}</span>
                <span className={`text-[10px] ${suite === s.id ? "text-white/70" : "text-[var(--gcp-text-secondary)]"}`}>{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Target + Versions + Label (single row card) ── */}
        <div className="gcp-card p-4 shrink-0">
          <div className="flex items-start gap-6">
            {/* Target segmented */}
            <div className="flex-1">
              <div className="text-[11px] font-semibold text-[var(--gcp-text-secondary)] uppercase tracking-widest mb-2">Target</div>
              <div className="flex gap-1 flex-wrap">
                {TARGETS.map(t => (
                  <button
                    key={t}
                    onClick={() => setTarget(t)}
                    className={`px-3 py-1.5 rounded text-[12px] font-medium border transition-all duration-150 ${
                      target === t
                        ? "bg-[var(--gcp-blue)] border-[var(--gcp-blue)] text-white"
                        : "bg-[var(--gcp-surface)] border-[var(--gcp-grey)] text-[var(--gcp-text-secondary)] hover:border-[var(--gcp-blue)] hover:text-[var(--gcp-blue)] hover:bg-[var(--gcp-blue-bg)]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="w-px self-stretch bg-[var(--gcp-grey)]" />

            {/* PM Version */}
            <div className="w-28">
              <label className="block text-[11px] font-semibold text-[var(--gcp-text-secondary)] uppercase tracking-widest mb-2">PM Version</label>
              <input
                value={pmVersion}
                onChange={e => setPmVersion(e.target.value)}
                className="gcp-input w-full font-mono text-center text-[14px] font-medium h-9"
                placeholder="892"
              />
            </div>

            {/* EW Version */}
            <div className="w-32">
              <label className="block text-[11px] font-semibold text-[var(--gcp-text-secondary)] uppercase tracking-widest mb-2">EW Version</label>
              <input
                value={ewVersion}
                onChange={e => setEwVersion(e.target.value)}
                className="gcp-input w-full font-mono text-center text-[14px] font-medium h-9"
                placeholder="2341.1.0"
              />
            </div>

            {/* Label */}
            <div className="w-52">
              <label className="block text-[11px] font-semibold text-[var(--gcp-text-secondary)] uppercase tracking-widest mb-2">
                Label <span className="normal-case font-normal opacity-60">(optional)</span>
              </label>
              <input
                value={label}
                onChange={e => setLabel(e.target.value)}
                className="gcp-input w-full text-[13px] h-9"
                placeholder={effectiveLabel}
              />
            </div>
          </div>
        </div>

        {/* ── Execution Options (single row) ── */}
        <div className="gcp-card p-4 shrink-0">
          <div className="flex items-center gap-8">
            <div>
              <div className="text-[11px] font-semibold text-[var(--gcp-text-secondary)] uppercase tracking-widest mb-2">Parallelism</div>
              <Stepper value={parallelism} onChange={setParallelism} min={1} max={32} />
            </div>

            <div className="w-px self-stretch bg-[var(--gcp-grey)]" />

            <div>
              <div className="text-[11px] font-semibold text-[var(--gcp-text-secondary)] uppercase tracking-widest mb-2">Retries</div>
              <Stepper value={retries} onChange={setRetries} min={0} max={5} />
            </div>

            <div className="w-px self-stretch bg-[var(--gcp-grey)]" />

            <label className="flex items-center gap-3 cursor-pointer">
              <div>
                <div className="text-[11px] font-semibold text-[var(--gcp-text-secondary)] uppercase tracking-widest mb-1">Fail Fast</div>
                <div className="text-[11px] text-[var(--gcp-text-secondary)]">Stop on first failure</div>
              </div>
              <Toggle on={failFast} onToggle={() => setFailFast(!failFast)} />
            </label>

            <div className="w-px self-stretch bg-[var(--gcp-grey)]" />

            {/* Recent preset pills */}
            <div className="flex-1">
              <div className="text-[11px] font-semibold text-[var(--gcp-text-secondary)] uppercase tracking-widest mb-2">Recent Presets</div>
              <div className="flex gap-1.5 flex-wrap">
                {RECENT.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => { const [pm, , ew] = r.label.split("-"); setPmVersion(pm.replace("pm","")); setEwVersion(r.label.split("ew-")[1]); setSuite(r.suite); setTarget(r.target); }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono border border-[var(--gcp-grey)] rounded bg-[var(--gcp-grey-bg)] hover:bg-[var(--gcp-surface-hover)] hover:border-[var(--gcp-blue)] transition-colors"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.status === "PASS" ? "bg-[var(--gcp-green)]" : "bg-[var(--gcp-red)]"}`} />
                    {r.label}
                    <span className="text-[var(--gcp-text-secondary)] ml-0.5">{r.ago}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Generated Command ── */}
        <div className="gcp-card flex flex-col overflow-hidden flex-1 min-h-0">
          {/* Tab bar */}
          <div className="flex items-center border-b border-[var(--gcp-grey)] bg-[var(--gcp-grey-bg)] shrink-0">
            {([
              { id: "gh" as TabId,     label: "gh CLI",     icon: "⌘" },
              { id: "curl" as TabId,   label: "curl",        icon: "$" },
              { id: "python" as TabId, label: "Python SDK",  icon: "🐍" },
            ]).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-[12px] font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? "border-[var(--gcp-blue)] text-[var(--gcp-blue)] bg-[var(--gcp-surface)]"
                    : "border-transparent text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-text)] hover:bg-[var(--gcp-surface-hover)]"
                }`}
              >
                <span className="font-mono text-[10px]">{t.icon}</span>
                {t.label}
              </button>
            ))}
            <div className="ml-auto px-3 flex items-center gap-2">
              <button
                onClick={() => handleCopy(tab)}
                className="flex items-center gap-1.5 text-[11px] text-[var(--gcp-blue)] hover:text-[var(--gcp-blue-hover)] transition-colors px-2 py-1 rounded hover:bg-[var(--gcp-blue-bg)]"
              >
                {copiedTab === tab ? <Check size={11} className="text-[var(--gcp-green)]" /> : <Copy size={11} />}
                {copiedTab === tab ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Code */}
          <pre className="flex-1 overflow-auto p-4 text-[12.5px] font-mono bg-[#1e1e1e] text-[#d4d4d4] leading-[1.7]">
            {tab === "gh" && ghCmd.split("\n").map((line, i) => <GhLine key={i} line={line} />)}
            {tab === "curl" && curlCmd.split("\n").map((line, i) => <CurlLine key={i} line={line} />)}
            {tab === "python" && pyCmd.split("\n").map((line, i) => <PyLine key={i} line={line} />)}
          </pre>
        </div>

        {/* ── Action Bar ── */}
        <div className="gcp-card p-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-[var(--gcp-yellow)]">
            <AlertCircle size={12} />
            Requires <span className="font-mono">GH_TOKEN</span> with <strong>workflow</strong> scope
          </div>
          <div className="flex items-center gap-3">
            <button className="gcp-button text-[13px] px-4 py-2 flex items-center gap-1.5">
              <Zap size={13} /> Save as preset
            </button>
            <button
              onClick={handleTrigger}
              className={`flex items-center gap-2 px-5 py-2 rounded text-[13px] font-medium transition-all duration-200 min-w-[140px] justify-center ${
                triggered
                  ? "bg-[var(--gcp-green)] text-white shadow-sm"
                  : "bg-[var(--gcp-blue)] text-white hover:bg-[var(--gcp-blue-hover)] shadow-sm"
              }`}
            >
              {triggered ? (
                <><Check size={14} /> Dispatched!</>
              ) : (
                <><Play size={14} /> Trigger Run</>
              )}
            </button>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
