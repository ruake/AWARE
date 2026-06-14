import React from "react";
import { useLocation } from "wouter";
import {
  DIFF_ROWS,
  getTestCaseById,
  RUNS,
  getTestResultsForRun,
  loadResultsForRun,
  computeTestDetailForName,
} from "@/lib/data";
import { TestDocTopBar } from "@/components/aware/TestDocTopBar";
import { TestDocSidebar } from "@/components/aware/TestDocSidebar";
import { TestDocChangelog } from "@/components/aware/TestDocChangelog";
import { TestFlowDiagram } from "@/components/aware/TestFlowDiagram";
import { StatusBadge } from "@/components/aware/StatusBadge";
import type { TestResult } from "@/lib/types";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  Activity,
  Clock,
  Beaker,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  BarChart3,
  Gauge,
} from "lucide-react";

function CountUp({
  value,
  suffix = "",
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
}) {
  const [display, setDisplay] = React.useState(0);
  const ref = React.useRef<number>(0);
  React.useEffect(() => {
    let start: number | null = null;
    const from = ref.current;
    const to = value;
    const duration = 600;
    function step(ts: number) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      ref.current = current;
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [value]);
  return (
    <>
      {display.toFixed(decimals)}
      {suffix}
    </>
  );
}

function MiniSparkline({
  data,
  color = "var(--proof-blue)",
}: {
  data: { v: number }[];
  color?: string;
}) {
  if (data.length < 2) return null;
  const chartData = data.map((d, i) => ({ i, v: d.v }));
  return (
    <ResponsiveContainer width="100%" height={32}>
      <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace(/\W/g, "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          fill={`url(#spark-${color.replace(/\W/g, "")})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function StaggerChildren({ children, index }: { children: React.ReactNode; index: number }) {
  return (
    <div
      style={{
        animation: `slide-up 0.3s ease-out both`,
        animationDelay: `${index * 40}ms`,
      }}
    >
      {children}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  color,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  color: string;
  trend?: { dir: "up" | "down"; val: string };
}) {
  return (
    <div
      className="proof-card"
      style={{
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        borderLeft: `3px solid ${color}`,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 8px 24px ${color}15, var(--proof-shadow-lg)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "var(--proof-shadow)";
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: `${color}08`,
          pointerEvents: "none",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `${color}15`,
            color,
          }}
        >
          {icon}
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--proof-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.3px",
          }}
        >
          {label}
        </span>
        {trend && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 2,
              color: trend.dir === "up" ? "var(--proof-green)" : "var(--proof-red)",
            }}
          >
            {trend.dir === "up" ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {trend.val}
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          fontFamily: "var(--font-mono)",
          letterSpacing: "-1px",
          lineHeight: 1,
          color: "var(--proof-text)",
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>{sub}</div>}
    </div>
  );
}

function AnomalyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; stroke: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(15,23,42,0.95)",
        border: "1px solid rgba(148,163,184,0.2)",
        borderRadius: 6,
        padding: "8px 12px",
        fontSize: 12,
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{ color: "var(--proof-text-secondary)", marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.stroke }} />
          <span style={{ fontWeight: 600 }}>{p.value}%</span>
        </div>
      ))}
    </div>
  );
}

export default function TestDoc() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");
  const testId = params.get("testId") || "";
  const diffRow = DIFF_ROWS.find((d) => d.id === testId);
  const testCase = React.useMemo(() => getTestCaseById(testId), [testId]);
  const [_loaded, setLoaded] = React.useState(false);
  const [activeChartTab, setActiveChartTab] = React.useState<"passrate" | "duration" | "bar">(
    "passrate",
  );
  const [hoveredExecution, setHoveredExecution] = React.useState<string | null>(null);

  React.useEffect(() => {
    Promise.all(RUNS.map((r) => loadResultsForRun(r.id))).then(() => setLoaded(true));
  }, []);

  const testDetail = React.useMemo(() => {
    const name = testCase?.name ?? diffRow?.name;
    if (!name) return null;
    return computeTestDetailForName(name);
  }, [testCase, diffRow, _loaded]);

  const latestResult = React.useMemo(() => {
    const name = testCase?.name ?? diffRow?.name;
    if (!name) return null;
    for (const run of RUNS) {
      const results = getTestResultsForRun(run.id);
      const match = results.find((r) => r.name === name);
      if (match) return match;
    }
    return null;
  }, [testCase, diffRow, _loaded]);

  const testName =
    testCase?.name ?? diffRow?.name ?? (testId || "test_geo_match_us_locale_prod[/us/]");
  const testStatus = diffRow?.candStatus ?? "FAIL";
  const testCategory = testCase?.category ?? diffRow?.category ?? "geo-match";
  const testSuite = "full_suite";

  const passRate = testDetail?.passRate ?? 0;
  const flakinessScore = testDetail?.flakinessScore ?? 0;
  const avgDuration = testDetail?.avgDuration ?? 0;
  const totalExecutions = testDetail?.history.length ?? 0;

  const historyData = React.useMemo(() => {
    if (!testDetail) return [];
    return testDetail.history.map((h) => {
      const run = RUNS.find((r) => r.id === h.runId);
      return {
        runId: h.runId,
        label: run?.started.slice(5, 10) ?? h.runId,
        status: h.status,
        duration: h.duration,
        date: run?.started ?? "",
        fullDate: run?.started ?? "",
      };
    });
  }, [testDetail]);

  const executionsData = React.useMemo(() => {
    if (!testDetail) return [];
    return [...testDetail.history]
      .reverse()
      .slice(0, 12)
      .map((h, i) => {
        const run = RUNS.find((r) => r.id === h.runId);
        return {
          key: `${h.runId}-${i}`,
          runId: h.runId,
          date: run?.started
            ? new Date(run.started).toLocaleDateString([], { month: "short", day: "numeric" })
            : "—",
          time: run?.started
            ? new Date(run.started).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "",
          status: h.status,
          duration: h.duration,
          env: run?.env ?? "—",
          build: run?.build ?? "—",
          rev: run?.rev ?? "—",
          label: run?.started?.slice(5, 10) ?? "",
        };
      });
  }, [testDetail]);

  const durationSparkData = React.useMemo(
    () => testDetail?.history.map((h) => ({ v: h.duration })) ?? [],
    [testDetail],
  );
  const passFailData = React.useMemo(() => {
    const pass = testDetail?.history.filter((h) => h.status === "PASS").length ?? 0;
    const fail = testDetail?.history.filter((h) => h.status === "FAIL").length ?? 0;
    return [
      { name: "Pass", value: pass, color: "var(--proof-green)" },
      { name: "Fail", value: fail, color: "var(--proof-red)" },
    ];
  }, [testDetail]);

  const sortedHistory = React.useMemo(() => {
    if (!testDetail) return [];
    return [...testDetail.history].sort((a, b) => {
      const ra = RUNS.find((r) => r.id === a.runId);
      const rb = RUNS.find((r) => r.id === b.runId);
      return new Date(ra?.started ?? 0).getTime() - new Date(rb?.started ?? 0).getTime();
    });
  }, [testDetail]);

  const chartData = React.useMemo(() => {
    return sortedHistory.map((h) => {
      const run = RUNS.find((r) => r.id === h.runId);
      return {
        label: run?.started?.slice(5, 10) ?? h.runId,
        passRate: h.status === "PASS" ? 100 : 0,
        duration: h.duration,
        status: h.status,
      };
    });
  }, [sortedHistory]);

  const barChartData = React.useMemo(() => {
    return sortedHistory.map((h) => {
      const run = RUNS.find((r) => r.id === h.runId);
      return {
        label: run?.started?.slice(5, 10) ?? h.runId,
        pass: h.status === "PASS" ? 1 : 0,
        fail: h.status === "FAIL" ? 1 : 0,
      };
    });
  }, [sortedHistory]);

  const categoryColor =
    testCategory === "geo-match"
      ? "var(--proof-blue)"
      : testCategory === "caching"
        ? "var(--proof-purple)"
        : testCategory === "security"
          ? "var(--proof-red)"
          : testCategory === "edge-routing"
            ? "var(--proof-yellow)"
            : testCategory === "http-protocol"
              ? "var(--proof-cyan, #06b6d4)"
              : "var(--proof-text-secondary)";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100vh - 80px)",
        maxWidth: 1800,
        margin: "0 auto",
        gap: 0,
      }}
    >
      {/* ── Glassmorphism Hero Banner ── */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "20px 24px",
          borderRadius: "var(--proof-radius-lg) var(--proof-radius-lg) 0 0",
          background: "linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.9) 100%)",
          borderBottom: "1px solid var(--proof-border)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-50%",
            left: "-20%",
            width: "60%",
            height: "200%",
            background: `radial-gradient(ellipse at center, ${categoryColor}10 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-30%",
            right: "-10%",
            width: "40%",
            height: "150%",
            background:
              "radial-gradient(ellipse at center, rgba(139,92,246,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <TestDocTopBar
              testId={testId}
              testName={testName}
              testStatus={testStatus}
              testCategory={testCategory}
              testSuite={testSuite}
              testCase={testCase}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr 300px",
          gap: 14,
          flex: 1,
          minHeight: 0,
          padding: "14px 14px 14px 14px",
          background: "var(--proof-grey-bg)",
        }}
      >
        {/* ── Left Sidebar ── */}
        <div
          style={{
            overflowY: "auto",
            paddingRight: 2,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* Quick Stats */}
          {testDetail && (
            <div
              className="proof-card"
              style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "var(--proof-text-secondary)",
                }}
              >
                Quick Stats
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {[
                  {
                    label: "Pass Rate",
                    value: passRate,
                    suffix: "%",
                    color:
                      passRate >= 80
                        ? "var(--proof-green)"
                        : passRate >= 50
                          ? "var(--proof-yellow)"
                          : "var(--proof-red)",
                  },
                  {
                    label: "Avg Duration",
                    value: avgDuration,
                    suffix: "ms",
                    color: "var(--proof-blue)",
                  },
                  {
                    label: "Flakiness",
                    value: flakinessScore,
                    suffix: "%",
                    color:
                      flakinessScore <= 20
                        ? "var(--proof-green)"
                        : flakinessScore <= 50
                          ? "var(--proof-yellow)"
                          : "var(--proof-red)",
                  },
                  {
                    label: "Executions",
                    value: totalExecutions,
                    suffix: "",
                    color: "var(--proof-purple)",
                  },
                ].map((stat, i) => (
                  <div
                    key={stat.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "5px 8px",
                      borderRadius: 4,
                      background: "rgba(255,255,255,0.02)",
                      animation: `slide-up 0.25s ease-out both`,
                      animationDelay: `${i * 60}ms`,
                    }}
                  >
                    <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
                      {stat.label}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        color: stat.color,
                      }}
                    >
                      <CountUp value={stat.value} suffix={stat.suffix} />
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ height: 40, marginTop: 4 }}>
                {durationSparkData.length > 1 && (
                  <MiniSparkline data={durationSparkData} color="var(--proof-blue)" />
                )}
              </div>
            </div>
          )}
          <TestDocSidebar testCase={testCase} />
        </div>

        {/* ── Main Content ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            overflowY: "auto",
            paddingRight: 4,
            paddingBottom: 32,
          }}
        >
          {/* Metrics Row */}
          {testDetail && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                {
                  icon: <CheckCircle2 size={16} />,
                  label: "Pass Rate",
                  value: <CountUp value={passRate} suffix="%" />,
                  sub: `${testDetail.history.filter((h) => h.status === "PASS").length} of ${totalExecutions} passes`,
                  color:
                    passRate >= 80
                      ? "var(--proof-green)"
                      : passRate >= 50
                        ? "var(--proof-yellow)"
                        : "var(--proof-red)",
                  trend:
                    sortedHistory.length >= 2
                      ? {
                          dir:
                            sortedHistory[sortedHistory.length - 1].status === "PASS"
                              ? ("up" as const)
                              : ("down" as const),
                          val:
                            sortedHistory[sortedHistory.length - 1].status === "PASS"
                              ? "Last: Pass"
                              : "Last: Fail",
                        }
                      : undefined,
                },
                {
                  icon: <Clock size={16} />,
                  label: "Avg Duration",
                  value: <CountUp value={avgDuration} suffix="ms" />,
                  sub: `Min: ${Math.min(...testDetail.history.map((h) => h.duration))}ms / Max: ${Math.max(...testDetail.history.map((h) => h.duration))}ms`,
                  color: "var(--proof-blue)",
                },
                {
                  icon: <Gauge size={16} />,
                  label: "Flakiness",
                  value: <CountUp value={flakinessScore} suffix="%" />,
                  sub:
                    flakinessScore <= 10
                      ? "Stable test"
                      : flakinessScore <= 30
                        ? "Moderately flaky"
                        : "Highly flaky",
                  color:
                    flakinessScore <= 10
                      ? "var(--proof-green)"
                      : flakinessScore <= 30
                        ? "var(--proof-yellow)"
                        : "var(--proof-red)",
                },
                {
                  icon: <BarChart3 size={16} />,
                  label: "Total Executions",
                  value: <CountUp value={totalExecutions} />,
                  sub: `${RUNS.length > 0 ? new Set(RUNS.map((r) => r.started.slice(0, 10))).size : 0}d span`,
                  color: "var(--proof-purple)",
                },
              ].map((metric, i) => (
                <StaggerChildren key={metric.label} index={i}>
                  <MetricCard {...metric} />
                </StaggerChildren>
              ))}
            </div>
          )}

          {/* Test Flow Diagram */}
          {testCase && (
            <StaggerChildren index={4}>
              <TestFlowDiagram testCase={testCase} />
            </StaggerChildren>
          )}

          {/* ── Chart Section ── */}
          {chartData.length > 1 && (
            <StaggerChildren index={5}>
              <div className="proof-card" style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--proof-grey)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "var(--proof-surface-hover)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 3,
                        height: 16,
                        borderRadius: 2,
                        background:
                          "linear-gradient(180deg, var(--proof-green) 0%, var(--proof-red) 100%)",
                      }}
                    />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>Trends</span>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[
                      { key: "passrate" as const, label: "Pass Rate" },
                      { key: "duration" as const, label: "Duration" },
                      { key: "bar" as const, label: "Pass/Fail" },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveChartTab(tab.key)}
                        style={{
                          padding: "4px 10px",
                          fontSize: 11,
                          fontWeight: 600,
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          background:
                            activeChartTab === tab.key
                              ? "var(--proof-blue)"
                              : "rgba(255,255,255,0.04)",
                          color:
                            activeChartTab === tab.key ? "#fff" : "var(--proof-text-secondary)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ padding: "16px 20px", height: 240 }}>
                  {activeChartTab === "passrate" && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 4, right: 8, bottom: 4, left: -16 }}
                      >
                        <defs>
                          <linearGradient id="passRateGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--proof-green)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="var(--proof-green)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10, fill: "var(--proof-text-muted)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fontSize: 10, fill: "var(--proof-text-muted)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<AnomalyTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="passRate"
                          stroke="var(--proof-green)"
                          strokeWidth={2}
                          fill="url(#passRateGrad)"
                          dot={false}
                          activeDot={{
                            r: 5,
                            fill: "var(--proof-green)",
                            stroke: "var(--proof-surface)",
                            strokeWidth: 2,
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                  {activeChartTab === "duration" && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 4, right: 8, bottom: 4, left: -16 }}
                      >
                        <defs>
                          <linearGradient id="durationGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--proof-blue)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="var(--proof-blue)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10, fill: "var(--proof-text-muted)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "var(--proof-text-muted)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<AnomalyTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="duration"
                          stroke="var(--proof-blue)"
                          strokeWidth={2}
                          fill="url(#durationGrad)"
                          dot={false}
                          activeDot={{
                            r: 5,
                            fill: "var(--proof-blue)",
                            stroke: "var(--proof-surface)",
                            strokeWidth: 2,
                          }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                  {activeChartTab === "bar" && barChartData.length > 1 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={barChartData}
                        margin={{ top: 4, right: 8, bottom: 4, left: -8 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.04)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10, fill: "var(--proof-text-muted)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "var(--proof-text-muted)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<AnomalyTooltip />} />
                        <Bar
                          dataKey="pass"
                          stackId="a"
                          fill="var(--proof-green)"
                          radius={[2, 2, 0, 0]}
                        />
                        <Bar
                          dataKey="fail"
                          stackId="a"
                          fill="var(--proof-red)"
                          radius={[2, 2, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </StaggerChildren>
          )}

          {/* ── Recent Executions ── */}
          <StaggerChildren index={6}>
            <div className="proof-card" style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  padding: "10px 14px",
                  borderBottom: "1px solid var(--proof-grey)",
                  background: "var(--proof-surface-hover)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Activity size={14} style={{ color: "var(--proof-text-secondary)" }} />
                  <h2 style={{ fontWeight: 600, fontSize: 13 }}>Recent Executions</h2>
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--proof-text-muted)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    ({executionsData.length})
                  </span>
                </div>
                {durationSparkData.length > 1 && (
                  <div style={{ width: 100, height: 28 }}>
                    <MiniSparkline data={durationSparkData} color="var(--proof-blue)" />
                  </div>
                )}
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="proof-table" style={{ width: "100%", fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "8px 12px" }}>Date</th>
                      <th style={{ padding: "8px 12px" }}>Time</th>
                      <th style={{ padding: "8px 12px" }}>Status</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Duration</th>
                      <th style={{ padding: "8px 12px" }}>Build</th>
                      <th style={{ padding: "8px 12px" }}>Rev</th>
                      <th style={{ padding: "8px 12px" }}>Env</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executionsData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          style={{
                            textAlign: "center",
                            padding: 24,
                            color: "var(--proof-text-secondary)",
                            fontSize: 12,
                          }}
                        >
                          No execution data available
                        </td>
                      </tr>
                    ) : (
                      executionsData.map((row, i) => {
                        const isFail = row.status === "FAIL";
                        const anomaly = row.duration > avgDuration * 1.5;
                        return (
                          <tr
                            key={row.key}
                            onMouseEnter={() => setHoveredExecution(row.runId)}
                            onMouseLeave={() => setHoveredExecution(null)}
                            style={{
                              cursor: "pointer",
                              background:
                                hoveredExecution === row.runId
                                  ? "rgba(255,255,255,0.03)"
                                  : isFail
                                    ? "var(--proof-red-bg)"
                                    : "transparent",
                              transition: "background 0.15s ease",
                              animation: `slide-up 0.25s ease-out both`,
                              animationDelay: `${i * 30}ms`,
                            }}
                          >
                            <td style={{ fontSize: 11, whiteSpace: "nowrap" }}>{row.date}</td>
                            <td
                              style={{
                                fontSize: 11,
                                color: "var(--proof-text-muted)",
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              {row.time}
                            </td>
                            <td>
                              <StatusBadge status={row.status as "PASS" | "FAIL"} />
                            </td>
                            <td
                              style={{
                                textAlign: "right",
                                fontFamily: "var(--font-mono)",
                                fontSize: 11,
                              }}
                            >
                              {anomaly ? (
                                <span
                                  style={{
                                    background: "rgba(245,158,11,0.15)",
                                    color: "var(--proof-yellow)",
                                    padding: "1px 5px",
                                    borderRadius: 4,
                                    fontWeight: 700,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 3,
                                  }}
                                >
                                  <AlertTriangle size={9} />
                                  {row.duration}ms
                                </span>
                              ) : (
                                <span>{row.duration}ms</span>
                              )}
                            </td>
                            <td style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}>
                              {row.build}
                            </td>
                            <td
                              style={{
                                fontSize: 11,
                                fontFamily: "var(--font-mono)",
                                color: "var(--proof-text-secondary)",
                              }}
                            >
                              {row.rev}
                            </td>
                            <td>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 600,
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  background:
                                    row.env === "PROD"
                                      ? "rgba(16,185,129,0.12)"
                                      : row.env === "UAT"
                                        ? "rgba(245,158,11,0.12)"
                                        : "rgba(139,92,246,0.12)",
                                  color:
                                    row.env === "PROD"
                                      ? "var(--proof-green)"
                                      : row.env === "UAT"
                                        ? "var(--proof-yellow)"
                                        : "var(--proof-purple)",
                                }}
                              >
                                {row.env}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </StaggerChildren>

          {/* ── HTTP Evidence ── */}
          <StaggerChildren index={7}>
            {(() => {
              const e = latestResult?.evidence;
              if (!e) return null;
              const rows: { label: string; val: string }[] = [];
              rows.push({ label: "Method", val: e.request.method });
              rows.push({ label: "URL", val: e.request.url });
              rows.push({ label: "Status", val: String(e.response.status) });
              const ct = e.response.headers?.["Content-Type"] ?? "";
              if (ct) rows.push({ label: "Content-Type", val: ct });
              const cl = e.response.headers?.["Content-Length"] ?? "";
              if (cl) rows.push({ label: "Size", val: cl + " bytes" });
              const cache = e.response.headers?.["Cache-Control"] ?? "";
              if (cache) rows.push({ label: "Cache", val: cache });

              return (
                <div className="proof-card" style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid var(--proof-grey)",
                      background: "var(--proof-surface-hover)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Beaker size={14} style={{ color: "var(--proof-text-secondary)" }} />
                    <h2 style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>HTTP Evidence</h2>
                    <span
                      style={{
                        fontSize: 10,
                        color: "var(--proof-text-muted)",
                        fontFamily: "var(--font-mono)",
                        background: "rgba(255,255,255,0.04)",
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      latest run
                    </span>
                  </div>
                  <div
                    style={{
                      padding: "14px 16px",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "6px 16px",
                      fontSize: 12,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {rows.map((r) => (
                      <div key={r.label} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span
                          style={{
                            color: "var(--proof-text-secondary)",
                            fontSize: 10,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.3px",
                            minWidth: 80,
                          }}
                        >
                          {r.label}
                        </span>
                        <span
                          style={{
                            color: "var(--proof-text)",
                            wordBreak: "break-all",
                            fontWeight: 500,
                          }}
                        >
                          {r.val}
                        </span>
                      </div>
                    ))}
                  </div>
                  {e.response.headers && Object.keys(e.response.headers).length > 0 && (
                    <details style={{ margin: "0 16px 12px", fontSize: 12 }}>
                      <summary
                        style={{
                          cursor: "pointer",
                          color: "var(--proof-text-secondary)",
                          fontWeight: 600,
                          fontSize: 10,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          padding: "6px 8px",
                          borderRadius: 4,
                          background: "rgba(255,255,255,0.02)",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "rgba(255,255,255,0.02)")
                        }
                      >
                        Response Headers ({Object.keys(e.response.headers).length})
                      </summary>
                      <div
                        style={{
                          marginTop: 6,
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                          maxHeight: 200,
                          overflowY: "auto",
                          border: "1px solid var(--proof-grey)",
                          borderRadius: 4,
                          padding: 4,
                        }}
                      >
                        {Object.entries(e.response.headers).map(([k, v]) => (
                          <div
                            key={k}
                            style={{
                              display: "flex",
                              gap: 6,
                              fontFamily: "var(--font-mono)",
                              fontSize: 11,
                              padding: "3px 6px",
                              borderRadius: 2,
                              transition: "background 0.1s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "rgba(255,255,255,0.03)")
                            }
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <span
                              style={{
                                color: "var(--proof-blue)",
                                minWidth: 160,
                                fontWeight: 500,
                              }}
                            >
                              {k}
                            </span>
                            <span style={{ color: "var(--proof-text)", wordBreak: "break-all" }}>
                              {v}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                  {e.request.headers && Object.keys(e.request.headers).length > 0 && (
                    <details style={{ margin: "0 16px 12px", fontSize: 12 }}>
                      <summary
                        style={{
                          cursor: "pointer",
                          color: "var(--proof-text-secondary)",
                          fontWeight: 600,
                          fontSize: 10,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          padding: "6px 8px",
                          borderRadius: 4,
                          background: "rgba(255,255,255,0.02)",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "rgba(255,255,255,0.02)")
                        }
                      >
                        Request Headers ({Object.keys(e.request.headers).length})
                      </summary>
                      <div
                        style={{
                          marginTop: 6,
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                          maxHeight: 200,
                          overflowY: "auto",
                          border: "1px solid var(--proof-grey)",
                          borderRadius: 4,
                          padding: 4,
                        }}
                      >
                        {Object.entries(e.request.headers).map(([k, v]) => (
                          <div
                            key={k}
                            style={{
                              display: "flex",
                              gap: 6,
                              fontFamily: "var(--font-mono)",
                              fontSize: 11,
                              padding: "3px 6px",
                              borderRadius: 2,
                              transition: "background 0.1s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "rgba(255,255,255,0.03)")
                            }
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <span
                              style={{
                                color: "var(--proof-purple)",
                                minWidth: 160,
                                fontWeight: 500,
                              }}
                            >
                              {k}
                            </span>
                            <span style={{ color: "var(--proof-text)", wordBreak: "break-all" }}>
                              {v}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                  {e.response.cookies && e.response.cookies.length > 0 && (
                    <details style={{ margin: "0 16px 12px", fontSize: 12 }}>
                      <summary
                        style={{
                          cursor: "pointer",
                          color: "var(--proof-text-secondary)",
                          fontWeight: 600,
                          fontSize: 10,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          padding: "6px 8px",
                          borderRadius: 4,
                          background: "rgba(255,255,255,0.02)",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "rgba(255,255,255,0.02)")
                        }
                      >
                        Cookies ({e.response.cookies.length})
                      </summary>
                      <div
                        style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}
                      >
                        {e.response.cookies.map((c, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              gap: 6,
                              fontFamily: "var(--font-mono)",
                              fontSize: 11,
                              padding: "5px 8px",
                              background: "rgba(255,255,255,0.02)",
                              borderRadius: 4,
                              border: "1px solid var(--proof-grey)",
                            }}
                          >
                            <span style={{ color: "var(--proof-orange)", fontWeight: 600 }}>
                              {c.name}
                            </span>
                            <span style={{ color: "var(--proof-text)", wordBreak: "break-all" }}>
                              = {c.value}
                            </span>
                            {c.domain && (
                              <span style={{ color: "var(--proof-text-secondary)" }}>
                                domain={c.domain}
                              </span>
                            )}
                            {c.path && (
                              <span style={{ color: "var(--proof-text-secondary)" }}>
                                path={c.path}
                              </span>
                            )}
                            {c.httpOnly && (
                              <span
                                style={{
                                  color: "var(--proof-green)",
                                  fontSize: 9,
                                  fontWeight: 600,
                                  padding: "1px 4px",
                                  background: "rgba(16,185,129,0.1)",
                                  borderRadius: 2,
                                }}
                              >
                                HttpOnly
                              </span>
                            )}
                            {c.secure && (
                              <span
                                style={{
                                  color: "var(--proof-green)",
                                  fontSize: 9,
                                  fontWeight: 600,
                                  padding: "1px 4px",
                                  background: "rgba(16,185,129,0.1)",
                                  borderRadius: 2,
                                }}
                              >
                                Secure
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              );
            })()}
          </StaggerChildren>

          {/* ── Assertions ── */}
          {latestResult?.assertions && latestResult.assertions.length > 0 && (
            <StaggerChildren index={8}>
              <div className="proof-card" style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--proof-grey)",
                    background: "var(--proof-surface-hover)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <CheckCircle2 size={14} style={{ color: "var(--proof-text-secondary)" }} />
                  <h2 style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>
                    Assertions ({latestResult.assertions.length})
                  </h2>
                  <span style={{ fontSize: 10, color: "var(--proof-text-muted)" }}>
                    {latestResult.assertions.filter((a) => a.passed).length} passed /{" "}
                    {latestResult.assertions.filter((a) => !a.passed).length} failed
                  </span>
                </div>
                <div
                  style={{
                    padding: "10px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  {latestResult.assertions.map((a, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "7px 10px",
                        borderRadius: 4,
                        background: a.passed ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
                        border: `1px solid ${a.passed ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}`,
                        fontSize: 12,
                        transition: "all 0.15s",
                        animation: `slide-up 0.2s ease-out both`,
                        animationDelay: `${i * 30}ms`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateX(2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      {a.passed ? (
                        <CheckCircle2
                          size={14}
                          style={{ color: "var(--proof-green)", flexShrink: 0 }}
                        />
                      ) : (
                        <XCircle size={14} style={{ color: "var(--proof-red)", flexShrink: 0 }} />
                      )}
                      <span style={{ flex: 1, fontWeight: 500 }}>{a.assertion}</span>
                      <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
                        Expected:{" "}
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontWeight: 600,
                            color: "var(--proof-text)",
                          }}
                        >
                          {a.expected}
                        </span>
                      </span>
                      {!a.passed && (
                        <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
                          Actual:{" "}
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontWeight: 600,
                              color: "var(--proof-red)",
                            }}
                          >
                            {a.actual}
                          </span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </StaggerChildren>
          )}
        </div>

        {/* ── Right Sidebar — Changelog ── */}
        <div
          style={{
            overflowY: "auto",
            paddingLeft: 2,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* Pass/Fail donut */}
          {passFailData[0] &&
            passFailData[1] &&
            (passFailData[0].value > 0 || passFailData[1].value > 0) && (
              <StaggerChildren index={0}>
                <div className="proof-card" style={{ padding: 14 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "var(--proof-text-secondary)",
                      marginBottom: 10,
                    }}
                  >
                    Pass / Fail Distribution
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={passFailData}
                          layout="vertical"
                          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                          barCategoryGap={4}
                        >
                          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                            {passFailData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                          <YAxis dataKey="name" type="category" hide />
                          <XAxis type="number" hide />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "var(--proof-green)",
                            }}
                          />
                          <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
                            Pass
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            fontFamily: "var(--font-mono)",
                            color: "var(--proof-green)",
                          }}
                        >
                          {passFailData[0].value}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "var(--proof-red)",
                            }}
                          />
                          <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
                            Fail
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            fontFamily: "var(--font-mono)",
                            color: "var(--proof-red)",
                          }}
                        >
                          {passFailData[1].value}
                        </span>
                      </div>
                      <div
                        style={{
                          marginTop: 2,
                          height: 4,
                          background: "rgba(255,255,255,0.06)",
                          borderRadius: 2,
                          overflow: "hidden",
                          display: "flex",
                        }}
                      >
                        <div
                          style={{
                            width: `${(passFailData[0].value / (passFailData[0].value + passFailData[1].value)) * 100}%`,
                            background: "var(--proof-green)",
                            transition: "width 0.5s ease",
                          }}
                        />
                        <div
                          style={{
                            flex: 1,
                            background: "var(--proof-red)",
                            transition: "width 0.5s ease",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </StaggerChildren>
            )}
          <TestDocChangelog testCase={testCase} />
        </div>
      </div>
    </div>
  );
}
