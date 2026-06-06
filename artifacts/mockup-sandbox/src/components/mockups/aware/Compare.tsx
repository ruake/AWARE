import React from "react";
import { AppLayout } from "./_shared/AppLayout";
import "./_group.css";

export function Compare() {
  const dummyDiff = Array.from({length: 15}).map((_, i) => {
    let state = "unchanged";
    if (i === 1 || i === 4) state = "regression"; // new fail
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

        {/* Filters & Table */}
        <div className="gcp-card overflow-hidden">
          <div className="p-3 border-b border-[var(--gcp-grey)] flex gap-4 items-center">
            <input type="text" placeholder="Search test name..." className="gcp-input flex-1" />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" defaultChecked /> Show regressions only
            </label>
          </div>
          
          <table className="gcp-table">
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Baseline Status</th>
                <th>Candidate Status</th>
                <th className="text-right">Δ Duration</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {dummyDiff.map(d => (
                <tr key={d.id} className={d.state === 'regression' ? 'bg-[var(--gcp-red-bg)]' : d.state === 'fixed' ? 'bg-[var(--gcp-green-bg)]' : ''}>
                  <td className="font-mono text-xs">{d.name}</td>
                  <td><span className={`gcp-badge ${d.baseClass}`}>{d.baseStatus}</span></td>
                  <td><span className={`gcp-badge ${d.candClass}`}>{d.candStatus}</span></td>
                  <td className="text-right font-mono text-xs">
                    {d.state === 'duration' ? <span className="text-[var(--gcp-red)] font-bold">+{d.durCand - d.durBase}ms</span> : <span className="text-[var(--gcp-text-secondary)]">~0ms</span>}
                  </td>
                  <td><span className="px-2 py-1 bg-[var(--gcp-surface)] text-[11px] border border-[var(--gcp-grey)] rounded">{d.category}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </AppLayout>
  );
}