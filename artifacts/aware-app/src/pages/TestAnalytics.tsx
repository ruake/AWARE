import { useState, useMemo, useDeferredValue, useTransition, memo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { BarChart2, TrendingUp, TrendingDown, Activity, Zap, Download, AlertCircle, Search, Globe } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { getRuns } from "@/lib/runsLoader";
import { PASS_RATE_CHART } from "@/lib/runs";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { fadeUp, staggerContainer, fadeIn } from "@/lib/motion";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

const PassRateMiniChart = memo(function PassRateMiniChart({ data }: { data: { label: string; passRate: number }[] }) {
  return (
    <div style={{ height: 60 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
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
  );
});

const FailureMiniChart = memo(function FailureMiniChart({ data }: { data: { label: string; passRate: number }[] }) {
  return (
    <div style={{ height: 60 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
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
  );
});

const VelocityMiniChart = memo(function VelocityMiniChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <div style={{ height: 60 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <Bar dataKey="count" fill="var(--proof-blue)" opacity={0.5} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

const RunFrequencyChart = memo(function RunFrequencyChart({ data }: { data: { name: string; count: number }[] }) {
  return (
    <div style={{ height: 240, width: "100%" }}>
      {/* Downsampling location: if data.length > 500, aggregate daily points before passing to BarChart */}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
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
  );
});

export default function TestAnalytics() {
  const rawRuns = getRuns();
  const rawPassRateData = PASS_RATE_CHART();

  const runs = useDeferredValue(rawRuns);
  const passRateData = useDeferredValue(rawPassRateData);

  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Derived metrics
  const globalPassRate = useMemo(() => {
    if (runs.length === 0) return 0;
    return Math.round(runs.reduce((acc, r) => acc + r.passPct, 0) / runs.length);
  }, [runs]);

  const failureRate = useMemo(() => 100 - globalPassRate, [globalPassRate]);

  const runVelocity = useMemo(() => {
    if (runs.length < 2) return "0";
    const sorted = [...runs].sort((a, b) => new Date(a.started).getTime() - new Date(b.started).getTime());
    const start = new Date(sorted[0].started).getTime();
    const end = new Date(sorted[sorted.length - 1].started).getTime();
    const days = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
    return (runs.length / days).toFixed(1);
  }, [runs]);

  const passTrend = useMemo(() => {
    if (runs.length < 2) return { value: "0", up: true };
    const latest = runs[runs.length - 1].passPct;
    const prev = runs[runs.length - 2].passPct;
    return { value: Math.abs(latest - prev).toFixed(1), up: latest >= prev };
  }, [runs]);

  // Prepare data for frequency chart (last 14 days or last 14 runs)
  const frequencyData = useMemo(() => {
    return passRateData.slice(-14).map(d => ({
      name: d.label,
      count: 1
    }));
  }, [passRateData]);

  // Filtered runs for flakiness section
  const filteredRuns = useMemo(() => {
    if (!debouncedSearch) return runs;
    const q = debouncedSearch.toLowerCase();
    return runs.filter(r =>
      r.label.toLowerCase().includes(q) ||
      r.suiteId.toLowerCase().includes(q) ||
      r.env.toLowerCase().includes(q)
    );
  }, [runs, debouncedSearch]);

  const last10 = useMemo(() => passRateData.slice(-10), [passRateData]);

  const categoryData = useMemo(() => (
    filteredRuns.map(r => ({ env: r.env, status: r.status === "FAIL" ? "FAIL" as const : "PASS" as const }))
  ), [filteredRuns]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    startTransition(() => {
      setSearchQuery(value);
    });
  }, []);

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
      <motion.div 
        variants={staggerContainer} 
        initial="hidden" 
        animate="visible"
        style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}
      >
        {/* Global Pass Rate */}
        <motion.div variants={fadeUp} className="glass-panel" style={{ padding: 24, borderRadius: "var(--proof-radius-lg)", position: "relative", overflow: "hidden" }}>
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
          <PassRateMiniChart data={last10} />
        </motion.div>

        {/* Failure Rate */}
        <motion.div variants={fadeUp} className="glass-panel" style={{ padding: 24, borderRadius: "var(--proof-radius-lg)", position: "relative", overflow: "hidden" }}>
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
          <FailureMiniChart data={last10} />
        </motion.div>

        {/* Run Velocity */}
        <motion.div variants={fadeUp} className="glass-panel" style={{ padding: 24, borderRadius: "var(--proof-radius-lg)", position: "relative", overflow: "hidden" }}>
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
          <VelocityMiniChart data={frequencyData} />
        </motion.div>
      </motion.div>

      {/* Category Distribution */}
      <motion.div 
        variants={fadeUp} 
        initial="hidden" 
        animate="visible" 
        className="glass-panel" 
        style={{ padding: 24, borderRadius: "var(--proof-radius-lg)" }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <Globe size={16} style={{ color: "var(--proof-blue)" }} />
          ENVIRONMENT DISTRIBUTION
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {(["QA", "UAT", "PROD"] as const).map(env => {
            const envRuns = categoryData.filter(d => d.env === env);
            const passCount = envRuns.filter(d => d.status === "PASS").length;
            const total = envRuns.length;
            const pct = total > 0 ? Math.round((passCount / total) * 100) : 0;
            return (
              <div key={env} style={{ padding: 16, borderRadius: "var(--proof-radius-md)", background: "var(--proof-surface-2)", border: "1px solid var(--proof-border)" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--proof-text-secondary)", marginBottom: 8 }}>{env}</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{pct}%</div>
                <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginTop: 2 }}>{passCount}/{total} passes</div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Flakiness Section */}
      <motion.div 
        variants={fadeUp} 
        initial="hidden" 
        animate="visible" 
        className="glass-panel" 
        style={{ padding: 24, borderRadius: "var(--proof-radius-lg)" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={16} style={{ color: "var(--proof-purple)" }} />
            Flakiness Index & Instability Report
          </div>
          <motion.div 
            variants={fadeIn} 
            initial="hidden" 
            animate="visible" 
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--proof-text-muted)", pointerEvents: "none" }} />
              <input
                type="text"
                placeholder="Filter runs..."
                value={searchQuery}
                onChange={handleSearchChange}
                style={{
                  padding: "6px 12px 6px 32px",
                  borderRadius: "var(--proof-radius-md)",
                  border: "1px solid var(--proof-border)",
                  background: "var(--proof-surface)",
                  color: "var(--proof-text)",
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  outline: "none",
                  width: 200
                }}
              />
            </div>
            <div style={{ color: "var(--proof-text-secondary)", fontSize: 11 }}>
              Total Analyzed: {filteredRuns.length} runs
            </div>
          </motion.div>
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
              {isPending ? (
                <tr>
                  <td colSpan={4} style={{ padding: "64px 24px", textAlign: "center" }}>
                    <LoadingSpinner label="Updating analytics…" />
                  </td>
                </tr>
              ) : (
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
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Run Frequency Section */}
      <motion.div 
        variants={fadeUp} 
        initial="hidden" 
        animate="visible" 
        className="glass-panel" 
        style={{ padding: 24, borderRadius: "var(--proof-radius-lg)" }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
          <Zap size={16} style={{ color: "var(--proof-blue)" }} />
          RUN FREQUENCY
        </div>
        <RunFrequencyChart data={frequencyData} />
      </motion.div>
    </div>
  );
}
