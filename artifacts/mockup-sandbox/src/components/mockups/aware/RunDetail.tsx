import React from "react";
import { AppLayout } from "./_shared/AppLayout";
import { RUNS, getRunById, getRunIndex, getTestResultsForRun } from "./_shared/data";
import { navTo, copyToClipboard, repo } from "./_shared/nav";
import "./_group.css";
import { Copy, Check, Share2, Link2, Github, ExternalLink, GitCompare } from "lucide-react";

function EvidenceSection({ label, children, copyText }: {
  label: string; children: React.ReactNode; copyText: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const handle = () => { copyToClipboard(copyText); setCopied(true); setTimeout(() => setCopied(false), 1800); };
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="text-[#569cd6] font-bold text-[12px]">{label}</div>
        <button onClick={handle} className="flex items-center gap-1 text-[10px] text-[#808080] hover:text-[#d4d4d4] transition-colors">
          {copied ? <Check size={10} className="text-[#4ec9b0]" /> : <Copy size={10} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {children}
    </div>
  );
}

export function RunDetail() {
  const params = new URLSearchParams(window.location.search);
  const currentRunId = params.get("runId") || RUNS[0].id;
  const currentRun = getRunById(currentRunId);
  const runIndex = getRunIndex(currentRunId);

  const otherRuns = RUNS.filter(r => r.id !== currentRunId);
  const [selectedCompareRun, setSelectedCompareRun] = React.useState(
    otherRuns[Math.min(0, otherRuns.length - 1)]?.id ?? ""
  );

  const dummyTests = getTestResultsForRun(Math.max(0, runIndex));

  const [shareToast, setShareToast] = React.useState<string | null>(null);
  const showToast = (msg: string) => { setShareToast(msg); setTimeout(() => setShareToast(null), 2500); };

  const handleCompare = () => {
    if (selectedCompareRun) {
      navTo(`Compare?baseline=${selectedCompareRun}&candidate=${currentRunId}`);
    }
  };

  const runStatus = currentRun?.status ?? "FAIL";
  const statusBadge = runStatus === "PASS" ? "gcp-badge-pass" : "gcp-badge-fail";
  const runLabel = currentRun ? currentRun.label : "Prod/Production · PM 892 · EW 2341.1.0";

  return (
    <AppLayout activeTab="runs">
      <div className="h-[calc(100vh-100px)] flex flex-col gap-4 max-w-[1800px] mx-auto">

        {/* Sticky Header */}
        <div className="gcp-card p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <span className={`gcp-badge text-sm ${statusBadge}`}>{runStatus}</span>
            <h1 className="text-lg font-medium">{runLabel}</h1>
            <span className="text-[var(--gcp-text-secondary)] gcp-mono text-sm">{currentRunId}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-[var(--gcp-text-secondary)]">
            <span>Duration: {currentRun?.duration ?? "45m"}</span>
            <span>Target: {currentRun?.env ?? "Prod/Production"}</span>
            <button onClick={() => { copyToClipboard(`https://aware.example.com/runs/${currentRunId}`); showToast("Permalink copied"); }} className="flex items-center gap-1.5 gcp-button text-[12px] px-3 py-1.5"><Link2 size={13} /> Copy link</button>
            <button onClick={() => { copyToClipboard(`Slack snippet for run ${currentRunId}: https://aware.example.com/runs/${currentRunId}`); showToast("Slack snippet copied"); }} className="flex items-center gap-1.5 gcp-button text-[12px] px-3 py-1.5"><Share2 size={13} /> Share</button>
            <a href={`${repo}/commit/mock-run-${currentRunId.slice(-4)}`} target="_blank" rel="noopener noreferrer" className="text-[var(--gcp-blue)] hover:underline flex items-center gap-1">View Commit <ExternalLink size={12} /></a>
          </div>
        </div>

        {/* Compare CTA */}
        <div className="gcp-card p-3 flex items-center gap-4 shrink-0">
          <span className="text-sm font-medium text-[var(--gcp-text)]">Compare this run with:</span>
          <select className="gcp-input flex-1 max-w-md" value={selectedCompareRun} onChange={e => setSelectedCompareRun(e.target.value)}>
            {otherRuns.map(r => (
              <option key={r.id} value={r.id}>{r.id} — {r.passPct}% pass</option>
            ))}
          </select>
          <button onClick={handleCompare} className="gcp-button gcp-button-primary flex items-center gap-1.5 text-sm"><GitCompare size={15} /> Compare</button>
        </div>

        {/* Split View */}
        <div className="flex gap-4 flex-1 overflow-hidden">

          {/* Left Panel */}
          <div className="w-[60%] flex flex-col gcp-card overflow-hidden">
            <div className="p-3 border-b border-[var(--gcp-grey)] flex gap-2">
              <input type="text" placeholder="Search tests..." className="gcp-input flex-1" />
              <button className="gcp-button" onClick={() => showToast("Filter applied")}>Filter</button>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="gcp-table">
                <thead className="sticky top-0 bg-[var(--gcp-surface)] z-10">
                  <tr>
                    <th>Test Name</th>
                    <th>Status</th>
                    <th className="text-right">Duration</th>
                    <th>Category</th>
                    <th>Suite</th>
                    <th className="w-16 text-center">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {dummyTests.map((t, i) => (
                    <tr key={t.id} className={`group ${i === 3 ? "bg-[var(--gcp-blue-bg)]" : "cursor-pointer"}`}>
                      <td className="font-mono text-xs">{t.name}</td>
                      <td><span className={`gcp-badge ${t.status === "PASS" ? "gcp-badge-pass" : "gcp-badge-fail"}`}>{t.status}</span></td>
                      <td className="text-right font-mono text-xs text-[var(--gcp-text-secondary)]">{t.duration}ms</td>
                      <td><span className="px-2 py-1 bg-[var(--gcp-grey-bg)] text-[11px] rounded">{t.category}</span></td>
                      <td className="text-[12px]">{t.suite}</td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { copyToClipboard(`https://aware.example.com/tests/${t.id}`); showToast("Permalink copied"); }} className="text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-blue)]" title="Copy test permalink"><Link2 size={12} /></button>
                          <button onClick={() => { copyToClipboard(`GitHub issue for test ${t.name} (status: ${t.status}, duration: ${t.duration}ms)`); showToast("GitHub issue template copied"); }} className="text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-text)]" title="Copy as GitHub issue"><Github size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-2 border-t border-[var(--gcp-grey)] text-xs text-[var(--gcp-text-secondary)] bg-[var(--gcp-surface-hover)]">
              Keyboard nav: ↑↓ navigate · Enter open evidence · <span className="font-mono">L</span> copy link · <span className="font-mono">G</span> file GitHub issue
            </div>
          </div>

          {/* Right Panel (Evidence) */}
          <div className="w-[40%] gcp-card bg-[#1e1e1e] text-[#d4d4d4] flex flex-col overflow-hidden">
            <div className="p-3 border-b border-[#333] flex justify-between items-center bg-[#252526]">
              <div className="font-mono text-sm truncate flex-1 pr-4">Check Locale match for /api/v2/data</div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="gcp-badge gcp-badge-fail">FAIL</span>
                <button onClick={() => { copyToClipboard("curl -X GET ... 503 Service Unavailable\nHeaders: ...\nPMUSER_LOCALE = en-US (DRIFT)"); showToast("Evidence bundle copied"); }} className="flex items-center gap-1 text-[11px] text-[#808080] hover:text-[#d4d4d4] border border-[#444] rounded px-2 py-1 transition-colors"><Copy size={10} /> Copy all</button>
                <button onClick={() => { copyToClipboard("Slack failure report for Check Locale match /api/v2/data\n503 Service Unavailable (Expected 200 OK)"); showToast("Slack failure snippet copied"); }} className="flex items-center gap-1 text-[11px] text-[#808080] hover:text-[#d4d4d4] border border-[#444] rounded px-2 py-1 transition-colors"><Share2 size={10} /> Share</button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-6 font-mono text-[13px] leading-relaxed">
              <EvidenceSection label="REQUEST" copyText={`curl -X GET \\\n  -H "Accept-Language: fr-FR" \\\n  -H "X-Akamai-Staging: 1" \\\n  "https://api.example.com/api/v2/data"`}>
                <div className="bg-[#1e1e1e] p-3 rounded border border-[#333] select-all">
                  <span className="text-[#c586c0]">curl</span> -X GET \<br />{"  "}-H <span className="text-[#ce9178]">"Accept-Language: fr-FR"</span> \<br />{"  "}-H <span className="text-[#ce9178]">"X-Akamai-Staging: 1"</span> \<br />{"  "}<span className="text-[#4fc1ff]">"https://api.example.com/api/v2/data"</span>
                </div>
              </EvidenceSection>

              <EvidenceSection label="RESPONSE STATUS" copyText="503 Service Unavailable (Expected 200 OK)">
                <div className="flex items-center gap-2">
                  <span className="text-[#f44747] font-bold text-lg">503 Service Unavailable</span>
                  <span className="text-[#808080]">(Expected 200 OK)</span>
                </div>
              </EvidenceSection>

              <EvidenceSection label="RESPONSE HEADERS" copyText={`content-type: text/html\nx-akamai-request-id: 4a9f3b2\nx-cache: TCP_MISS`}>
                <div className="bg-[#1e1e1e] p-3 rounded border border-[#333]">
                  <div><span className="text-[#9cdcfe]">content-type:</span> text/html</div>
                  <div><span className="text-[#9cdcfe]">x-akamai-request-id:</span> 4a9f3b2</div>
                  <div><span className="text-[#f44747]"><span className="text-[#9cdcfe]">x-cache:</span> TCP_MISS</span></div>
                </div>
              </EvidenceSection>

              <EvidenceSection label="PM VARIABLES (Extracted)" copyText={`PMUSER_LOCALE = "en-US"  # DRIFT (Expected "fr-FR")\nPMUSER_GEO = "EU"`}>
                <div className="bg-[#1e1e1e] p-3 rounded border border-[#333]">
                  <div>PMUSER_LOCALE = <span className="text-[#ce9178]">"en-US"</span> <span className="text-[#f44747]">&lt;-- DRIFT (Expected "fr-FR")</span></div>
                  <div>PMUSER_GEO = <span className="text-[#ce9178]">"EU"</span></div>
                </div>
              </EvidenceSection>
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
