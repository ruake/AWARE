import React from "react";
import { AppLayout } from "./_shared/AppLayout";
import "./_group.css";
import { Link2, Check, Share2, Copy, ExternalLink } from "lucide-react";

function CopyLinkBtn({ runId }: { runId: string }) {
  const [copied, setCopied] = React.useState(false);
  const handle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={handle}
      title={`Copy permalink for ${runId}`}
      className="opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-blue)]"
    >
      {copied ? <Check size={12} className="text-[var(--gcp-green)]" /> : <Link2 size={12} />}
    </button>
  );
}

function SlackBtn({ runId }: { runId: string }) {
  const [copied, setCopied] = React.useState(false);
  const handle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={handle}
      title="Copy Slack snippet"
      className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--gcp-text-secondary)] hover:text-[#4a154b]"
    >
      {copied ? <Check size={12} className="text-[var(--gcp-green)]" /> : <Share2 size={12} />}
    </button>
  );
}

export function Runs() {
  const dummyRuns = Array.from({length: 12}).map((_, i) => {
    const isFail = i === 2 || i === 7;
    const isPartial = i === 4;
    const status = isFail ? "FAIL" : isPartial ? "PARTIAL" : "PASS";
    const statusClass = status === "PASS" ? "gcp-badge-pass" : status === "FAIL" ? "gcp-badge-fail" : "gcp-badge-flaky";
    const failCount = status === "PASS" ? 0 : status === "FAIL" ? (i === 2 ? 6 : 12) : 3;
    const passPct = status === "PASS" ? 100 : 100 - Math.floor(failCount / 10);
    return {
      id: `run_892_2341.1.0_prod_${1000 + i}`,
      label: `Prod/Production · PM 892 · EW 2341.1.0`,
      suite: i % 3 === 0 ? "full_suite" : "geo_gating",
      target: i % 2 === 0 ? "Prod" : "UAT",
      status,
      statusClass,
      passPct: `${passPct}%`,
      failures: failCount,
      duration: `${45 + (i%15)}m`,
      started: `2026-06-06T14:${String(30 - i).padStart(2,"0")}Z`,
      pm: "v892",
      ew: "2341.1.0"
    };
  });

  const [shareToast, setShareToast] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setShareToast(msg);
    setTimeout(() => setShareToast(null), 2500);
  };

  return (
    <AppLayout activeTab="runs">
      <div className="max-w-[1600px] mx-auto space-y-4">

        {/* Filters */}
        <div className="gcp-card p-4 flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            {["All", "PASS", "FAIL", "PARTIAL", "FLAKY"].map(s => (
              <span key={s} className={`gcp-badge cursor-pointer ${s === 'All' ? 'bg-[var(--gcp-blue)] text-white' : 'bg-[var(--gcp-grey-bg)] text-[var(--gcp-text)]'}`}>{s}</span>
            ))}
          </div>
          <div className="h-6 w-px bg-[var(--gcp-grey)]" />
          <select className="gcp-input">
            <option>full_suite</option>
            <option>geo_gating</option>
            <option>smoke</option>
            <option>url_health</option>
          </select>
          <select className="gcp-input">
            <option>Prod</option>
            <option>UAT</option>
          </select>
          <select className="gcp-input">
            <option>Production</option>
            <option>Staging</option>
          </select>
          <input type="date" className="gcp-input" />
        </div>

        {/* Table Controls */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-[12px] text-[var(--gcp-text-secondary)]">
            <Link2 size={12} />
            Hover any row to copy its permalink or Slack snippet
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => showToast("Current filter state copied as shareable URL")}
              className="gcp-button text-sm flex items-center gap-1.5"
            >
              <Copy size={13} /> Share filtered view
            </button>
            <button className="gcp-button text-sm">Export CSV</button>
            <button className="gcp-button text-sm">Export JSON</button>
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
              {dummyRuns.map((run, i) => (
                <tr key={run.id} className={`group ${i === 1 ? "bg-[var(--gcp-blue-bg)]" : ""}`}>
                  <td>
                    <div className="flex items-center">
                      <span className="gcp-mono text-[var(--gcp-blue)] hover:underline cursor-pointer text-[12px]">{run.id}</span>
                      <CopyLinkBtn runId={run.id} />
                    </div>
                  </td>
                  <td className="text-[var(--gcp-text-secondary)] text-[12px]">{run.label}</td>
                  <td className="text-[12px]">{run.suite}</td>
                  <td className="text-[12px]">{run.target}</td>
                  <td><span className={`gcp-badge ${run.statusClass}`}>{run.status}</span></td>
                  <td className="text-right font-mono text-[12px]">{run.passPct}</td>
                  <td className="text-right font-mono text-[12px] text-[var(--gcp-red)]">{run.failures > 0 ? run.failures : "-"}</td>
                  <td className="text-right text-[var(--gcp-text-secondary)] text-[12px]">{run.duration}</td>
                  <td className="gcp-mono text-[11px]">{run.started}</td>
                  <td className="gcp-mono text-[12px]">{run.pm}</td>
                  <td className="gcp-mono text-[12px]">{run.ew}</td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => showToast(`Permalink copied: /runs/${run.id}`)}
                        title="Copy permalink"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-blue)]"
                      >
                        <Link2 size={13} />
                      </button>
                      <button
                        onClick={() => showToast(`Slack snippet copied for ${run.id}`)}
                        title="Copy Slack snippet"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--gcp-text-secondary)] hover:text-[#4a154b]"
                      >
                        <Share2 size={13} />
                      </button>
                      <a href="#" className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-blue)]" title="Open in new tab">
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 border-t border-[var(--gcp-grey)] flex justify-between items-center text-sm text-[var(--gcp-text-secondary)]">
            <span>Showing 1–12 of 145 runs</span>
            <div className="flex gap-2">
              <button className="gcp-button" disabled>&lt; Prev</button>
              <button className="gcp-button">Next &gt;</button>
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
    </AppLayout>
  );
}
