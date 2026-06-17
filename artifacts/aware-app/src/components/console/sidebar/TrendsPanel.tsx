import React, { useSyncExternalStore } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useSyncedUrlState } from "@/lib/urlState";
import { DIFF_ROWS, RUNS, getTestResultsForRun, getTestDetailsAsync, computeRunFrequency, subscribeToRuns, getRuns } from "@/lib/data";
import { getTestDetailStat, subscribeToSidebarData } from "@/lib/sidebarData";
import { useTestData } from "@/hooks/useTestData";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/constants";
import { detectAnomalies } from "@/lib/anomalyDetection";
import { getTestDetailsSync } from "@/lib/runsLoader";
import { ArrowLeft, ChevronRight, Search, FileText, Share2, AlertTriangle, X } from "lucide-react";

function selectorLabel(item: { id: string; name: string }, query: string): React.ReactNode {
  if (!query.trim()) return item.name;
  const lower = query.toLowerCase();
  const idx = item.name.toLowerCase().indexOf(lower);
  if (idx === -1) return item.name;
  return (
    <>
      {item.name.slice(0, idx)}
      <strong style={{ background: "var(--proof-blue-bg)", color: "var(--proof-blue)" }}>{item.name.slice(idx, idx + query.length)}</strong>
      {item.name.slice(idx + query.length)}
    </>
  );
}

function TestSelector() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [, navigate] = useLocation();
  const { tcs } = useTestData();
  const [testDetails, setTestDetails] = React.useState<{ history: { runId: string; status: "PASS" | "FAIL"; duration: number; env: string }[]; passRate: number; flakinessScore: number; avgDuration: number }[]>([]);
  React.useEffect(() => { getTestDetailsAsync().then(setTestDetails); }, []);

  const rawTestId = params.get("testId") ?? "";
  const isTcMode = rawTestId !== "" && tcs.some((t) => t.id === rawTestId);
  const diff = DIFF_ROWS[Math.min(Math.max(0, DIFF_ROWS.findIndex((d) => d.id === (params.get("diffId") ?? "diff_0"))), DIFF_ROWS.length - 1)] ?? DIFF_ROWS[0];

  const selectorItems = isTcMode ? tcs.map((t) => ({ id: t.id, name: t.name })) : DIFF_ROWS.map((d) => ({ id: d.id, name: d.name }));

  const [selSearch, setSelSearch] = React.useState("");
  const [selOpen, setSelOpen] = React.useState(false);
  const [selActiveIdx, setSelActiveIdx] = React.useState(0);
  const selRef = React.useRef<HTMLDivElement>(null);

  const filteredSelector = selSearch.trim()
    ? selectorItems.filter((s) => s.id.toLowerCase().includes(selSearch.toLowerCase()) || s.name.toLowerCase().includes(selSearch.toLowerCase()))
    : selectorItems;

  const handleSelectNavigate = (id: string) => {
    const key = isTcMode ? "testId" : "diffId";
    navigate(`/trends?${key}=${encodeURIComponent(id)}`, { replace: true });
    setSelOpen(false);
    setSelSearch("");
  };

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (selRef.current && !selRef.current.contains(e.target as Node)) { setSelOpen(false); setSelSearch(""); } };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--proof-border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <Link href={isTcMode ? "/suites" : "/compare"} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, color: "var(--proof-text-secondary)", textDecoration: "none", padding: "2px 6px", borderRadius: 3, border: "1px solid var(--proof-border)" }}>
          <ArrowLeft size={10} /> Back
        </Link>
        <ChevronRight size={11} style={{ color: "var(--proof-text-secondary)" }} />
        <span style={{ fontSize: 10, color: "var(--proof-text-secondary)", fontWeight: 500 }}>Analytics</span>
      </div>
      <div ref={selRef} style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, border: "1px solid var(--proof-grey)", borderRadius: 4, padding: "3px 6px", background: selOpen ? "var(--proof-surface)" : "transparent" }}>
          <Search size={11} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
          <input value={selSearch} onChange={(e) => { setSelSearch(e.target.value); setSelOpen(true); setSelActiveIdx(0); }} onFocus={() => setSelOpen(true)} onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setSelActiveIdx((i) => Math.min(i + 1, filteredSelector.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setSelActiveIdx((i) => Math.max(i - 1, 0)); }
            else if (e.key === "Enter" && filteredSelector[selActiveIdx]) handleSelectNavigate(filteredSelector[selActiveIdx].id);
            else if (e.key === "Escape") { setSelOpen(false); setSelSearch(""); }
          }} placeholder={isTcMode ? "Search tests..." : "Search diffs..."} style={{ border: "none", outline: "none", fontSize: 10, background: "transparent", flex: 1, minWidth: 0, color: "var(--proof-text)", padding: 0 }} />
          {selSearch && <button onClick={() => { setSelSearch(""); setSelActiveIdx(0); }} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--proof-text-secondary)", padding: 0, display: "flex" }}><X size={10} /></button>}
        </div>
        {selOpen && filteredSelector.length > 0 && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100, background: "var(--proof-surface)", border: "1px solid var(--proof-grey)", borderRadius: 4, marginTop: 2, maxHeight: 220, overflow: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
            {filteredSelector.map((item, i) => (
              <div key={item.id} onClick={() => handleSelectNavigate(item.id)} onMouseEnter={() => setSelActiveIdx(i)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", cursor: "pointer", background: i === selActiveIdx ? "var(--proof-blue-bg)" : "transparent", borderBottom: i < filteredSelector.length - 1 ? "1px solid var(--proof-grey)" : undefined }}>
                <span style={{ fontSize: 9, fontWeight: 600, flexShrink: 0, color: "var(--proof-text-secondary)", fontFamily: "var(--font-mono)", minWidth: 36 }}>{item.id}</span>
                <span style={{ fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectorLabel(item, selSearch)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TestHeader() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [, navigate] = useLocation();
  const { tcs } = useTestData();
  const { show } = { show: () => {} };

  const rawTestId = params.get("testId") ?? "";
  const isTcMode = rawTestId !== "" && tcs.some((t) => t.id === rawTestId);
  const testCase = isTcMode ? (tcs.find((t) => t.id === rawTestId) ?? null) : null;
  const rawDiffId = params.get("diffId") ?? "diff_0";
  const idx = Math.max(0, DIFF_ROWS.findIndex((d) => d.id === (isTcMode ? rawTestId : rawDiffId)));
  const diff = DIFF_ROWS[Math.min(idx, DIFF_ROWS.length - 1)] ?? DIFF_ROWS[0];
  const isFlakyDetail = DIFF_ROWS.some((d) => d.state === "regression");

  const testName = isTcMode && testCase ? testCase.name : diff?.name ?? "Unknown";

  if (!DIFF_ROWS.length) return null;

  const category = isTcMode && testCase ? testCase.category : diff.category;
  const catIdx = CATEGORIES.indexOf(category) % CATEGORY_COLORS.length;
  const catColor = CATEGORY_COLORS[catIdx] ?? "#9aa0a6";

  return (
    <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--proof-border)" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--proof-text)", lineHeight: 1.3, wordBreak: "break-word", marginBottom: 4 }}>{testName}</div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 4 }}>
        <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, fontWeight: 600, background: catColor + "20", border: `1px solid ${catColor}40`, color: catColor }}>{category}</span>
        {isTcMode && testCase && <span style={{ fontSize: 9, fontWeight: 600, color: testCase.priority === "P0" ? "var(--proof-red)" : "var(--proof-text-secondary)" }}>{testCase.priority}</span>}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {isTcMode && testCase && (
          <button onClick={() => navigate(`/tests?q=${testCase.id}`)} style={{ display: "flex", alignItems: "center", gap: 2, padding: "2px 6px", borderRadius: 3, border: "1px solid var(--proof-border)", background: "var(--proof-surface)", cursor: "pointer", color: "var(--proof-text-secondary)", fontSize: 8 }}>
            <FileText size={9} /> Def
          </button>
        )}
        <button onClick={() => { navigator.clipboard.writeText(window.location.href); }} style={{ display: "flex", alignItems: "center", gap: 2, padding: "2px 6px", borderRadius: 3, border: "1px solid var(--proof-border)", background: "var(--proof-surface)", cursor: "pointer", color: "var(--proof-text-secondary)", fontSize: 8 }}>
          <Share2 size={9} /> Share
        </button>
      </div>
    </div>
  );
}

function TrendAlert() {
  const { tcs } = useTestData();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const rawTestId = params.get("testId") ?? "";
  const isTcMode = rawTestId !== "" && tcs.some((t) => t.id === rawTestId);
  const rawDiffId = params.get("diffId") ?? "diff_0";
  const idx = Math.max(0, DIFF_ROWS.findIndex((d) => d.id === (isTcMode ? rawTestId : rawDiffId)));
  const detail = { history: [] as { runId: string; status: "PASS" | "FAIL"; duration: number; env: string }[], passRate: 0, flakinessScore: 0, avgDuration: 0 };

  const recent = detail.history.slice(-3);
  const trend = recent.length < 3 ? "insufficient" : recent.every((h) => h.status === "FAIL") ? "degrading" : "stable";

  if (trend !== "degrading") return null;

  return (
    <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--proof-border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 8px", borderRadius: 4, background: "var(--proof-red-bg)", border: "1px solid var(--proof-red)", fontSize: 10, color: "var(--proof-red)" }}>
        <AlertTriangle size={11} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>Degrading trend</span>
      </div>
    </div>
  );
}

function TrendsOverviewStats() {
  const [, navigate] = useLocation();
  const runs = useSyncExternalStore(subscribeToRuns, getRuns);

  const freq = React.useMemo(() => computeRunFrequency(), [runs.length]);
  const avgPassRate = React.useMemo(() => {
    if (runs.length === 0) return 0;
    return Math.round(runs.reduce((s, r) => s + r.passPct, 0) / runs.length);
  }, [runs]);
  const flakyCount = React.useMemo(() => {
    try { return getTestDetailsSync().filter((d) => d.flakinessScore > 20).length; }
    catch { return 0; }
  }, [runs.length]);
  const anomalyCount = React.useMemo(() => {
    try { return detectAnomalies().filter((a) => a.severity !== "low").length; }
    catch { return 0; }
  }, [runs.length]);

  const items = [
    { label: "Total Runs", value: freq.totalRuns.toLocaleString(), color: "var(--proof-blue)", onClick: () => navigate("/runs") },
    { label: "Avg Pass Rate", value: `${avgPassRate}%`, color: avgPassRate >= 85 ? "var(--proof-green)" : "var(--proof-yellow)", onClick: () => navigate("/runs") },
    { label: "Days", value: `${freq.daysCovered}d`, color: "var(--proof-text-secondary)", onClick: () => navigate("/trends") },
    { label: "Flaky Tests", value: flakyCount.toString(), color: flakyCount > 0 ? "var(--proof-yellow)" : "var(--proof-text-muted)", onClick: flakyCount > 0 ? () => navigate("/trends") : undefined },
    { label: "Anomalies", value: anomalyCount.toString(), color: anomalyCount > 0 ? "var(--proof-red)" : "var(--proof-green)", onClick: anomalyCount > 0 ? () => navigate("/trends") : undefined },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: "8px 10px", borderBottom: "1px solid var(--proof-border)" }}>
      {items.map((item) => (
        <div key={item.label} onClick={item.onClick}
          style={{ padding: "5px 7px", borderRadius: 3, background: "var(--proof-hover-light)", display: "flex", flexDirection: "column", gap: 1, cursor: item.onClick ? "pointer" : "default", transition: "background 0.1s" }}
          onMouseEnter={(e) => { if (item.onClick) (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--proof-hover-light)"; }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", color: item.color, lineHeight: 1.2 }}>{item.value}</span>
          <span style={{ fontSize: 8, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>{item.label}</span>
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
      <div style={{ padding: "12px 10px", fontSize: 11, color: "var(--proof-text-secondary)", textAlign: "center", lineHeight: 1.5 }}>
        Select a test to view pass rate history, assertion trends, and flakiness.
      </div>
    );
  }

  const items = [
    { label: "Pass Rate", value: `${detail.passRate}%`, color: "var(--proof-blue)", onClick: () => navigate(`/trends?${params.get("testId") ? "testId" : "diffId"}=${testId}`) },
    { label: "Flakiness", value: `${detail.flakinessScore}%`, color: detail.flakinessScore > 20 ? "var(--proof-yellow)" : "var(--proof-green)", onClick: () => navigate(`/trends?${params.get("testId") ? "testId" : "diffId"}=${testId}`) },
    { label: "Avg Duration", value: `${detail.avgDuration}ms`, color: "var(--proof-green)", onClick: () => navigate(`/trends?${params.get("testId") ? "testId" : "diffId"}=${testId}`) },
    { label: "Failures", value: detail.failCount.toString(), color: detail.failCount > 0 ? "var(--proof-red)" : "var(--proof-text-muted)", onClick: detail.failCount > 0 ? () => navigate(`/trends?${params.get("testId") ? "testId" : "diffId"}=${testId}&hStatus=FAIL`) : undefined, active: hStatus === "FAIL" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: "8px 10px", borderBottom: "1px solid var(--proof-border)" }}>
      {items.map((item) => (
        <div key={item.label} onClick={item.onClick} style={{ padding: "5px 7px", borderRadius: 3, background: item.active ? "var(--proof-hover)" : "var(--proof-hover-light)", display: "flex", flexDirection: "column", gap: 1, cursor: item.onClick ? "pointer" : "default", transition: "background 0.1s", border: item.active ? `1px solid ${item.color}40` : "1px solid transparent" }}
          onMouseEnter={(e) => { if (item.onClick) (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = item.active ? "var(--proof-hover)" : "var(--proof-hover-light)"; }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-mono)", color: item.color, lineHeight: 1.2 }}>{item.value}</span>
          <span style={{ fontSize: 8, color: "var(--proof-text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function TrendsPanel() {
  return (
    <>
      <TrendsOverviewStats />
      <TestDetailSummary />
      <TestSelector />
      <TestHeader />
      <TrendAlert />
    </>
  );
}
