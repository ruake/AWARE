import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/aware/AppLayout";
import { ColumnFilter, type ColumnFilterState } from "@/components/aware/ColumnFilter";
import { CTAStatCard } from "@/components/aware/CTAStatCard";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { useSyncedUrlState } from "@/lib/urlState";
import { RUNS, DIFF_ROWS, setPromotionDecision } from "@/lib/data";
import type { DiffRow } from "@/lib/types";
import {
  Link2, Github, Share2, Check, AlertTriangle, BarChart3,
  ChevronLeft, ChevronRight, Zap, XCircle, Shield,
  ArrowUpRight, Search,
} from "lucide-react";

const EMPTY_FILTER: ColumnFilterState = { text: "", selected: [] };

function copy(text: string) { navigator.clipboard.writeText(text).catch(() => {}); }

function stateBadge(state: DiffRow["state"]) {
  const map: Record<string, { color: string; label: string }> = {
    regression: { color: "var(--gcp-red)", label: "Regression" },
    fixed: { color: "var(--gcp-green)", label: "Fixed" },
    duration: { color: "var(--gcp-yellow)", label: "Duration ↑" },
    unchanged: { color: "var(--gcp-text-secondary)", label: "Unchanged" },
    fishy: { color: "var(--gcp-purple)", label: "Fishy ⚠" },
  };
  const s = map[state] ?? { color: "var(--gcp-text-secondary)", label: state };
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
    <div className="gcp-card" style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden", borderLeft: `3px solid ${diff.state === "regression" ? "var(--gcp-red)" : diff.state === "fixed" ? "var(--gcp-green)" : "var(--gcp-blue)"}` }}>
      <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--gcp-grey)", display: "flex", alignItems: "center", gap: 8, background: "var(--gcp-blue-bg)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 1, border: "1px solid var(--gcp-grey)", borderRadius: 4, background: "var(--gcp-surface)" }}>
          <button disabled={idx <= 0} onClick={() => onSelect(diffs[idx - 1]?.id)} style={{ padding: "4px 7px", border: "none", background: "transparent", cursor: idx > 0 ? "pointer" : "not-allowed", color: idx > 0 ? "var(--gcp-blue)" : "var(--gcp-grey)" }}>
            <ChevronLeft size={13} />
          </button>
          <span style={{ fontSize: 10, color: "var(--gcp-text-secondary)", padding: "0 4px" }}>{idx + 1}/{diffs.length}</span>
          <button disabled={idx >= diffs.length - 1} onClick={() => onSelect(diffs[idx + 1]?.id)} style={{ padding: "4px 7px", border: "none", background: "transparent", cursor: idx < diffs.length - 1 ? "pointer" : "not-allowed", color: idx < diffs.length - 1 ? "var(--gcp-blue)" : "var(--gcp-grey)" }}>
            <ChevronRight size={13} />
          </button>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gcp-blue)", flex: 1 }}>Comparison Detail</span>
        <button onClick={() => onSelect(null)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--gcp-text-secondary)", fontSize: 18, lineHeight: 1 }}>×</button>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gcp-text)", lineHeight: 1.5, wordBreak: "break-all" }}>{diff.name}</div>
          <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
            <span className="gcp-badge gcp-badge-skip" style={{ fontSize: 10 }}>{diff.category}</span>
            {stateBadge(diff.state)}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ padding: 10, background: `var(--${diff.baseStatus === "PASS" ? "gcp-green-bg" : "gcp-red-bg"})`, borderRadius: 6, border: `1px solid ${diff.baseStatus === "PASS" ? "var(--gcp-green)" : "var(--gcp-red)"}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: diff.baseStatus === "PASS" ? "var(--gcp-green)" : "var(--gcp-red)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 4 }}>Baseline</div>
            <span className={`gcp-badge ${diff.baseStatus === "PASS" ? "gcp-badge-pass" : "gcp-badge-fail"}`} style={{ fontSize: 10 }}>{diff.baseStatus}</span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gcp-text)", marginTop: 6, fontWeight: 600 }}>{diff.durBase}ms</div>
          </div>
          <div style={{ padding: 10, background: `var(--${diff.candStatus === "PASS" ? "gcp-green-bg" : "gcp-red-bg"})`, borderRadius: 6, border: `1px solid ${diff.candStatus === "PASS" ? "var(--gcp-green)" : "var(--gcp-red)"}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: diff.candStatus === "PASS" ? "var(--gcp-green)" : "var(--gcp-red)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 4 }}>Candidate</div>
            <span className={`gcp-badge ${diff.candStatus === "PASS" ? "gcp-badge-pass" : "gcp-badge-fail"}`} style={{ fontSize: 10 }}>{diff.candStatus}</span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gcp-text)", marginTop: 6, fontWeight: 600 }}>{diff.durCand}ms</div>
          </div>
        </div>
        <div style={{ padding: 10, borderRadius: 6, border: "1px solid var(--gcp-grey)", background: deltaMs > 20 ? "var(--gcp-red-bg)" : deltaMs < -20 ? "var(--gcp-green-bg)" : "var(--gcp-grey-bg)" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: deltaMs > 20 ? "var(--gcp-red)" : deltaMs < -20 ? "var(--gcp-green)" : "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 4 }}>Delta</div>
          <div style={{ display: "flex", gap: 16 }}>
            <div>
              <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>Status: </span>
              {diff.baseStatus === diff.candStatus
                ? <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>—</span>
                : <span style={{ fontSize: 11, fontWeight: 700, color: diff.state === "regression" ? "var(--gcp-red)" : "var(--gcp-green)" }}>{diff.baseStatus} → {diff.candStatus}</span>
              }
            </div>
            <div>
              <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>Duration: </span>
              {Math.abs(deltaMs) > 20
                ? <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: deltaMs > 0 ? "var(--gcp-red)" : "var(--gcp-green)" }}>{deltaMs > 0 ? "+" : ""}{deltaMs}ms</span>
                : <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gcp-text-secondary)" }}>~0ms</span>
              }
            </div>
          </div>
        </div>
        {/* Filmstrip placeholder */}
        <div className="gcp-card" style={{ padding: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", marginBottom: 8 }}>Visual Diff (Filmstrip)</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {["Baseline", "Candidate"].map(label => (
              <div key={label} style={{ background: "var(--gcp-grey-bg)", borderRadius: 4, height: 80, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4, border: "1px solid var(--gcp-grey)" }}>
                <span style={{ fontSize: 20 }}>🎞</span>
                <span style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button onClick={() => navigate(`/analytics?testId=${diff.id}`)} className="gcp-button" style={{ fontSize: 11, justifyContent: "center" }}>
            <BarChart3 size={12} /> View Analytics <ArrowUpRight size={10} />
          </button>
          <button onClick={() => { copy(`https://aware.example.com/tests/${diff.id}`); show("Test permalink copied"); }} className="gcp-button" style={{ fontSize: 11, justifyContent: "center" }}>
            <Link2 size={12} /> Copy Test Permalink
          </button>
          <button onClick={() => { copy(`GitHub issue: Regression in ${diff.name}\nBaseline: ${diff.baseStatus} (${diff.durBase}ms)\nCandidate: ${diff.candStatus} (${diff.durCand}ms)`); show("GitHub issue template copied"); }}
            className="gcp-button" style={{ fontSize: 11, justifyContent: "center" }}>
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

  const runIds = RUNS.map(r => r.id);
  const [baseline, setBaseline] = useSyncedUrlState("baseline", RUNS[RUNS.length - 1]?.id ?? "");
  const [candidate, setCandidate] = useSyncedUrlState("candidate", RUNS[0]?.id ?? "");
  const [selectedId, setSelectedId] = useSyncedUrlState<string | null>("sel", null);
  const [searchText, setSearchText] = useSyncedUrlState("q", "");
  const [regressionsOnly, setRegressionsOnly] = useSyncedUrlState("regressions", false);
  const baselineRun = RUNS.find(r => r.id === baseline);
  const candidateRun = RUNS.find(r => r.id === candidate);

  const [colFilters, setColFilters] = React.useState<Record<string, ColumnFilterState>>({});
  const updateColFilter = (field: string) => (f: ColumnFilterState) => setColFilters(p => ({ ...p, [field]: f }));

  const diffs = DIFF_ROWS;
  const regressions = diffs.filter(d => d.state === "regression");
  const fixed = diffs.filter(d => d.state === "fixed");
  const duration = diffs.filter(d => d.state === "duration");
  const unchanged = diffs.filter(d => d.state === "unchanged");
  const categories = [...new Set(diffs.map(d => d.category))];
  const states: DiffRow["state"][] = ["regression", "fixed", "duration", "unchanged"];

  const filtered = React.useMemo(() => {
    return diffs.filter(d => {
      if (searchText && !d.name.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (regressionsOnly && d.state !== "regression") return false;
      const catF = colFilters.category;
      if (catF?.selected.length && !catF.selected.includes(d.category)) return false;
      if (catF?.text && !d.category.includes(catF.text)) return false;
      const stateF = colFilters.state;
      if (stateF?.selected.length && !stateF.selected.includes(d.state)) return false;
      const baseF = colFilters.baseStatus;
      if (baseF?.selected.length && !baseF.selected.includes(d.baseStatus)) return false;
      const candF = colFilters.candStatus;
      if (candF?.selected.length && !candF.selected.includes(d.candStatus)) return false;
      return true;
    });
  }, [diffs, searchText, regressionsOnly, colFilters]);

  const selectedDiff = selectedId ? diffs.find(d => d.id === selectedId) ?? null : null;
  const hasActiveFilters = Object.values(colFilters).some(f => f.text || f.selected.length > 0);

  const confirmPromotion = (action: "promote" | "block") => {
    setPromotionDecision({ runId: candidate, decision: action, decidedBy: "you", decidedAt: new Date().toISOString(), note: `${action === "promote" ? "Approved" : "Blocked"} via comparison` });
    show(action === "promote" ? "Promotion approved — Akamai config can be deployed" : "Promotion blocked — regressions must be fixed");
  };

  return (
    <AppLayout activeHref="/compare">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Run selectors */}
        <div className="gcp-card" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 240px", minWidth: 200 }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Baseline Run</label>
            <select className="gcp-input" style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: 11 }} value={baseline} onChange={e => setBaseline(e.target.value)}>
              {RUNS.map(r => <option key={r.id} value={r.id}>{r.id} · {r.env} · PM {r.pm} · EW {r.ew}</option>)}
            </select>
            {baselineRun && (
              <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                <span className="gcp-badge gcp-badge-skip" style={{ fontSize: 9 }}>{baselineRun.target}</span>
                <span className="gcp-badge gcp-badge-skip" style={{ fontSize: 9 }}>{baselineRun.env}</span>
                <span className={`gcp-badge ${baselineRun.network === "production" ? "gcp-badge-pass" : "gcp-badge-flaky"}`} style={{ fontSize: 9 }}>{baselineRun.network}</span>
                <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--gcp-text-secondary)", background: "var(--gcp-grey-bg)", padding: "1px 5px", borderRadius: 3, border: "1px solid var(--gcp-grey)" }}>PM {baselineRun.pm}</span>
                <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--gcp-text-secondary)", background: "var(--gcp-grey-bg)", padding: "1px 5px", borderRadius: 3, border: "1px solid var(--gcp-grey)" }}>EW {baselineRun.ew}</span>
              </div>
            )}
          </div>
          <button onClick={() => { const t = baseline; setBaseline(candidate); setCandidate(t); }} className="gcp-button" style={{ fontSize: 12, marginTop: 16 }}>⇄ Swap</button>
          <div style={{ flex: "1 1 240px", minWidth: 200 }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--gcp-blue)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Candidate Run</label>
            <select className="gcp-input" style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: 11, borderColor: "var(--gcp-blue)" }} value={candidate} onChange={e => setCandidate(e.target.value)}>
              {RUNS.map(r => <option key={r.id} value={r.id}>{r.id} · {r.env} · PM {r.pm} · EW {r.ew}</option>)}
            </select>
            {candidateRun && (
              <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                <span className="gcp-badge gcp-badge-skip" style={{ fontSize: 9 }}>{candidateRun.target}</span>
                <span className="gcp-badge gcp-badge-skip" style={{ fontSize: 9 }}>{candidateRun.env}</span>
                <span className={`gcp-badge ${candidateRun.network === "production" ? "gcp-badge-pass" : "gcp-badge-flaky"}`} style={{ fontSize: 9 }}>{candidateRun.network}</span>
                <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--gcp-text-secondary)", background: "var(--gcp-grey-bg)", padding: "1px 5px", borderRadius: 3, border: "1px solid var(--gcp-grey)" }}>PM {candidateRun.pm}</span>
                <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--gcp-text-secondary)", background: "var(--gcp-grey-bg)", padding: "1px 5px", borderRadius: 3, border: "1px solid var(--gcp-grey)" }}>EW {candidateRun.ew}</span>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0, marginTop: 16, flexWrap: "wrap" }}>
            <button onClick={() => { copy(window.location.href); show("Permalink copied — URL always reflects current comparison"); }} className="gcp-button" style={{ fontSize: 12 }}>
              <Link2 size={13} /> Permalink
            </button>
            <button onClick={() => { copy(`Comparison: ${baseline} vs ${candidate}\nNew failures: ${regressions.length}\nFixed: ${fixed.length}\nDuration regressions: ${duration.length}`); show("Slack summary copied"); }}
              className="gcp-button" style={{ fontSize: 12 }}>
              <Share2 size={13} /> Share
            </button>
            <button onClick={() => { copy(`## Regression Report\n**Baseline:** ${baseline}\n**Candidate:** ${candidate}\n\n### Regressions (${regressions.length})\n${regressions.map(r => `- ${r.name}`).join("\n")}\n\n### Fixed (${fixed.length})\n${fixed.map(r => `- ${r.name}`).join("\n")}`); show("Markdown report copied"); }}
              className="gcp-button" style={{ fontSize: 12 }}>
              <Github size={13} /> Report
            </button>
          </div>
        </div>

        {/* Summary tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[
            { label: "New Failures", value: `+${regressions.length}`, color: "var(--gcp-red)", key: "regression" },
            { label: "Fixed", value: `+${fixed.length}`, color: "var(--gcp-green)", key: "fixed" },
            { label: "Duration Regressions", value: `+${duration.length}`, color: "var(--gcp-yellow)", key: "duration" },
            { label: "Unchanged", value: unchanged.length, color: "var(--gcp-text-secondary)", key: "unchanged" },
          ].map(tile => (
            <CTAStatCard
              key={tile.label}
              label={tile.label}
              value={tile.value}
              accentColor={tile.color}
              active={colFilters.state?.selected.includes(tile.key)}
              onClick={() => updateColFilter("state")({ text: "", selected: colFilters.state?.selected.includes(tile.key) ? [] : [tile.key] })}
            />
          ))}
        </div>

        {/* Run context ribbon */}
        <div style={{ background: "var(--gcp-grey-bg)", border: "1px solid var(--gcp-grey)", borderRadius: 4, padding: "6px 14px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", fontSize: 11 }}>
          <span style={{ fontWeight: 600, color: "var(--gcp-text-secondary)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.3px" }}>Comparison</span>
          <span className="gcp-badge gcp-badge-skip" style={{ fontSize: 9 }}>{baselineRun?.target} / {baselineRun?.env}</span>
          <span className={`gcp-badge ${baselineRun?.network === "production" ? "gcp-badge-pass" : "gcp-badge-flaky"}`} style={{ fontSize: 9 }}>{baselineRun?.network}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--gcp-text-secondary)" }}>PM {baselineRun?.pm}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--gcp-text-secondary)" }}>EW {baselineRun?.ew}</span>
          <span style={{ color: "var(--gcp-grey)", fontSize: 12 }}>|</span>
          <span className="gcp-badge gcp-badge-skip" style={{ fontSize: 9 }}>{candidateRun?.target} / {candidateRun?.env}</span>
          <span className={`gcp-badge ${candidateRun?.network === "production" ? "gcp-badge-pass" : "gcp-badge-flaky"}`} style={{ fontSize: 9 }}>{candidateRun?.network}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--gcp-text-secondary)" }}>PM {candidateRun?.pm}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--gcp-text-secondary)" }}>EW {candidateRun?.ew}</span>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: "var(--gcp-text-secondary)" }}>{diffs.length} tests compared</span>
        </div>

        {/* Promotion/regression — full-width ribbon w/ badges */}
        {regressions.length > 0 ? (
          <div style={{ background: "var(--gcp-red-bg)", border: "1px solid var(--gcp-red)", borderRadius: 4, padding: "8px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span className="gcp-badge gcp-badge-fail" style={{ fontSize: 10 }}>{regressions.length} regression{regressions.length !== 1 ? "s" : ""}</span>
            <span style={{ fontSize: 12, flex: 1 }}><strong>Promotion blocked.</strong> Fix regressions before deploying to Akamai.</span>
            <button onClick={() => confirmPromotion("block")} className="gcp-button" style={{ fontSize: 11, padding: "3px 10px", color: "var(--gcp-red)", borderColor: "var(--gcp-red)" }}>
              <XCircle size={11} /> Confirm Block
            </button>
            <button onClick={() => { copy(`Bulk regression report\nBaseline: ${baseline}\nCandidate: ${candidate}\n${regressions.length} regressions:\n${regressions.map(r => `- ${r.name}`).join("\n")}`); show("Bulk issue template copied"); }}
              className="gcp-button-danger" style={{ fontSize: 11, padding: "3px 10px" }}>
              <Github size={11} /> File Issues
            </button>
          </div>
        ) : (
          <div style={{ background: "var(--gcp-green-bg)", border: "1px solid var(--gcp-green)", borderRadius: 4, padding: "8px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span className="gcp-badge gcp-badge-pass" style={{ fontSize: 10 }}>All Clear</span>
            <span style={{ fontSize: 12, flex: 1, fontWeight: 500 }}>No regressions — ready to promote to <strong>Akamai Production</strong></span>
            <button onClick={() => confirmPromotion("promote")} className="gcp-button-success" style={{ fontSize: 11, padding: "3px 10px" }}>
              <Zap size={11} /> Approve Promotion
            </button>
          </div>
        )}

        {/* Table + side panel */}
        <div style={{ display: "flex", gap: 14 }}>
          <div className="gcp-card" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "60vh" }}>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--gcp-grey)", background: "var(--gcp-grey-bg)", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 140 }}>
                <Search size={13} style={{ color: "var(--gcp-text-secondary)" }} />
                <input className="gcp-input" placeholder="Search tests…" value={searchText} onChange={e => setSearchText(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
                <input type="checkbox" checked={regressionsOnly} onChange={e => setRegressionsOnly(e.target.checked)} />
                Regressions only
              </label>
              {hasActiveFilters && (
                <button onClick={() => setColFilters({})} style={{ fontSize: 11, color: "var(--gcp-red)", background: "none", border: "none", cursor: "pointer" }}>
                  Clear filters
                </button>
              )}
              <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)", marginLeft: "auto" }}>{filtered.length}/{diffs.length} tests</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <table className="gcp-table">
                <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--gcp-surface)" }}><tr>
                  <th>
                    <ColumnFilter label="Test Name" filter={colFilters.name ?? EMPTY_FILTER} onFilterChange={updateColFilter("name")} />
                  </th>
                  <th>
                    <ColumnFilter label="Baseline" allValues={["PASS", "FAIL"]} filter={colFilters.baseStatus ?? EMPTY_FILTER} onFilterChange={updateColFilter("baseStatus")} />
                  </th>
                  <th>
                    <ColumnFilter label="Candidate" allValues={["PASS", "FAIL"]} filter={colFilters.candStatus ?? EMPTY_FILTER} onFilterChange={updateColFilter("candStatus")} />
                  </th>
                  <th style={{ textAlign: "right" }}>Δ Duration</th>
                  <th>
                    <ColumnFilter label="Category" allValues={categories} filter={colFilters.category ?? EMPTY_FILTER} onFilterChange={updateColFilter("category")} />
                  </th>
                  <th>
                    <ColumnFilter label="State" allValues={states} filter={colFilters.state ?? EMPTY_FILTER} onFilterChange={updateColFilter("state")} />
                  </th>
                  <th style={{ textAlign: "center" }}>Actions</th>
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
                          background: isSelected ? "var(--gcp-blue-bg)" : d.state === "regression" ? "rgba(217,48,37,0.04)" : d.state === "fixed" ? "rgba(30,142,62,0.04)" : undefined,
                          outline: isSelected ? "2px solid var(--gcp-blue)" : "none",
                          outlineOffset: -2,
                        }}
                      >
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gcp-blue)", fontWeight: 500, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</td>
                        <td><span className={`gcp-badge ${d.baseStatus === "PASS" ? "gcp-badge-pass" : "gcp-badge-fail"}`}>{d.baseStatus}</span></td>
                        <td><span className={`gcp-badge ${d.candStatus === "PASS" ? "gcp-badge-pass" : "gcp-badge-fail"}`}>{d.candStatus}</span></td>
                        <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                          {Math.abs(deltams) > 20
                            ? <span style={{ color: deltams > 0 ? "var(--gcp-red)" : "var(--gcp-green)", fontWeight: 700 }}>{deltams > 0 ? "+" : ""}{deltams}ms</span>
                            : <span style={{ color: "var(--gcp-text-secondary)" }}>~0ms</span>}
                        </td>
                        <td><span className="gcp-badge gcp-badge-skip" style={{ fontSize: 10 }}>{d.category}</span></td>
                        <td>{stateBadge(d.state)}</td>
                        <td>
                          <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                            <button onClick={e => { e.stopPropagation(); copy(`${window.location.origin}/tests/${d.id}`); show("Permalink copied"); }} style={{ padding: "3px 5px", border: "none", background: "transparent", cursor: "pointer", color: "var(--gcp-text-secondary)" }} title="Copy permalink">
                              <Link2 size={12} />
                            </button>
                            <button onClick={e => { e.stopPropagation(); copy(`Regression: ${d.name}\nBaseline: ${d.baseStatus} (${d.durBase}ms)\nCandidate: ${d.candStatus} (${d.durCand}ms)`); show("Issue template copied"); }} style={{ padding: "3px 5px", border: "none", background: "transparent", cursor: "pointer", color: "var(--gcp-text-secondary)" }} title="File issue">
                              <Github size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: "28px", color: "var(--gcp-text-secondary)", fontSize: 13 }}>No tests match your filters</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {selectedDiff && selectedId && (
            <SidePanel diff={selectedDiff} diffs={filtered} selectedId={selectedId} onSelect={setSelectedId} navigate={navigate} />
          )}
        </div>
      </div>
      {Toast}
    </AppLayout>
  );
}
