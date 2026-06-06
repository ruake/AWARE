import React from "react";
import { AppLayout } from "./_shared/AppLayout";
import "./_group.css";
import { Play, Copy, Check, ChevronDown, TerminalSquare, AlertCircle, Info } from "lucide-react";

const SUITES = ["full_suite", "geo_gating", "locale_match", "cache_key", "edgeworker", "smoke"];
const TARGETS = ["Prod/Production", "Prod/Staging", "UAT/Production", "UAT/Staging"];
const ENVS = ["production", "staging", "uat"];
const PARALLELISM = ["1", "2", "4", "8", "16"];

export function StartRun() {
  const [suite, setSuite] = React.useState("full_suite");
  const [target, setTarget] = React.useState("Prod/Production");
  const [pmVersion, setPmVersion] = React.useState("892");
  const [ewVersion, setEwVersion] = React.useState("2341.1.0");
  const [label, setLabel] = React.useState("");
  const [parallelism, setParallelism] = React.useState("4");
  const [failFast, setFailFast] = React.useState(true);
  const [retries, setRetries] = React.useState("1");
  const [env, setEnv] = React.useState("production");
  const [copied, setCopied] = React.useState(false);
  const [triggered, setTriggered] = React.useState(false);

  const labelValue = label.trim() || `pm-${pmVersion}-ew-${ewVersion}`;

  const ghCommand = `gh workflow run regression.yml \\
  --field suite=${suite} \\
  --field target="${target}" \\
  --field pm_version=${pmVersion} \\
  --field ew_version=${ewVersion} \\
  --field label="${labelValue}" \\
  --field parallelism=${parallelism} \\
  --field fail_fast=${failFast} \\
  --field retries=${retries} \\
  --field env=${env}`;

  const curlCommand = `curl -X POST \\
  -H "Accept: application/vnd.github+json" \\
  -H "Authorization: Bearer $GH_TOKEN" \\
  https://api.github.com/repos/salesforce/aware/actions/workflows/regression.yml/dispatches \\
  -d '{
    "ref": "main",
    "inputs": {
      "suite": "${suite}",
      "target": "${target}",
      "pm_version": "${pmVersion}",
      "ew_version": "${ewVersion}",
      "label": "${labelValue}",
      "parallelism": "${parallelism}",
      "fail_fast": "${failFast}",
      "retries": "${retries}",
      "env": "${env}"
    }
  }'`;

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTrigger = () => {
    setTriggered(true);
    setTimeout(() => setTriggered(false), 3000);
  };

  const SelectField = ({
    label: fieldLabel,
    value,
    onChange,
    options,
    hint,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: string[];
    hint?: string;
  }) => (
    <div>
      <label className="block text-[12px] font-medium text-[var(--gcp-text-secondary)] uppercase tracking-wider mb-1">
        {fieldLabel}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="gcp-input w-full appearance-none pr-8 cursor-pointer"
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--gcp-text-secondary)] pointer-events-none" />
      </div>
      {hint && <p className="text-[11px] text-[var(--gcp-text-secondary)] mt-1">{hint}</p>}
    </div>
  );

  return (
    <AppLayout activeTab="runs">
      <div className="max-w-[960px] mx-auto space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-medium text-[var(--gcp-text)]">Start Regression Run</h1>
            <p className="text-[13px] text-[var(--gcp-text-secondary)] mt-0.5">
              Configure parameters and trigger a GitHub Actions workflow dispatch.
            </p>
          </div>
          <div className="flex items-center gap-1 text-[12px] text-[var(--gcp-text-secondary)] bg-[var(--gcp-grey-bg)] px-3 py-1.5 rounded border border-[var(--gcp-grey)]">
            <Info size={13} className="mr-1" />
            Workflow: <span className="font-mono ml-1 text-[var(--gcp-text)]">regression.yml</span>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_1fr] gap-6">

          {/* ── Left: Form ── */}
          <div className="space-y-5">

            <div className="gcp-card p-5 space-y-4">
              <h2 className="text-[13px] font-medium text-[var(--gcp-text-secondary)] uppercase tracking-wider border-b border-[var(--gcp-grey)] pb-2">
                Run Configuration
              </h2>

              <SelectField label="Test Suite" value={suite} onChange={setSuite} options={SUITES}
                hint="Selects the pytest mark to collect." />

              <SelectField label="Target" value={target} onChange={setTarget} options={TARGETS}
                hint="PM environment × Akamai network pair." />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-[var(--gcp-text-secondary)] uppercase tracking-wider mb-1">
                    PM Version
                  </label>
                  <input
                    className="gcp-input w-full font-mono"
                    value={pmVersion}
                    onChange={(e) => setPmVersion(e.target.value)}
                    placeholder="892"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[var(--gcp-text-secondary)] uppercase tracking-wider mb-1">
                    EW Version
                  </label>
                  <input
                    className="gcp-input w-full font-mono"
                    value={ewVersion}
                    onChange={(e) => setEwVersion(e.target.value)}
                    placeholder="2341.1.0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[var(--gcp-text-secondary)] uppercase tracking-wider mb-1">
                  Label <span className="normal-case font-normal">(optional)</span>
                </label>
                <input
                  className="gcp-input w-full"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={`pm-${pmVersion}-ew-${ewVersion}`}
                />
              </div>

              <SelectField label="Environment" value={env} onChange={setEnv} options={ENVS} />
            </div>

            <div className="gcp-card p-5 space-y-4">
              <h2 className="text-[13px] font-medium text-[var(--gcp-text-secondary)] uppercase tracking-wider border-b border-[var(--gcp-grey)] pb-2">
                Execution Options
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Parallelism" value={parallelism} onChange={setParallelism} options={PARALLELISM}
                  hint="Number of parallel workers." />
                <div>
                  <label className="block text-[12px] font-medium text-[var(--gcp-text-secondary)] uppercase tracking-wider mb-1">
                    Retries
                  </label>
                  <input
                    className="gcp-input w-full font-mono"
                    value={retries}
                    onChange={(e) => setRetries(e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setFailFast(!failFast)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${failFast ? "bg-[var(--gcp-blue)]" : "bg-[var(--gcp-grey)]"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${failFast ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <span className="text-[13px] text-[var(--gcp-text)]">Fail fast on first failure</span>
              </label>
            </div>

            {/* Trigger button */}
            <div className="flex gap-3">
              <button
                onClick={handleTrigger}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded text-[13px] font-medium transition-colors ${
                  triggered
                    ? "bg-[var(--gcp-green)] text-white"
                    : "gcp-button gcp-button-primary"
                }`}
              >
                {triggered ? (
                  <><Check size={15} /> Dispatched</>
                ) : (
                  <><Play size={15} /> Trigger Workflow</>
                )}
              </button>
              <button className="gcp-button px-4 py-2.5 text-[13px]">Save as preset</button>
            </div>

            {triggered && (
              <div className="flex items-start gap-2 text-[12px] text-[var(--gcp-green)] bg-[var(--gcp-green-bg)] border border-[var(--gcp-green)] rounded p-3">
                <Check size={14} className="mt-0.5 shrink-0" />
                Workflow dispatched. Run will appear in the Runs table within ~30 seconds.
              </div>
            )}
          </div>

          {/* ── Right: Generated commands ── */}
          <div className="space-y-4">
            <div className="gcp-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--gcp-grey-bg)] border-b border-[var(--gcp-grey)]">
                <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--gcp-text-secondary)]">
                  <TerminalSquare size={14} />
                  gh CLI
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-[11px] text-[var(--gcp-blue)] hover:text-[var(--gcp-blue-hover)] transition-colors"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="p-4 text-[12px] font-mono text-[var(--gcp-text)] bg-[#1e1e1e] text-[#d4d4d4] overflow-x-auto whitespace-pre leading-relaxed">
                {ghCommand.split("\n").map((line, i) => {
                  if (line.startsWith("gh workflow")) return <span key={i} className="text-[#569cd6]">{line}{"\n"}</span>;
                  const match = line.match(/^(\s+--field )(\w+)(=)(.+)(\\?)$/);
                  if (match) {
                    return (
                      <span key={i}>
                        <span className="text-[#9cdcfe]">{match[1]}</span>
                        <span className="text-[#4ec9b0]">{match[2]}</span>
                        <span className="text-[#d4d4d4]">{match[3]}</span>
                        <span className="text-[#ce9178]">{match[4]}</span>
                        {match[5] && <span className="text-[#569cd6]">{match[5]}</span>}
                        {"\n"}
                      </span>
                    );
                  }
                  return <span key={i}>{line}{"\n"}</span>;
                })}
              </pre>
            </div>

            <div className="gcp-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--gcp-grey-bg)] border-b border-[var(--gcp-grey)]">
                <div className="flex items-center gap-2 text-[12px] font-medium text-[var(--gcp-text-secondary)]">
                  <TerminalSquare size={14} />
                  curl / REST API
                </div>
                <button className="flex items-center gap-1.5 text-[11px] text-[var(--gcp-blue)] hover:text-[var(--gcp-blue-hover)]">
                  <Copy size={12} /> Copy
                </button>
              </div>
              <pre className="p-4 text-[12px] font-mono bg-[#1e1e1e] text-[#d4d4d4] overflow-x-auto whitespace-pre leading-relaxed max-h-[280px] overflow-y-auto">
                {curlCommand.split("\n").map((line, i) => {
                  if (line.includes("curl")) return <span key={i} className="text-[#569cd6]">{line}{"\n"}</span>;
                  if (line.includes("-H")) return <span key={i} className="text-[#4ec9b0]">{line}{"\n"}</span>;
                  if (line.includes('"') && !line.includes("https")) return <span key={i} className="text-[#ce9178]">{line}{"\n"}</span>;
                  if (line.includes("https")) return <span key={i} className="text-[#9cdcfe]">{line}{"\n"}</span>;
                  return <span key={i}>{line}{"\n"}</span>;
                })}
              </pre>
            </div>

            {/* Recent runs / presets */}
            <div className="gcp-card p-4">
              <h3 className="text-[12px] font-medium text-[var(--gcp-text-secondary)] uppercase tracking-wider mb-3">Recent Dispatches</h3>
              <div className="space-y-2">
                {[
                  { label: "pm-892-ew-2341.1.0", suite: "full_suite", target: "Prod/Production", status: "PASS", ago: "2h ago" },
                  { label: "pm-891-ew-2340.0.1", suite: "geo_gating", target: "Prod/Production", status: "FAIL", ago: "6h ago" },
                  { label: "pm-892-ew-2341.1.0", suite: "smoke", target: "UAT/Staging", status: "PASS", ago: "1d ago" },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-[var(--gcp-grey)] last:border-0">
                    <div>
                      <div className="text-[12px] font-mono font-medium text-[var(--gcp-text)]">{r.label}</div>
                      <div className="text-[11px] text-[var(--gcp-text-secondary)]">{r.suite} · {r.target}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`gcp-badge ${r.status === "PASS" ? "gcp-badge-pass" : "gcp-badge-fail"} text-[11px]`}>{r.status}</span>
                      <span className="text-[11px] text-[var(--gcp-text-secondary)]">{r.ago}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 text-[12px] text-[var(--gcp-text-secondary)] bg-[var(--gcp-yellow-bg)] border border-[var(--gcp-yellow)] rounded p-3">
              <AlertCircle size={13} className="mt-0.5 text-[var(--gcp-yellow)] shrink-0" />
              <span>Requires <span className="font-mono">GH_TOKEN</span> with <strong>workflow</strong> scope. Set via <span className="font-mono">gh auth login</span> or the <span className="font-mono">GH_TOKEN</span> env var.</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
