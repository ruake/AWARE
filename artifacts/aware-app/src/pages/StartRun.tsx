import React from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/aware/AppLayout";
import { CiConfigBanner } from "@/components/aware/CiConfigBanner";
import { downloadCiConfig } from "@/lib/ciConfig";
import {
  Copy, Check, TerminalSquare, AlertCircle, Github, ArrowLeft,
  Minus, Plus, Zap, Clock, Play, ExternalLink, Download, FileText,
} from "lucide-react";

const SUITES = [
  { id: "full_suite",   label: "full_suite",   desc: "All tests (P0–P3)", count: 25 },
  { id: "geo_gating",  label: "geo_gating",   desc: "Geo routing rules", count: 8 },
  { id: "locale_match",label: "locale_match", desc: "Locale splitting", count: 6 },
  { id: "cache_key",   label: "cache_key",    desc: "Cache TTL/keys", count: 5 },
  { id: "edgeworker",  label: "edgeworker",   desc: "EdgeWorker JS", count: 4 },
  { id: "smoke",       label: "smoke",        desc: "Quick health", count: 5 },
];

const TARGETS = ["Prod/Production", "Prod/Staging", "UAT/Production", "UAT/Staging"];

const RECENT = [
  { label: "build-v892-rev-2341.1.0", suite: "full_suite",  target: "Prod/Production", status: "PASS", ago: "2h" },
  { label: "build-v891-rev-2340.0.1", suite: "geo_gating",  target: "Prod/Production", status: "FAIL", ago: "6h" },
  { label: "build-v892-rev-2341.1.0", suite: "smoke",       target: "UAT/Staging",     status: "PASS", ago: "1d" },
];

type TabId = "gh" | "curl" | "python";

function Stepper({ value, onChange, min = 1, max = 32 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--gcp-grey)", borderRadius: 4, overflow: "hidden", height: 32 }}>
      <button onClick={() => onChange(Math.max(min, value - 1))} style={{ padding: "0 8px", border: "none", background: "transparent", cursor: "pointer", borderRight: "1px solid var(--gcp-grey)", height: "100%", display: "flex", alignItems: "center" }}>
        <Minus size={11} />
      </button>
      <span style={{ padding: "0 12px", fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, minWidth: 36, textAlign: "center" }}>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} style={{ padding: "0 8px", border: "none", background: "transparent", cursor: "pointer", borderLeft: "1px solid var(--gcp-grey)", height: "100%", display: "flex", alignItems: "center" }}>
        <Plus size={11} />
      </button>
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{
      position: "relative", display: "inline-flex", width: 36, height: 20, borderRadius: 10,
      background: on ? "var(--gcp-blue)" : "var(--gcp-grey)", border: "none", cursor: "pointer",
      transition: "background 0.2s", flexShrink: 0,
    }}>
      <span style={{
        position: "absolute", top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: "50%",
        background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s",
      }} />
    </button>
  );
}

export default function StartRun() {
  const [suite, setSuite] = React.useState("full_suite");
  const [target, setTarget] = React.useState("Prod/Production");
  const [buildVersion, setBuildVersion] = React.useState("v892");
  const [revVersion, setRevVersion] = React.useState("2341.1.0");
  const [label, setLabel] = React.useState("");
  const [parallelism, setParallelism] = React.useState(4);
  const [retries, setRetries] = React.useState(1);
  const [failFast, setFailFast] = React.useState(true);
  const [tab, setTab] = React.useState<TabId>("gh");
  const [copied, setCopied] = React.useState(false);
  const [triggered, setTriggered] = React.useState(false);

  const effectiveLabel = label.trim() || `build-${buildVersion}-rev-${revVersion}`;

  const ghCmd = `gh workflow run regression.yml \\
  --field suite=${suite} \\
  --field target="${target}" \\
  --field build_version=${buildVersion} \\
  --field rev_version=${revVersion} \\
  --field label="${effectiveLabel}" \\
  --field parallelism=${parallelism} \\
  --field fail_fast=${failFast} \\
  --field retries=${retries}`;

  const curlCmd = `curl -sX POST \\
  -H "Authorization: Bearer $GH_TOKEN" \\
  -H "Accept: application/vnd.github+json" \\
  https://api.github.com/repos/ruake/AWARE/actions/workflows/regression.yml/dispatches \\
  -d '{"ref":"main","inputs":{"suite":"${suite}","target":"${target}","build_version":"${buildVersion}","rev_version":"${revVersion}","label":"${effectiveLabel}","parallelism":"${parallelism}","fail_fast":"${failFast}","retries":"${retries}"}}'`;

  const pyCmd = `import requests, os

requests.post(
    "https://api.github.com/repos/ruake/AWARE/actions/workflows/regression.yml/dispatches",
    headers={
        "Authorization": f"Bearer {os.environ['GH_TOKEN']}",
        "Accept": "application/vnd.github+json",
    },
    json={
        "ref": "main",
        "inputs": {
            "suite": "${suite}",
            "target": "${target}",
            "build_version": "${buildVersion}",
            "rev_version": "${revVersion}",
            "label": "${effectiveLabel}",
            "parallelism": "${parallelism}",
            "fail_fast": "${failFast}",
            "retries": "${retries}",
        },
    },
).raise_for_status()`;

  const cmds: Record<TabId, string> = { gh: ghCmd, curl: curlCmd, python: pyCmd };

  const handleCopy = () => {
    navigator.clipboard.writeText(cmds[tab]).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const handleTrigger = () => {
    const url = `https://github.com/ruake/PROOF/actions/workflows/regression.yml`;
    window.open(url, "_blank", "noopener");
    setTriggered(true);
    setTimeout(() => setTriggered(false), 3000);
  };

  const selectedSuite = SUITES.find(s => s.id === suite);

  return (
    <AppLayout activeHref="/start">
      <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "calc(100vh - 100px)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--gcp-text)" }}>Start Regression Run</h1>
            <p style={{ fontSize: 12, color: "var(--gcp-text-secondary)", marginTop: 3 }}>
              Configure and dispatch a GitHub Actions workflow to test application changes
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--gcp-grey-bg)", border: "1px solid var(--gcp-grey)", borderRadius: 4, padding: "5px 12px", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gcp-text-secondary)" }}>
            <TerminalSquare size={13} /> regression.yml
          </div>
        </div>

        {/* Suite selector */}
        <div className="gcp-card" style={{ padding: 14, flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>Test Suite</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SUITES.map(s => (
              <button key={s.id} onClick={() => setSuite(s.id)} style={{
                display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "8px 12px", borderRadius: 4, border: "1px solid",
                borderColor: suite === s.id ? "var(--gcp-blue)" : "var(--gcp-grey)",
                background: suite === s.id ? "var(--gcp-blue)" : "var(--gcp-surface)",
                color: suite === s.id ? "white" : "var(--gcp-text-secondary)",
                cursor: "pointer", transition: "all 0.15s", gap: 2,
              }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600 }}>{s.label}</span>
                <span style={{ fontSize: 10, opacity: 0.8 }}>{s.desc} · {s.count} tests</span>
              </button>
            ))}
          </div>
        </div>

        {/* Target + versions */}
        <div className="gcp-card" style={{ padding: 14, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>Target Environment</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {TARGETS.map(t => (
                  <button key={t} onClick={() => setTarget(t)} style={{
                    padding: "5px 12px", borderRadius: 4, border: "1px solid",
                    borderColor: target === t ? "var(--gcp-blue)" : "var(--gcp-grey)",
                    background: target === t ? "var(--gcp-blue)" : "var(--gcp-surface)",
                    color: target === t ? "white" : "var(--gcp-text-secondary)",
                    fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
                  }}>{t}</button>
                ))}
              </div>
            </div>
            <div style={{ width: 1, alignSelf: "stretch", background: "var(--gcp-grey)" }} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>Build Version</div>
              <input value={buildVersion} onChange={e => setBuildVersion(e.target.value)} className="gcp-input" style={{ width: 110, fontFamily: "var(--font-mono)", textAlign: "center", fontWeight: 700 }} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>Rev Version</div>
              <input value={revVersion} onChange={e => setRevVersion(e.target.value)} className="gcp-input" style={{ width: 110, fontFamily: "var(--font-mono)", textAlign: "center", fontWeight: 700 }} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>
                Label <span style={{ fontWeight: 400 }}>(optional)</span>
              </div>
              <input value={label} onChange={e => setLabel(e.target.value)} className="gcp-input" placeholder={effectiveLabel} style={{ width: 200, fontSize: 12 }} />
            </div>
          </div>
        </div>

        {/* Execution options */}
        <div className="gcp-card" style={{ padding: 14, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>Parallelism</div>
              <Stepper value={parallelism} onChange={setParallelism} />
            </div>
            <div style={{ width: 1, alignSelf: "stretch", background: "var(--gcp-grey)" }} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>Retries</div>
              <Stepper value={retries} onChange={setRetries} min={0} max={5} />
            </div>
            <div style={{ width: 1, alignSelf: "stretch", background: "var(--gcp-grey)" }} />
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 2 }}>Fail Fast</div>
                <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>Stop on first failure</div>
              </div>
              <Toggle on={failFast} onToggle={() => setFailFast(f => !f)} />
            </label>
            <div style={{ width: 1, alignSelf: "stretch", background: "var(--gcp-grey)" }} />
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>Recent Presets</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {RECENT.map((r, i) => (
                  <button key={i} onClick={() => {
                    const parts = r.label.split("-");
                    setBuildVersion(parts[1] ?? "v892");
                    setRevVersion(r.label.split("rev-")[1] ?? "2341.1.0");
                    setSuite(r.suite); setTarget(r.target);
                  }} style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "4px 10px",
                    fontFamily: "var(--font-mono)", fontSize: 10, border: "1px solid var(--gcp-grey)",
                    borderRadius: 4, background: "var(--gcp-grey-bg)", cursor: "pointer",
                    transition: "all 0.15s",
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: r.status === "PASS" ? "var(--gcp-green)" : "var(--gcp-red)", flexShrink: 0 }} />
                    {r.label}
                    <span style={{ color: "var(--gcp-text-secondary)" }}>{r.ago}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Generated command */}
        <div className="gcp-card" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--gcp-grey)", background: "var(--gcp-grey-bg)", flexShrink: 0 }}>
            {([
              { id: "gh" as TabId, label: "gh CLI", icon: "⌘" },
              { id: "curl" as TabId, label: "curl", icon: "$" },
              { id: "python" as TabId, label: "Python SDK", icon: "🐍" },
            ]).map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 12, fontWeight: 500,
                border: "none", background: "transparent", cursor: "pointer",
                borderBottom: tab === t.id ? "2px solid var(--gcp-blue)" : "2px solid transparent",
                color: tab === t.id ? "var(--gcp-blue)" : "var(--gcp-text-secondary)",
                transition: "all 0.15s",
              }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
            <button onClick={handleCopy} className="gcp-button gcp-button-xs" style={{ marginLeft: "auto", marginRight: 12, color: copied ? "var(--gcp-green)" : "var(--gcp-blue)" }}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre style={{ flex: 1, overflowY: "auto", padding: 16, background: "#1e1e1e", color: "#d4d4d4", fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {cmds[tab]}
          </pre>
        </div>

        {/* CI Config download */}
        <div className="gcp-card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, flexWrap: "wrap", background: "var(--gcp-blue-bg)", border: "1px solid var(--gcp-blue)" }}>
          <FileText size={14} style={{ color: "var(--gcp-blue)" }} />
          <span style={{ fontSize: 12, flex: 1, color: "var(--gcp-text)" }}>
            <strong>CI config.</strong> Download the <code style={{ fontSize: 11, background: "rgba(26,115,232,0.1)", padding: "1px 5px", borderRadius: 3, fontFamily: "var(--font-mono)" }}>aware-test-config.yml</code> and commit to <code style={{ fontSize: 11, background: "rgba(26,115,232,0.1)", padding: "1px 5px", borderRadius: 3, fontFamily: "var(--font-mono)" }}>config/</code> to sync GHA with your test registry.
          </span>
          <button onClick={() => { downloadCiConfig(); }} className="gcp-button-primary gcp-button-xs">
            <Download size={12} /> Download YAML
          </button>
        </div>

        {/* Action bar */}
        <div className="gcp-card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/runs"><a className="gcp-button gcp-button-sm"><ArrowLeft size={13} /> Back to Runs</a></Link>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--gcp-yellow)" }}>
              <AlertCircle size={13} />
              Requires <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>GH_TOKEN</span> with <strong>workflow</strong> scope
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="gcp-button gcp-button-sm">
              <Zap size={13} /> Save as Preset
            </button>
            <button onClick={handleTrigger} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 20px", borderRadius: 4,
              background: triggered ? "var(--gcp-green)" : "var(--gcp-blue)",
              color: "white", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "all 0.2s", fontFamily: "var(--font-sans)", minWidth: 180, justifyContent: "center",
              boxShadow: "0 1px 3px rgba(26,115,232,0.4)",
            }}>
              {triggered ? <><Check size={14} /> Opened GitHub!</> : <><Github size={14} /> Open GitHub Actions</>}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
