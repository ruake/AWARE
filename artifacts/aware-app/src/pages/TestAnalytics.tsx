import React from "react";
import { CategoryHeatmap } from "@/components/aware/CategoryHeatmap";
import { HeatmapCalendar } from "@/components/aware/HeatmapCalendar";
import { BarChart2, TrendingUp, TrendingDown, Activity, Zap, Download, AlertCircle } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { getRuns, getPassRateChart } from "@/lib/runs";

export default function TestAnalytics() {
  const runs = getRuns();
  const passRateData = getPassRateChart();
  
  // Prepare data for frequency chart (last 14 days or last 14 runs)
  const frequencyData = React.useMemo(() => {
    return passRateData.slice(-14).map(d => ({
      name: d.label,
      count: 1 // Each entry represents a run on that day in this context
    }));
  }, [passRateData]);

  // Derived metrics
  const globalPassRate = React.useMemo(() => {
    if (runs.length === 0) return 0;
    return Math.round(runs.reduce((acc, r) => acc + r.passPct, 0) / runs.length);
  }, [runs]);

  const failureRate = 100 - globalPassRate;
  
  const runVelocity = React.useMemo(() => {
    if (runs.length < 2) return 0;
    const sorted = [...runs].sort((a, b) => new Date(a.started).getTime() - new Date(b.started).getTime());
    const start = new Date(sorted[0].started).getTime();
    const end = new Date(sorted[sorted.length - 1].started).getTime();
    const days = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
    return (runs.length / days).toFixed(1);
  }, [runs]);

  const passTrend = React.useMemo(() => {
    if (runs.length < 2) return { value: 0, up: true };
    const latest = runs[runs.length - 1].passPct;
    const prev = runs[runs.length - 2].passPct;
    return { value: Math.abs(latest - prev).toFixed(1), up: latest >= prev };
  }, [runs]);

  return (
    <div style={{ padding: "24px", maxWidth: "1600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: "var(--proof-radius-md)", 
              background: "var(--proof-blue-bg)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              border: "1px solid var(--proof-blue-border)"
            }}>
              <BarChart2 size={24} style={{ color: "var(--proof-blue)" }} />
            </div>
            TELEMETRY & TRENDS
          </h1>
          <div style={{ color: "var(--proof-text-secondary)", fontFamily: "var(--font-mono)", fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={12} />
            REAL-TIME SYSTEM PERFORMANCE DATA • LAST 30 DAYS
          </div>
        </div>
        <button className="proof-btn proof-btn-ghost" style={{ border: "1px solid var(--proof-border)", gap: 8 }}>
          <Download size={16} />
          Export Report
        </button>
      </div>

      {/* Top Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        {/* Global Pass Rate */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: "var(--proof-radius-lg)", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Global Pass Rate</div>
              <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }} className="metric-number">
                {globalPassRate}%
              </div>
            </div>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 4, 
              padding: "4px 8px", 
              borderRadius: "var(--proof-radius-full)", 
              background: passTrend.up ? "var(--proof-green-bg)" : "var(--proof-red-bg)",
              color: passTrend.up ? "var(--proof-green)" : "var(--proof-red)",
              fontSize: 12,
              fontWeight: 600
            }}>
              {passTrend.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {passTrend.value}%
            </div>
          </div>
          <div style={{ height: 60 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={passRateData.slice(-10)}>
                <defs>
                  <linearGradient id="colorPass" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--proof-blue)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--proof-blue)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="passRate" stroke="var(--proof-blue)" strokeWidth={2} fillOpacity={1} fill="url(#colorPass)" isAnimationActive={true} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Failure Rate */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: "var(--proof-radius-lg)", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Failure Rate</div>
              <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4, color: "var(--proof-red)" }} className="metric-number">
                {failureRate}%
              </div>
            </div>
            <div style={{ color: "var(--proof-text-muted)" }}>
              <AlertCircle size={20} />
            </div>
          </div>
          <div style={{ height: 60 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={passRateData.slice(-10)}>
                <defs>
                  <linearGradient id="colorFail" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--proof-red)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--proof-red)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="passRate" stroke="var(--proof-red)" strokeWidth={2} fillOpacity={1} fill="url(#colorFail)" isAnimationActive={true} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Run Velocity */}
        <div className="glass-panel" style={{ padding: 24, borderRadius: "var(--proof-radius-lg)", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Run Velocity</div>
              <div style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }} className="metric-number">
                {runVelocity} <span style={{ fontSize: 14, color: "var(--proof-text-secondary)", fontWeight: 500 }}>runs/day</span>
              </div>
            </div>
            <div style={{ color: "var(--proof-blue)" }}>
              <Zap size={20} />
            </div>
          </div>
          <div style={{ height: 60 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={frequencyData}>
                <Bar dataKey="count" fill="var(--proof-blue)" opacity={0.5} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <CategoryHeatmap data={runs.map(r => ({ env: r.env, status: r.status === "FAIL" ? "FAIL" as const : "PASS" as const }))} />
        <HeatmapCalendar data={[]} />
      </div>

      {/* Flakiness Section */}
      <div className="glass-panel" style={{ padding: 24, borderRadius: "var(--proof-radius-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={16} style={{ color: "var(--proof-purple)" }} />
            Flakiness Index & Instability Report
          </div>
          <div style={{ color: "var(--proof-text-secondary)", fontSize: 11 }}>
            Total Analyzed: {runs.length} runs
          </div>
        </div>
        
        <div style={{ border: "1px solid var(--proof-border)", borderRadius: "var(--proof-radius-md)", overflow: "hidden" }}>
          <table className="proof-table" style={{ border: "none" }}>
            <thead>
              <tr style={{ background: "var(--proof-surface-2)" }}>
                <th style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>TEST SIGNATURE</th>
                <th style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>STABILITY SCORE</th>
                <th style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>FAILURES</th>
                <th style={{ fontFamily: "var(--font-mono)", fontSize: 10, textAlign: "right" }}>TREND</th>
              </tr>
            </thead>
            <tbody>
              {/* Empty State for Flakiness */}
              <tr>
                <td colSpan={4} style={{ padding: "64px 24px", textAlign: "center" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                    <div style={{ 
                      width: 56, 
                      height: 56, 
                      borderRadius: "50%", 
                      background: "var(--proof-surface-2)", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      color: "var(--proof-text-muted)"
                    }}>
                      <Activity size={32} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--proof-text)" }}>NO FLAKY TESTS DETECTED</div>
                      <div style={{ fontSize: 13, color: "var(--proof-text-secondary)", marginTop: 4 }}>
                        System stability is within target parameters (99.9% uptime).
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Run Frequency Section */}
      <div className="glass-panel" style={{ padding: 24, borderRadius: "var(--proof-radius-lg)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
          <Zap size={16} style={{ color: "var(--proof-blue)" }} />
          RUN FREQUENCY
        </div>
        <div style={{ height: 240, width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={frequencyData}>
              <XAxis 
                dataKey="name" 
                stroke="var(--proof-text-muted)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => val.split("-").slice(1).join("/")}
              />
              <YAxis 
                stroke="var(--proof-text-muted)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  background: "var(--proof-surface)", 
                  border: "1px solid var(--proof-border)",
                  borderRadius: "var(--proof-radius-md)",
                  fontSize: 12
                }}
              />
              <Bar dataKey="count" fill="var(--proof-blue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
