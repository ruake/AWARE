import React, { useSyncExternalStore } from "react";
import { useLocation } from "wouter";
import { getAutoDiscoveredTests, computeTestStats, getAutoDiscoverySummary } from "@/lib/data";
import { useTestData } from "@/hooks/useTestData";
import {
  subscribeToTestSuites,
  getTestSuites,
  subscribeToTestCases,
  getTestCases,
} from "@/lib/data";
import { FolderTree, Beaker, Search, Download, X } from "lucide-react";
import type { TestSuite } from "@/lib/types";
import { exportAndDownload, exportAsXML, downloadFile } from "@/lib/testImportExport";

const TEST_TYPES = ["All", "web", "api", "http", "edgeworker", "transaction", "pytest"] as const;
const TEST_CATEGORIES = [
  "All",
  "geo-match",
  "caching",
  "security",
  "performance",
  "functional",
  "general",
  "network",
  "screenshots",
  "url-health",
  "edge-routing",
  "http-protocol",
] as const;
const STATUSES = ["All", "active", "disabled", "deprecated"] as const;
const PRIORITIES = ["All", "P0", "P1", "P2", "P3"] as const;

function TestKpis() {
  const [, navigate] = useLocation();
  const { tcs, suites } = useTestData();
  const stats = React.useMemo(() => computeTestStats(), []);

  const kpis = [
    {
      label: "Total Suites",
      value: suites.length,
      color: "var(--proof-blue)",
      onClick: () => navigate("/suites"),
    },
    {
      label: "Total Tests",
      value: tcs.length,
      color: "var(--proof-blue)",
      onClick: () => navigate("/tests"),
    },
    {
      label: "Active Tests",
      value: tcs.filter((t) => t.status === "active").length,
      color: "var(--proof-green)",
      onClick: () => navigate("/tests?status=active"),
    },
    {
      label: "Scheduled",
      value: suites.filter((s) => s.schedule).length,
      color: "var(--proof-orange)",
      onClick: () => navigate("/suites"),
    },
    {
      label: "Coverage",
      value: `${stats.coverage}%`,
      color: "var(--proof-text)",
      onClick: () => navigate("/tests"),
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 4,
        padding: "8px 10px",
        borderBottom: "1px solid var(--proof-border)",
      }}
    >
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          onClick={kpi.onClick}
          style={{
            padding: "6px 6px",
            borderRadius: 4,
            background: "var(--proof-hover-light)",
            border: "1px solid var(--proof-border)",
            textAlign: "center",
            cursor: "pointer",
            transition: "background 0.1s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--proof-hover-light)";
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: kpi.color,
              lineHeight: 1.2,
            }}
          >
            {kpi.value}
          </div>
          <div
            style={{
              fontSize: 7,
              color: "var(--proof-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              marginTop: 1,
            }}
          >
            {kpi.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function TestFilters() {
  const [loc, navigate] = useLocation();
  const { tcs, suites } = useTestData();
  const allTests = React.useMemo(() => getAutoDiscoveredTests(), []);
  const discovery = React.useMemo(() => getAutoDiscoverySummary(), []);
  const params = React.useMemo(() => new URLSearchParams(window.location.search), [loc]);
  const suiteFilter = params.get("suite") || "";
  const selectedSuite = suiteFilter ? (suites.find((s) => s.id === suiteFilter) ?? null) : null;

  const [search, setSearch] = React.useState("");
  const [testType, setTestType] = React.useState("All");
  const [category, setCategory] = React.useState("All");
  const [status, setStatus] = React.useState("All");
  const [priority, setPriority] = React.useState("All");

  const typeCounts = React.useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of allTests) c[t.testType] = (c[t.testType] || 0) + 1;
    return c;
  }, [allTests]);
  const categoryCounts = React.useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of allTests) c[t.category] = (c[t.category] || 0) + 1;
    return c;
  }, [allTests]);

  const filtered = React.useMemo(() => {
    let result = allTests;
    if (suiteFilter) {
      const suite = suites.find((s) => s.id === suiteFilter);
      if (suite) result = result.filter((t) => suite.testIds.includes(t.id));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q),
      );
    }
    if (testType !== "All") result = result.filter((t) => t.testType === testType);
    if (category !== "All") result = result.filter((t) => t.category === category);
    if (status !== "All") result = result.filter((t) => t.status === status);
    if (priority !== "All") result = result.filter((t) => t.priority === priority);
    return result;
  }, [allTests, suiteFilter, search, testType, category, status, priority, suites]);

  const handleExport = (format: "json" | "csv" | "junit_xml") => {
    if (format === "json") exportAndDownload(tcs, "json");
    else if (format === "junit_xml")
      downloadFile(exportAsXML(tcs), "aware-tests.xml", "application/xml");
    else
      downloadFile(
        "id,name,category,priority,status,owner\n" +
          tcs
            .map((t) => `${t.id},"${t.name}",${t.category},${t.priority},${t.status},${t.owner}`)
            .join("\n"),
        "aware-tests.csv",
        "text/csv",
      );
  };

  return (
    <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--proof-border)" }}>
      {/* Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          border: "1px solid var(--proof-border)",
          borderRadius: 4,
          padding: "3px 6px",
          marginBottom: 4,
        }}
      >
        <Search size={11} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tests..."
          style={{
            border: "none",
            outline: "none",
            fontSize: 11,
            background: "transparent",
            flex: 1,
            minWidth: 0,
            color: "var(--proof-text)",
          }}
        />
      </div>
      {/* Filter dropdowns */}
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
        <select
          value={testType}
          onChange={(e) => setTestType(e.target.value)}
          style={{
            fontSize: 9,
            padding: "2px 4px",
            border: "1px solid var(--proof-border)",
            borderRadius: 3,
            background: "var(--proof-surface)",
            color: "var(--proof-text)",
            flex: 1,
            minWidth: 0,
          }}
        >
          {TEST_TYPES.map((t) => (
            <option key={t} value={t}>
              {t} {t !== "All" ? `(${typeCounts[t] || 0})` : ""}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            fontSize: 9,
            padding: "2px 4px",
            border: "1px solid var(--proof-border)",
            borderRadius: 3,
            background: "var(--proof-surface)",
            color: "var(--proof-text)",
            flex: 1,
            minWidth: 0,
          }}
        >
          {TEST_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c} {c !== "All" ? `(${categoryCounts[c] || 0})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: "flex", gap: 3, marginTop: 3 }}>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{
            fontSize: 9,
            padding: "2px 4px",
            border: "1px solid var(--proof-border)",
            borderRadius: 3,
            background: "var(--proof-surface)",
            color: "var(--proof-text)",
            flex: 1,
            minWidth: 0,
          }}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          style={{
            fontSize: 9,
            padding: "2px 4px",
            border: "1px solid var(--proof-border)",
            borderRadius: 3,
            background: "var(--proof-surface)",
            color: "var(--proof-text)",
            flex: 1,
            minWidth: 0,
          }}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      {/* Suite badge + info */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 4,
        }}
      >
        <div style={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center" }}>
          {selectedSuite && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
                fontSize: 8,
                padding: "1px 4px",
                borderRadius: 3,
                background: "var(--proof-blue)10",
                border: "1px solid var(--proof-blue)30",
                color: "var(--proof-blue)",
              }}
            >
              <FolderTree size={8} /> {selectedSuite.name}
              <button
                onClick={() => navigate("/tests")}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: "var(--proof-text-secondary)",
                  padding: 0,
                  lineHeight: 1,
                  display: "inline-flex",
                }}
              >
                <X size={8} />
              </button>
            </span>
          )}
          <span
            style={{
              fontSize: 9,
              color: "var(--proof-text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {filtered.length}/{allTests.length}
          </span>
          {discovery.total > 0 && (
            <span
              style={{
                fontSize: 8,
                color: "var(--proof-text-muted)",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Beaker size={8} />
              {discovery.total} auto
            </span>
          )}
        </div>
        {/* Export */}
        <div style={{ position: "relative", cursor: "pointer" }}>
          <button
            onClick={() => handleExport("json")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              padding: "2px 5px",
              borderRadius: 3,
              border: "1px solid var(--proof-border)",
              background: "var(--proof-surface)",
              cursor: "pointer",
              color: "var(--proof-text-secondary)",
              fontSize: 8,
            }}
          >
            <Download size={8} /> Export
          </button>
          <select
            onChange={(e) => {
              if (e.target.value) handleExport(e.target.value as "json" | "csv" | "junit_xml");
              (e.target as HTMLSelectElement).blur();
            }}
            style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
          >
            <option value="">Format...</option>
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="junit_xml">JUnit XML</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function flattenForSearch(suite: TestSuite, allSuites: TestSuite[]): TestSuite[] {
  const result = [suite];
  for (const c of allSuites.filter((s) => s.parentId === suite.id))
    result.push(...flattenForSearch(c, allSuites));
  return result;
}

function SuiteTreePanel() {
  const [loc2, navigate] = useLocation();
  const suites = useSyncExternalStore(subscribeToTestSuites, getTestSuites);
  const tests = useSyncExternalStore(subscribeToTestCases, getTestCases);
  const [treeSearch, setTreeSearch] = React.useState("");
  const currentSuite = React.useMemo(() => new URLSearchParams(window.location.search).get("suite"), [loc2]);

  const rootSuites = React.useMemo(() => {
    let roots = suites.filter(
      (s) => s.parentId === null || !suites.find((p) => p.id === s.parentId),
    );
    if (treeSearch.trim()) {
      const q = treeSearch.toLowerCase();
      roots = roots.filter((s) => {
        const all = flattenForSearch(s, suites);
        return all.some((c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
      });
    }
    return roots;
  }, [suites, treeSearch]);


  function getChildren(suite: TestSuite): TestSuite[] {
    return suites.filter((s) => s.parentId === suite.id);
  }
  function getTestCount(suite: TestSuite): number {
    const ids = [...suite.testIds];
    for (const child of getChildren(suite)) ids.push(...child.testIds);
    return ids.length;
  }

  function renderSuite(suite: TestSuite, depth: number) {
    const children = getChildren(suite);
    const count = getTestCount(suite);
    const isActive = currentSuite === suite.id;
    const matches =
      !treeSearch.trim() ||
      flattenForSearch(suite, suites).some(
        (s) =>
          s.name.toLowerCase().includes(treeSearch.toLowerCase()) ||
          s.id.toLowerCase().includes(treeSearch.toLowerCase()),
      );
    if (!matches) return null;
    return (
      <React.Fragment key={suite.id}>
        <div
          onClick={() => navigate(`/tests?suite=${suite.id}`)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 10px",
            paddingLeft: `${8 + depth * 14}px`,
            cursor: "pointer",
            fontSize: 11,
            color: isActive ? "var(--proof-text)" : "var(--proof-text-secondary)",
            background: isActive ? "var(--proof-blue-bg)" : "transparent",
            transition: "background 0.1s",
            lineHeight: "22px",
            userSelect: "none",
          }}
          onMouseEnter={(e) => {
            if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
            (e.currentTarget as HTMLElement).style.color = "var(--proof-text)";
          }}
          onMouseLeave={(e) => {
            if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--proof-text-secondary)";
          }}
        >
          {depth > 0 && (
            <span
              style={{ fontSize: 7, color: "var(--proof-text-muted)", width: 8, flexShrink: 0 }}
            >
              └
            </span>
          )}
          <FolderTree size={11} style={{ color: "var(--proof-blue)", flexShrink: 0 }} />
          <span
            style={{
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: 10,
            }}
          >
            {suite.name}
          </span>
          <span
            style={{
              fontSize: 9,
              fontFamily: "var(--font-mono)",
              color: "var(--proof-text-muted)",
              flexShrink: 0,
            }}
          >
            {count}
          </span>
        </div>
        {children.map((c) => renderSuite(c, depth + 1))}
      </React.Fragment>
    );
  }

  return (
    <>
      <div style={{ padding: "8px 10px 4px", borderBottom: "1px solid var(--proof-border)" }}>
        <div
          onClick={() => navigate("/tests")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 6px",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
            color: !currentSuite ? "var(--proof-text)" : "var(--proof-text-secondary)",
            background: !currentSuite ? "var(--proof-blue-bg)" : "transparent",
            transition: "background 0.1s",
          }}
          onMouseEnter={(e) => {
            if (currentSuite)
              (e.currentTarget as HTMLElement).style.background = "var(--proof-hover)";
          }}
          onMouseLeave={(e) => {
            if (currentSuite) (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <Beaker size={12} style={{ color: "var(--proof-orange)" }} />
          All Tests
          <span
            style={{
              marginLeft: "auto",
              fontSize: 9,
              fontFamily: "var(--font-mono)",
              color: "var(--proof-text-muted)",
            }}
          >
            {tests.length}
          </span>
        </div>
      </div>
      <div style={{ padding: "4px 10px", borderBottom: "1px solid var(--proof-border)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            border: "1px solid var(--proof-border)",
            borderRadius: 3,
            padding: "3px 6px",
          }}
        >
          <Search size={10} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
          <input
            value={treeSearch}
            onChange={(e) => setTreeSearch(e.target.value)}
            placeholder="Filter suites..."
            style={{
              border: "none",
              outline: "none",
              fontSize: 10,
              background: "transparent",
              flex: 1,
              minWidth: 0,
              color: "var(--proof-text)",
            }}
          />
        </div>
      </div>
      <div style={{ padding: "2px 0" }}>
        {suites.length === 0 && (
          <div
            style={{
              padding: "12px 10px",
              fontSize: 10,
              color: "var(--proof-text-muted)",
              textAlign: "center",
            }}
          >
            No suites configured
          </div>
        )}
        {rootSuites.map((s) => renderSuite(s, 0))}
      </div>
    </>
  );
}

export function TestsPanel() {
  return (
    <>
      <TestKpis />
      <TestFilters />
      <SuiteTreePanel />
    </>
  );
}
