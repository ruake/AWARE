import React from "react";
import { Chart } from "react-google-charts";
import { AppLayout } from "./_shared/AppLayout";
import { useSyncDiffs, useTestHistory } from "./_shared/hooks";
import { navTo, copyToClipboard } from "./_shared/nav";
import "./_group.css";
import { BarChart3, Clock, Activity, Check, ArrowLeft, AlertTriangle, FileText, Search } from "lucide-react";

const ENVS = ["Prod/Production", "Prod/Staging", "UAT/Production", "UAT/Staging"];

export function TestAnalytics() {
  const params = new URLSearchParams(window.location.search);
  const testId = params.get("testId") || "diff_0";
  const index = Number(testId.replace("diff_", ""));
  const diffs = useSyncDiffs();
  const { detail, loading: historyLoading, error: historyError } = useTestHistory(index);
  const diff = diffs[index];

  const [shareToast, setShareToast] = React.useState<string | null>(null);
  const [tableFilter, setTableFilter] = React.useState<string | null>(null);
  const showToast = (msg: string) => { setShareToast(msg); setTimeout(() => setShareToast(null), 2500); };

  const toggleTableFilter = (val: string) => {
    setTableFilter(prev => prev === val ? null : val);
  };

  if (historyLoading) {
    return (
      <AppLayout activeTab="compare">
        <div className="flex items-center justify-center h-32 text-[var(--gcp-text-secondary)] text-sm">Loading...</div>
      </AppLayout>
    );
  }

  if (historyError) {
    return (
      <AppLayout activeTab="compare">
        <div className="flex items-center justify-center h-32 text-[var(--gcp-red)] text-sm">Error: {historyError.message}</div>
      </AppLayout>
    );
  }

  if (!detail || !diff) {
    return (
      <AppLayout activeTab="compare">
        <div className="max-w-[800px] mx-auto mt-12 text-center">
          <AlertTriangle size={32} className="mx-auto text-[var(--gcp-yellow)] mb-3" />
          <p className="text-[var(--gcp-text-secondary)]">Test not found: {testId}</p>
          <button onClick={() => navTo("Compare")} className="gcp-button mt-4">Back to Compare</button>
        </div>
      </AppLayout>
    );
  }

  const filteredHistory = tableFilter
    ? detail.history.filter(h => tableFilter === "PASS" ? h.status === "PASS" : h.status === "FAIL")
    : detail.history;

  const runStatusData = [
    ["Run", "Status", { type: "string", role: "tooltip" }],
    ...detail.history.map((h, i) => [`R${1000 + i}`, h.status === "PASS" ? 1 : 0, `${h.runId}\n${h.status}\n${h.duration}ms\n${h.env}`]),
  ];

  const durationData = [
    ["Run", "Duration (ms)", { type: "string", role: "tooltip" }],
    ...detail.history.map((h, i) => [`R${1000 + i}`, h.duration, `${h.runId}\n${h.duration}ms\n${h.env}`]),
  ];

  const envStatus = ENVS.map(env => {
    const runs = detail.history.filter(h => h.env === env);
    const pass = runs.filter(r => r.status === "PASS").length;
    const fail = runs.filter(r => r.status === "FAIL").length;
    return { env, pass, fail, total: runs.length };
  });

  const envChartData = [
    ["Environment", "Pass", "Fail", { role: "tooltip" }],
    ...envStatus.map(e => [e.env, e.pass, e.fail, `${e.env}\n${e.pass} Pass · ${e.fail} Fail`]),
  ];

  return (
    <AppLayout activeTab="compare">
      <div className="max-w-[1400px] mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navTo("Compare")} className="gcp-button text-[12px] flex items-center gap-1 px-3 py-1.5">
              <ArrowLeft size={14} /> Back to Compare
            </button>
            <div className="flex items-center gap-2">
              <Search size={14} className="text-[var(--gcp-text-secondary)]" />
              <select
                className="gcp-input text-sm font-mono max-w-[280px]"
                value={testId}
                onChange={e => navTo(`TestAnalytics?testId=${e.target.value}`)}
              >
                <option value="">Jump to test...</option>
                {diffs.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <h1 className="text-lg font-medium text-[var(--gcp-text)]">{diff.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="px-2 py-0.5 bg-[var(--gcp-surface)] text-[11px] border border-[var(--gcp-grey)] rounded">{diff.category}</span>
                <span className="text-[12px] text-[var(--gcp-text-secondary)]">{detail.history.length} runs tracked</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navTo(`TestDoc?testId=${testId}`)} className="gcp-button text-[12px] flex items-center gap-1.5 px-3 py-1.5">
              <FileText size={13} /> View Docs
            </button>
            <button onClick={() => { copyToClipboard(window.location.href); showToast("Analytics permalink copied"); }} className="gcp-button text-[12px] flex items-center gap-1.5 px-3 py-1.5">
              <Check size={13} /> Copy link
            </button>
          </div>
        </div>

        {/* Summary Cards — clickable CTAs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            onClick={() => toggleTableFilter("PASS")}
            className={`bg-[var(--gcp-blue-bg)] rounded p-4 gcp-card cursor-pointer transition-all hover:shadow-md ${
              tableFilter === "PASS" ? "shadow-[inset_0_0_0_2px_var(--gcp-blue)]" : ""
            }`}
          >
            <div className="text-[11px] text-[var(--gcp-text-secondary)] uppercase tracking-wider font-medium">Pass Rate</div>
            <div className="text-3xl font-bold text-[var(--gcp-blue)] mt-1">{detail.passRate}%</div>
            <div className="text-[12px] text-[var(--gcp-text-secondary)] mt-1">click to show PASS only</div>
          </div>
          <div
            onClick={() => toggleTableFilter("FAIL")}
            className={`bg-[var(--gcp-yellow-bg)] rounded p-4 gcp-card cursor-pointer transition-all hover:shadow-md ${
              tableFilter === "FAIL" ? "shadow-[inset_0_0_0_2px_var(--gcp-yellow)]" : ""
            }`}
          >
            <div className="text-[11px] text-[var(--gcp-text-secondary)] uppercase tracking-wider font-medium">Flakiness</div>
            <div className="text-3xl font-bold text-[var(--gcp-yellow)] mt-1">{detail.flakinessScore}%</div>
            <div className="text-[12px] text-[var(--gcp-text-secondary)] mt-1">click to show FAIL only</div>
          </div>
          <div
            onClick={() => toggleTableFilter("DURATION")}
            className={`bg-[var(--gcp-green-bg)] rounded p-4 gcp-card cursor-pointer transition-all hover:shadow-md ${
              tableFilter === "DURATION" ? "shadow-[inset_0_0_0_2px_var(--gcp-green)]" : ""
            }`}
          >
            <div className="text-[11px] text-[var(--gcp-text-secondary)] uppercase tracking-wider font-medium">Avg Duration</div>
            <div className="text-3xl font-bold text-[var(--gcp-green)] mt-1">{detail.avgDuration}ms</div>
            <div className="text-[12px] text-[var(--gcp-text-secondary)] mt-1">click to highlight fast/slow</div>
          </div>
          <div
            onClick={() => setTableFilter(null)}
            className={`bg-[var(--gcp-grey-bg)] rounded p-4 gcp-card cursor-pointer transition-all hover:shadow-md`}
          >
            <div className="text-[11px] text-[var(--gcp-text-secondary)] uppercase tracking-wider font-medium">Total Executions</div>
            <div className="text-3xl font-bold text-[var(--gcp-text)] mt-1">{detail.history.length}</div>
            <div className="text-[12px] text-[var(--gcp-text-secondary)] mt-1">click to clear filter</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Pass/Fail Column Chart */}
          <div className="gcp-card p-4">
            <h3 className="text-[13px] font-medium text-[var(--gcp-text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Activity size={14} /> Pass/Fail Across Runs
            </h3>
            <div className="h-64">
              <Chart chartType="ColumnChart" width="100%" height="100%" data={runStatusData} options={{
                legend: { position: "none" }, colors: ["#1a73e8"],
                vAxis: { textPosition: "none", gridlines: { count: 0 }, minValue: 0, maxValue: 1 },
                hAxis: { textStyle: { color: "#5f6368", fontSize: 10 }, slantedText: true, slantedTextAngle: 45, gridlines: { color: "transparent" } },
                chartArea: { width: "90%", height: "78%", top: 8, left: 8, right: 8 },
                tooltip: { isHtml: true }, backgroundColor: "transparent", bar: { groupWidth: "50%" },
              }} />
            </div>
          </div>

          {/* Duration Trend Line */}
          <div className="gcp-card p-4">
            <h3 className="text-[13px] font-medium text-[var(--gcp-text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock size={14} /> Duration Trend
            </h3>
            <div className="h-64">
              <Chart chartType="LineChart" width="100%" height="100%" data={durationData} options={{
                legend: { position: "none" }, curveType: "function", pointSize: 6, colors: ["#1e8e3e"], lineWidth: 2,
                vAxis: { textStyle: { color: "#5f6368", fontSize: 10 }, gridlines: { color: "#f1f3f4" } },
                hAxis: { textStyle: { color: "#5f6368", fontSize: 10 }, slantedText: true, slantedTextAngle: 45, gridlines: { color: "transparent" } },
                chartArea: { width: "88%", height: "78%", top: 8, left: 44, right: 12 },
                tooltip: { isHtml: true }, backgroundColor: "transparent",
              }} />
            </div>
          </div>

          {/* Environment Breakdown */}
          <div className="gcp-card p-4 col-span-2">
            <h3 className="text-[13px] font-medium text-[var(--gcp-text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BarChart3 size={14} /> Environment Breakdown
            </h3>
            <div className="h-48">
              <Chart chartType="BarChart" width="100%" height="100%" data={envChartData} options={{
                isStacked: true, legend: { position: "top", textStyle: { fontSize: 11 } }, colors: ["#1e8e3e", "#d93025"],
                hAxis: { textStyle: { color: "#5f6368", fontSize: 10 }, gridlines: { color: "#f1f3f4" }, minValue: 0 },
                vAxis: { textStyle: { color: "#5f6368", fontSize: 10 }, gridlines: { color: "transparent" } },
                chartArea: { width: "80%", height: "70%", top: 24, left: 120, right: 20 },
                tooltip: { isHtml: true }, backgroundColor: "transparent", bar: { groupWidth: "60%" },
              }} />
            </div>
          </div>

        </div>

        {/* Run History Table */}
        <div className="gcp-card overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--gcp-grey)] bg-[var(--gcp-grey-bg)] flex items-center justify-between">
            <h3 className="text-[13px] font-medium text-[var(--gcp-text)]">Run History</h3>
            {tableFilter && (
              <span className="text-[11px] text-[var(--gcp-text-secondary)]">{filteredHistory.length} of {detail.history.length} runs</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="gcp-table">
              <thead>
                <tr>
                  <th>Run ID</th>
                  <th>Status</th>
                  <th className="text-right">Duration</th>
                  <th>Environment</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((h, i) => (
                  <tr key={h.runId} className={`cursor-pointer transition-colors ${
                    tableFilter === "DURATION"
                      ? h.duration > detail.avgDuration
                        ? "bg-[var(--gcp-red-bg)]"
                        : "bg-[var(--gcp-green-bg)]"
                      : ""
                  }`} onClick={() => navTo(`RunDetail?runId=${h.runId}`)}>
                    <td className="font-mono text-[12px] text-[var(--gcp-blue)] hover:underline">{h.runId}</td>
                    <td><span className={`gcp-badge ${h.status === "PASS" ? "gcp-badge-pass" : "gcp-badge-fail"}`}>{h.status}</span></td>
                    <td className="text-right font-mono text-[12px]">{h.duration}ms</td>
                    <td className="text-[12px]">{h.env}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
