import React from "react";
import { AppLayout } from "./_shared/AppLayout";
import "./_group.css";

export function Runs() {
  const dummyRuns = Array.from({length: 12}).map((_, i) => {
    const isFail = i === 2 || i === 7;
    const isPartial = i === 4;
    const status = isFail ? "FAIL" : isPartial ? "PARTIAL" : "PASS";
    const statusClass = status === "PASS" ? "gcp-badge-pass" : status === "FAIL" ? "gcp-badge-fail" : "gcp-badge-flaky";
    const failCount = status === "PASS" ? 0 : status === "FAIL" ? Math.floor(Math.random() * 20) + 1 : Math.floor(Math.random() * 5) + 1;
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
      started: `2026-06-06T14:${30 - i}Z`,
      pm: "v892",
      ew: "2341.1.0"
    };
  });

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
          <div className="h-6 w-px bg-[var(--gcp-grey)]"></div>
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
        <div className="flex justify-end gap-2">
          <button className="gcp-button text-sm">Export CSV</button>
          <button className="gcp-button text-sm">Export JSON</button>
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
              </tr>
            </thead>
            <tbody>
              {dummyRuns.map((run, i) => (
                <tr key={run.id} className={i === 1 ? "bg-[var(--gcp-blue-bg)]" : ""}>
                  <td className="gcp-mono text-[var(--gcp-blue)] hover:underline cursor-pointer">{run.id}</td>
                  <td className="text-[var(--gcp-text-secondary)]">{run.label}</td>
                  <td>{run.suite}</td>
                  <td>{run.target}</td>
                  <td><span className={`gcp-badge ${run.statusClass}`}>{run.status}</span></td>
                  <td className="text-right font-mono">{run.passPct}</td>
                  <td className="text-right font-mono text-[var(--gcp-red)]">{run.failures > 0 ? run.failures : "-"}</td>
                  <td className="text-right text-[var(--gcp-text-secondary)]">{run.duration}</td>
                  <td className="gcp-mono text-[12px]">{run.started}</td>
                  <td className="gcp-mono">{run.pm}</td>
                  <td className="gcp-mono">{run.ew}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 border-t border-[var(--gcp-grey)] flex justify-between items-center text-sm text-[var(--gcp-text-secondary)]">
            <span>Showing 1-12 of 145 runs</span>
            <div className="flex gap-2">
              <button className="gcp-button" disabled>&lt; Prev</button>
              <button className="gcp-button">Next &gt;</button>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}