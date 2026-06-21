import React from "react";
import { useLocation, useSearch } from "wouter";
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
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
            className="proof-button proof-button-xs"
            title="Previous test"
          >
            <ChevronUp size={14} />
          </button>
          <button
            onClick={() => navigateTest(1)}
            className="proof-button proof-button-xs"
            title="Next test"
          >
            <ChevronDown size={14} />
          </button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, minHeight: 0 }}>
        {/* Summary Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            {
              label: "Pass Rate",
              value: `${detail.passRate}%`,
              icon: <ShieldCheck size={16} />,
              color: detail.passRate >= 95 ? "var(--proof-green)" : "var(--proof-red)",
            },
            {
              label: "Avg Duration",
              value: `${detail.avgDuration}ms`,
              icon: <Clock size={16} />,
              color: "var(--proof-blue)",
            },
            {
              label: "Flakiness",
              value: `${detail.flakinessScore}%`,
              icon: <AlertTriangle size={16} />,
              color: detail.flakinessScore > 20 ? "var(--proof-yellow)" : "var(--proof-green)",
            },
            {
              label: "Total Runs",
              value: detail.history.length,
              icon: <History size={16} />,
              color: "var(--proof-text)",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="proof-card"
              style={{
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "var(--proof-surface)",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "var(--proof-grey-bg)",
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
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--proof-text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {stat.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--proof-text)" }}>
                  {stat.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 14, flex: 1, minHeight: 0 }}>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            {/* Charts & Error Analysis Section */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="proof-card" style={{ padding: 16 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <TrendingUp size={14} /> Duration Trend (ms)
                </div>
                <div style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={enriched}>
                      <CartesianGrid stroke="var(--proof-border)" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="runId"
                        hide
                      />
                      <YAxis
                        fontSize={10}
                        stroke="var(--proof-text-muted)"
                        tickFormatter={(val) => `${val}ms`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--proof-surface)",
                          border: "1px solid var(--proof-border)",
                          fontSize: 11,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="duration"
                        stroke="var(--proof-blue)"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "var(--proof-blue)" }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="proof-card" style={{ padding: 16 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Bug size={14} /> Common Errors
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {commonErrors.length > 0 ? (
                    commonErrors.map(([msg, count], i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: 11,
                          padding: "6px 10px",
                          borderRadius: 6,
                          background: "var(--proof-red-bg)",
                          border: "1px solid var(--proof-red-border)",
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
                            marginRight: 8,
                          }}
                        >
                          {msg}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: "var(--proof-red)",
                            background: "rgba(239,68,68,0.1)",
                            padding: "1px 6px",
                            borderRadius: 10,
                          }}
                        >
                          {count}×
                        </span>
                      </div>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: 24,
                        textAlign: "center",
                        fontSize: 12,
                        color: "var(--proof-text-muted)",
                      }}
                    >
                      No errors detected in recent history
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Top Flaky Tests Table (Global) */}
            <div className="proof-card" style={{ padding: 16 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Activity size={14} /> Top Flaky Tests (All)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {topFlakyTests.map((t, i) => (
                  <div
                    key={i}
                    onClick={() => navigate(`/analytics?diffId=diff_${testDetails.indexOf(t)}`)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "8px 12px",
                      borderRadius: 6,
                      cursor: "pointer",
                      gap: 12,
                      transition: "background 0.2s",
                    }}
                    className="proof-list-item"
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "var(--proof-text-muted)",
                        width: 16,
                      }}
                    >
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "var(--proof-text)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.name}
                      </div>
                      <div style={{ width: "100%", height: 3, background: "var(--proof-grey-bg)", marginTop: 4, borderRadius: 2 }}>
                        <div
                          style={{
                            height: "100%",
                            borderRadius: 2,
                            width: `${t.flakinessScore}%`,
                            background:
                              t.flakinessScore > 50
                                ? "var(--proof-red)"
                                : t.flakinessScore > 25
                                  ? "var(--proof-yellow)"
                                  : "var(--proof-green)",
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 16, textAlign: "right" }}>
                      <div style={{ width: 60 }}>
                        <div style={{ fontSize: 9, color: "var(--proof-text-muted)", textTransform: "uppercase" }}>Flaky</div>
                        <div style={{ fontSize: 11, fontWeight: 600 }}>{t.flakinessScore}%</div>
                      </div>
                      <div style={{ width: 60 }}>
                        <div style={{ fontSize: 9, color: "var(--proof-text-muted)", textTransform: "uppercase" }}>Pass</div>
                        <div style={{ fontSize: 11, fontWeight: 600 }}>{t.passRate}%</div>
                      </div>
                      <div style={{ width: 60 }}>
                        <div style={{ fontSize: 9, color: "var(--proof-text-muted)", textTransform: "uppercase" }}>Avg Dur</div>
                        <div style={{ fontSize: 11, fontWeight: 600 }}>{t.avgDuration}ms</div>
                      </div>
                    </div>
                  </div>
                ))}
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

          {selectedRow && (
            <div
              className="proof-card"
              style={{
                width: 380,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                borderLeft: `3px solid ${selectedRow.status === "PASS" ? "var(--proof-green)" : "var(--proof-red)"}`,
              }}
            >
              {(() => {
                const run = RUNS.find((r) => r.id === selectedRow.runId);
                const allResults = getTestResultsForRun(selectedRow.runId);
                const testResult = allResults.find((r) => {
                  const rn = r.name.toLowerCase();
                  const tn = testName.toLowerCase().replace(/_/g, " ");
                  return rn === tn || rn.includes(tn) || tn.includes(rn);
                });
                const assertions = testResult?.assertions ?? testResult?.evidence?.assertions ?? [];
                const passed = assertions.filter((a) => a.passed).length;
                const failed = assertions.filter((a) => !a.passed).length;
                const evidence = testResult?.evidence;

                return (
                  <>
                    <div
                      style={{
                        padding: "10px 14px",
                        borderBottom: "1px solid var(--proof-grey)",
                        background: "var(--proof-blue-bg)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          border: "1px solid var(--proof-grey)",
                          borderRadius: 4,
                          background: "var(--proof-surface)",
                        }}
                      >
                        <button
                          disabled={selIdx <= 0}
                          onClick={() => navigateDetail(-1)}
                          style={{
                            padding: "4px 7px",
                            border: "none",
                            background: "transparent",
                            cursor: selIdx > 0 ? "pointer" : "not-allowed",
                            color: selIdx > 0 ? "var(--proof-blue)" : "var(--proof-grey)",
                          }}
                        >
                          <ChevronLeft size={13} />
                        </button>
                        <span
                          style={{
                            fontSize: 10,
                            color: "var(--proof-text-secondary)",
                            padding: "0 4px",
                          }}
                        >
                          {selIdx + 1}/{filteredHistory.length}
                        </span>
                        <button
                          disabled={selIdx >= filteredHistory.length - 1}
                          onClick={() => navigateDetail(1)}
                          style={{
                            padding: "4px 7px",
                            border: "none",
                            background: "transparent",
                            cursor: selIdx < filteredHistory.length - 1 ? "pointer" : "not-allowed",
                            color:
                              selIdx < filteredHistory.length - 1
                                ? "var(--proof-blue)"
                                : "var(--proof-grey)",
                          }}
                        >
                          <ChevronRight size={13} />
                        </button>
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color:
                            selectedRow.status === "PASS"
                              ? "var(--proof-green)"
                              : "var(--proof-red)",
                          flex: 1,
                        }}
                      >
                        {selectedRow.status}
                      </span>
                      <button
                        onClick={() => setSelectedRow(null)}
                        aria-label="Close"
                        style={{
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          color: "var(--proof-text-secondary)",
                          fontSize: 18,
                          lineHeight: 1,
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div
                      style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: 14,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          fontWeight: 600,
                          lineHeight: 1.5,
                          wordBreak: "break-all",
                        }}
                      >
                        {testName}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                        {[
                          {
                            label: "Run ID",
                            value: selectedRow.runId,
                            mono: true,
                            color: "var(--proof-blue)",
                          },
                          { label: "Environment", value: selectedRow.env, mono: false },
                          { label: "Duration", value: `${selectedRow.duration}ms`, mono: true },
                          {
                            label: "Started",
                            value: run
                              ? new Date(run.started).toLocaleString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "\u2014",
                            mono: false,
                          },
                        ].map(({ label, value, mono, color }) => (
                          <div
                            key={label}
                            style={{
                              padding: "6px 8px",
                              borderRadius: 6,
                              background: "var(--proof-grey-bg)",
                              border: "1px solid var(--proof-border)",
                            }}
                          >
                            <div
                              style={{
                                fontSize: 9,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                                color: "var(--proof-text-secondary)",
                                marginBottom: 2,
                              }}
                            >
                              {label}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                fontFamily: mono ? "var(--font-mono)" : undefined,
                                color: color ?? "var(--proof-text)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {value}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 10px",
                          borderRadius: 7,
                          background:
                            selectedRow.status === "PASS"
                              ? "rgba(34,197,94,0.07)"
                              : "rgba(239,68,68,0.07)",
                          border: `1px solid ${selectedRow.status === "PASS" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                        }}
                      >
                        <span
                          className={`proof-badge ${selectedRow.status === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`}
                        >
                          {selectedRow.status}
                        </span>
                        {assertions.length > 0 && (
                          <span
                            style={{
                              fontSize: 11,
                              fontFamily: "var(--font-mono)",
                              color: "var(--proof-text-secondary)",
                              marginLeft: 4,
                            }}
                          >
                            <span style={{ color: "var(--proof-green)" }}>{passed}\u2713</span>
                            {" / "}
                            <span
                              style={{
                                color:
                                  failed > 0 ? "var(--proof-red)" : "var(--proof-text-secondary)",
                              }}
                            >
                              {failed}\u2717
                            </span>
                            {" assertions"}
                          </span>
                        )}
                        {run && (
                          <span
                            style={{
                              marginLeft: "auto",
                              fontSize: 10,
                              fontFamily: "var(--font-mono)",
                              color: "var(--proof-text-tertiary)",
                              background: "var(--proof-grey-bg)",
                              padding: "1px 5px",
                              borderRadius: 3,
                            }}
                          >
                            {run.build?.slice(0, 7)}
                          </span>
                        )}
                      </div>

                      {assertions.length > 0 && (
                        <div>
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              color: "var(--proof-text-secondary)",
                              marginBottom: 6,
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <Bug size={11} /> Assertions ({assertions.length})
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {assertions.map((a, i) => (
                              <div
                                key={i}
                                style={{
                                  padding: "6px 8px",
                                  borderRadius: 5,
                                  background: a.passed
                                    ? "rgba(34,197,94,0.05)"
                                    : "rgba(239,68,68,0.06)",
                                  border: `1px solid ${a.passed ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.2)"}`,
                                  borderLeft: `3px solid ${a.passed ? "var(--proof-green)" : "var(--proof-red)"}`,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: a.passed ? "var(--proof-green)" : "var(--proof-red)",
                                    marginBottom: 3,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                  }}
                                >
                                  {a.passed ? "\u2713" : "\u2717"} {a.assertion}
                                </div>
                                {!a.passed && (
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 2,
                                      fontSize: 9,
                                      fontFamily: "var(--font-mono)",
                                    }}
                                  >
                                    <div>
                                      <span style={{ color: "var(--proof-text-secondary)" }}>
                                        expected:{" "}
                                      </span>
                                      <span style={{ color: "var(--proof-green)" }}>
                                        {a.expected}
                                      </span>
                                    </div>
                                    <div>
                                      <span style={{ color: "var(--proof-text-secondary)" }}>
                                        actual:{" "}
                                      </span>
                                      <span style={{ color: "var(--proof-red)" }}>{a.actual}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedRow.error && (
                        <div>
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              color: "var(--proof-red)",
                              marginBottom: 6,
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <AlertTriangle size={11} /> Error Output
                          </div>
                          <pre
                            style={{
                              fontSize: 10,
                              color: "var(--proof-red)",
                              fontFamily: "var(--font-mono)",
                              background: "rgba(239,68,68,0.06)",
                              border: "1px solid rgba(239,68,68,0.15)",
                              borderRadius: 6,
                              padding: "8px 10px",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-all",
                              margin: 0,
                              lineHeight: 1.55,
                            }}
                          >
                            {selectedRow.error}
                          </pre>
                        </div>
                      )}

                      {evidence && (
                        <div>
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              color: "var(--proof-text-secondary)",
                              marginBottom: 6,
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            <Activity size={11} /> HTTP Evidence
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <div
                              style={{
                                padding: "5px 8px",
                                borderRadius: 5,
                                background: "var(--proof-grey-bg)",
                                border: "1px solid var(--proof-border)",
                                fontSize: 10,
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              <span style={{ color: "var(--proof-blue)", fontWeight: 600 }}>
                                {evidence.request.method}
                              </span>{" "}
                              <span
                                style={{
                                  color: "var(--proof-text)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  display: "inline-block",
                                  maxWidth: 280,
                                }}
                              >
                                {evidence.request.url}
                              </span>
                            </div>
                            {evidence.response.body && (
                              <details style={{ fontSize: 10 }}>
                                <summary
                                  style={{
                                    cursor: "pointer",
                                    color: "var(--proof-text-secondary)",
                                    padding: "3px 0",
                                    userSelect: "none",
                                  }}
                                >
                                  Response body
                                </summary>
                                <pre
                                  style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: 9,
                                    color: "var(--proof-text-secondary)",
                                    background: "var(--proof-grey-bg)",
                                    border: "1px solid var(--proof-border)",
                                    borderRadius: 4,
                                    padding: "6px 8px",
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-all",
                                    margin: "4px 0 0",
                                    lineHeight: 1.5,
                                    maxHeight: 140,
                                    overflow: "auto",
                                  }}
                                >
                                  {evidence.response.body.length > 400
                                    ? evidence.response.body.slice(0, 400) + "\n\u2026"
                                    : evidence.response.body}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        padding: "8px 14px",
                        borderTop: "1px solid var(--proof-grey)",
                        display: "flex",
                        gap: 6,
                        flexShrink: 0,
                      }}
                    >
                      <button
                        onClick={() => navigate(`/runs/${selectedRow.runId}`)}
                        className="proof-button proof-button-xs"
                        style={{ flex: 1, justifyContent: "center" }}
                      >
                        View Full Run \u2192
                      </button>
                      <button
                        onClick={() => setSelectedRow(null)}
                        className="proof-button proof-button-xs"
                      >
                        Close
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </PageTemplate>
  );
}
