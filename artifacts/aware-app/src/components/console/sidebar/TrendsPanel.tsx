import React, { useSyncExternalStore } from "react";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  DIFF_ROWS,
  computeRunFrequency,
  subscribeToRuns,
  getRuns} from "@/lib/data";
import { getTestDetailStat, subscribeToSidebarData } from "@/lib/sidebarData";
import { useTestData } from "@/hooks/useTestData";

import { detectAnomalies } from "@/lib/anomalyDetection";
import { getTestDetailsSync } from "@/lib/runsLoader";
import {
  ArrowLeft,
  Search,
  X,
  TrendingUp,
  Grid3x3} from "lucide-react";

function selectorLabel(item: { id: string; name: string }, query: string): React.ReactNode {
  if (!query.trim()) return item.name;
  const lower = query.toLowerCase();
  const idx = item.name.toLowerCase().indexOf(lower);
  if (idx === -1) return item.name;
  return (
    <>
      {item.name.slice(0, idx)}
      <strong style={{ background: "var(--proof-blue-bg)", color: "var(--proof-blue-bright)" }}>
        {item.name.slice(idx, idx + query.length)}
      </strong>
      {item.name.slice(idx + query.length)}
    </>
  );
}

function TestSelector() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [, navigate] = useLocation();
  const { tcs } = useTestData();
  
  const rawTestId = params.get("testId") ?? "";
  const isTcMode = rawTestId !== "" && tcs.some((t) => t.id === rawTestId);

  const selectorItems = isTcMode
    ? tcs.map((t) => ({ id: t.id, name: t.name }))
    : DIFF_ROWS.map((d) => ({ id: d.id, name: d.name }));

  const [selSearch, setSelSearch] = React.useState("");
  const [selOpen, setSelOpen] = React.useState(false);
  const [selActiveIdx, setSelActiveIdx] = React.useState(0);
  const selRef = React.useRef<HTMLDivElement>(null);

  const filteredSelector = selSearch.trim()
    ? selectorItems.filter(
        (s) =>
          s.id.toLowerCase().includes(selSearch.toLowerCase()) ||
          s.name.toLowerCase().includes(selSearch.toLowerCase()),
      )
    : selectorItems;

  const handleSelectNavigate = (id: string) => {
    const key = isTcMode ? "testId" : "diffId";
    navigate(`/trends?${key}=${encodeURIComponent(id)}`, { replace: true });
    setSelOpen(false);
    setSelSearch("");
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

  return (
    <div style={{ padding: "12px", borderBottom: "1px solid var(--proof-border)", background: "var(--proof-surface-subtle)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <button
          onClick={() => navigate(isTcMode ? "/suites" : "/compare")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10,
            fontWeight: 600,
            color: "var(--proof-text-secondary)",
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid var(--proof-border)",
            background: "var(--proof-surface)",
            cursor: "pointer"}}
        >
          <ArrowLeft size={12} /> Back
        </button>
        <div style={{ fontSize: 10, color: "var(--proof-text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Analysis Explorer
        </div>
      </div>
      <div ref={selRef} style={{ position: "relative" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "1px solid var(--proof-border)",
            borderRadius: 8,
            padding: "6px 10px",
            background: selOpen ? "var(--proof-surface-active)" : "var(--proof-surface)",
            transition: "all 0.2s ease",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)"}}
        >
          <Search size={14} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
          <input
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
              } else if (e.key === "Enter" && filteredSelector[selActiveIdx])
                handleSelectNavigate(filteredSelector[selActiveIdx].id);
              else if (e.key === "Escape") {
                setSelOpen(false);
                setSelSearch("");
              }
            }}
            placeholder={isTcMode ? "Search tests..." : "Search results..."}
            style={{
              border: "none",
              fontSize: 12,
              background: "transparent",
              flex: 1,
              minWidth: 0,
              color: "var(--proof-text)",
              padding: 0}}
          />
          {selSearch && (
            <X size={12} onClick={() => setSelSearch("")} style={{ color: "var(--proof-text-muted)", cursor: "pointer" }} />
          )}
        </div>
        
        <AnimatePresence>
          {selOpen && filteredSelector.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                zIndex: 100,
                background: "var(--proof-surface-active)",
                border: "1px solid var(--proof-border-strong)",
                borderRadius: 8,
                marginTop: 6,
                maxHeight: 260,
                overflow: "auto",
                boxShadow: "0 12px 32px rgba(0,0,0,0.25)"}}
            >
              {filteredSelector.map((item, i) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectNavigate(item.id)}
                  onMouseEnter={() => setSelActiveIdx(i)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    cursor: "pointer",
                    background: i === selActiveIdx ? "var(--proof-blue-bg)" : "transparent",
                    borderBottom: "1px solid var(--proof-border-subtle)"}}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      flexShrink: 0,
                      color: i === selActiveIdx ? "var(--proof-blue-bright)" : "var(--proof-text-muted)",
                      fontFamily: "var(--font-mono)",
                      minWidth: 44}}
                  >
                    {item.id}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: i === selActiveIdx ? "var(--proof-text)" : "var(--proof-text-secondary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"}}
                  >
                    {selectorLabel(item, selSearch)}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TrendsOverviewStats() {
  const [, navigate] = useLocation();
  const runs = useSyncExternalStore(subscribeToRuns, getRuns);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const freq = React.useMemo(() => computeRunFrequency(), [runs]);
  const avgPassRate = React.useMemo(() => {
    if (runs.length === 0) return 0;
    return Math.round(runs.reduce((s, r) => s + r.passPct, 0) / runs.length);
  }, [runs]);
  const flakyCount = React.useMemo(() => {
    try {
      return getTestDetailsSync("").filter((d) => Number((d as unknown as Record<string, unknown>).flakinessScore ?? 0) > 20).length;
    } catch {
      return 0;
    }
  }, []);
  const anomalyCount = React.useMemo(() => {
    try {
      return detectAnomalies().filter((a) => a.severity !== "low").length;
    } catch {
      return 0;
    }
  }, []);

  const items = [
    {
      label: "Total Runs",
      value: freq.totalRuns.toLocaleString(),
      color: "var(--proof-blue)",
      onClick: () => navigate("/runs")},
    {
      label: "Avg Pass Rate",
      value: `${avgPassRate}%`,
      color: avgPassRate >= 85 ? "var(--proof-green)" : "var(--proof-yellow)",
      onClick: () => navigate("/runs")},
    {
      label: "Days",
      value: `${freq.daysCovered}d`,
      color: "var(--proof-text-secondary)",
      onClick: () => navigate("/trends")},
    {
      label: "Flaky Tests",
      value: flakyCount.toString(),
      color: flakyCount > 0 ? "var(--proof-yellow)" : "var(--proof-text-muted)",
      onClick: flakyCount > 0 ? () => navigate("/trends") : undefined},
    {
      label: "Anomalies",
      value: anomalyCount.toString(),
      color: anomalyCount > 0 ? "var(--proof-red)" : "var(--proof-green)",
      onClick: anomalyCount > 0 ? () => navigate("/trends") : undefined},
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 4,
        padding: "8px 10px",
        borderBottom: "1px solid var(--proof-border)"}}
    >
      {items.map((item) => (
        <div
          key={item.label}
          onClick={item.onClick}
          style={{
            padding: "5px 7px",
            borderRadius: 3,
            background: "var(--proof-hover-light)",
            display: "flex",
            flexDirection: "column",
            gap: 1,
            cursor: item.onClick ? "pointer" : "default",
            transition: "background 0.1s"}}
          onMouseEnter={(e) => {
            if (item.onClick)
              (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--proof-hover-light)";
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: item.color,
              lineHeight: 1.2}}
          >
            {item.value}
          </span>
          <span
            style={{
              fontSize: 8,
              color: "var(--proof-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.4px"}}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function TestDetailSummary() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [, navigate] = useLocation();
  const testId = params.get("testId") || params.get("diffId");
  const { detail, hStatus } = useSyncExternalStore(subscribeToSidebarData, getTestDetailStat);

  if (!testId || !detail) {
    return (
      <div
        style={{
          padding: "12px 10px",
          fontSize: 11,
          color: "var(--proof-text-secondary)",
          textAlign: "center",
          lineHeight: 1.5}}
      >
        Select a test to view pass rate history, assertion trends, and flakiness.
      </div>
    );
  }

  const items = [
    {
      label: "Pass Rate",
      value: `${detail.passRate}%`,
      color: "var(--proof-blue)",
      onClick: () => navigate(`/trends?${params.get("testId") ? "testId" : "diffId"}=${testId}`)},
    {
      label: "Flakiness",
      value: `${detail.flakinessScore}%`,
      color: detail.flakinessScore > 20 ? "var(--proof-yellow)" : "var(--proof-green)",
      onClick: () => navigate(`/trends?${params.get("testId") ? "testId" : "diffId"}=${testId}`)},
    {
      label: "Avg Duration",
      value: `${detail.avgDuration}ms`,
      color: "var(--proof-green)",
      onClick: () => navigate(`/trends?${params.get("testId") ? "testId" : "diffId"}=${testId}`)},
    {
      label: "Failures",
      value: detail.failCount.toString(),
      color: detail.failCount > 0 ? "var(--proof-red)" : "var(--proof-text-muted)",
      onClick:
        detail.failCount > 0
          ? () =>
              navigate(
                `/trends?${params.get("testId") ? "testId" : "diffId"}=${testId}&hStatus=FAIL`,
              )
          : undefined,
      active: hStatus === "FAIL"},
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 4,
        padding: "8px 10px",
        borderBottom: "1px solid var(--proof-border)"}}
    >
      {items.map((item) => (
        <div
          key={item.label}
          onClick={item.onClick}
          style={{
            padding: "5px 7px",
            borderRadius: 3,
            background: item.active ? "var(--proof-hover)" : "var(--proof-hover-light)",
            display: "flex",
            flexDirection: "column",
            gap: 1,
            cursor: item.onClick ? "pointer" : "default",
            transition: "background 0.1s",
            border: item.active ? `1px solid ${item.color}40` : "1px solid transparent"}}
          onMouseEnter={(e) => {
            if (item.onClick)
              (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = item.active
              ? "var(--proof-hover)"
              : "var(--proof-hover-light)";
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: item.color,
              lineHeight: 1.2}}
          >
            {item.value}
          </span>
          <span
            style={{
              fontSize: 8,
              color: "var(--proof-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.4px"}}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function CompactTrendChart() {
  const { detail } = useSyncExternalStore(subscribeToSidebarData, getTestDetailStat);

  if (!detail) return null;

  const flakinessColor =
    detail.flakinessScore > 30
      ? "var(--proof-red)"
      : detail.flakinessScore > 15
        ? "var(--proof-yellow)"
        : "var(--proof-green)";

  const items = [
    {
      label: "Pass Rate",
      value: `${detail.passRate}%`,
      dotColor: detail.passRate >= 80 ? "var(--proof-green)" : "var(--proof-red)"},
    {
      label: "Flakiness",
      value: `${detail.flakinessScore}%`,
      dotColor: flakinessColor},
    {
      label: "Avg Duration",
      value: `${detail.avgDuration}ms`,
      dotColor: "var(--proof-blue)"},
  ];

  return (
    <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--proof-border)" }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color: "var(--proof-text-secondary)",
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
          gap: 4}}
      >
        <TrendingUp size={11} /> Trend
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 6px",
              borderRadius: 3,
              background: "var(--proof-hover-light)"}}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: item.dotColor,
                flexShrink: 0}}
            />
            <span
              style={{
                fontSize: 9,
                color: "var(--proof-text-secondary)",
                flex: 1}}
            >
              {item.label}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                color: item.dotColor}}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompactCategoryHeatmap() {
  const runs = useSyncExternalStore(subscribeToRuns, getRuns);

  const envStats = React.useMemo(() => {
    const map = new Map<string, { passPctSum: number; totalCount: number }>();
    for (const run of runs) {
      const env = run.env;
      if (!map.has(env)) map.set(env, { passPctSum: 0, totalCount: 0 });
      const s = map.get(env)!;
      s.totalCount++;
      s.passPctSum += run.passPct;
    }
    return Array.from(map.entries())
      .map(([env, s]) => ({
        env,
        avgPassRate: Math.round(s.passPctSum / s.totalCount)}))
      .sort((a, b) => b.avgPassRate - a.avgPassRate);
  }, [runs]);

  if (envStats.length === 0) return null;

  return (
    <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--proof-border)" }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color: "var(--proof-text-secondary)",
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
          gap: 4}}
      >
        <Grid3x3 size={11} /> Environments
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {envStats.map(({ env, avgPassRate }) => {
          const barColor =
            avgPassRate >= 90
              ? "var(--proof-green)"
              : avgPassRate >= 70
                ? "var(--proof-yellow)"
                : "var(--proof-red)";
          return (
            <div
              key={env}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 6px",
                borderRadius: 3,
                background: "var(--proof-hover-light)"}}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: "var(--proof-text-secondary)",
                  width: 32,
                  flexShrink: 0}}
              >
                {env}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background: "var(--proof-grey)",
                  overflow: "hidden"}}
              >
                <div
                  style={{
                    width: `${avgPassRate}%`,
                    height: "100%",
                    borderRadius: 2,
                    background: barColor,
                    transition: "width 0.3s"}}
                />
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: barColor,
                  width: 32,
                  textAlign: "right"}}
              >
                {avgPassRate}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TrendsPanel() {
  return (
    <>
      <TrendsOverviewStats />
      <TestDetailSummary />
      <CompactTrendChart />
      <CompactCategoryHeatmap />
      <TestSelector />
    </>
  );
}
