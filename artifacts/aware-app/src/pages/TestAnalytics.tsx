import React from "react";
import { Link, useLocation, useSearch } from "wouter";
import { CTAStatCard } from "@/components/aware/CTAStatCard";
import { DIFF_ROWS, RUNS, getTestResultsForRun, getTestDetailsAsync } from "@/lib/data";
import { getEnvLabels } from "@/lib/envConfig";
import { ENVS, CATEGORIES, CATEGORY_COLORS } from "@/lib/constants";
import { useTestData } from "@/hooks/useTestData";
import { PanelErrorBoundary } from "@/components/aware/PanelErrorBoundary";
import { useSyncedUrlState } from "@/lib/urlState";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  ArrowLeft,
  BarChart3,
  Clock,
  Activity,
  AlertTriangle,
  Search,
  Share2,
  ChevronRight,
  FileText,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Bug,
} from "lucide-react";
import { useSimpleToast } from "@/hooks/useSimpleToast";

interface EnrichedHistoryRow {
  runId: string;
  status: "PASS" | "FAIL";
  duration: number;
  env: string;
  error?: string;
  assertionsPassed: number;
  assertionsFailed: number;
}

type SortKey = "runId" | "status" | "duration" | "env";
type SortDir = "asc" | "desc";

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

function selectorLabel(item: { id: string; name: string }, query: string): React.ReactNode {
  if (!query.trim()) return item.name;
  const lower = query.toLowerCase();
  const name = item.name;
  const idx = name.toLowerCase().indexOf(lower);
  if (idx === -1) return name;
  return (
    <>
      {name.slice(0, idx)}
      <strong style={{ background: "var(--proof-blue-bg)", color: "var(--proof-blue)" }}>
        {name.slice(idx, idx + query.length)}
      </strong>
      {name.slice(idx + query.length)}
    </>
  );
}

export default function TestAnalytics() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [, navigate] = useLocation();
  const { show, Toast } = useSimpleToast();
  const { tcs } = useTestData();
  const [testDetails, setTestDetails] = React.useState<
    {
      history: { runId: string; status: "PASS" | "FAIL"; duration: number; env: string }[];
      passRate: number;
      flakinessScore: number;
      avgDuration: number;
    }[]
  >([]);
  React.useEffect(() => {
    getTestDetailsAsync().then(setTestDetails);
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

  // ── All hooks before any early return ──
  const [selSearch, setSelSearch] = React.useState("");
  const [selOpen, setSelOpen] = React.useState(false);
  const [selActiveIdx, setSelActiveIdx] = React.useState(0);
  const selRef = React.useRef<HTMLDivElement>(null);

  const [hStatus, setHStatus] = useSyncedUrlState<string>("hStatus", "all");
  const [hEnv, setHEnv] = useSyncedUrlState<string>("hEnv", "all");
  const [hErrOnly, setHErrOnly] = useSyncedUrlState<boolean>("hErrOnly", false);
  const [hSort, setHSort] = useSyncedUrlState<string>("hSort", "runId");
  const [selectedRow, setSelectedRow] = React.useState<EnrichedHistoryRow | null>(null);

  // ── Derived values (safe for empty diffs) ──
  const idx =
    diffs.length === 0
      ? 0
      : isTcMode
        ? Math.abs(tcIdx % diffs.length)
        : Math.max(
            0,
            diffs.findIndex((d) => d.id === selectedTestId),
          );
  const diff = diffs[Math.min(idx, diffs.length - 1)] ?? diffs[0];
  const detail =
    diffs.length === 0 || testDetails.length === 0
      ? { history: [], passRate: 0, flakinessScore: 0, avgDuration: 0 }
      : (testDetails[idx % testDetails.length] ?? {
          history: [],
          passRate: 0,
          flakinessScore: 0,
          avgDuration: 0,
        });
  const selectorItems =
    diffs.length === 0
      ? []
      : isTcMode
        ? tcs.map((t) => ({ id: t.id, name: t.name }))
        : diffs.map((d) => ({ id: d.id, name: d.name }));

  const filteredSelector = selSearch.trim()
    ? selectorItems.filter(
        (s) =>
          s.id.toLowerCase().includes(selSearch.toLowerCase()) ||
          s.name.toLowerCase().includes(selSearch.toLowerCase()),
      )
    : selectorItems;

  const testName =
    isTcMode && testCase ? testCase.name : getTestNameForDetail(tcs, selectedTestId, isTcMode);

  const handleSelectNavigate = (id: string) => {
    const key = isTcMode ? "testId" : "diffId";
    navigate(`/trends?${key}=${encodeURIComponent(id)}`, { replace: true });
    setSelOpen(false);
    setSelSearch("");
  };

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
    const dir: SortDir = desc ? "desc" : "asc";
    return [...rows].sort((a, b) => {
      let cmp = 0;
      if (key === "runId") cmp = a.runId.localeCompare(b.runId);
      else if (key === "status") cmp = a.status.localeCompare(b.status);
      else if (key === "duration") cmp = a.duration - b.duration;
      else if (key === "env") cmp = a.env.localeCompare(b.env);
      return dir === "asc" ? cmp : -cmp;
    });
  }, [enriched, hStatus, hEnv, hErrOnly, hSort]);

  const uniqueEnvs = React.useMemo(
    () => [...new Set(enriched.map((r) => r.env))].sort(),
    [enriched],
  );

  const toggleSort = (key: SortKey) => {
    setHSort((prev) => {
      const clean = prev.startsWith("-") ? prev.slice(1) : prev;
      if (clean === key) return prev.startsWith("-") ? key : `-${key}`;
      return key;
    });
  };

  const sortIcon = (key: SortKey) => {
    const clean = hSort.startsWith("-") ? hSort.slice(1) : hSort;
    if (clean !== key) return <ArrowUpDown size={11} style={{ opacity: 0.3 }} />;
    return hSort.startsWith("-") ? <ArrowDown size={11} /> : <ArrowUp size={11} />;
  };

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (selRef.current && !selRef.current.contains(e.target as Node)) {
        setSelOpen(false);
        setSelSearch("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (diffs.length === 0) {
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

  // ── Derived stats ──
  const envLabels = getEnvLabels();
  const envStatus = (envLabels.length > 0 ? envLabels : ENVS).map((env) => {
    const target = env.split("/")[0].toLowerCase();
    const stage = env.split("/")[1]?.toLowerCase();
    const runs = detail.history.filter((h) => h.env === stage || h.env === target);
    const pass = runs.filter((r) => r.status === "PASS").length;
    const fail = runs.filter((r) => r.status === "FAIL").length;
    return { env, pass, fail, total: runs.length };
  });

  const historyChartData = detail.history
    .map((h, i) => {
      const enrichedRow = enriched[i];
      return {
        index: i,
        label: `#${detail.history.length - i}`,
        runId: h.runId,
        _realRunId: h.runId,
        status: h.status,
        pass: h.status === "PASS" ? 1 : 0,
        fail: h.status === "FAIL" ? 1 : 0,
        duration: h.duration,
        env: h.env,
        assertionsPassed: enrichedRow?.assertionsPassed ?? 0,
        assertionsFailed: enrichedRow?.assertionsFailed ?? 0,
      };
    })
    .reverse();

  const isFlaky = detail.flakinessScore > 20;
  const recent = detail.history.slice(-3);
  const trend =
    recent.length < 3
      ? "insufficient"
      : recent.every((h) => h.status === "FAIL")
        ? "degrading"
        : recent.every((h) => h.status === "PASS")
          ? "stable"
          : "flaky";

  const failCount = enriched.filter((r) => r.status === "FAIL").length;
  const errorCount = enriched.filter((r) => r.error).length;

  return (
    <div
      className="proof-page"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        padding: "24px 32px",
        maxWidth: "2000px",
        margin: "0 auto",
      }}
    >
      {/* Modern Navigation & Header */}
      <div style={{ paddingBottom: 16, borderBottom: "1px solid var(--proof-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Link href={isTcMode ? "/suites" : "/compare"} className="proof-button proof-button-sm">
            <ArrowLeft size={13} /> Back
          </Link>
          <ChevronRight size={14} style={{ color: "var(--proof-text-secondary)" }} />
          <span style={{ fontSize: 13, color: "var(--proof-text-secondary)", fontWeight: 500 }}>
            Analytics
          </span>
        </div>
        <div ref={selRef} style={{ position: "relative" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid var(--proof-grey)",
              borderRadius: 4,
              padding: "4px 10px",
              background: selOpen ? "var(--proof-surface)" : "transparent",
            }}
          >
            <Search size={13} style={{ color: "var(--proof-text-secondary)", flexShrink: 0 }} />
            <input
              className="proof-input"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: 12,
                background: "transparent",
                padding: 0,
                fontFamily: "var(--font-mono)",
              }}
              placeholder={isTcMode ? "Search tests by name or ID…" : "Search diffs by name or ID…"}
              value={selSearch}
              onChange={(e) => {
                setSelSearch(e.target.value);
                setSelOpen(true);
                setSelActiveIdx(0);
              }}
              onFocus={() => setSelOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setSelActiveIdx((i) => Math.min(i + 1, filteredSelector.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setSelActiveIdx((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter" && filteredSelector[selActiveIdx]) {
                  handleSelectNavigate(filteredSelector[selActiveIdx].id);
                } else if (e.key === "Escape") {
                  setSelOpen(false);
                  setSelSearch("");
                }
              }}
            />
            {selSearch && (
              <button
                onClick={() => {
                  setSelSearch("");
                  setSelActiveIdx(0);
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "var(--proof-text-secondary)",
                  padding: 0,
                  display: "flex",
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
          {selOpen && filteredSelector.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 100,
                background: "var(--proof-surface)",
                border: "1px solid var(--proof-grey)",
                borderRadius: 4,
                marginTop: 2,
                maxHeight: 280,
                overflow: "auto",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              {filteredSelector.map((item, i) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectNavigate(item.id)}
                  onMouseEnter={() => setSelActiveIdx(i)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 10px",
                    cursor: "pointer",
                    background: i === selActiveIdx ? "var(--proof-blue-bg)" : "transparent",
                    borderBottom:
                      i < filteredSelector.length - 1 ? "1px solid var(--proof-grey)" : undefined,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      flexShrink: 0,
                      color: "var(--proof-text-secondary)",
                      fontFamily: "var(--font-mono)",
                      minWidth: 48,
                    }}
                  >
                    {item.id}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {selectorLabel(item, selSearch)}
                  </span>
                  {item.id === selectedTestId && (
                    <span style={{ fontSize: 10, color: "var(--proof-blue)", marginLeft: "auto" }}>
                      current
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          {selOpen && filteredSelector.length === 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 100,
                background: "var(--proof-surface)",
                border: "1px solid var(--proof-grey)",
                borderRadius: 4,
                marginTop: 2,
                padding: "12px 16px",
                fontSize: 12,
                color: "var(--proof-text-secondary)",
                textAlign: "center",
              }}
            >
              No matches for <strong>"{selSearch}"</strong>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--proof-text)", maxWidth: 700 }}>
            {isTcMode && testCase ? testCase.name : diff.name}
            {isTcMode && testCase && (
              <span
                style={{
                  fontSize: 11,
                  color: "var(--proof-text-secondary)",
                  fontWeight: 400,
                  marginLeft: 8,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {testCase.id} · v{testCase.version}
              </span>
            )}
          </h1>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 4,
                fontWeight: 600,
                background:
                  (CATEGORY_COLORS[
                    CATEGORIES.indexOf(isTcMode && testCase ? testCase.category : diff.category) %
                      CATEGORY_COLORS.length
                  ] ?? "#9aa0a6") + "20",
                border:
                  "1px solid " +
                  (CATEGORY_COLORS[
                    CATEGORIES.indexOf(isTcMode && testCase ? testCase.category : diff.category) %
                      CATEGORY_COLORS.length
                  ] ?? "#9aa0a6") +
                  "40",
                color:
                  CATEGORY_COLORS[
                    CATEGORIES.indexOf(isTcMode && testCase ? testCase.category : diff.category) %
                      CATEGORY_COLORS.length
                  ] ?? "#9aa0a6",
              }}
            >
              {isTcMode && testCase ? testCase.category : diff.category}
            </span>
            {isTcMode && testCase && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color:
                    testCase.priority === "P0" ? "var(--proof-red)" : "var(--proof-text-secondary)",
                }}
              >
                {testCase.priority}
              </span>
            )}
            {!isTcMode && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: isFlaky ? "var(--proof-yellow)" : "var(--proof-green)",
                }}
              >
                {isFlaky ? "⚠ Flaky" : "✓ Stable"}
              </span>
            )}
            <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
              {detail.history.length} runs tracked
            </span>
            {failCount > 0 && (
              <span style={{ fontSize: 11, color: "var(--proof-red)", fontWeight: 600 }}>
                {failCount} failed
              </span>
            )}
            {errorCount > 0 && (
              <span style={{ fontSize: 11, color: "var(--proof-yellow)", fontWeight: 600 }}>
                {errorCount} with errors
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {isTcMode && testCase && (
            <button
              onClick={() => navigate(`/tests?q=${testCase.id}`)}
              className="proof-button proof-button-sm"
            >
              <FileText size={13} /> Definition
            </button>
          )}
          <button
            onClick={() => {
              navigator.clipboard
                .writeText(window.location.href)
                .then(() => show("Permalink copied"));
            }}
            className="proof-button proof-button-sm"
          >
            <Share2 size={13} /> Share
          </button>
        </div>
      </div>

      {/* Trend alert */}
      {trend === "degrading" && (
        <div
          style={{
            background: "var(--proof-red-bg)",
            border: "1px solid var(--proof-red)",
            borderRadius: 4,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 12,
          }}
        >
          <AlertTriangle size={14} style={{ color: "var(--proof-red)" }} />
          <strong>Degrading trend</strong> — last 3 runs all FAIL. Investigate before promoting
          changes.
          <button
            onClick={() => {
              navigator.clipboard
                .writeText(
                  `Test degrading: ${diff.name}\nLast 3 runs: FAIL\nPass Rate: ${detail.passRate}%`,
                )
                .then(() => show("Alert copied"));
            }}
            className="proof-button proof-button-xs"
            style={{ marginLeft: "auto" }}
          >
            Copy Alert
          </button>
        </div>
      )}

      {/* KPI tiles */}
      <div
        className="proof-stagger"
        style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}
      >
        <CTAStatCard
          label="Pass Rate"
          value={`${detail.passRate}%`}
          subtitle={`${detail.history.length} runs`}
          accentColor="var(--proof-blue)"
          icon={<BarChart3 size={16} />}
          onClick={() => setHStatus("all")}
        />
        <CTAStatCard
          label="Flakiness"
          value={`${detail.flakinessScore}%`}
          subtitle="status changes"
          accentColor={isFlaky ? "var(--proof-yellow)" : "var(--proof-green)"}
          icon={<Activity size={16} />}
        />
        <CTAStatCard
          label="Avg Duration"
          value={`${detail.avgDuration}ms`}
          subtitle="across all runs"
          accentColor="var(--proof-green)"
          icon={<Clock size={16} />}
        />
        <CTAStatCard
          label="Failures"
          value={failCount}
          subtitle={`${errorCount} with errors`}
          accentColor={failCount > 0 ? "var(--proof-red)" : "var(--proof-text-secondary)"}
          icon={<AlertTriangle size={16} />}
          onClick={failCount > 0 ? () => setHStatus("FAIL") : undefined}
          active={hStatus === "FAIL"}
        />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Pass/Fail + Duration combined */}
        <PanelErrorBoundary label="History chart">
          <div className="proof-card" style={{ padding: 16 }}>
            <h3
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--proof-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Activity size={13} /> Run History Timeline
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={historyChartData}
                margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                onClick={(e) => {
                  if (e?.activePayload?.[0]?.payload?._realRunId) {
                    navigate(`/runs/${encodeURIComponent(e.activePayload[0].payload._realRunId)}`);
                  }
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--proof-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={
                    {
                      fontSize: 9,
                      fill: "var(--proof-text-muted)",
                    } as React.SVGProps<SVGTextElement>
                  }
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={
                    {
                      fontSize: 9,
                      fill: "var(--proof-text-muted)",
                    } as React.SVGProps<SVGTextElement>
                  }
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 1.2]}
                  ticks={[0, 1]}
                  tickFormatter={(v: number) => (v === 1 ? "PASS" : "FAIL")}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--proof-surface)",
                    border: "1px solid var(--proof-border)",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  labelStyle={{ color: "var(--proof-text-muted)" }}
                  formatter={(_: unknown, name: string) => {
                    if (name === "duration") return null;
                    return [name === "pass" ? "PASS" : "FAIL", "Status"];
                  }}
                />
                <Bar
                  dataKey="pass"
                  stackId="a"
                  fill="#22c55e"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={20}
                />
                <Bar
                  dataKey="fail"
                  stackId="a"
                  fill="#ef4444"
                  radius={[2, 2, 0, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PanelErrorBoundary>

        {/* Duration trend */}
        <PanelErrorBoundary label="Duration chart">
          <div className="proof-card" style={{ padding: 16 }}>
            <h3
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--proof-text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Clock size={13} /> Duration Trend (ms)
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart
                data={historyChartData}
                margin={{ top: 4, right: 4, bottom: 0, left: -18 }}
                onClick={(e) => {
                  if (e?.activePayload?.[0]?.payload?._realRunId) {
                    navigate(`/runs/${encodeURIComponent(e.activePayload[0].payload._realRunId)}`);
                  }
                }}
              >
                <defs>
                  <linearGradient id="dur-trend-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--proof-blue)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="var(--proof-blue)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--proof-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={
                    {
                      fontSize: 9,
                      fill: "var(--proof-text-muted)",
                    } as React.SVGProps<SVGTextElement>
                  }
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={
                    {
                      fontSize: 9,
                      fill: "var(--proof-text-muted)",
                    } as React.SVGProps<SVGTextElement>
                  }
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--proof-surface)",
                    border: "1px solid var(--proof-border)",
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  labelStyle={{ color: "var(--proof-text-muted)" }}
                  formatter={(value: number) => [`${value}ms`, "Duration"]}
                />
                <Area
                  type="monotone"
                  dataKey="duration"
                  stroke="var(--proof-blue)"
                  strokeWidth={2}
                  fill="url(#dur-trend-fill)"
                  dot={(props: { cx: number; cy: number; payload: { status: string } }) => (
                    <circle
                      key={props.cx}
                      cx={props.cx}
                      cy={props.cy}
                      r={3}
                      fill={props.payload.status === "PASS" ? "#22c55e" : "#ef4444"}
                    />
                  )}
                  activeDot={{ r: 4, fill: "var(--proof-blue)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </PanelErrorBoundary>

        {/* Env breakdown */}
        <div className="proof-card" style={{ padding: 16 }}>
          <h3
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--proof-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <BarChart3 size={13} /> Pass/Fail by Environment
          </h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart
              data={envStatus}
              layout="vertical"
              margin={{ top: 4, right: 4, bottom: 0, left: 80 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--proof-border)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={
                  { fontSize: 9, fill: "var(--proof-text-muted)" } as React.SVGProps<SVGTextElement>
                }
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="env"
                tick={
                  { fontSize: 9, fill: "var(--proof-text-muted)" } as React.SVGProps<SVGTextElement>
                }
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--proof-surface)",
                  border: "1px solid var(--proof-border)",
                  borderRadius: 8,
                  fontSize: 11,
                }}
              />
              <Bar dataKey="pass" fill="#22c55e" radius={[0, 2, 2, 0]} />
              <Bar dataKey="fail" fill="#ef4444" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Assertions trend */}
        <div className="proof-card" style={{ padding: 16 }}>
          <h3
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--proof-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Bug size={13} /> Assertions Trend
          </h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart
              data={historyChartData}
              margin={{ top: 4, right: 4, bottom: 0, left: -18 }}
              onClick={(e) => {
                if (e?.activePayload?.[0]?.payload?._realRunId) {
                  navigate(`/runs/${encodeURIComponent(e.activePayload[0].payload._realRunId)}`);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--proof-border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={
                  { fontSize: 9, fill: "var(--proof-text-muted)" } as React.SVGProps<SVGTextElement>
                }
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={
                  { fontSize: 9, fill: "var(--proof-text-muted)" } as React.SVGProps<SVGTextElement>
                }
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--proof-surface)",
                  border: "1px solid var(--proof-border)",
                  borderRadius: 8,
                  fontSize: 11,
                }}
                labelStyle={{ color: "var(--proof-text-muted)" }}
              />
              <Bar
                dataKey="assertionsPassed"
                stackId="a"
                fill="#22c55e"
                radius={[2, 2, 0, 0]}
                maxBarSize={20}
                name="Passed"
              />
              <Bar
                dataKey="assertionsFailed"
                stackId="a"
                fill="#ef4444"
                radius={[2, 2, 0, 0]}
                maxBarSize={20}
                name="Failed"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Run history table with filters */}
      <div
        className="proof-card"
        style={{ overflow: "hidden", display: "flex", flexDirection: "row" }}
      >
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid var(--proof-grey)",
              background: "var(--proof-grey-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <h3
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--proof-text)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Filter size={13} /> Run History
              <span style={{ fontSize: 11, fontWeight: 400, color: "var(--proof-text-secondary)" }}>
                ({filteredHistory.length} of {enriched.length})
              </span>
            </h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              {/* Status filter */}
              <div
                style={{
                  display: "flex",
                  gap: 2,
                  background: "var(--proof-surface)",
                  borderRadius: 4,
                  border: "1px solid var(--proof-grey)",
                  overflow: "hidden",
                }}
              >
                {(["all", "PASS", "FAIL"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setHStatus(s)}
                    style={{
                      border: "none",
                      cursor: "pointer",
                      padding: "3px 10px",
                      fontSize: 11,
                      fontWeight: 500,
                      background: hStatus === s ? "var(--proof-blue)" : "transparent",
                      color: hStatus === s ? "white" : "var(--proof-text-secondary)",
                    }}
                  >
                    {s === "all" ? "All" : s}
                  </button>
                ))}
              </div>
              {/* Env filter */}
              <select
                className="proof-input"
                value={hEnv}
                onChange={(e) => setHEnv(e.target.value)}
                style={{ fontSize: 11, padding: "3px 6px", maxWidth: 120 }}
              >
                <option value="all">All envs</option>
                {uniqueEnvs.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
              {/* Errors only toggle */}
              <button
                onClick={() => setHErrOnly((prev) => !prev)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 500,
                  border: hErrOnly
                    ? "1px solid var(--proof-yellow)"
                    : "1px solid var(--proof-grey)",
                  background: hErrOnly ? "var(--proof-yellow-bg)" : "var(--proof-surface)",
                  color: hErrOnly ? "var(--proof-yellow)" : "var(--proof-text-secondary)",
                }}
              >
                <Bug size={11} /> Errors only
              </button>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="proof-table">
              <thead>
                <tr>
                  <th
                    onClick={() => toggleSort("runId")}
                    style={{ cursor: "pointer", userSelect: "none" }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                      Run ID {sortIcon("runId")}
                    </span>
                  </th>
                  <th
                    onClick={() => toggleSort("status")}
                    style={{ cursor: "pointer", userSelect: "none" }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                      Status {sortIcon("status")}
                    </span>
                  </th>
                  <th
                    onClick={() => toggleSort("duration")}
                    style={{ textAlign: "right", cursor: "pointer", userSelect: "none" }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        justifyContent: "flex-end",
                      }}
                    >
                      Duration {sortIcon("duration")}
                    </span>
                  </th>
                  <th
                    onClick={() => toggleSort("env")}
                    style={{ cursor: "pointer", userSelect: "none" }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                      Environment {sortIcon("env")}
                    </span>
                  </th>
                  <th>Error</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((h) => (
                  <tr
                    key={h.runId}
                    onClick={() => setSelectedRow(h)}
                    style={{
                      cursor: "pointer",
                      background:
                        selectedRow?.runId === h.runId ? "var(--proof-blue-bg)" : undefined,
                    }}
                  >
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRow(h);
                        }}
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          color: "var(--proof-blue)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        {h.runId}
                      </button>
                    </td>
                    <td>
                      <span
                        className={`proof-badge ${h.status === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`}
                      >
                        {h.status}
                      </span>
                      {h.assertionsFailed > 0 && (
                        <span
                          style={{
                            fontSize: 10,
                            marginLeft: 4,
                            color: "var(--proof-red)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {h.assertionsFailed}✗
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--proof-text-secondary)",
                      }}
                    >
                      {h.duration}ms
                    </td>
                    <td style={{ fontSize: 12 }}>{h.env}</td>
                    <td
                      style={{
                        fontSize: 11,
                      }}
                    >
                      {h.error ? (
                        <span
                          style={{
                            color: "var(--proof-red)",
                            fontFamily: "var(--font-mono)",
                            fontSize: 10,
                          }}
                        >
                          {h.error.length > 80 ? h.error.slice(0, 80) + "…" : h.error}
                        </span>
                      ) : h.status === "FAIL" ? (
                        <span style={{ color: "var(--proof-text-secondary)", fontSize: 10 }}>
                          no error message
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRow(h);
                        }}
                        className="proof-button proof-button-xs"
                        style={{ padding: "2px 7px" }}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredHistory.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: 24,
                        fontSize: 12,
                        color: "var(--proof-text-secondary)",
                      }}
                    >
                      No matching results for the selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* end left column */}

        {/* Test detail side panel — full test output */}
        {selectedRow &&
          (() => {
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
              <div
                style={{
                  width: 380,
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  borderLeft: "2px solid var(--proof-blue)",
                  background: "var(--proof-surface)",
                }}
              >
                {/* Panel header */}
                <div
                  style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--proof-grey)",
                    background: "var(--proof-blue-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--proof-blue)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <FileText size={13} /> Test Output
                  </span>
                  <button
                    onClick={() => setSelectedRow(null)}
                    aria-label="Close"
                    style={{
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      color: "var(--proof-text-secondary)",
                      fontSize: 18,
                      lineHeight: 1,
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Panel body */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                  }}
                >
                  {/* Test name */}
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--proof-text)",
                      lineHeight: 1.4,
                    }}
                  >
                    {testName}
                  </div>

                  {/* Metadata strip */}
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
                          : "—",
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

                  {/* Status + assertion summary */}
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
                        <span style={{ color: "var(--proof-green)" }}>{passed}✓</span>
                        {" / "}
                        <span
                          style={{
                            color: failed > 0 ? "var(--proof-red)" : "var(--proof-text-secondary)",
                          }}
                        >
                          {failed}✗
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

                  {/* Assertions list */}
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
                              {a.passed ? "✓" : "✗"} {a.assertion}
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
                                  <span style={{ color: "var(--proof-green)" }}>{a.expected}</span>
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

                  {/* Error output */}
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

                  {/* HTTP evidence */}
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
                          <span
                            style={{
                              fontWeight: 600,
                              color:
                                evidence.response.status < 300
                                  ? "var(--proof-green)"
                                  : evidence.response.status < 400
                                    ? "var(--proof-yellow)"
                                    : "var(--proof-red)",
                            }}
                          >
                            HTTP {evidence.response.status}
                          </span>
                          {evidence.response.headers["content-type"] && (
                            <span style={{ color: "var(--proof-text-secondary)", marginLeft: 8 }}>
                              {evidence.response.headers["content-type"].split(";")[0]}
                            </span>
                          )}
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
                                ? evidence.response.body.slice(0, 400) + "\n…"
                                : evidence.response.body}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Panel footer */}
                <div
                  style={{
                    padding: "10px 14px",
                    borderTop: "1px solid var(--proof-grey)",
                    flexShrink: 0,
                    display: "flex",
                    gap: 6,
                  }}
                >
                  <button
                    onClick={() => navigate(`/runs/${selectedRow.runId}`)}
                    className="proof-button-primary"
                    style={{ flex: 1, fontSize: 12, justifyContent: "center" }}
                  >
                    View Full Run →
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRow(null);
                    }}
                    className="proof-button"
                    style={{ fontSize: 12 }}
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          })()}
      </div>
      {Toast}
    </div>
  );
}
