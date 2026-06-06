import React from "react";
import { AppLayout } from "./_shared/AppLayout";
import { useSyncRuns, useSyncDiffs } from "./_shared/hooks";
import type { DiffRow } from "./_shared/services";
import { copyToClipboard, navTo } from "./_shared/nav";
import { TableHeaderFilter, type ColumnFilterState } from "./_shared/ColumnFilter";
import { useSyncedUrlState } from "./_shared/urlState";
import "./_group.css";
import { Link2, Github, Share2, Copy, Check, AlertTriangle, BarChart3, X, ArrowUpRight, Calendar, Filter, FileText, ChevronLeft, ChevronRight } from "lucide-react";

const EMPTY_FILTER: ColumnFilterState = { text: "", selected: [] };
const TIME_SLICES = ["1d", "7d", "14d", "30d", "All"];

function ComparisonSidePanel({ diff, testId, onPrev, onNext, hasPrev, hasNext }: {
  diff: DiffRow; testId: string;
  onPrev?: () => void; onNext?: () => void; hasPrev?: boolean; hasNext?: boolean;
}) {
  const runs = useSyncRuns();
  const deltaMs = diff.durCand - diff.durBase;
  const hasDelta = Math.abs(deltaMs) > 20;
  const stateLabel = diff.state === "regression" ? "Regression" : diff.state === "fixed" ? "Fixed" : diff.state === "duration" ? "Duration Change" : "Unchanged";
  const stateColor = diff.state === "regression" ? "var(--gcp-red)" : diff.state === "fixed" ? "var(--gcp-green)" : diff.state === "duration" ? "var(--gcp-yellow)" : "var(--gcp-text-secondary)";

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-[var(--gcp-grey)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-[var(--gcp-grey)] rounded">
            <button onClick={onPrev} disabled={!hasPrev} className={`p-1 ${hasPrev ? 'text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-blue)]' : 'text-[var(--gcp-grey)] cursor-not-allowed'} transition-colors`} title="Previous test"><ChevronLeft size={14} /></button>
            <button onClick={onNext} disabled={!hasNext} className={`p-1 ${hasNext ? 'text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-blue)]' : 'text-[var(--gcp-grey)] cursor-not-allowed'} transition-colors`} title="Next test"><ChevronRight size={14} /></button>
          </div>
          <h3 className="font-medium text-sm flex items-center gap-2"><BarChart3 size={15} className="text-[var(--gcp-blue)]" /> Comparison Detail</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navTo(`TestDoc?testId=${testId}`)} className="gcp-button text-[11px] flex items-center gap-1 px-2.5 py-1.5">
            <FileText size={12} /> View Docs <ArrowUpRight size={11} />
          </button>
          <button onClick={() => navTo(`TestAnalytics?testId=${testId}`)} className="gcp-button text-[11px] flex items-center gap-1 px-2.5 py-1.5">
            <BarChart3 size={12} /> View Analytics <ArrowUpRight size={11} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-5">

        {/* Test Identity */}
        <div>
          <h4 className="text-[13px] font-mono text-[var(--gcp-text)] leading-relaxed">{diff.name}</h4>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="px-2 py-0.5 bg-[var(--gcp-surface)] text-[11px] border border-[var(--gcp-grey)] rounded">{diff.category}</span>
            <span className="text-[11px] text-[var(--gcp-text-secondary)]" style={{ color: stateColor }}>{stateLabel}</span>
          </div>
        </div>

        {/* Baseline vs Candidate */}
        <div className="grid grid-cols-2 gap-3">
          <div className="gcp-card p-3 border-l-4" style={{ borderLeftColor: diff.baseStatus === "PASS" ? "var(--gcp-green)" : "var(--gcp-red)" }}>
            <div className="text-[11px] text-[var(--gcp-text-secondary)] uppercase tracking-wider font-medium mb-1">Baseline</div>
            <div className="flex items-center justify-between">
              <span className={`gcp-badge ${diff.baseStatus === "PASS" ? "gcp-badge-pass" : "gcp-badge-fail"}`}>{diff.baseStatus}</span>
              <span className="font-mono text-[12px] text-[var(--gcp-text-secondary)]">{diff.durBase}ms</span>
            </div>
          </div>
          <div className="gcp-card p-3 border-l-4" style={{ borderLeftColor: diff.candStatus === "PASS" ? "var(--gcp-green)" : "var(--gcp-red)" }}>
            <div className="text-[11px] text-[var(--gcp-text-secondary)] uppercase tracking-wider font-medium mb-1">Candidate</div>
            <div className="flex items-center justify-between">
              <span className={`gcp-badge ${diff.candStatus === "PASS" ? "gcp-badge-pass" : "gcp-badge-fail"}`}>{diff.candStatus}</span>
              <span className="font-mono text-[12px] text-[var(--gcp-text-secondary)]">{diff.durCand}ms</span>
            </div>
          </div>
        </div>

        {/* Delta */}
        <div className="gcp-card p-3">
          <div className="text-[11px] text-[var(--gcp-text-secondary)] uppercase tracking-wider font-medium mb-1">Delta</div>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[var(--gcp-text-secondary)] text-[12px]">Status: </span>
              {diff.baseStatus === diff.candStatus
                ? <span className="font-medium text-[12px] text-[var(--gcp-text-secondary)]">No change</span>
                : <span className="font-medium text-[12px]" style={{ color: stateColor }}>
                    {diff.baseStatus} → {diff.candStatus}
                  </span>
              }
            </div>
            <div>
              <span className="text-[var(--gcp-text-secondary)] text-[12px]">Duration: </span>
              {hasDelta
                ? <span className={`font-mono text-[12px] font-bold ${deltaMs > 0 ? "text-[var(--gcp-red)]" : "text-[var(--gcp-green)]"}`}>
                    {deltaMs > 0 ? "+" : ""}{deltaMs}ms
                  </span>
                : <span className="font-mono text-[12px] text-[var(--gcp-text-secondary)]">~0ms</span>
              }
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => { copyToClipboard(`https://aware.example.com/tests/${diff.id}?baseline=${runs[0]?.id ?? ""}&candidate=${runs[3]?.id ?? ""}`); }}
            className="w-full gcp-button text-[12px] flex items-center justify-center gap-1.5 py-2"
          >
            <Link2 size={13} /> Copy permalink
          </button>
          <button
            onClick={() => { copyToClipboard(`GitHub issue for test: ${diff.name}\nBaseline: ${diff.baseStatus} (${diff.durBase}ms)\nCandidate: ${diff.candStatus} (${diff.durCand}ms)`); }}
            className="w-full gcp-button text-[12px] flex items-center justify-center gap-1.5 py-2"
          >
            <Github size={13} /> File GitHub issue
          </button>
        </div>
      </div>
    </div>
  );
}

function _SidePanel({ selectedDiff, selectedTestId, setSelectedTestId }: {
  selectedDiff: DiffRow;
  selectedTestId: string;
  setSelectedTestId: (id: string | null) => void;
}) {
  const diffs = useSyncDiffs();
  const si = diffs.findIndex(d => d.id === selectedTestId);
  return (
    <div className="w-[35%] gcp-card overflow-hidden shrink-0 bg-[var(--gcp-surface)] border-l-2 border-[var(--gcp-blue)]">
      <ComparisonSidePanel
        diff={selectedDiff}
        testId={selectedTestId}
        onPrev={() => { const p = diffs[si - 1]; if (p) setSelectedTestId(p.id); }}
        onNext={() => { const n = diffs[si + 1]; if (n) setSelectedTestId(n.id); }}
        hasPrev={si > 0}
        hasNext={si < diffs.length - 1}
      />
    </div>
  );
}

export function Compare() {
  const runs = useSyncRuns();
  const diffs = useSyncDiffs();
  const params = new URLSearchParams(window.location.search);
  const initialBaseline = params.get("baseline") || (runs[0]?.id ?? "");
  const initialCandidate = params.get("candidate") || (runs[3]?.id ?? "");

  const [baseline, setBaseline] = React.useState(initialBaseline);
  const [candidate, setCandidate] = React.useState(initialCandidate);
  const [selectedTestId, setSelectedTestId] = useSyncedUrlState<string | null>("sel", null);
  const [colFilters, setColFilters] = useSyncedUrlState<Record<string, ColumnFilterState>>("filters", {});
  const [searchText, setSearchText] = useSyncedUrlState("q", "");
  const [regressionsOnly, setRegressionsOnly] = useSyncedUrlState("reg", false);
  const [timeSlice, setTimeSlice] = useSyncedUrlState("slice", "All");

  const [shareToast, setShareToast] = React.useState<string | null>(null);
  const [issueFiled, setIssueFiled] = React.useState<string | null>(null);
  const showToast = (msg: string) => { setShareToast(msg); setTimeout(() => setShareToast(null), 2500); };

  const fileIssue = (testName: string) => {
    setIssueFiled(testName);
    copyToClipboard(`GitHub issue for test: ${testName}\nComparison: ${baseline} vs ${candidate}`);
    showToast(`GitHub issue template copied for ${testName}`);
    setTimeout(() => setIssueFiled(null), 3000);
  };

  const runIds = runs.map(r => r.id);

  const selectedDiff = selectedTestId
    ? diffs.find(d => d.id === selectedTestId) ?? null
    : null;

  const updateBaseline = (val: string) => {
    setBaseline(val);
    const url = new URL(window.location.href);
    url.searchParams.set("baseline", val);
    window.history.replaceState({}, "", url.toString());
  };

  const updateCandidate = (val: string) => {
    setCandidate(val);
    const url = new URL(window.location.href);
    url.searchParams.set("candidate", val);
    window.history.replaceState({}, "", url.toString());
  };

  const doSwap = () => {
    setBaseline(candidate);
    setCandidate(baseline);
    const url = new URL(window.location.href);
    url.searchParams.set("baseline", candidate);
    url.searchParams.set("candidate", baseline);
    window.history.replaceState({}, "", url.toString());
  };

  const updateColFilter = (field: string) => (f: ColumnFilterState) => {
    setColFilters(prev => ({ ...prev, [field]: f }));
  };

  let filteredRows = diffs;
  if (searchText) {
    const q = searchText.toLowerCase();
    filteredRows = filteredRows.filter(d => d.name.toLowerCase().includes(q));
  }
  if (regressionsOnly) {
    filteredRows = filteredRows.filter(d => d.state === "regression");
  }
  for (const [field, f] of Object.entries(colFilters)) {
    if (f.text || f.selected.length > 0) {
      filteredRows = filteredRows.filter(d => {
        const raw = String((d as unknown as Record<string, unknown>)[field] ?? "");
        const textMatch = !f.text || raw.toLowerCase().includes(f.text.toLowerCase());
        const selMatch = f.selected.length === 0 || f.selected.includes(raw);
        return textMatch && selMatch;
      });
    }
  }

  const categories = [...new Set(diffs.map(d => d.category))];
  const states = [...new Set(diffs.map(d => d.state))];

  return (
    <AppLayout activeTab="compare">
      <div className="h-[calc(100vh-100px)] flex flex-col max-w-[1600px] mx-auto gap-4">

        {/* Selectors */}
        <div className="gcp-card p-4 flex items-center justify-between bg-[var(--gcp-surface-hover)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 border-r border-[var(--gcp-grey)] pr-3">
              <Calendar size={13} />
              <select className="text-[12px] bg-transparent border-none outline-none font-medium cursor-pointer" value={timeSlice} onChange={e => setTimeSlice(e.target.value)}>
                {TIME_SLICES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-4 px-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-[var(--gcp-text-secondary)] mb-1 uppercase">Baseline Run</label>
              <select className="gcp-input w-full font-mono text-sm" value={baseline} onChange={e => updateBaseline(e.target.value)}>
                {runIds.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="pt-5">
              <button className="gcp-button" onClick={doSwap}>⇄ Swap</button>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-[var(--gcp-text-secondary)] mb-1 uppercase">Candidate Run</label>
              <select className="gcp-input w-full font-mono text-sm border-[var(--gcp-blue)]" value={candidate} onChange={e => updateCandidate(e.target.value)}>
                {runIds.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-end gap-2 pb-0.5">
            <button onClick={() => { copyToClipboard(window.location.href); showToast("Comparison permalink copied"); }} className="gcp-button text-[12px] flex items-center gap-1.5"><Link2 size={13} /> Copy link</button>
            <button onClick={() => { copyToClipboard(`Comparison summary: ${baseline} vs ${candidate}\nNew failures: 7\nFixed: 12\nStill failing: 3\nDuration regressions: 2`); showToast("Slack comparison summary copied"); }} className="gcp-button text-[12px] flex items-center gap-1.5"><Share2 size={13} /> Share</button>
          </div>
        </div>

        {/* Summary Tiles */}
        <div className="grid grid-cols-4 gap-4 shrink-0">
          <div className="gcp-card p-4 flex justify-between items-center border-l-4 border-l-[var(--gcp-red)]">
            <span className="font-medium text-[var(--gcp-text-secondary)]">New Failures</span>
            <span className="text-2xl font-bold text-[var(--gcp-red)]">+7</span>
          </div>
          <div className="gcp-card p-4 flex justify-between items-center border-l-4 border-l-[var(--gcp-green)]">
            <span className="font-medium text-[var(--gcp-text-secondary)]">Fixed</span>
            <span className="text-2xl font-bold text-[var(--gcp-green)]">+12</span>
          </div>
          <div className="gcp-card p-4 flex justify-between items-center border-l-4 border-l-[var(--gcp-grey)]">
            <span className="font-medium text-[var(--gcp-text-secondary)]">Still Failing</span>
            <span className="text-2xl font-bold text-[var(--gcp-text-secondary)]">3</span>
          </div>
          <div className="gcp-card p-4 flex justify-between items-center border-l-4 border-l-[var(--gcp-yellow)]">
            <span className="font-medium text-[var(--gcp-text-secondary)]">Duration Regressions</span>
            <span className="text-2xl font-bold text-[var(--gcp-yellow)]">+2</span>
          </div>
        </div>

        {/* Regression quick-actions bar */}
        <div className="flex items-center gap-3 text-[12px] text-[var(--gcp-text-secondary)] bg-[var(--gcp-red-bg)] border border-[var(--gcp-red)] rounded px-4 py-2.5 shrink-0">
          <AlertTriangle size={14} className="text-[var(--gcp-red)] shrink-0" />
          <span><strong>7 regressions</strong> detected. File GitHub issues or share with your team:</span>
          <button onClick={() => { copyToClipboard(`Bulk regression report\nBaseline: ${baseline}\nCandidate: ${candidate}\n7 regressions detected`); showToast("Bulk issue template copied — 7 regressions"); }} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-[var(--gcp-red)] text-white rounded text-[11px] font-medium hover:opacity-90 transition-opacity"><Github size={12} /> File all as GitHub Issues</button>
          <button onClick={() => { copyToClipboard(`Regression summary\nBaseline: ${baseline}\nCandidate: ${candidate}\n7 regressions, 12 fixed, 3 still failing, 2 duration regressions`); showToast("Regression summary copied as Slack message"); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--gcp-surface)] border border-[var(--gcp-red)] text-[var(--gcp-red)] rounded text-[11px] font-medium hover:bg-[var(--gcp-red-bg)] transition-colors"><Share2 size={12} /> Share to Slack</button>
          <button onClick={() => { copyToClipboard(window.location.href); showToast("Full comparison permalink copied"); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--gcp-surface)] border border-[var(--gcp-grey)] text-[var(--gcp-text-secondary)] rounded text-[11px] font-medium hover:bg-[var(--gcp-surface-hover)] transition-colors"><Copy size={12} /> Copy permalink</button>
        </div>

        {/* Main split: table (left) + side panel (right) */}
        <div className="flex gap-4 flex-1 overflow-hidden">

          {/* Left: Table */}
          <div className={`flex flex-col gcp-card overflow-hidden ${selectedTestId ? "flex-1" : "w-full"}`}>
            <div className="p-3 border-b border-[var(--gcp-grey)] flex gap-4 items-center shrink-0">
              <input type="text" placeholder="Search test name..." className="gcp-input flex-1" value={searchText} onChange={e => setSearchText(e.target.value)} />
              <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap"><input type="checkbox" checked={regressionsOnly} onChange={e => setRegressionsOnly(e.target.checked)} /> Regressions only</label>
              <span className="text-[11px] text-[var(--gcp-text-secondary)] ml-auto">Click a row for comparison detail</span>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="gcp-table">
                <thead className="sticky top-0 bg-[var(--gcp-surface)] z-10">
                  <tr>
                    <th><TableHeaderFilter label="Test Name" filter={colFilters.name ?? EMPTY_FILTER} onFilterChange={updateColFilter("name")} /></th>
                    <th><TableHeaderFilter label="Baseline" allValues={["PASS", "FAIL"]} filter={colFilters.baseStatus ?? EMPTY_FILTER} onFilterChange={updateColFilter("baseStatus")} /></th>
                    <th><TableHeaderFilter label="Candidate" allValues={["PASS", "FAIL"]} filter={colFilters.candStatus ?? EMPTY_FILTER} onFilterChange={updateColFilter("candStatus")} /></th>
                    <th className="text-right"><TableHeaderFilter label="Δ Duration" filter={colFilters.durCand ?? EMPTY_FILTER} onFilterChange={updateColFilter("durCand")} /></th>
                    <th><TableHeaderFilter label="Category" allValues={categories} filter={colFilters.category ?? EMPTY_FILTER} onFilterChange={updateColFilter("category")} /></th>
                    <th><TableHeaderFilter label="State" allValues={states} filter={colFilters.state ?? EMPTY_FILTER} onFilterChange={updateColFilter("state")} /></th>
                    <th className="w-24 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((d, i) => (
                    <tr key={d.id}
                      className={`group cursor-pointer ${
                        d.state === 'regression' ? 'bg-[var(--gcp-red-bg)]' : d.state === 'fixed' ? 'bg-[var(--gcp-green-bg)]' : ''
                      } ${selectedTestId === d.id ? 'bg-[var(--gcp-blue-bg)] ring-2 ring-inset ring-[var(--gcp-blue)]' : ''}`}
                      onClick={() => setSelectedTestId(selectedTestId === d.id ? null : d.id)}
                    >
                      <td className="font-mono text-xs text-[var(--gcp-blue)] hover:underline font-medium">{d.name}</td>
                      <td><span className={`gcp-badge ${d.baseStatus === "PASS" ? "gcp-badge-pass" : "gcp-badge-fail"}`}>{d.baseStatus}</span></td>
                      <td><span className={`gcp-badge ${d.candStatus === "PASS" ? "gcp-badge-pass" : "gcp-badge-fail"}`}>{d.candStatus}</span></td>
                      <td className="text-right font-mono text-xs">
                        {d.state === 'duration'
                          ? <span className="text-[var(--gcp-red)] font-bold">+{d.durCand - d.durBase}ms</span>
                          : <span className="text-[var(--gcp-text-secondary)]">~0ms</span>}
                      </td>
                      <td><span className="px-2 py-1 bg-[var(--gcp-surface)] text-[11px] border border-[var(--gcp-grey)] rounded">{d.category}</span></td>
                      <td>
                        <span className={`text-[11px] font-medium ${
                          d.state === "regression" ? "text-[var(--gcp-red)]" :
                          d.state === "fixed" ? "text-[var(--gcp-green)]" :
                          d.state === "duration" ? "text-[var(--gcp-yellow)]" : "text-[var(--gcp-text-secondary)]"
                        }`}>
                          {d.state === "regression" ? "Regression" : d.state === "fixed" ? "Fixed" : d.state === "duration" ? "Duration" : "Unchanged"}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); copyToClipboard(`https://aware.example.com/tests/${d.id}?baseline=${baseline}&candidate=${candidate}`); showToast("Permalink copied"); }} title="Copy permalink" className="p-1 text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-blue)] rounded hover:bg-[var(--gcp-blue-bg)] transition-colors"><Link2 size={12} /></button>
                          <button onClick={(e) => { e.stopPropagation(); fileIssue(d.name); }} title="File GitHub issue" className={`p-1 rounded transition-colors ${issueFiled === d.name ? "text-[var(--gcp-green)]" : "text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-text)] hover:bg-[var(--gcp-grey-bg)]"}`}>{issueFiled === d.name ? <Check size={12} /> : <Github size={12} />}</button>
                          <button onClick={(e) => { e.stopPropagation(); copyToClipboard(`Slack: test ${d.name} comparison\nBaseline: ${d.baseStatus} (${d.durBase}ms)\nCandidate: ${d.candStatus} (${d.durCand}ms)\n${baseline} vs ${candidate}`); showToast("Slack snippet copied"); }} title="Share via Slack" className="p-1 text-[var(--gcp-text-secondary)] hover:text-[#4a154b] rounded hover:bg-[var(--gcp-grey-bg)] transition-colors"><Share2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Side panel */}
          {selectedDiff && selectedTestId && <_SidePanel selectedDiff={selectedDiff} selectedTestId={selectedTestId} setSelectedTestId={setSelectedTestId} />}

        </div>

        {/* Toast */}
        {shareToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[var(--gcp-text)] text-[var(--gcp-surface)] px-4 py-2.5 rounded shadow-lg text-[12px] z-50">
            <Check size={13} className="text-[var(--gcp-green)]" /> {shareToast}
          </div>
        )}

      </div>
    </AppLayout>
  );
}
