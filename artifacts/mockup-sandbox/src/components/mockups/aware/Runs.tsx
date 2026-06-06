import React from "react";
import { AppLayout } from "./_shared/AppLayout";
import { RUNS } from "./_shared/data";
import { navTo, copyToClipboard, repo } from "./_shared/nav";
import "./_group.css";
import { Link2, Check, Share2, Copy, ExternalLink, PlayCircle, Github, X } from "lucide-react";

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

function SlackBtn({ runId }: { runId: string }) {
  const [copied, setCopied] = React.useState(false);
  const handle = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyToClipboard(`Slack snippet for run ${runId}: https://aware.example.com/runs/${runId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={handle} title="Copy Slack snippet" className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--gcp-text-secondary)] hover:text-[#4a154b]">
      {copied ? <Check size={12} className="text-[var(--gcp-green)]" /> : <Share2 size={12} />}
    </button>
  );
}

function NewRunModal({ onClose }: { onClose: () => void }) {
  const [branch, setBranch] = React.useState("main");
  const [suite, setSuite] = React.useState("full_suite");
  const [target, setTarget] = React.useState("Prod");
  const [env, setEnv] = React.useState("Production");
  const [triggered, setTriggered] = React.useState(false);

  const handleTrigger = () => {
    const workflowUrl = `${repo}/actions/workflows/run-tests.yml`;
    const params = new URLSearchParams({
      inputs: JSON.stringify({ branch, suite, target, environment: env }),
    });
    copyToClipboard(`${workflowUrl}/dispatches?${params}`);
    setTriggered(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="gcp-card w-[480px] p-5 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium flex items-center gap-2">
            <PlayCircle size={18} className="text-[var(--gcp-blue)]" /> New Run
          </h2>
          <button onClick={onClose} className="text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-text)]"><X size={18} /></button>
        </div>

        {triggered ? (
          <div className="text-center py-6 space-y-3">
            <Check size={32} className="mx-auto text-[var(--gcp-green)]" />
            <p className="text-sm font-medium text-[var(--gcp-text)]">Workflow trigger copied to clipboard</p>
            <p className="text-[12px] text-[var(--gcp-text-secondary)]">Open GitHub Actions to run the workflow:</p>
            <a href={`${repo}/actions/workflows/run-tests.yml`} target="_blank" rel="noopener noreferrer" className="gcp-button gcp-button-primary inline-flex items-center gap-1.5 text-sm">
              <Github size={15} /> Open GitHub Actions <ExternalLink size={13} />
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-[var(--gcp-text-secondary)] mb-1">Branch</label>
              <input value={branch} onChange={e => setBranch(e.target.value)} className="gcp-input w-full font-mono text-sm" placeholder="main" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--gcp-text-secondary)] mb-1">Suite</label>
              <select value={suite} onChange={e => setSuite(e.target.value)} className="gcp-input w-full text-sm">
                <option>full_suite</option>
                <option>geo_gating</option>
                <option>smoke</option>
                <option>url_health</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[var(--gcp-text-secondary)] mb-1">Target</label>
                <select value={target} onChange={e => setTarget(e.target.value)} className="gcp-input w-full text-sm">
                  <option>Prod</option>
                  <option>UAT</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[var(--gcp-text-secondary)] mb-1">Environment</label>
                <select value={env} onChange={e => setEnv(e.target.value)} className="gcp-input w-full text-sm">
                  <option>Production</option>
                  <option>Staging</option>
                </select>
              </div>
            </div>
            <div className="pt-2">
              <button onClick={handleTrigger} className="gcp-button gcp-button-primary w-full flex items-center justify-center gap-1.5 text-sm py-2.5">
                <Github size={16} /> Trigger via GitHub Actions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function Runs() {
  const [shareToast, setShareToast] = React.useState<string | null>(null);
  const [showNewRun, setShowNewRun] = React.useState(false);
  const showToast = (msg: string) => { setShareToast(msg); setTimeout(() => setShareToast(null), 2500); };

  return (
    <AppLayout activeTab="runs">
      <div className="max-w-[1600px] mx-auto space-y-4">

        {/* Filters */}
        <div className="gcp-card p-4 flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            {["All", "PASS", "FAIL", "PARTIAL", "FLAKY"].map(s => (
              <span key={s} onClick={() => showToast(`Filtered by: ${s}`)} className={`gcp-badge cursor-pointer ${s === 'All' ? 'bg-[var(--gcp-blue)] text-white' : 'bg-[var(--gcp-grey-bg)] text-[var(--gcp-text)]'}`}>{s}</span>
            ))}
          </div>
          <div className="h-6 w-px bg-[var(--gcp-grey)]" />
          <select className="gcp-input" onChange={e => showToast(`Suite: ${e.target.value}`)}><option>full_suite</option><option>geo_gating</option><option>smoke</option><option>url_health</option></select>
          <select className="gcp-input" onChange={e => showToast(`Target: ${e.target.value}`)}><option>Prod</option><option>UAT</option></select>
          <select className="gcp-input" onChange={e => showToast(`Env: ${e.target.value}`)}><option>Production</option><option>Staging</option></select>
          <input type="date" className="gcp-input" onChange={e => showToast(`Date: ${e.target.value}`)} />
        </div>

        {/* Table Controls */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-[12px] text-[var(--gcp-text-secondary)]">
            <Link2 size={12} />
            Hover any row to copy its permalink or Slack snippet
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowNewRun(true)} className="gcp-button gcp-button-primary text-sm flex items-center gap-1.5">
              <PlayCircle size={14} /> New Run
            </button>
            <button onClick={() => { copyToClipboard(window.location.href); showToast("Current filter state URL copied"); }} className="gcp-button text-sm flex items-center gap-1.5"><Copy size={13} /> Share filtered view</button>
            <button onClick={() => showToast("CSV export started")} className="gcp-button text-sm">Export CSV</button>
            <button onClick={() => showToast("JSON export started")} className="gcp-button text-sm">Export JSON</button>
          </div>
        </div>

        {/* Table */}
        <div className="gcp-card overflow-x-auto">
          <table className="gcp-table">
            <thead>
              <tr>
                <th>Run ID</th>
                <th>Label</th>
                <th>Suite</th>
                <th>Target</th>
                <th>Status</th>
                <th className="text-right">Pass %</th>
                <th className="text-right">Failures</th>
                <th className="text-right">Duration</th>
                <th>Started</th>
                <th>PM</th>
                <th>EW</th>
                <th className="w-16 text-center text-[var(--gcp-text-secondary)]">Share</th>
              </tr>
            </thead>
            <tbody>
              {RUNS.map((run, i) => {
                const statusBadge = run.status === "PASS" ? "gcp-badge-pass" : run.status === "FAIL" ? "gcp-badge-fail" : "gcp-badge-flaky";
                return (
                  <tr key={run.id} className={`group ${i === 1 ? "bg-[var(--gcp-blue-bg)]" : ""}`}>
                    <td>
                      <div className="flex items-center">
                        <span className="gcp-mono text-[var(--gcp-blue)] hover:underline cursor-pointer text-[12px]" onClick={() => navTo(`RunDetail?runId=${run.id}`)}>
                          {run.id}
                        </span>
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
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => { copyToClipboard(`https://aware.example.com/runs/${run.id}`); showToast("Permalink copied"); }} title="Copy permalink" className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-blue)]"><Link2 size={13} /></button>
                        <button onClick={() => { copyToClipboard(`Slack snippet for run ${run.id}: https://aware.example.com/runs/${run.id}`); showToast("Slack snippet copied"); }} title="Copy Slack snippet" className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--gcp-text-secondary)] hover:text-[#4a154b]"><Share2 size={13} /></button>
                        <button onClick={() => window.open(`/preview/aware/RunDetail?runId=${run.id}`, "_blank", "noopener")} title="Open in new tab" className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-blue)]"><ExternalLink size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="p-4 border-t border-[var(--gcp-grey)] flex justify-between items-center text-sm text-[var(--gcp-text-secondary)]">
            <span>Showing 1–12 of 145 runs</span>
            <div className="flex gap-2">
              <button className="gcp-button" disabled onClick={() => showToast("Already on first page")}>&lt; Prev</button>
              <button className="gcp-button" onClick={() => showToast("Loading next page...")}>Next &gt;</button>
            </div>
          </div>
        </div>

        {/* Toast */}
        {shareToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[var(--gcp-text)] text-[var(--gcp-surface)] px-4 py-2.5 rounded shadow-lg text-[12px] z-50">
            <Check size={13} className="text-[var(--gcp-green)]" /> {shareToast}
          </div>
        )}

      </div>

      {/* New Run Modal */}
      {showNewRun && <NewRunModal onClose={() => setShowNewRun(false)} />}
    </AppLayout>
  );
}
