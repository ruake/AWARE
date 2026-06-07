import React from "react";
import { useLocation, useSearch } from "wouter";
import { AppLayout } from "@/components/aware/AppLayout";
import { ColumnFilter, type ColumnFilterState } from "@/components/aware/ColumnFilter";
import { RUNS, DIFF_ROWS, setPromotionDecision } from "@/lib/data";
import type { DiffRow } from "@/lib/types";
import {
  Link2, Github, Share2, Check, AlertTriangle, BarChart3,
  ChevronLeft, ChevronRight, Zap, XCircle, Shield,
  ArrowUpRight, Search,
} from "lucide-react";

const EMPTY_FILTER: ColumnFilterState = { text: "", selected: [] };

function useToast() {
  const [msg, setMsg] = React.useState<string | null>(null);
  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 2500); };
  const Toast = msg ? <div className="gcp-toast"><Check size={13} style={{ color: "var(--gcp-green)" }} /> {msg}</div> : null;
  return { show, Toast };
}

function copy(text: string) { navigator.clipboard.writeText(text).catch(() => {}); }

function stateBadge(state: DiffRow["state"]) {
  const map = {
    regression: { color: "var(--gcp-red)", label: "Regression" },
    fixed: { color: "var(--gcp-green)", label: "Fixed" },
    duration: { color: "var(--gcp-yellow)", label: "Duration ↑" },
    unchanged: { color: "var(--gcp-text-secondary)", label: "Unchanged" },
  };
  const s = map[state];
  return <span style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{s.label}</span>;
}

function SidePanel({ diff, diffs, selectedId, onSelect, navigate }: {
  diff: DiffRow; diffs: DiffRow[]; selectedId: string;
  onSelect: (id: string | null) => void; navigate: (href: string) => void;
}) {
  const { show, Toast } = useToast();
  const idx = diffs.findIndex(d => d.id === selectedId);
  const deltaMs = diff.durCand - diff.durBase;

  return (
    <div className="gcp-card" style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden", borderLeft: "3px solid var(--gcp-blue)" }}>
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
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 11, background: "var(--gcp-grey-bg)", padding: "2px 8px", borderRadius: 4, border: "1px solid var(--gcp-grey)" }}>{diff.category}</span>
            {stateBadge(diff.state)}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div className="gcp-card" style={{ padding: 10, borderLeft: `3px solid ${diff.baseStatus === "PASS" ? "var(--gcp-green)" : "var(--gcp-red)"}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>Baseline</div>
            <span className={`gcp-badge ${diff.baseStatus === "PASS" ? "gcp-badge-pass" : "gcp-badge-fail"}`}>{diff.baseStatus}</span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gcp-text-secondary)", marginTop: 6 }}>{diff.durBase}ms</div>
          </div>
          <div className="gcp-card" style={{ padding: 10, borderLeft: `3px solid ${diff.candStatus === "PASS" ? "var(--gcp-green)" : "var(--gcp-red)"}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>Candidate</div>
            <span className={`gcp-badge ${diff.candStatus === "PASS" ? "gcp-badge-pass" : "gcp-badge-fail"}`}>{diff.candStatus}</span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--gcp-text-secondary)", marginTop: 6 }}>{diff.durCand}ms</div>
          </div>
        </div>
        <div className="gcp-card" style={{ padding: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", marginBottom: 6 }}>Delta</div>
          <div style={{ display: "flex", gap: 16 }}>
            <div>
              <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>Status: </span>
              {diff.baseStatus === diff.candStatus
                ? <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>No change</span>
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
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [, navigate] = useLocation();
  const { show, Toast } = useToast();

  const runIds = RUNS.map(r => r.id);
  const [baseline, setBaseline] = React.useState(params.get("baseline") ?? RUNS[RUNS.length - 1]?.id ?? "");
  const [candidate, setCandidate] = React.useState(params.get("candidate") ?? RUNS[0]?.id ?? "");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [searchText, setSearchText] = React.useState("");
  const [regressionsOnly, setRegressionsOnly] = React.useState(false);

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
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Baseline Run</label>
            <select className="gcp-input" style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: 11 }} value={baseline} onChange={e => setBaseline(e.target.value)}>
              {runIds.map(id => <option key={id} value={id}>{id}</option>)}
            </select>
          </div>
          <button onClick={() => { const t = baseline; setBaseline(candidate); setCandidate(t); }} className="gcp-button" style={{ fontSize: 12, marginTop: 16 }}>⇄ Swap</button>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--gcp-blue)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Candidate Run</label>
            <select className="gcp-input" style={{ width: "100%", fontFamily: "var(--font-mono)", fontSize: 11, borderColor: "var(--gcp-blue)" }} value={candidate} onChange={e => setCandidate(e.target.value)}>
              {runIds.map(id => <option key={id} value={id}>{id}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0, marginTop: 16, flexWrap: "wrap" }}>
            <button onClick={() => { copy(`${window.location.href}?baseline=${baseline}&candidate=${candidate}`); show("Permalink copied"); }} className="gcp-button" style={{ fontSize: 12 }}>
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
            <div key={tile.label}
              className="gcp-card"
              onClick={() => updateColFilter("state")({ text: "", selected: colFilters.state?.selected.includes(tile.key) ? [] : [tile.key] })}
              style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: `4px solid ${tile.color}`, cursor: "pointer" }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--gcp-text-secondary)" }}>{tile.label}</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: tile.color }}>{tile.value}</span>
            </div>
          ))}
        </div>

        {/* Promotion/regression banner */}
        {regressions.length > 0 ? (
          <div style={{ background: "var(--gcp-red-bg)", border: "1px solid var(--gcp-red)", borderRadius: 4, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <AlertTriangle size={15} style={{ color: "var(--gcp-red)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, flex: 1 }}><strong>{regressions.length} regression{regressions.length !== 1 ? "s" : ""} detected.</strong> Promotion blocked until fixed.</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { copy(`Bulk regression report\nBaseline: ${baseline}\nCandidate: ${candidate}\n${regressions.length} regressions:\n${regressions.map(r => `- ${r.name}`).join("\n")}`); show("Bulk issue template copied"); }}
                className="gcp-button-danger" style={{ fontSize: 11, padding: "5px 12px" }}>
                <Github size={12} /> File All as Issues
              </button>
              <button onClick={() => confirmPromotion("block")} className="gcp-button" style={{ fontSize: 11, padding: "5px 12px", color: "var(--gcp-red)", borderColor: "var(--gcp-red)" }}>
                <XCircle size={12} /> Confirm Block
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: "var(--gcp-green-bg)", border: "1px solid var(--gcp-green)", borderRadius: 4, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
            <Shield size={15} style={{ color: "var(--gcp-green)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, flex: 1 }}><strong>No regressions detected.</strong> Candidate is ready to promote to Akamai.</span>
            <button onClick={() => confirmPromotion("promote")} className="gcp-button-success" style={{ fontSize: 11, padding: "5px 12px" }}>
              <Zap size={12} /> Approve Promotion
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
                        <td><span style={{ fontSize: 11, background: "var(--gcp-grey-bg)", padding: "2px 7px", borderRadius: 4, border: "1px solid var(--gcp-grey)" }}>{d.category}</span></td>
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
