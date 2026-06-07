import React from "react";
import { AppLayout } from "./_shared/AppLayout";
import { useSyncRuns } from "./_shared/hooks";
import type { Run } from "./_shared/services";
import { navTo, copyToClipboard } from "./_shared/nav";
import { ColumnFilter, type ColumnFilterState } from "./_shared/ColumnFilter";
import { useSyncedUrlState } from "./_shared/urlState";
import "./_group.css";
import { Link2, Check, Share2, Copy, ExternalLink, PlayCircle, X, ArrowUpRight, AlertTriangle } from "lucide-react";

const EMPTY_FILTER: ColumnFilterState = { text: "", selected: [] };

function applyFilters(runs: Run[], filters: Record<string, ColumnFilterState>) {
  return runs.filter(r => {
    for (const [field, f] of Object.entries(filters)) {
      const raw = String((r as unknown as Record<string, unknown>)[field] ?? "");
      const textMatch = !f.text || raw.toLowerCase().includes(f.text.toLowerCase());
      const selMatch = f.selected.length === 0 || f.selected.includes(raw);
      if (!textMatch || !selMatch) return false;
    }
    return true;
  });
}

function CopyLinkBtn({ runId }: { runId: string }) {
  const [copied, setCopied] = React.useState(false);
  const handle = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyToClipboard(`https://aware.example.com/runs/${runId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={handle} title={`Copy permalink for ${runId}`} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-blue)]">
      {copied ? <Check size={12} className="text-[var(--gcp-green)]" /> : <Link2 size={12} />}
    </button>
  );
}

function RunSidePanel({ run, onClose, onFilter }: { run: Run; onClose: () => void; onFilter: (field: string, value: string) => void }) {
  const statusBadge = run.status === "PASS" ? "gcp-badge-pass" : run.status === "FAIL" ? "gcp-badge-fail" : "gcp-badge-flaky";
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-[var(--gcp-grey)] flex items-center justify-between shrink-0">
        <h3 className="font-medium text-sm flex items-center gap-2">Run Detail</h3>
        <button onClick={onClose} className="p-1 text-[var(--gcp-text-secondary)] hover:bg-[var(--gcp-surface-hover)] rounded"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`gcp-badge ${statusBadge}`}>{run.status}</span>
            <span className="font-mono text-sm text-[var(--gcp-blue)]">{run.id}</span>
          </div>
          <p className="text-sm text-[var(--gcp-text-secondary)]">{run.label}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="gcp-card p-3">
            <div className="text-[11px] text-[var(--gcp-text-secondary)] uppercase tracking-wider font-medium">Pass Rate</div>
            <div className="text-2xl font-bold mt-1">{run.passPct}%</div>
          </div>
          <div
            onClick={() => onFilter("status", "FAIL")}
            className="gcp-card p-3 cursor-pointer transition-all hover:shadow-md"
          >
            <div className="text-[11px] text-[var(--gcp-text-secondary)] uppercase tracking-wider font-medium">Failures</div>
            <div className="text-2xl font-bold text-[var(--gcp-red)] mt-1">{run.failures}</div>
          </div>
          <div className="gcp-card p-3">
            <div className="text-[11px] text-[var(--gcp-text-secondary)] uppercase tracking-wider font-medium">Duration</div>
            <div className="text-lg font-bold mt-1">{run.duration}</div>
          </div>
          <div
            onClick={() => onFilter("target", run.target)}
            className="gcp-card p-3 cursor-pointer transition-all hover:shadow-md"
          >
            <div className="text-[11px] text-[var(--gcp-text-secondary)] uppercase tracking-wider font-medium">Target</div>
            <div className="text-lg font-bold mt-1">{run.target}</div>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1.5 border-b border-[var(--gcp-grey)]">
            <span className="text-[var(--gcp-text-secondary)]">Suite</span><span className="font-medium">{run.suite}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[var(--gcp-grey)]">
            <span className="text-[var(--gcp-text-secondary)]">Environment</span><span className="font-medium">{run.env}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[var(--gcp-grey)]">
            <span className="text-[var(--gcp-text-secondary)]">PM Version</span><span className="font-mono">{run.pm}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[var(--gcp-grey)]">
            <span className="text-[var(--gcp-text-secondary)]">EW Version</span><span className="font-mono">{run.ew}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[var(--gcp-text-secondary)]">Started</span><span className="font-mono">{run.started}</span>
          </div>
        </div>
        <div className="space-y-2 pt-2">
          <button onClick={() => navTo(`RunDetail?runId=${run.id}`)} className="w-full gcp-button gcp-button-primary text-sm flex items-center justify-center gap-1.5 py-2">
            View Full Details <ArrowUpRight size={14} />
          </button>
          <button onClick={() => { copyToClipboard(`https://aware.example.com/runs/${run.id}`); }} className="w-full gcp-button text-[12px] flex items-center justify-center gap-1.5 py-2">
            <Link2 size={13} /> Copy permalink
          </button>
        </div>
      </div>
    </div>
  );
}

export function Runs() {
  const [shareToast, setShareToast] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useSyncedUrlState<string | null>("status", null);
  const [quickSuite, setQuickSuite] = useSyncedUrlState("suite", "All");
  const [quickTarget, setQuickTarget] = useSyncedUrlState("target", "All");
  const [quickEnv, setQuickEnv] = useSyncedUrlState("env", "All");
  const [colFilters, setColFilters] = useSyncedUrlState<Record<string, ColumnFilterState>>("filters", {});
  const [selectedRunId, setSelectedRunId] = useSyncedUrlState<string | null>("sel", null);
  const showToast = (msg: string) => { setShareToast(msg); setTimeout(() => setShareToast(null), 2500); };
  const RUNS = useSyncRuns();

  const updateColFilter = (field: string) => (f: ColumnFilterState) => {
    setColFilters(prev => ({ ...prev, [field]: f }));
  };

  let filtered = applyFilters(RUNS, colFilters);
  if (statusFilter) filtered = filtered.filter(r => r.status === statusFilter);
  if (quickSuite !== "All") filtered = filtered.filter(r => r.suite === quickSuite);
  if (quickTarget !== "All") filtered = filtered.filter(r => r.target === quickTarget);
  if (quickEnv !== "All") filtered = filtered.filter(r => r.env.includes(quickEnv));

  const selectedRun = selectedRunId ? RUNS.find(r => r.id === selectedRunId) ?? null : null;

  const suites = [...new Set(RUNS.map(r => r.suite))];
  const targets = [...new Set(RUNS.map(r => r.target))];
  const envs = [...new Set(RUNS.map(r => r.env))];
  const statuses = [...new Set(RUNS.map(r => r.status))];
  const pms = [...new Set(RUNS.map(r => r.pm))];
  const ews = [...new Set(RUNS.map(r => r.ew))];

  return (
    <AppLayout activeTab="runs">
      <div className="h-[calc(100vh-100px)] flex flex-col max-w-[1600px] mx-auto gap-4">

        {/* Toolbar Filters */}
        <div className="gcp-card p-4 flex flex-wrap gap-4 items-center shrink-0">
          <div className="flex gap-2">
            {["All", "PASS", "FAIL", "PARTIAL", "FLAKY"].map(s => (
              <span key={s} onClick={() => {
                setStatusFilter(s === "All" ? null : s);
                showToast(s === "All" ? "Filter cleared" : `Filtered by: ${s}`);
              }} className={`gcp-badge cursor-pointer ${(s === "All" && !statusFilter) || statusFilter === s ? 'bg-[var(--gcp-blue)] text-white' : 'bg-[var(--gcp-grey-bg)] text-[var(--gcp-text)]'}`}>{s}</span>
            ))}
          </div>
          <div className="h-6 w-px bg-[var(--gcp-grey)]" />
          <select className="gcp-input" value={quickSuite} onChange={e => { setQuickSuite(e.target.value); showToast(`Suite: ${e.target.value}`); }}>
            <option>All</option>
            {suites.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="gcp-input" value={quickTarget} onChange={e => { setQuickTarget(e.target.value); showToast(`Target: ${e.target.value}`); }}>
            <option>All</option>
            {targets.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="gcp-input" value={quickEnv} onChange={e => { setQuickEnv(e.target.value); showToast(`Env: ${e.target.value}`); }}>
            <option>All</option>
            {envs.map(s => <option key={s}>{s}</option>)}
          </select>
          <input type="date" className="gcp-input" onChange={e => showToast(`Date: ${e.target.value}`)} />
        </div>

        {/* Table Controls */}
        <div className="flex justify-between items-center shrink-0">
          <div className="flex items-center gap-1.5 text-[12px] text-[var(--gcp-text-secondary)]">
            <Link2 size={12} />
            Click a row for run details · Hover to copy permalink
          </div>
          <div className="flex gap-2">
            <button onClick={() => navTo("StartRun")} className="gcp-button gcp-button-primary text-sm flex items-center gap-1.5">
              <PlayCircle size={14} /> New Run
            </button>
            <button onClick={() => { copyToClipboard(window.location.href); showToast("Current filter state URL copied"); }} className="gcp-button text-sm flex items-center gap-1.5"><Copy size={13} /> Share filtered view</button>
            <button onClick={() => showToast("CSV export started")} className="gcp-button text-sm">Export CSV</button>
            <button onClick={() => showToast("JSON export started")} className="gcp-button text-sm">Export JSON</button>
          </div>
        </div>

        {/* Split: table (left) + side panel (right) */}
        <div className="flex-col lg:flex-row gap-4 flex-1 overflow-hidden">

          {/* Table */}
          <div className={`flex flex-col gcp-card overflow-hidden ${selectedRun ? "flex-1" : "w-full"}`}>
            <div className="flex-1 overflow-auto">
              <table className="gcp-table">
                <thead className="sticky top-0 bg-[var(--gcp-surface)] z-10">
                  <tr>
                    <th><ColumnFilter label="Run ID" allValues={RUNS.map(r => r.id)} filter={colFilters.id ?? EMPTY_FILTER} onFilterChange={updateColFilter("id")} /></th>
                    <th><ColumnFilter label="Label" filter={colFilters.label ?? EMPTY_FILTER} onFilterChange={updateColFilter("label")} /></th>
                    <th><ColumnFilter label="Suite" allValues={suites} filter={colFilters.suite ?? EMPTY_FILTER} onFilterChange={updateColFilter("suite")} /></th>
                    <th><ColumnFilter label="Target" allValues={targets} filter={colFilters.target ?? EMPTY_FILTER} onFilterChange={updateColFilter("target")} /></th>
                    <th><ColumnFilter label="Status" allValues={statuses} filter={colFilters.status ?? EMPTY_FILTER} onFilterChange={updateColFilter("status")} /></th>
                    <th className="text-right"><ColumnFilter label="Pass %" filter={colFilters.passPct ?? EMPTY_FILTER} onFilterChange={updateColFilter("passPct")} /></th>
                    <th className="text-right">Failures</th>
                    <th className="text-right">Duration</th>
                    <th><ColumnFilter label="Started" filter={colFilters.started ?? EMPTY_FILTER} onFilterChange={updateColFilter("started")} /></th>
                    <th><ColumnFilter label="PM" allValues={pms} filter={colFilters.pm ?? EMPTY_FILTER} onFilterChange={updateColFilter("pm")} /></th>
                    <th><ColumnFilter label="EW" allValues={ews} filter={colFilters.ew ?? EMPTY_FILTER} onFilterChange={updateColFilter("ew")} /></th>
                    <th className="w-16 text-center text-[var(--gcp-text-secondary)]">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((run, i) => {
                    const statusBadge = run.status === "PASS" ? "gcp-badge-pass" : run.status === "FAIL" ? "gcp-badge-fail" : "gcp-badge-flaky";
                    return (
                      <tr key={run.id} className={`group cursor-pointer ${selectedRunId === run.id ? "bg-[var(--gcp-blue-bg)] ring-2 ring-inset ring-[var(--gcp-blue)]" : i === 1 ? "bg-[var(--gcp-blue-bg)]" : ""}`} onClick={() => setSelectedRunId(selectedRunId === run.id ? null : run.id)}>
                        <td>
                          <div className="flex items-center">
                            <span className="gcp-mono text-[var(--gcp-blue)] text-[12px]">{run.id}</span>
                            <CopyLinkBtn runId={run.id} />
                          </div>
                        </td>
                        <td className="text-[var(--gcp-text-secondary)] text-[12px]">{run.label}</td>
                        <td className="text-[12px]">{run.suite}</td>
                        <td className="text-[12px]">{run.target}</td>
                        <td><span className={`gcp-badge ${statusBadge}`}>{run.status}</span></td>
                        <td className="text-right font-mono text-[12px]">{run.passPct}%</td>
                        <td className="text-right font-mono text-[12px] text-[var(--gcp-red)]">{run.failures > 0 ? run.failures : "-"}</td>
                        <td className="text-right text-[var(--gcp-text-secondary)] text-[12px]">{run.duration}</td>
                        <td className="gcp-mono text-[11px]">{run.started}</td>
                        <td className="gcp-mono text-[12px]">{run.pm}</td>
                        <td className="gcp-mono text-[12px]">{run.ew}</td>
                        <td className="text-center">
                          <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { copyToClipboard(`https://aware.example.com/runs/${run.id}`); showToast("Permalink copied"); }} title="Copy permalink" className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-blue)]"><Link2 size={13} /></button>
                            <button onClick={() => { copyToClipboard(`Slack snippet for run ${run.id}: https://aware.example.com/runs/${run.id}`); showToast("Slack snippet copied"); }} title="Copy Slack snippet" className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--gcp-text-secondary)] hover:text-[#4a154b]"><Share2 size={13} /></button>
                            <button onClick={() => window.open(`${import.meta.env.BASE_URL}RunDetail?runId=${run.id}`, "_blank", "noopener")} title="Open in new tab" className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-blue)]"><ExternalLink size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-[var(--gcp-grey)] flex justify-between items-center text-sm text-[var(--gcp-text-secondary)] bg-[var(--gcp-surface-hover)]">
              <span>Showing {filtered.length} of {RUNS.length} runs</span>
              <div className="flex gap-2">
                <button className="gcp-button" disabled onClick={() => showToast("Already on first page")}>&lt; Prev</button>
                <button className="gcp-button" onClick={() => showToast("Loading next page...")}>Next &gt;</button>
              </div>
            </div>
          </div>

          {/* Side panel */}
          {selectedRun && (
            <div className="w-full lg:w-[35%] gcp-card overflow-hidden shrink-0 bg-[var(--gcp-surface)] border-l-2 border-[var(--gcp-blue)]">
              <RunSidePanel run={selectedRun} onClose={() => setSelectedRunId(null)}
                onFilter={(field, value) => {
                  if (field === "status") setStatusFilter(value);
                  if (field === "target") setQuickTarget(value);
                }} />
            </div>
          )}

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
