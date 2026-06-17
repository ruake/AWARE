import React, { useSyncExternalStore } from "react";
import { useLocation, useSearch } from "wouter";
import { useSyncedUrlState } from "@/lib/urlState";
import { subscribeToRuns, getRuns, subscribeToDiffRows, getDiffRows } from "@/lib/data";
import { getSelectedEnvSnapshot, subscribeToSelectedEnv, setSelectedEnvIds } from "@/lib/selectedEnv";
import { getCompareStats, subscribeToSidebarData } from "@/lib/sidebarData";
import { EnvSelector } from "@/components/console/EnvSelector";
import { Link2, Share2, Github, Zap, ExternalLink } from "lucide-react";

function copy(text: string) { navigator.clipboard.writeText(text).catch(() => {}); }

function StatCard({ stat, activeFilter, baseline, candidate }: { stat: { label: string; value: string | number; color: string; key: string; count: number }; activeFilter: string | null; baseline: string; candidate: string }) {
  const [, navigate] = useLocation();
  const isActive = stat.key === activeFilter;
  const maxVal = Math.max(stat.count, 1);
  const barWidth = ["total", "passRateDelta"].includes(stat.key) ? undefined : `${Math.min(100, Math.round((stat.count / maxVal) * 100))}%`;

  return (
    <div onClick={() => navigate(`/compare?baseline=${baseline}&candidate=${candidate}&filter=${isActive ? "" : stat.key}`)}
      style={{ padding: "5px 7px", borderRadius: 3, background: isActive ? "var(--proof-hover)" : "var(--proof-hover-light)", display: "flex", flexDirection: "column", gap: 1, cursor: "pointer", transition: "background 0.1s", border: isActive ? `1px solid ${stat.color}40` : "1px solid transparent" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = isActive ? "var(--proof-hover)" : "var(--proof-hover-light)"; }}
    >
      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", color: stat.color, lineHeight: 1.2 }}>{stat.value}</span>
      <span style={{ fontSize: 8, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "0.3px" }}>{stat.label}</span>
      {barWidth && (
        <div style={{ marginTop: 2, height: 3, borderRadius: 99, background: "var(--proof-bar-track)", overflow: "hidden" }}>
          <div style={{ width: barWidth, height: "100%", borderRadius: 99, background: stat.color, transition: "width 0.3s" }} />
        </div>
      )}
    </div>
  );
}

function CompareStatSummary() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const baseline = params.get("baseline");
  const candidate = params.get("candidate");
  const { stats, activeFilter } = useSyncExternalStore(subscribeToSidebarData, getCompareStats);

  if (!baseline || !candidate || stats.length === 0) {
    return (
      <div style={{ padding: "12px 10px", fontSize: 11, color: "var(--proof-text-secondary)", textAlign: "center", lineHeight: 1.5 }}>
        Select baseline and candidate runs to view diff statistics.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3, padding: "6px 8px", borderBottom: "1px solid var(--proof-border)" }}>
      {stats.map((s) => (
        <StatCard key={s.key} stat={s} activeFilter={activeFilter} baseline={baseline!} candidate={candidate!} />
      ))}
    </div>
  );
}

function EnvTags({ baseline, candidate }: { baseline: string; candidate: string }) {
  const envColor = (e: string) =>
    e === "QA" ? { color: "var(--proof-purple)", bg: "var(--proof-purple-bg)" }
    : e === "UAT" ? { color: "var(--proof-orange)", bg: "var(--proof-orange-bg)" }
    : { color: "var(--proof-green)", bg: "var(--proof-green-bg)" };
  const b = envColor(baseline);
  const c_ = envColor(candidate);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "1px 6px", borderRadius: 3, fontSize: 9, fontWeight: 600, background: b.bg, border: `1px solid ${b.color}`, color: b.color }}>{baseline}</span>
      <span style={{ fontSize: 9, color: "var(--proof-text-muted)" }}>vs</span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "1px 6px", borderRadius: 3, fontSize: 9, fontWeight: 600, background: c_.bg, border: `1px solid ${c_.color}`, color: c_.color }}>{candidate}</span>
    </div>
  );
}

export function ComparePanel() {
  const [, navigate] = useLocation();
  const { show } = { show: copy };
  const envSnap = useSyncExternalStore(subscribeToSelectedEnv, getSelectedEnvSnapshot);
  const runs = useSyncExternalStore(subscribeToRuns, getRuns);
  const diffs = useSyncExternalStore(subscribeToDiffRows, getDiffRows);
  const envRuns = envSnap.envIds.length > 0 ? runs.filter((r) => envSnap.envIds.includes(r.envId)) : runs;

  const [baseline, setBaseline] = useSyncedUrlState("baseline", "");
  const [candidate, setCandidate] = useSyncedUrlState("candidate", "");
  const [swapped, setSwapped] = React.useState(false);

  // Derive effective run IDs: use URL param if set, otherwise pick from envRuns
  const effectiveBaseline = baseline || envRuns[envRuns.length - 1]?.id || "";
  const effectiveCandidate = candidate || envRuns[0]?.id || "";
  const baselineRun = runs.find((r) => r.id === effectiveBaseline);
  const candidateRun = runs.find((r) => r.id === effectiveCandidate);

  const regressions = diffs.filter((d) => d.state === "regression");
  const fixed = diffs.filter((d) => d.state === "fixed");
  const duration = diffs.filter((d) => d.state === "duration");

  return (
    <>
      <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--proof-border)" }}>
        <EnvSelector currentEnvIds={envSnap.envIds} onEnvChange={setSelectedEnvIds} variant="topbar" />
      </div>

      <CompareStatSummary />

      {/* Run selectors */}
      <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--proof-border)", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.3px", flex: 1 }}>Baseline</span>
          <span style={{ fontSize: 9, fontWeight: 600, color: "var(--proof-blue)", textTransform: "uppercase", letterSpacing: "0.3px", flex: 1, textAlign: "right" }}>Candidate</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <select value={effectiveBaseline} onChange={(e) => { setBaseline(e.target.value); setSwapped(false); }} style={{ flex: 1, fontSize: 10, padding: "3px 5px", border: "1px solid var(--proof-border)", borderRadius: 3, background: "var(--proof-surface)", color: "var(--proof-text)", minWidth: 0 }}>
            {envRuns.map((r) => <option key={r.id} value={r.id}>{r.env} · {r.label || r.id}</option>)}
          </select>
          <button onClick={() => { const t = effectiveBaseline; setBaseline(effectiveCandidate); setCandidate(t); setSwapped(false); }} style={{ border: "1px solid var(--proof-border)", background: "var(--proof-surface)", cursor: "pointer", padding: "2px 5px", borderRadius: 3, color: "var(--proof-text-secondary)", fontSize: 10, flexShrink: 0 }}>⇄</button>
          <select value={effectiveCandidate} onChange={(e) => { setCandidate(e.target.value); setSwapped(false); }} style={{ flex: 1, fontSize: 10, padding: "3px 5px", border: "1px solid var(--proof-border)", borderRadius: 3, background: "var(--proof-surface)", color: "var(--proof-text)", minWidth: 0 }}>
            {envRuns.map((r) => <option key={r.id} value={r.id}>{r.env} · {r.label || r.id}</option>)}
          </select>
        </div>
        {/* Selected run env tags */}
        {baselineRun && candidateRun && <EnvTags baseline={baselineRun.env} candidate={candidateRun.env} />}
      </div>

      {/* Share / Report buttons */}
      <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--proof-border)", display: "flex", gap: 4, flexWrap: "wrap" }}>
        <button onClick={() => { copy(window.location.href); show("Permalink copied"); }} style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 7px", borderRadius: 4, border: "1px solid var(--proof-border)", background: "var(--proof-surface)", cursor: "pointer", color: "var(--proof-text-secondary)", fontSize: 9 }}>
          <Link2 size={10} /> Link
        </button>
        <button onClick={() => { copy(`Comparison: ${baseline} vs ${candidate}\nNew failures: ${regressions.length}\nFixed: ${fixed.length}\nDuration regressions: ${duration.length}`); show("Slack summary copied"); }} style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 7px", borderRadius: 4, border: "1px solid var(--proof-border)", background: "var(--proof-surface)", cursor: "pointer", color: "var(--proof-text-secondary)", fontSize: 9 }}>
          <Share2 size={10} /> Share
        </button>
        <button onClick={() => { copy(`## Regression Report\n**Baseline:** ${baseline}\n**Candidate:** ${candidate}\n\n### Regressions (${regressions.length})\n${regressions.map((r) => `- ${r.name}`).join("\n")}\n\n### Fixed (${fixed.length})\n${fixed.map((r) => `- ${r.name}`).join("\n")}`); show("Markdown report copied"); }} style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 7px", borderRadius: 4, border: "1px solid var(--proof-border)", background: "var(--proof-surface)", cursor: "pointer", color: "var(--proof-text-secondary)", fontSize: 9 }}>
          <Github size={10} /> Report
        </button>
      </div>

      {/* Comparison info strip */}
      {baselineRun && candidateRun && (
        <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--proof-border)" }}>
          <div style={{ padding: "6px 8px", borderRadius: 4, background: "var(--proof-grey-bg)", border: "1px solid var(--proof-grey)", fontSize: 9 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: "var(--proof-text-secondary)" }}>Baseline</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--proof-text)" }}>{baselineRun.envId}/{baselineRun.env}</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--proof-text-muted)" }}>build {baselineRun.build}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: "var(--proof-text-secondary)" }}>Candidate</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--proof-blue)" }}>{candidateRun.envId}/{candidateRun.env}</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--proof-text-muted)" }}>build {candidateRun.build}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", paddingTop: 4, borderTop: "1px solid var(--proof-border)" }}>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--proof-text-secondary)" }}>{diffs.length} tests</span>
              {regressions.length > 0 ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "1px 5px", borderRadius: 3, background: "var(--proof-red-bg)", border: "1px solid var(--proof-red)", color: "var(--proof-red)", fontWeight: 600 }}>
                  {regressions.length} regressed
                </span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "var(--proof-green)", fontWeight: 600 }}>
                  <Zap size={10} /> Ready
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
