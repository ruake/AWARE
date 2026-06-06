import React from "react";
import { AppLayout } from "./_shared/AppLayout";
import "./_group.css";
import { Link2, Github, Share2, Copy, Check, ExternalLink, AlertTriangle } from "lucide-react";

export function Compare() {
  const dummyDiff = Array.from({length: 15}).map((_, i) => {
    let state = "unchanged";
    if (i === 1 || i === 4) state = "regression";
    if (i === 2) state = "fixed";
    if (i === 5) state = "duration";
    return {
      id: `diff_${i}`,
      name: `Regression Check /path/${i}`,
      baseStatus: state === "fixed" ? "FAIL" : "PASS",
      baseClass: state === "fixed" ? "gcp-badge-fail" : "gcp-badge-pass",
      candStatus: state === "regression" ? "FAIL" : "PASS",
      candClass: state === "regression" ? "gcp-badge-fail" : "gcp-badge-pass",
      durBase: 120,
      durCand: state === "duration" ? 340 : 125,
      category: "geo-match",
      state
    };
  });

  const [shareToast, setShareToast] = React.useState<string | null>(null);
  const [issueFiled, setIssueFiled] = React.useState<string | null>(null);
  const showToast = (msg: string) => { setShareToast(msg); setTimeout(() => setShareToast(null), 2500); };

  const fileIssue = (testName: string) => {
    setIssueFiled(testName);
    showToast(`GitHub issue template copied for ${testName}`);
    setTimeout(() => setIssueFiled(null), 3000);
  };

  return (
    <AppLayout activeTab="compare">
      <div className="max-w-[1600px] mx-auto space-y-4">

        {/* Selectors */}
        <div className="gcp-card p-4 flex items-center justify-between bg-[var(--gcp-surface-hover)]">
          <div className="flex-1">
            <label className="block text-xs font-bold text-[var(--gcp-text-secondary)] mb-1 uppercase">Baseline Run</label>
            <select className="gcp-input w-full font-mono text-sm">
              <option>run_892_2341.1.0_prod_1000 (PASS 99%)</option>
            </select>
          </div>
          <div className="px-8">
            <button className="gcp-button">⇄ Swap</button>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-[var(--gcp-text-secondary)] mb-1 uppercase">Candidate Run</label>
            <select className="gcp-input w-full font-mono text-sm border-[var(--gcp-blue)]">
              <option>run_893_2341.1.0_prod_1001 (PASS 87%)</option>
            </select>
          </div>
          <div className="pl-6 flex items-end gap-2 pb-0.5">
            <button
              onClick={() => showToast("Comparison permalink copied")}
              className="gcp-button text-[12px] flex items-center gap-1.5"
            >
              <Link2 size={13} /> Copy link
            </button>
            <button
              onClick={() => showToast("Slack comparison summary copied")}
              className="gcp-button text-[12px] flex items-center gap-1.5"
            >
              <Share2 size={13} /> Share
            </button>
          </div>
        </div>

        {/* Summary Tiles */}
        <div className="grid grid-cols-4 gap-4">
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
        <div className="flex items-center gap-3 text-[12px] text-[var(--gcp-text-secondary)] bg-[var(--gcp-red-bg)] border border-[var(--gcp-red)] rounded px-4 py-2.5">
          <AlertTriangle size={14} className="text-[var(--gcp-red)] shrink-0" />
          <span><strong>7 regressions</strong> detected. File GitHub issues or share with your team:</span>
          <button
            onClick={() => showToast("Bulk issue template copied — 7 regressions")}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-[var(--gcp-red)] text-white rounded text-[11px] font-medium hover:opacity-90 transition-opacity"
          >
            <Github size={12} /> File all as GitHub Issues
          </button>
          <button
            onClick={() => showToast("Regression summary copied as Slack message")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--gcp-surface)] border border-[var(--gcp-red)] text-[var(--gcp-red)] rounded text-[11px] font-medium hover:bg-[var(--gcp-red-bg)] transition-colors"
          >
            <Share2 size={12} /> Share to Slack
          </button>
          <button
            onClick={() => showToast("Full comparison permalink copied")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--gcp-surface)] border border-[var(--gcp-grey)] text-[var(--gcp-text-secondary)] rounded text-[11px] font-medium hover:bg-[var(--gcp-surface-hover)] transition-colors"
          >
            <Copy size={12} /> Copy permalink
          </button>
        </div>

        {/* Filters & Table */}
        <div className="gcp-card overflow-hidden">
          <div className="p-3 border-b border-[var(--gcp-grey)] flex gap-4 items-center">
            <input type="text" placeholder="Search test name..." className="gcp-input flex-1" />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" defaultChecked /> Show regressions only
            </label>
            <span className="text-[11px] text-[var(--gcp-text-secondary)] ml-auto">
              Hover a row → <Link2 size={10} className="inline" /> permalink · <Github size={10} className="inline" /> issue · <Share2 size={10} className="inline" /> share
            </span>
          </div>

          <table className="gcp-table">
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Baseline Status</th>
                <th>Candidate Status</th>
                <th className="text-right">Δ Duration</th>
                <th>Category</th>
                <th className="w-24 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dummyDiff.map(d => (
                <tr
                  key={d.id}
                  className={`group ${d.state === 'regression' ? 'bg-[var(--gcp-red-bg)]' : d.state === 'fixed' ? 'bg-[var(--gcp-green-bg)]' : ''}`}
                >
                  <td className="font-mono text-xs">{d.name}</td>
                  <td><span className={`gcp-badge ${d.baseClass}`}>{d.baseStatus}</span></td>
                  <td><span className={`gcp-badge ${d.candClass}`}>{d.candStatus}</span></td>
                  <td className="text-right font-mono text-xs">
                    {d.state === 'duration'
                      ? <span className="text-[var(--gcp-red)] font-bold">+{d.durCand - d.durBase}ms</span>
                      : <span className="text-[var(--gcp-text-secondary)]">~0ms</span>}
                  </td>
                  <td><span className="px-2 py-1 bg-[var(--gcp-surface)] text-[11px] border border-[var(--gcp-grey)] rounded">{d.category}</span></td>
                  <td>
                    <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => showToast(`Permalink copied for ${d.name}`)}
                        title="Copy permalink"
                        className="p-1 text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-blue)] rounded hover:bg-[var(--gcp-blue-bg)] transition-colors"
                      >
                        <Link2 size={12} />
                      </button>
                      <button
                        onClick={() => fileIssue(d.name)}
                        title="File GitHub issue"
                        className={`p-1 rounded transition-colors ${issueFiled === d.name ? "text-[var(--gcp-green)]" : "text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-text)] hover:bg-[var(--gcp-grey-bg)]"}`}
                      >
                        {issueFiled === d.name ? <Check size={12} /> : <Github size={12} />}
                      </button>
                      <button
                        onClick={() => showToast(`Slack snippet copied for ${d.name}`)}
                        title="Share via Slack"
                        className="p-1 text-[var(--gcp-text-secondary)] hover:text-[#4a154b] rounded hover:bg-[var(--gcp-grey-bg)] transition-colors"
                      >
                        <Share2 size={12} />
                      </button>
                      <a href="#" title="Open in new tab" className="p-1 text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-blue)] rounded hover:bg-[var(--gcp-blue-bg)] transition-colors">
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
