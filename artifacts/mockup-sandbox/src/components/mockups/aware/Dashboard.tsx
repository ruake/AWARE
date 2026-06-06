import React from "react";
import { Chart } from "react-google-charts";
import { AppLayout } from "./_shared/AppLayout";
import { RUNS, PASS_RATE_DATA } from "./_shared/data";
import { navTo } from "./_shared/nav";
import "./_group.css";

const OUTCOME_DATA = [
  ["", "PASS", "FAIL", "FLAKY", "SKIP"],
  ["", 850, 150, 100, 50],
];

export function Dashboard() {
  return (
    <AppLayout activeTab="dashboard">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Scope Selector Pills */}
        <div className="flex gap-4 mb-6">
          {["Prod/Production", "Prod/Staging", "UAT/Production", "UAT/Staging"].map(scope => (
            <div key={scope} className="gcp-card px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-[var(--gcp-surface-hover)]" onClick={() => navTo("Runs")}>
              <span className="font-medium text-[13px]">{scope}</span>
              <span className="gcp-badge gcp-badge-pass">
                {scope === "Prod/Production" ? "87%" : scope === "Prod/Staging" ? "92%" : scope === "UAT/Production" ? "100%" : "98%"}
              </span>
            </div>
          ))}
        </div>

        {/* Hero Signal Card */}
        <div className="gcp-card p-6 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="w-32 h-32 relative">
              <Chart
                chartType="Gauge"
                width={130}
                height={130}
                data={[["Label", "Value"], ["", 87]]}
                options={{
                  redFrom: 0, redTo: 50, yellowFrom: 50, yellowTo: 80, greenFrom: 80, greenTo: 100,
                  minorTicks: 5, max: 100, min: 0, animation: { duration: 0 },
                }}
              />
            </div>
            <div>
              <h2 className="text-xl font-medium mb-2">Cross-Target Health</h2>
              <div className="flex gap-3 mb-4">
                <span className="gcp-badge gcp-badge-fail text-sm px-3 py-1">14 failures</span>
                <span className="text-[var(--gcp-text-secondary)] text-sm mt-1">Updated 3m ago</span>
              </div>
              <button
                onClick={() => navTo(`RunDetail?runId=${RUNS[RUNS.length - 1].id}`)}
                className="gcp-button gcp-button-primary"
              >
                View latest run &rarr;
              </button>
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
            <div className="h-40 w-full">
              <Chart
                chartType="LineChart"
                width="100%"
                height="100%"
                data={PASS_RATE_DATA}
                options={{
                  curveType: "function",
                  legend: { position: "none" },
                  pointSize: 7,
                  pointShape: "circle",
                  colors: ["#1a73e8"],
                  lineWidth: 2,
                  hAxis: { textStyle: { color: "#5f6368", fontSize: 11 }, gridlines: { color: "transparent" } },
                  vAxis: { textStyle: { color: "#5f6368", fontSize: 11 }, gridlines: { color: "#f1f3f4" }, format: "#'%'", minValue: 0, maxValue: 100, viewWindow: { min: 0, max: 100 } },
                  chartArea: { width: "88%", height: "78%", top: 8, left: 42 },
                  tooltip: { isHtml: true, trigger: "focus" },
                  backgroundColor: "transparent",
                  focusTarget: "category",
                }}
                chartEvents={[{
                  eventName: "select",
                  callback: ({ chartWrapper }) => {
                    if (!chartWrapper) return;
                    const chart = chartWrapper.getChart();
                    if (!chart) return;
                    const selection = chart.getSelection();
                    if (selection.length > 0) {
                      const row = selection[0].row;
                      if (row >= 0 && row < RUNS.length) {
                        navTo(`RunDetail?runId=${RUNS[row].id}`);
                      }
                    }
                  },
                }]}
              />
            </div>
          </div>

          {/* Outcome Mix */}
          <div className="gcp-card p-4">
            <h3 className="font-medium text-[14px] text-[var(--gcp-text-secondary)] mb-4 uppercase tracking-wider">Outcome Mix</h3>
            <div className="mt-8 mb-4 h-10">
              <Chart
                chartType="BarChart"
                width="100%"
                height="100%"
                data={OUTCOME_DATA}
                options={{
                  isStacked: true, legend: { position: "none" },
                  colors: ["#1e8e3e", "#d93025", "#f9ab00", "#dadce0"],
                  hAxis: { textPosition: "none", gridlines: { count: 0 } },
                  vAxis: { textPosition: "none", gridlines: { count: 0 } },
                  chartArea: { width: "100%", height: "100%", top: 0, bottom: 0, left: 0, right: 0 },
                  bar: { groupWidth: "90%" }, tooltip: { trigger: "none" }, backgroundColor: "transparent",
                }}
              />
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
                <tr><th>Target</th><th>PM Version</th><th>EW Version</th></tr>
              </thead>
              <tbody>
                <tr><td>Prod/Production</td><td className="gcp-mono">v892</td><td className="gcp-mono">2341.1.0</td></tr>
                <tr><td>Prod/Staging</td><td className="gcp-mono text-[var(--gcp-red)]">v893</td><td className="gcp-mono">2341.1.0</td></tr>
                <tr><td>UAT/Production</td><td className="gcp-mono">v892</td><td className="gcp-mono">2341.0.9</td></tr>
              </tbody>
            </table>
          </div>

          {/* Version Drift Status */}
          <div className="gcp-card p-4">
            <h3 className="font-medium text-[14px] text-[var(--gcp-text-secondary)] mb-4 uppercase tracking-wider">Version Drift</h3>
            <table className="gcp-table">
              <thead>
                <tr><th>Component</th><th>Prod ↔ Staging Drift</th><th>Status</th></tr>
              </thead>
              <tbody>
                <tr><td>Property Manager</td><td className="gcp-mono text-[var(--gcp-text-secondary)]">v892 ↔ v893</td><td><span className="gcp-badge gcp-badge-fail">DRIFT DETECTED</span></td></tr>
                <tr><td>EdgeWorker</td><td className="gcp-mono text-[var(--gcp-text-secondary)]">2341.1.0 ↔ 2341.1.0</td><td><span className="gcp-badge gcp-badge-pass">ALIGNED</span></td></tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
