import React from "react";
import { Chart } from "react-google-charts";
import { AppLayout } from "./_shared/AppLayout";
import { RUNS, ENV_PASS_RATE_DATA, ENV_SUMMARY } from "./_shared/data";
import { navTo } from "./_shared/nav";
import "./_group.css";
import { TrendingDown, TrendingUp, Minus, AlertTriangle, ChevronRight, ArrowUpDown } from "lucide-react";

const ENV_COLORS = ["#1a73e8", "#f9ab00", "#1e8e3e", "#9334e6"];

function TrendIcon({ delta }: { delta: number }) {
  if (delta < -1) return <TrendingDown size={14} className="text-[var(--gcp-red)]" />;
  if (delta > 0) return <TrendingUp size={14} className="text-[var(--gcp-green)]" />;
  return <Minus size={14} className="text-[var(--gcp-text-secondary)]" />;
}

export function Dashboard() {
  const regressed = ENV_SUMMARY.filter(e => e.alert);
  const [chartKey, setChartKey] = React.useState(0);

  React.useEffect(() => {
    const t = setTimeout(() => setChartKey(k => k + 1), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <AppLayout activeTab="dashboard">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Regression Alerts */}
        {regressed.length > 0 && (
          <div className="flex gap-3">
            {regressed.map(env => (
              <div key={env.label} className="gcp-card flex-1 p-4 border-l-4 border-[var(--gcp-red)] flex items-center gap-3">
                <AlertTriangle size={20} className="text-[var(--gcp-red)] shrink-0" />
                <div>
                  <div className="text-sm font-medium text-[var(--gcp-red)]">{env.alert}</div>
                  <div className="text-[12px] text-[var(--gcp-text-secondary)]">{env.label} — {env.passRate}% pass rate, {env.failures} failures</div>
                </div>
                <button onClick={() => navTo("Runs")} className="gcp-button ml-auto text-sm shrink-0 flex items-center gap-1">
                  Investigate <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Env Scope Selector + Health Gauge */}
        <div className="gcp-card p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-medium">Cross-Target Health</h2>
              <p className="text-sm text-[var(--gcp-text-secondary)] mt-1">Latest pass rate across all environments</p>
            </div>
            <div className="flex items-center gap-3">
              <Chart
                chartType="Gauge"
                width={100}
                height={100}
                data={[["Label", "Value"], ["", 87]]}
                options={{
                  redFrom: 0, redTo: 50, yellowFrom: 50, yellowTo: 80, greenFrom: 80, greenTo: 100,
                  minorTicks: 5, max: 100, min: 0, animation: { duration: 0 },
                  majorTicks: ["0", "25", "50", "75", "100"],
                }}
              />
              <div className="text-right">
                <div className="text-3xl font-mono font-bold text-[var(--gcp-red)]">87%</div>
                <div className="text-sm text-[var(--gcp-text-secondary)]">14 failures</div>
                <button onClick={() => navTo(`RunDetail?runId=${RUNS[RUNS.length - 1].id}`)} className="text-[12px] text-[var(--gcp-blue)] hover:underline mt-1">
                  View latest run &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* Env cards */}
          <div className="grid grid-cols-4 gap-3">
            {ENV_SUMMARY.map((env, i) => (
              <div
                key={env.label}
                className="border border-[var(--gcp-grey)] rounded p-3 hover:bg-[var(--gcp-surface-hover)] cursor-pointer transition-colors"
                onClick={() => navTo("Runs")}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium uppercase tracking-wider">{env.label.replace("/", " · ")}</span>
                  <TrendIcon delta={env.trend} />
                </div>
                <div className={`text-2xl font-mono font-bold ${env.passRate < 90 ? "text-[var(--gcp-red)]" : env.passRate < 100 ? "text-[var(--gcp-yellow)]" : "text-[var(--gcp-green)]"}`}>
                  {env.passRate}%
                </div>
                <div className="flex justify-between text-[11px] text-[var(--gcp-text-secondary)] mt-1">
                  <span>{env.failures} failures</span>
                  <span className={env.trend < 0 ? "text-[var(--gcp-red)]" : ""}>{env.trend > 0 ? "+" : ""}{env.trend}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Composite Multi-Environment Line Chart */}
        <div className="gcp-card p-4">
          <h3 className="font-medium text-[14px] text-[var(--gcp-text-secondary)] mb-4 uppercase tracking-wider flex items-center gap-2">
            <ArrowUpDown size={14} /> Pass Rate by Environment
          </h3>
          <div className="h-72 w-full">
            <Chart
              key={chartKey}
              chartType="LineChart"
              width="100%"
              height="100%"
              data={ENV_PASS_RATE_DATA}
              options={{
                curveType: "function",
                pointSize: 6,
                pointShape: "circle",
                colors: ENV_COLORS,
                lineWidth: 2,
                interpolateNulls: true,
                legend: { position: "top", alignment: "center", textStyle: { color: "#5f6368", fontSize: 11 } },
                hAxis: { textStyle: { color: "#5f6368", fontSize: 11 }, gridlines: { color: "transparent" } },
                vAxis: {
                  textStyle: { color: "#5f6368", fontSize: 11 },
                  gridlines: { color: "#f1f3f4" },
                  format: "#'%'",
                  minValue: 60,
                  maxValue: 100,
                  viewWindow: { min: 60, max: 100 },
                },
                chartArea: { width: "85%", height: "70%", top: 32, left: 48 },
                tooltip: { isHtml: true, trigger: "focus" },
                backgroundColor: "transparent",
                focusTarget: "category",
                crosshair: { trigger: "both", orientation: "both", color: "#5f6368", opacity: 0.3 },
                explorer: { actions: ["dragToZoom", "rightClickToReset"], maxZoomIn: 0.1 },
              }}
              chartEvents={[{
                eventName: "select",
                callback: ({ chartWrapper }) => {
                  if (!chartWrapper) return;
                  const chart = chartWrapper.getChart();
                  if (!chart) return;
                  const sel = chart.getSelection();
                  if (sel.length > 0) {
                    const row = sel[0].row;
                    const col = sel[0].column;
                    if (row >= 0 && row < RUNS.length) {
                      navTo(`RunDetail?runId=${RUNS[Math.min(row, RUNS.length - 1)].id}`);
                    }
                  }
                },
              }]}
            />
          </div>
        </div>

        {/* Bottom 2-col: Outcome Mix + Runtime Identity */}
        <div className="grid grid-cols-2 gap-6">

          {/* Outcome Mix by Environment */}
          <div className="gcp-card p-4">
            <h3 className="font-medium text-[14px] text-[var(--gcp-text-secondary)] mb-4 uppercase tracking-wider">Outcome Mix</h3>
            <div className="h-10 mb-2">
              <Chart
                chartType="BarChart"
                width="100%"
                height="100%"
                data={[["", "PASS", "FAIL", "FLAKY", "SKIP"], ["", 850, 150, 100, 50]]}
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

          {/* Version Drift Summary */}
          <div className="gcp-card p-4">
            <h3 className="font-medium text-[14px] text-[var(--gcp-text-secondary)] mb-4 uppercase tracking-wider">Version Drift</h3>
            <table className="gcp-table">
              <thead>
                <tr><th>Target</th><th>PM Version</th><th>EW Version</th></tr>
              </thead>
              <tbody>
                <tr><td>Prod/Production</td><td className="gcp-mono">v892</td><td className="gcp-mono">2341.1.0</td></tr>
                <tr><td>Prod/Staging</td><td className="gcp-mono text-[var(--gcp-red)]">v893</td><td className="gcp-mono">2341.1.0</td></tr>
                <tr><td>UAT/Production</td><td className="gcp-mono">v892</td><td className="gcp-mono">2341.0.9</td></tr>
                <tr><td>UAT/Staging</td><td className="gcp-mono">v892</td><td className="gcp-mono">2341.0.9</td></tr>
              </tbody>
            </table>
            <div className="mt-3 p-2 bg-red-50 rounded text-[12px] flex items-center gap-2">
              <AlertTriangle size={12} className="text-[var(--gcp-red)]" />
              <span className="text-[var(--gcp-red)] font-medium">Prod/Staging PM v893 drifts from Prod/Production v892</span>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
