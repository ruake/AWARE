import React from "react";
import { AppLayout } from "./_shared/AppLayout";
import "./_group.css";

export function Dashboard() {
  return (
    <AppLayout activeTab="dashboard">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Scope Selector Pills */}
        <div className="flex gap-4 mb-6">
          {[
            { label: "Prod/Production", pass: "87%" },
            { label: "Prod/Staging", pass: "92%" },
            { label: "UAT/Production", pass: "100%" },
            { label: "UAT/Staging", pass: "98%" },
          ].map(scope => (
            <div key={scope.label} className="gcp-card px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-[var(--gcp-surface-hover)]">
              <span className="font-medium text-[13px]">{scope.label}</span>
              <span className="gcp-badge gcp-badge-pass">{scope.pass}</span>
            </div>
          ))}
        </div>

        {/* Hero Signal Card */}
        <div className="gcp-card p-6 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="w-32 h-32 relative">
              {/* Simulated Gauge SVG */}
              <svg viewBox="0 0 100 50" className="w-full overflow-visible">
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="var(--gcp-grey)" strokeWidth="12" strokeLinecap="round" />
                <path d="M 10 50 A 40 40 0 0 1 80 18" fill="none" stroke="var(--gcp-blue)" strokeWidth="12" strokeLinecap="round" />
              </svg>
              <div className="absolute bottom-0 left-0 w-full text-center text-3xl font-bold text-[var(--gcp-text)]">
                87<span className="text-xl">%</span>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-medium mb-2">Cross-Target Health</h2>
              <div className="flex gap-3 mb-4">
                <span className="gcp-badge gcp-badge-fail text-sm px-3 py-1">14 failures</span>
                <span className="text-[var(--gcp-text-secondary)] text-sm mt-1">Updated 3m ago</span>
              </div>
              <button className="gcp-button gcp-button-primary">View latest run &rarr;</button>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[var(--gcp-text-secondary)] text-sm mb-1">Target Version Drift</div>
            <div className="text-lg font-mono font-medium text-[var(--gcp-red)]">Detected</div>
          </div>
        </div>

        {/* 2-col Grid */}
        <div className="grid grid-cols-2 gap-6">
          
          {/* Pass Rate Trend */}
          <div className="gcp-card p-4">
            <h3 className="font-medium text-[14px] text-[var(--gcp-text-secondary)] mb-4 uppercase tracking-wider">Pass-Rate Trend (7d)</h3>
            <div className="h-40 w-full flex items-end">
              <svg viewBox="0 0 400 100" className="w-full h-full" preserveAspectRatio="none">
                <path d="M 0 50 L 50 40 L 100 60 L 150 20 L 200 30 L 250 10 L 300 15 L 350 5 L 400 20" fill="none" stroke="var(--gcp-blue)" strokeWidth="2" />
                <path d="M 0 50 L 50 40 L 100 60 L 150 20 L 200 30 L 250 10 L 300 15 L 350 5 L 400 20 L 400 100 L 0 100 Z" fill="var(--gcp-blue-bg)" opacity="0.3" />
              </svg>
            </div>
          </div>

          {/* Outcome Mix */}
          <div className="gcp-card p-4">
            <h3 className="font-medium text-[14px] text-[var(--gcp-text-secondary)] mb-4 uppercase tracking-wider">Outcome Mix</h3>
            <div className="flex h-8 w-full rounded overflow-hidden mt-8 mb-4">
              <div className="bg-[var(--gcp-green)] h-full" style={{width: '70%'}} title="PASS"></div>
              <div className="bg-[var(--gcp-red)] h-full" style={{width: '15%'}} title="FAIL"></div>
              <div className="bg-[var(--gcp-yellow)] h-full" style={{width: '10%'}} title="FLAKY"></div>
              <div className="bg-[var(--gcp-grey)] h-full" style={{width: '5%'}} title="SKIP"></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--gcp-green)] font-medium">850 PASS</span>
              <span className="text-[var(--gcp-red)] font-medium">150 FAIL</span>
              <span className="text-[var(--gcp-yellow)] font-medium">100 FLAKY</span>
              <span className="text-[var(--gcp-text-secondary)]">50 SKIP</span>
            </div>
          </div>

          {/* Runtime Identity Table */}
          <div className="gcp-card p-4">
            <h3 className="font-medium text-[14px] text-[var(--gcp-text-secondary)] mb-4 uppercase tracking-wider">Runtime Identity Snapshot</h3>
            <table className="gcp-table">
              <thead>
                <tr>
                  <th>Target</th>
                  <th>PM Version</th>
                  <th>EW Version</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Prod/Production</td>
                  <td className="gcp-mono">v892</td>
                  <td className="gcp-mono">2341.1.0</td>
                </tr>
                <tr>
                  <td>Prod/Staging</td>
                  <td className="gcp-mono text-[var(--gcp-red)]">v893</td>
                  <td className="gcp-mono">2341.1.0</td>
                </tr>
                <tr>
                  <td>UAT/Production</td>
                  <td className="gcp-mono">v892</td>
                  <td className="gcp-mono">2341.0.9</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Version Drift Status */}
          <div className="gcp-card p-4">
             <h3 className="font-medium text-[14px] text-[var(--gcp-text-secondary)] mb-4 uppercase tracking-wider">Version Drift</h3>
             <table className="gcp-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Prod ↔ Staging Drift</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Property Manager</td>
                  <td className="gcp-mono text-[var(--gcp-text-secondary)]">v892 ↔ v893</td>
                  <td><span className="gcp-badge gcp-badge-fail">DRIFT DETECTED</span></td>
                </tr>
                <tr>
                  <td>EdgeWorker</td>
                  <td className="gcp-mono text-[var(--gcp-text-secondary)]">2341.1.0 ↔ 2341.1.0</td>
                  <td><span className="gcp-badge gcp-badge-pass">ALIGNED</span></td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </AppLayout>
  );
}