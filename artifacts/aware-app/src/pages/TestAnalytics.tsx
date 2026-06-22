import React from "react";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { DIFF_ROWS, RUNS, getTestResultsForRun, getTestDetailsAsync } from "@/lib/data";
import { setTestDetailStat } from "@/lib/sidebarData";
import { useTestData } from "@/hooks/useTestData";
import { useSyncedUrlState } from "@/lib/urlState";
import { PageTemplate, FlakinessTable } from "@/components/aware";
import type { EnrichedHistoryRow } from "@/components/aware/FlakinessTable";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Bug,
  AlertTriangle,
  Activity,
  Loader2,
  TrendingUp,
  Clock,
  History,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  Calendar,
  BarChart3,
  Search
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { HeatmapCalendar } from "@/components/aware/HeatmapCalendar";
import { CategoryHeatmap } from "@/components/aware/CategoryHeatmap";

type SortKey = "runId" | "status" | "duration" | "env";

interface TestDetailEntry {
  history: { runId: string; status: "PASS" | "FAIL"; duration: number; env: string }[];
  passRate: number;
  flakinessScore: number;
  avgDuration: number;
  name?: string;
}

function getTestNameForDetail(
  tcs: ReturnType<typeof useTestData>["tcs"],
  testId: string,
  isTc: boolean,
): string {
  if (isTc) {
    const tc = tcs.find((t) => t.id === testId);
    return tc?.name ?? testId;
  }
  const diff = DIFF_ROWS.find((d) => d.id === testId);
  return diff?.name ?? testId;
}

function enrichHistory(
  history: { runId: string; status: "PASS" | "FAIL"; duration: number; env: string }[],
  testName: string,
): EnrichedHistoryRow[] {
  return history.map((h) => {
    const results = getTestResultsForRun(h.runId);
    const match = results.find((r) => {
      const rn = r.name.toLowerCase();
      const tn = testName.toLowerCase().replace(/_/g, " ");
      return rn === tn || rn.includes(tn) || tn.includes(rn);
    });
    const assertions = match?.assertions ?? [];
    return {
      ...h,
      error: match?.error,
      assertionsPassed: assertions.filter((a) => a.passed).length,
      assertionsFailed: assertions.filter((a) => !a.passed).length,
    };
  });
}

export default function TestAnalytics() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [, navigate] = useLocation();
  const { tcs } = useTestData();
  const [testDetails, setTestDetails] = React.useState<TestDetailEntry[]>([]);
  const [detailsLoading, setDetailsLoading] = React.useState(false);

  React.useEffect(() => {
    setDetailsLoading(true);
    getTestDetailsAsync()
      .then((data) => {
        // Enriched with names for ranking
        const withNames = data.map((d, i) => ({
          ...d,
          name: DIFF_ROWS[i % DIFF_ROWS.length]?.name ?? `Test ${i}`,
        }));
        setTestDetails(withNames);
      })
      .catch((err: unknown) => {
        console.warn("[AWARE] TestAnalytics: failed to load test details", err);
      })
      .finally(() => {
        setDetailsLoading(false);
      });
  }, []);

  const rawTestId = (() => {
    const id = params.get("testId") ?? "";
    if (id.startsWith("tr_")) {
      const parts = id.replace("tr_", "").split("_");
      const runIdx = Math.min(parseInt(parts[0] ?? "0", 10), RUNS.length - 1);
      const resultIdx = parseInt(parts[1] ?? "0", 10);
      const results = getTestResultsForRun(RUNS[runIdx]?.id ?? "");
      const result = results[Math.min(resultIdx, results.length - 1)];
      if (result) {
        const tc = tcs.find((t) => t.name === result.name);
        if (tc) return tc.id;
      }
    }
    return id;
  })();
  const rawDiffId = params.get("diffId") ?? "diff_0";
  const isTcMode = rawTestId !== "" && tcs.some((t) => t.id === rawTestId);

  const testCase = isTcMode ? (tcs.find((t) => t.id === rawTestId) ?? null) : null;
  const selectedTestId = isTcMode ? rawTestId : rawDiffId;

  const tcIdx = isTcMode ? tcs.findIndex((t) => t.id === rawTestId) : -1;
  const diffs = DIFF_ROWS;

  const [hStatus, setHStatus] = useSyncedUrlState<string>("hStatus", "all");
  const [hEnv, setHEnv] = useSyncedUrlState<string>("hEnv", "all");
  const [hErrOnly, setHErrOnly] = useSyncedUrlState<boolean>("hErrOnly", false);
  const [hSort, setHSort] = useSyncedUrlState<string>("hSort", "runId");
  const [selectedRow, setSelectedRow] = React.useState<EnrichedHistoryRow | null>(null);

  const topFlakyTests = React.useMemo(() => {
    return [...testDetails]
      .sort((a, b) => b.flakinessScore - a.flakinessScore)
      .slice(0, 10);
  }, [testDetails]);

  const idx =
    diffs.length === 0
      ? 0
      : isTcMode
        ? Math.abs(tcIdx % diffs.length)
        : Math.max(
            0,
            diffs.findIndex((d) => d.id === selectedTestId),
          );
  const _diff = diffs[Math.min(idx, diffs.length - 1)] ?? diffs[0];
  const detail =
    diffs.length === 0 || testDetails.length === 0
      ? { history: [], passRate: 0, flakinessScore: 0, avgDuration: 0 }
      : (testDetails[idx % testDetails.length] ?? {
          history: [],
          passRate: 0,
          flakinessScore: 0,
          avgDuration: 0,
        });
  const testName =
    isTcMode && testCase ? testCase.name : getTestNameForDetail(tcs, selectedTestId, isTcMode);

  const enriched = React.useMemo(() => {
    if (diffs.length === 0) return [];
    return enrichHistory(detail.history, testName);
  }, [detail.history, testName, diffs.length]);

  const filteredHistory = React.useMemo(() => {
    let rows = enriched;
    if (hStatus !== "all") rows = rows.filter((r) => r.status === hStatus);
    if (hEnv !== "all") rows = rows.filter((r) => r.env === hEnv);
    if (hErrOnly) rows = rows.filter((r) => r.error);
    const desc = hSort.startsWith("-");
    const key = (desc ? hSort.slice(1) : hSort) as SortKey;
    const dir: "asc" | "desc" = desc ? "desc" : "asc";
    return [...rows].sort((a, b) => {
      let cmp = 0;
      if (key === "runId") cmp = a.runId.localeCompare(b.runId);
      else if (key === "status") cmp = a.status.localeCompare(b.status);
      else if (key === "duration") cmp = a.duration - b.duration;
      else if (key === "env") cmp = a.env.localeCompare(b.env);
      return dir === "asc" ? cmp : -cmp;
    });
  }, [enriched, hStatus, hEnv, hErrOnly, hSort]);

  const failCount = enriched.filter((r) => r.status === "FAIL").length;
  const errorCount = enriched.filter((r) => r.error).length;
  React.useEffect(() => {
    if (detail.history.length > 0) {
      setTestDetailStat(
        {
          passRate: detail.passRate,
          flakinessScore: detail.flakinessScore,
          avgDuration: detail.avgDuration,
          failCount,
          errorCount,
        },
        hStatus,
      );
    }
  }, [
    detail.passRate,
    detail.flakinessScore,
    detail.avgDuration,
    detail.history.length,
    failCount,
    errorCount,
    hStatus,
  ]);

  const uniqueEnvs = React.useMemo(
    () => [...new Set(enriched.map((r) => r.env))].sort(),
    [enriched],
  );

  const commonErrors = React.useMemo(() => {
    if (!enriched.length) return [];
    const counts = new Map<string, number>();
    enriched.forEach((r) => {
      if (r.error) {
        // Group by message prefix (first 60 chars)
        const prefix = r.error.slice(0, 60);
        counts.set(prefix, (counts.get(prefix) ?? 0) + 1);
      }
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [enriched]);

  if (detailsLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 12,
        }}
      >
        <Loader2 className="animate-spin" size={32} style={{ color: "var(--proof-blue)" }} />
        <span style={{ fontSize: 13, color: "var(--proof-text-secondary)" }}>
          Loading test details...
        </span>
      </div>
    );
  }

  if (!detailsLoading && testDetails.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 64 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--proof-text-primary)" }}>
          No test data available
        </h2>
        <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", marginTop: 8 }}>
          Run a comparison first to see analytics.
        </p>
        <button
          onClick={() => navigate("/compare")}
          className="proof-button"
          style={{ fontSize: 13, marginTop: 16 }}
        >
          Go to Compare
        </button>
      </div>
    );
  }

  const selIdx = selectedRow ? filteredHistory.findIndex((r) => r.runId === selectedRow.runId) : -1;

  const navigateDetail = (dir: -1 | 1) => {
    const next = selIdx + dir;
    if (next >= 0 && next < filteredHistory.length) {
      setSelectedRow(filteredHistory[next]);
    }
  };

  const navigateTest = (dir: -1 | 1) => {
    if (isTcMode) {
      const next = (tcIdx + dir + tcs.length) % tcs.length;
      navigate(`/analytics?testId=${tcs[next].id}`);
    } else {
      const next = (idx + dir + diffs.length) % diffs.length;
      navigate(`/analytics?diffId=${diffs[next].id}`);
    }
  };

  const heatmapData = enriched.map(h => ({ env: h.env, status: h.status }));

  return (
    <PageTemplate
      title="Test Analytics"
      subtitle={
        testCase
          ? `${testCase.name} · ${tcIdx + 1} of ${tcs.length}`
          : `${testName} · ${idx + 1} of ${diffs.length}`
      }
      headerActions={
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => navigateTest(-1)}
            className="proof-button-ghost"
            style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--proof-grey-bg)", border: "1px solid var(--proof-border)" }}
            title="Previous test"
          >
            <ChevronUp size={16} />
          </button>
          <button
            onClick={() => navigateTest(1)}
            className="proof-button-ghost"
            style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--proof-grey-bg)", border: "1px solid var(--proof-border)" }}
            title="Next test"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, minHeight: 0 }}>
        {/* Summary Stats Row */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}
        >
          {[
            {
              label: "Pass Rate",
              value: `${detail.passRate}%`,
              icon: <ShieldCheck size={18} />,
              color: detail.passRate >= 95 ? "var(--proof-green)" : "var(--proof-red)",
            },
            {
              label: "Avg Duration",
              value: `${detail.avgDuration}ms`,
              icon: <Clock size={18} />,
              color: "var(--proof-blue)",
            },
            {
              label: "Flakiness",
              value: `${detail.flakinessScore}%`,
              icon: <AlertTriangle size={18} />,
              color: detail.flakinessScore > 20 ? "var(--proof-yellow)" : "var(--proof-green)",
            },
            {
              label: "Total Runs",
              value: detail.history.length,
              icon: <History size={18} />,
              color: "var(--proof-text-secondary)",
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="proof-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                padding: "20px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: "var(--proof-surface)",
                border: "1px solid var(--proof-border)",
                borderRadius: "16px"
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: `${stat.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: stat.color,
                }}
              >
                {stat.icon}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--proof-text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: 2
                  }}
                >
                  {stat.label}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--proof-text)" }}>
                  {stat.value}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div style={{ display: "flex", gap: 16, flex: 1, minHeight: 0 }}>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            {/* Charts Section */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="proof-card" style={{ padding: 20, borderRadius: 16 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "var(--proof-text)"
                  }}
                >
                  <TrendingUp size={16} /> Duration Trend (ms)
                </div>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={enriched}>
                      <defs>
                        <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--proof-blue)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--proof-blue)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--proof-border)" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="runId"
                        hide
                      />
                      <YAxis
                        fontSize={10}
                        stroke="var(--proof-text-muted)"
                        tickFormatter={(val) => `${val}ms`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--proof-surface)",
                          border: "1px solid var(--proof-border)",
                          borderRadius: 8,
                          fontSize: 12,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="duration"
                        stroke="var(--proof-blue)"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorDuration)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="proof-card" style={{ padding: 20, borderRadius: 16 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "var(--proof-text)"
                  }}
                >
                  <Bug size={16} /> Common Errors
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {commonErrors.length > 0 ? (
                    commonErrors.map(([msg, count], i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: 12,
                          padding: "10px 14px",
                          borderRadius: 8,
                          background: "rgba(239,68,68,0.05)",
                          border: "1px solid rgba(239,68,68,0.1)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            color: "var(--proof-red)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                            marginRight: 12,
                          }}
                        >
                          {msg}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "white",
                            background: "var(--proof-red)",
                            padding: "2px 8px",
                            borderRadius: 12,
                          }}
                        >
                          {count}×
                        </span>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: 40,
                        textAlign: "center",
                        fontSize: 13,
                        color: "var(--proof-text-muted)",
                      }}
                    >
                      No errors detected in recent history
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Visualizations Section */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
              <CategoryHeatmap data={heatmapData} />
              <div className="proof-card" style={{ padding: 20, borderRadius: 16 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "var(--proof-text)"
                  }}
                >
                  <Calendar size={16} /> History Calendar
                </div>
                <HeatmapCalendar data={enriched.map(e => ({ date: e.runId, count: 1, envs: {} }))} />
              </div>
            </div>

            <FlakinessTable
              filteredHistory={filteredHistory}
              enriched={enriched}
              hStatus={hStatus}
              setHStatus={setHStatus}
              hEnv={hEnv}
              setHEnv={setHEnv}
              hErrOnly={hErrOnly}
              setHErrOnly={setHErrOnly}
              hSort={hSort}
              setHSort={setHSort}
              uniqueEnvs={uniqueEnvs}
              selectedRow={selectedRow}
              setSelectedRow={setSelectedRow}
              testName={testName}
            />
          </div>

          <AnimatePresence>
            {selectedRow && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="proof-card"
                style={{
                  width: 400,
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  borderLeft: `4px solid ${selectedRow.status === "PASS" ? "var(--proof-green)" : "var(--proof-red)"}`,
                  borderRadius: 16
                }}
              >
                {(() => {
                  const results = getTestResultsForRun(selectedRow.runId);
                  const result = results.find((r) => {
                    const rn = r.name.toLowerCase();
                    const tn = testName.toLowerCase().replace(/_/g, " ");
                    return rn === tn || rn.includes(tn) || tn.includes(rn);
                  });

                  return (
                    <>
                      <div
                        style={{
                          padding: "16px 20px",
                          borderBottom: "1px solid var(--proof-border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "var(--proof-grey-bg)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button
                            onClick={() => navigateDetail(-1)}
                            disabled={selIdx <= 0}
                            className="proof-button-ghost"
                            style={{ padding: 4, borderRadius: 4 }}
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                            {selectedRow.runId}
                          </span>
                          <button
                            onClick={() => navigateDetail(1)}
                            disabled={selIdx >= filteredHistory.length - 1}
                            className="proof-button-ghost"
                            style={{ padding: 4, borderRadius: 4 }}
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                        <button
                          onClick={() => setSelectedRow(null)}
                          className="proof-button-ghost"
                          style={{ padding: 4, borderRadius: 4 }}
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span
                            className={`proof-badge ${selectedRow.status === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`}
                            style={{ fontSize: 12, padding: "4px 12px" }}
                          >
                            {selectedRow.status}
                          </span>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 11, color: "var(--proof-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Duration</div>
                            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{selectedRow.duration}ms</div>
                          </div>
                        </div>

                        {selectedRow.error && (
                          <div style={{ 
                            background: "rgba(239,68,68,0.05)", 
                            border: "1px solid rgba(239,68,68,0.1)", 
                            borderRadius: 12, 
                            padding: 16 
                          }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--proof-red)", marginBottom: 8, textTransform: "uppercase" }}>Error Message</div>
                            <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--proof-red)", wordBreak: "break-all" }}>
                              {selectedRow.error}
                            </div>
                          </div>
                        )}

                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--proof-text-muted)", marginBottom: 12, textTransform: "uppercase" }}>Assertions</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {result?.assertions && result.assertions.length > 0 ? (
                              result.assertions.map((a, i) => (
                                <div
                                  key={i}
                                  style={{
                                    padding: "10px 12px",
                                    borderRadius: 8,
                                    fontSize: 12,
                                    background: a.passed ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)",
                                    border: `1px solid ${a.passed ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)"}`,
                                    display: "flex",
                                    gap: 10,
                                  }}
                                >
                                  <span style={{ color: a.passed ? "var(--proof-green)" : "var(--proof-red)", fontWeight: 700 }}>
                                    {a.passed ? "✓" : "✗"}
                                  </span>
                                  <span style={{ flex: 1, color: "var(--proof-text)" }}>{a.assertion}</span>
                                </div>
                              ))
                            ) : (
                              <div style={{ fontSize: 12, color: "var(--proof-text-muted)", textAlign: "center", padding: 20 }}>
                                No assertions recorded
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                          <button
                            onClick={() => navigate(`/run/${selectedRow.runId}?test=${selectedTestId}`)}
                            className="proof-button"
                            style={{ width: "100%", justifyContent: "center" }}
                          >
                            <BarChart3 size={14} /> Full Run Evidence
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTemplate>
  );
}
