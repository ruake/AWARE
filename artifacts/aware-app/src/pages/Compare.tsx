import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/aware/AppLayout";
import { CTAStatCard } from "@/components/aware/CTAStatCard";
import { PanelErrorBoundary } from "@/components/aware/PanelErrorBoundary";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { useSyncedUrlState } from "@/lib/urlState";
import { RUNS, DIFF_ROWS } from "@/lib/data";
import type { DiffRow } from "@/lib/types";
import {
  Link2, Github, Share2, BarChart3, ChevronLeft, ChevronRight, Zap, ArrowUpRight, Search,
} from "lucide-react";

function copy(text: string) { navigator.clipboard.writeText(text).catch(() => {}); }

function stateBadge(state: DiffRow["state"]) {
  const map: Record<string, { color: string; label: string }> = {
    regression: { color: "var(--proof-red)", label: "Regression" },
    fixed: { color: "var(--proof-green)", label: "Fixed" },
    duration: { color: "var(--proof-yellow)", label: "Duration ↑" },
    unchanged: { color: "var(--proof-text-secondary)", label: "Unchanged" },
    fishy: { color: "var(--proof-purple)", label: "Fishy ⚠" },
  };
  const s = map[state] ?? { color: "var(--proof-text-secondary)", label: state };
  return <span style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{s.label}</span>;
}

function SidePanel({ diff, diffs, selectedId, onSelect, navigate }: {
  diff: DiffRow; diffs: DiffRow[]; selectedId: string;
  onSelect: (id: string | null) => void; navigate: (href: string) => void;
}) {
  const { show, Toast } = useSimpleToast();
  const idx = diffs.findIndex(d => d.id === selectedId);
  const deltaMs = diff.durCand - diff.durBase;

  return (
    <div className="gcp-card" style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden", borderLeft: `3px solid ${diff.state === "regression" ? "var(--proof-red)" : diff.state === "fixed" ? "var(--proof-green)" : "var(--proof-blue)"}` }}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--proof-grey)", display: "flex", alignItems: "center", gap: 8, background: "var(--proof-blue-bg)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 1, border: "1px solid var(--proof-grey)", borderRadius: 4, background: "var(--proof-surface)" }}>
          <button disabled={idx <= 0} onClick={() => onSelect(diffs[idx - 1]?.id)} style={{ padding: "4px 7px", border: "none", background: "transparent", cursor: idx > 0 ? "pointer" : "not-allowed", color: idx > 0 ? "var(--proof-blue)" : "var(--proof-grey)" }}>
            <ChevronLeft size={13} />
          </button>
          <span style={{ fontSize: 10, color: "var(--proof-text-secondary)", padding: "0 4px" }}>{idx + 1}/{diffs.length}</span>
          <button disabled={idx >= diffs.length - 1} onClick={() => onSelect(diffs[idx + 1]?.id)} style={{ padding: "4px 7px", border: "none", background: "transparent", cursor: idx < diffs.length - 1 ? "pointer" : "not-allowed", color: idx < diffs.length - 1 ? "var(--proof-blue)" : "var(--proof-grey)" }}>
            <ChevronRight size={13} />
          </button>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--proof-blue)", flex: 1 }}>Comparison Detail</span>
        <button onClick={() => onSelect(null)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--proof-text-secondary)", fontSize: 18, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--proof-text)", lineHeight: 1.5, wordBreak: "break-all" }}>{diff.name}</div>
          <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
            <span className="gcp-badge gcp-badge-skip" style={{ fontSize: 10 }}>{diff.category}</span>
            {stateBadge(diff.state)}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ padding: 10, background: `var(--${diff.baseStatus === "PASS" ? "gcp-green-bg" : "gcp-red-bg"})`, borderRadius: 6, border: `1px solid ${diff.baseStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)"}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: diff.baseStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 4 }}>Baseline</div>
            <span className={`gcp-badge ${diff.baseStatus === "PASS" ? "gcp-badge-pass" : "gcp-badge-fail"}`} style={{ fontSize: 10 }}>{diff.baseStatus}</span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--proof-text)", marginTop: 6, fontWeight: 600 }}>{diff.durBase}ms</div>
          </div>
          <div style={{ padding: 10, background: `var(--${diff.candStatus === "PASS" ? "gcp-green-bg" : "gcp-red-bg"})`, borderRadius: 6, border: `1px solid ${diff.candStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)"}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: diff.candStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 4 }}>Candidate</div>
            <span className={`gcp-badge ${diff.candStatus === "PASS" ? "gcp-badge-pass" : "gcp-badge-fail"}`} style={{ fontSize: 10 }}>{diff.candStatus}</span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--proof-text)", marginTop: 6, fontWeight: 600 }}>{diff.durCand}ms</div>
          </div>
        </div>
        <div style={{ padding: 10, borderRadius: 6, border: "1px solid var(--proof-grey)", background: deltaMs > 20 ? "var(--proof-red-bg)" : deltaMs < -20 ? "var(--proof-green-bg)" : "var(--proof-grey-bg)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: deltaMs > 20 ? "var(--proof-red)" : deltaMs < -20 ? "var(--proof-green)" : "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 4 }}>Delta</div>
          <div style={{ display: "flex", gap: 16 }}>
            <div>
              <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>Status: </span>
              {diff.baseStatus === diff.candStatus
                ? <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>—</span>
                : <span style={{ fontSize: 11, fontWeight: 700, color: diff.state === "regression" ? "var(--proof-red)" : "var(--proof-green)" }}>{diff.baseStatus} → {diff.candStatus}</span>
              }
            </div>
            <div>
              <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>Duration: </span>
              {Math.abs(deltaMs) > 20
                ? <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: deltaMs > 0 ? "var(--proof-red)" : "var(--proof-green)" }}>{deltaMs > 0 ? "+" : ""}{deltaMs}ms</span>
                : <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--proof-text-secondary)" }}>~0ms</span>
              }
            </div>
          </div>
        </div>
        <div className="gcp-card" style={{ padding: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--proof-text-secondary)", textTransform: "uppercase", marginBottom: 8 }}>Visual Diff (Filmstrip)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {["Baseline", "Candidate"].map(label => (
              <div key={label} style={{ background: "var(--proof-grey-bg)", borderRadius: 4, height: 80, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4, border: "1px solid var(--proof-grey)" }}>
                <span style={{ fontSize: 20 }}>🎞</span>
                <span style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button onClick={() => navigate(`/analytics?testId=${diff.id}`)} className="gcp-button gcp-button-xs" style={{ justifyContent: "center" }}>
              <BarChart3 size={12} /> View Analytics <ArrowUpRight size={10} />
            </button>
            <button onClick={() => { copy(`${window.location.origin}/tests/${diff.id}`); show("Test permalink copied"); }} className="gcp-button gcp-button-xs" style={{ justifyContent: "center" }}>
              <Link2 size={12} /> Copy Test Permalink
            </button>
            <button onClick={() => { copy(`GitHub issue: Regression in ${diff.name}\nBaseline: ${diff.baseStatus} (${diff.durBase}ms)\nCandidate: ${diff.candStatus} (${diff.durCand}ms)`); show("GitHub issue template copied"); }}
              className="gcp-button gcp-button-xs" style={{ justifyContent: "center" }}>
              <Github size={12} /> File GitHub Issue
            </button>
        </div>
      </div>
      {Toast}
    </div>
  );
}

export default function Compare() {
  const [, navigate] = useLocation();
  const { show, Toast } = useSimpleToast();

  const [baseline, setBaseline] = useSyncedUrlState("baseline", RUNS[RUNS.length - 1]?.id ?? "");
  const [candidate, setCandidate] = useSyncedUrlState("candidate", RUNS[0]?.id ?? "");
  const [selectedId, setSelectedId] = useSyncedUrlState<string | null>("sel", null);
  const [searchText, setSearchText] = useSyncedUrlState("q", "");
  const [regressionsOnly, setRegressionsOnly] = useSyncedUrlState("regressions", false);
  const [activeFilter, setActiveFilter] = React.useState<string | null>(null);
  const [swapped, setSwapped] = React.useState(false);
  const baselineRun = RUNS.find(r => r.id === baseline);
  const candidateRun = RUNS.find(r => r.id === candidate);

  if (!baselineRun || !candidateRun) {
    return (
      <AppLayout activeHref="/compare">
        <div style={{ textAlign: "center", padding: 64 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--proof-text-primary)" }}>No runs to compare</h2>
          <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", marginTop: 8 }}>At least two runs are required for comparison.</p>
          <button onClick={() => navigate("/runs")} className="gcp-button" style={{ fontSize: 13, marginTop: 16 }}>View Runs</button>
        </div>
      </AppLayout>
    );
  }

  const diffs = React.useMemo(() => {
    if (!swapped) return DIFF_ROWS;
    return DIFF_ROWS.map(d => {
      const state: DiffRow["state"] = d.state === "regression" ? "fixed" : d.state === "fixed" ? "regression" : d.state;
      return { ...d, state, baseStatus: d.candStatus, candStatus: d.baseStatus, durBase: d.durCand, durCand: d.durBase };
    });
  }, [swapped]);
  const regressions = diffs.filter(d => d.state === "regression");
  const fixed = diffs.filter(d => d.state === "fixed");
  const duration = diffs.filter(d => d.state === "duration");
  const unchanged = diffs.filter(d => d.state === "unchanged");
  const categories = [...new Set(DIFF_ROWS.map(d => d.category))];

  const [colFilters, setColFilters] = React.useState<Record<string, string>>({});

  const filtered = React.useMemo(() => {
    return diffs.filter(d => {
      if (searchText && !d.name.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (regressionsOnly && d.state !== "regression") return false;
      if (activeFilter && d.state !== activeFilter) return false;
      for (const [field, val] of Object.entries(colFilters)) {
        if (!val) continue;
        const cell = String((d as unknown as Record<string, unknown>)[field] ?? "").toLowerCase();
        if (!cell.includes(val.toLowerCase())) return false;
      }
      return true;
    });
  }, [diffs, searchText, regressionsOnly, activeFilter, colFilters]);

  const selectedDiff = selectedId ? diffs.find(d => d.id === selectedId) ?? null : null;
  const hasActiveFilters = Object.values(colFilters).some(v => v);

  return (
    <AppLayout activeHref="/compare">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Run selectors */}
        <div className="gcp-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 240px", minWidth: 200 }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--proof-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Baseline Run</label>
            <select className="gcp-input" style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: 11 }} value={baseline} onChange={e => { setBaseline(e.target.value); setSwapped(false); }}>
              {RUNS.map(r => <option key={r.id} value={r.id}>{r.id} · {r.env} · Build {r.build} · Rev {r.rev}</option>)}
            </select>
            {baselineRun && (
              <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                <span className="gcp-badge gcp-badge-skip" style={{ fontSize: 9 }}>{baselineRun.target}</span>
                <span className="gcp-badge gcp-badge-skip" style={{ fontSize: 9 }}>{baselineRun.env}</span>
                <span className={`gcp-badge ${baselineRun.network === "production" ? "gcp-badge-pass" : "gcp-badge-flaky"}`} style={{ fontSize: 9 }}>{baselineRun.network}</span>
                <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--proof-text-secondary)", background: "var(--proof-grey-bg)", padding: "1px 5px", borderRadius: 3, border: "1px solid var(--proof-grey)" }}>Build {baselineRun.build}</span>
                <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--proof-text-secondary)", background: "var(--proof-grey-bg)", padding: "1px 5px", borderRadius: 3, border: "1px solid var(--proof-grey)" }}>Rev {baselineRun.rev}</span>
              </div>
            )}
          </div>
          <button onClick={() => { const t = baseline; setBaseline(candidate); setCandidate(t); setSwapped(p => !p); }} className="gcp-button gcp-button-sm" style={{ marginTop: 16 }}>⇄ Swap</button>
          <div style={{ flex: "1 1 240px", minWidth: 200 }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--proof-blue)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Candidate Run</label>
            <select className="gcp-input" style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: 11, borderColor: "var(--proof-blue)" }} value={candidate} onChange={e => { setCandidate(e.target.value); setSwapped(false); }}>
              {RUNS.map(r => <option key={r.id} value={r.id}>{r.id} · {r.env} · Build {r.build} · Rev {r.rev}</option>)}
            </select>
            {candidateRun && (
              <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                <span className="gcp-badge gcp-badge-skip" style={{ fontSize: 9 }}>{candidateRun.target}</span>
                <span className="gcp-badge gcp-badge-skip" style={{ fontSize: 9 }}>{candidateRun.env}</span>
                <span className={`gcp-badge ${candidateRun.network === "production" ? "gcp-badge-pass" : "gcp-badge-flaky"}`} style={{ fontSize: 9 }}>{candidateRun.network}</span>
                <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--proof-text-secondary)", background: "var(--proof-grey-bg)", padding: "1px 5px", borderRadius: 3, border: "1px solid var(--proof-grey)" }}>Build {candidateRun.build}</span>
                <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--proof-text-secondary)", background: "var(--proof-grey-bg)", padding: "1px 5px", borderRadius: 3, border: "1px solid var(--proof-grey)" }}>Rev {candidateRun.rev}</span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0, marginTop: 16, flexWrap: "wrap" }}>
            <button onClick={() => { copy(window.location.href); show("Permalink copied — URL always reflects current comparison"); }} className="gcp-button gcp-button-sm">
              <Link2 size={13} /> Permalink
            </button>
            <button onClick={() => { copy(`Comparison: ${baseline} vs ${candidate}\nNew failures: ${regressions.length}\nFixed: ${fixed.length}\nDuration regressions: ${duration.length}`); show("Slack summary copied"); }}
              className="gcp-button gcp-button-sm">
              <Share2 size={13} /> Share
            </button>
            <button onClick={() => { copy(`## Regression Report\n**Baseline:** ${baseline}\n**Candidate:** ${candidate}\n\n### Regressions (${regressions.length})\n${regressions.map(r => `- ${r.name}`).join("\n")}\n\n### Fixed (${fixed.length})\n${fixed.map(r => `- ${r.name}`).join("\n")}`); show("Markdown report copied"); }}
              className="gcp-button gcp-button-sm">
              <Github size={13} /> Report
            </button>
          </div>
        </div>

        {/* Summary tiles — clickable filters */}
        <PanelErrorBoundary label="Stat cards">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {[
              { label: "New Failures", value: `+${regressions.length}`, color: "var(--proof-red)", key: "regression" },
              { label: "Fixed", value: `+${fixed.length}`, color: "var(--proof-green)", key: "fixed" },
              { label: "Duration Regressions", value: `+${duration.length}`, color: "var(--proof-yellow)", key: "duration" },
              { label: "Unchanged", value: unchanged.length, color: "var(--proof-text-secondary)", key: "unchanged" },
            ].map(tile => (
              <CTAStatCard
                key={tile.label}
                label={tile.label}
                value={tile.value}
                accentColor={tile.color}
                active={activeFilter === tile.key}
                onClick={() => {
                  if (activeFilter === tile.key) {
                    setActiveFilter(null);
                  } else {
                    setActiveFilter(tile.key);
                    setRegressionsOnly(false);
                  }
                }}
              />
            ))}
          </div>
        </PanelErrorBoundary>

        {/* Run context ribbon */}
        <div style={{ background: "var(--proof-grey-bg)", border: "1px solid var(--proof-grey)", borderRadius: 4, padding: "6px 14px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 11 }}>
          <span style={{ fontWeight: 600, color: "var(--proof-text-secondary)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.3px" }}>Comparison</span>
          <span className="gcp-badge gcp-badge-skip" style={{ fontSize: 9 }}>{baselineRun?.target} / {baselineRun?.env}</span>
          <span className={`gcp-badge ${baselineRun?.network === "production" ? "gcp-badge-pass" : "gcp-badge-flaky"}`} style={{ fontSize: 9 }}>{baselineRun?.network}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--proof-text-secondary)" }}>Build {baselineRun?.build}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--proof-text-secondary)" }}>Rev {baselineRun?.rev}</span>
          <span style={{ color: "var(--proof-grey)", fontSize: 12 }}>|</span>
          <span className="gcp-badge gcp-badge-skip" style={{ fontSize: 9 }}>{candidateRun?.target} / {candidateRun?.env}</span>
          <span className={`gcp-badge ${candidateRun?.network === "production" ? "gcp-badge-pass" : "gcp-badge-flaky"}`} style={{ fontSize: 9 }}>{candidateRun?.network}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--proof-text-secondary)" }}>Build {candidateRun?.build}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--proof-text-secondary)" }}>Rev {candidateRun?.rev}</span>
          {regressions.length > 0 ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "var(--proof-red-bg)", border: "1px solid var(--proof-red)", borderRadius: 3, padding: "1px 6px", fontSize: 10 }}>
              <span className="gcp-badge gcp-badge-fail" style={{ fontSize: 8, padding: "0 4px" }}>{regressions.length}</span>
              Blocked
            </span>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: "var(--proof-green)", fontSize: 10, fontWeight: 600 }}>
              <Zap size={10} /> Ready to promote
            </span>
          )}
          <span style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>{diffs.length} tests</span>
        </div>

        {/* Table + side panel */}
        <PanelErrorBoundary label="Diff area">
          <div style={{ display: "flex", gap: 14 }}>
            <div className="gcp-card" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "60vh" }}>
              <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--proof-grey)", background: "var(--proof-grey-bg)", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 140 }}>
                  <Search size={13} style={{ color: "var(--proof-text-secondary)" }} />
                  <input className="gcp-input" placeholder="Search tests…" value={searchText} onChange={e => setSearchText(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
                  <input type="checkbox" checked={regressionsOnly} onChange={e => { setRegressionsOnly(e.target.checked); setActiveFilter(null); }} />
                  Regressions only
                </label>
                {hasActiveFilters && (
                  <button onClick={() => setColFilters({})} style={{ fontSize: 11, color: "var(--proof-red)", background: "none", border: "none", cursor: "pointer" }}>
                    Clear filters
                  </button>
                )}
                <span style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginLeft: "auto" }}>{filtered.length}/{diffs.length} tests</span>
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                <table className="gcp-table">
                  <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--proof-surface)" }}><tr>
                    <th><input className="gcp-input" placeholder="Name" value={colFilters.name ?? ""} onChange={e => setColFilters(f => ({ ...f, name: e.target.value }))} style={{ width: "100%", fontSize: 10, padding: "2px 6px" }} /></th>
                    <th>
                      <select className="gcp-input" style={{ fontSize: 10, padding: "2px 6px", width: "100%" }} value={colFilters.baseStatus ?? ""} onChange={e => setColFilters(f => ({ ...f, baseStatus: e.target.value }))}>
                        <option value="">Baseline</option>
                        <option value="PASS">PASS</option>
                        <option value="FAIL">FAIL</option>
                      </select>
                    </th>
                    <th>
                      <select className="gcp-input" style={{ fontSize: 10, padding: "2px 6px", width: "100%" }} value={colFilters.candStatus ?? ""} onChange={e => setColFilters(f => ({ ...f, candStatus: e.target.value }))}>
                        <option value="">Candidate</option>
                        <option value="PASS">PASS</option>
                        <option value="FAIL">FAIL</option>
                      </select>
                    </th>
                    <th style={{ textAlign: "right", fontSize: 10, color: "var(--proof-text-secondary)", fontWeight: 600, whiteSpace: "nowrap" }}>Δ Duration</th>
                    <th>
                      <select className="gcp-input" style={{ fontSize: 10, padding: "2px 6px", width: "100%" }} value={colFilters.category ?? ""} onChange={e => setColFilters(f => ({ ...f, category: e.target.value }))}>
                        <option value="">Category</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </th>
                    <th>
                      <select className="gcp-input" style={{ fontSize: 10, padding: "2px 6px", width: "100%" }} value={colFilters.state ?? ""} onChange={e => setColFilters(f => ({ ...f, state: e.target.value }))}>
                        <option value="">State</option>
                        <option value="regression">Regression</option>
                        <option value="fixed">Fixed</option>
                        <option value="duration">Duration ↑</option>
                        <option value="unchanged">Unchanged</option>
                      </select>
                    </th>
                    <th style={{ textAlign: "center", fontSize: 10, color: "var(--proof-text-secondary)" }}>Actions</th>
                  </tr></thead>
                  <tbody>
                    {filtered.map(d => {
                      const isSelected = selectedId === d.id;
                      const deltams = d.durCand - d.durBase;
                      return (
                        <tr key={d.id}
                          onClick={() => setSelectedId(isSelected ? null : d.id)}
                          style={{
                            cursor: "pointer",
                            background: isSelected ? "var(--proof-blue-bg)" : d.state === "regression" ? "rgba(217,48,37,0.04)" : d.state === "fixed" ? "rgba(30,142,62,0.04)" : undefined,
                            outline: isSelected ? "2px solid var(--proof-blue)" : "none",
                            outlineOffset: -2,
                          }}
                        >
                          <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--proof-blue)", fontWeight: 500, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</td>
                          <td><span className={`gcp-badge ${d.baseStatus === "PASS" ? "gcp-badge-pass" : "gcp-badge-fail"}`}>{d.baseStatus}</span></td>
                          <td><span className={`gcp-badge ${d.candStatus === "PASS" ? "gcp-badge-pass" : "gcp-badge-fail"}`}>{d.candStatus}</span></td>
                          <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                            {Math.abs(deltams) > 20
                              ? <span style={{ color: deltams > 0 ? "var(--proof-red)" : "var(--proof-green)", fontWeight: 700 }}>{deltams > 0 ? "+" : ""}{deltams}ms</span>
                              : <span style={{ color: "var(--proof-text-secondary)" }}>~0ms</span>}
                          </td>
                          <td><span className="gcp-badge gcp-badge-skip" style={{ fontSize: 10 }}>{d.category}</span></td>
                          <td>{stateBadge(d.state)}</td>
                          <td>
                            <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                              <button onClick={e => { e.stopPropagation(); copy(`${window.location.origin}/tests/${d.id}`); show("Permalink copied"); }} style={{ padding: "3px 5px", border: "none", background: "transparent", cursor: "pointer", color: "var(--proof-text-secondary)" }} title="Copy permalink">
                                <Link2 size={12} />
                              </button>
                              <button onClick={e => { e.stopPropagation(); copy(`Regression: ${d.name}\nBaseline: ${d.baseStatus} (${d.durBase}ms)\nCandidate: ${d.candStatus} (${d.durCand}ms)`); show("Issue template copied"); }} style={{ padding: "3px 5px", border: "none", background: "transparent", cursor: "pointer", color: "var(--proof-text-secondary)" }} title="File issue">
                                <Github size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: "28px", color: "var(--proof-text-secondary)", fontSize: 13 }}>No tests match your filters</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            {selectedDiff && selectedId && (
              <SidePanel diff={selectedDiff} diffs={filtered} selectedId={selectedId} onSelect={setSelectedId} navigate={navigate} />
            )}
          </div>
        </PanelErrorBoundary>
      </div>
      {Toast}
    </AppLayout>
  );
}
