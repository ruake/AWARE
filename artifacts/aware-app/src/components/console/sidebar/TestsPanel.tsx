import React, { useSyncExternalStore } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  getAutoDiscoveredTests,
  subscribeToAutoTests,
  computeTestStats,
  getAutoDiscoverySummary} from "@/lib/data";
import { useTestData } from "@/hooks/useTestData";
import {
  subscribeToTestSuites,
  getTestSuites,
  subscribeToTestCases,
  getTestCases} from "@/lib/data";
import { FolderTree, Beaker, Search, Download, X, Filter, ChevronRight, ChevronDown, Layers, Target, Activity } from "lucide-react";
import type { TestSuite } from "@/lib/types";
import { exportAndDownload, exportAsXML, downloadFile } from "@/lib/testImportExport";

const TEST_TYPES = ["All", "web", "api", "http", "edgeworker", "transaction", "pytest"] as const;
const STATUSES = ["All", "active", "disabled", "deprecated"] as const;
const PRIORITIES = ["All", "P0", "P1", "P2", "P3"] as const;

function TestKpis() {
  const [, navigate] = useLocation();
  const { tcs, suites } = useTestData();
  const stats = React.useMemo(() => computeTestStats(), [tcs]);

  const kpis = [
    {
      label: "Suites",
      value: suites.length,
      color: "var(--proof-blue)",
      onClick: () => navigate("/suites")},
    {
      label: "Tests",
      value: tcs.length,
      color: "var(--proof-cyan)",
      onClick: () => navigate("/tests")},
    {
      label: "Active",
      value: tcs.filter((t) => t.status === "active").length,
      color: "var(--proof-green)",
      onClick: () => navigate("/tests?status=active")},
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 6,
        padding: "12px",
        borderBottom: "1px solid var(--proof-border)",
        background: "var(--proof-surface-subtle)"}}
    >
      {kpis.map((kpi, idx) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          onClick={kpi.onClick}
          whileHover={{ background: "var(--proof-surface-hover)", scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: "8px",
            borderRadius: 8,
            background: "var(--proof-surface)",
            border: "1px solid var(--proof-border)",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.2s ease"}}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: kpi.color,
              lineHeight: 1}}
          >
            {kpi.value}
          </div>
          <div
            style={{
              fontSize: 8,
              fontWeight: 600,
              color: "var(--proof-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginTop: 2}}
          >
            {kpi.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function TestFilters() {
  const [loc, navigate] = useLocation();
  const { suites } = useTestData();
  const allTests = useSyncExternalStore(subscribeToAutoTests, getAutoDiscoveredTests);
  const discovery = React.useMemo(() => getAutoDiscoverySummary(), []);
  const params = React.useMemo(() => new URLSearchParams(window.location.search), [loc]);
  const suiteFilter = params.get("suite") || "";
  const selectedSuite = suiteFilter ? (suites.find((s) => s.id === suiteFilter) ?? null) : null;

  const [search, setSearch] = React.useState("");
  const [testType, setTestType] = React.useState("All");
  const [status, setStatus] = React.useState("All");

  return (
    <div style={{ padding: "12px", borderBottom: "1px solid var(--proof-border)", background: "var(--proof-surface-subtle)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--proof-surface)",
          border: "1px solid var(--proof-border)",
          borderRadius: 8,
          padding: "6px 10px",
          marginBottom: 10,
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)"}}
      >
        <Search size={14} style={{ color: "var(--proof-text-muted)", flexShrink: 0 }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter tests..."
          style={{
            border: "none",
            fontSize: 12,
            background: "transparent",
            flex: 1,
            minWidth: 0,
            color: "var(--proof-text)"}}
        />
        {search && <X size={12} style={{ color: "var(--proof-text-muted)", cursor: "pointer" }} onClick={() => setSearch("")} />}
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <div style={{ position: "relative" }}>
          <Layers size={10} style={{ position: "absolute", left: 8, top: 8, color: "var(--proof-text-muted)", pointerEvents: "none" }} />
          <select
            value={testType}
            onChange={(e) => setTestType(e.target.value)}
            style={{
              width: "100%",
              fontSize: 11,
              padding: "5px 8px 5px 24px",
              border: "1px solid var(--proof-border)",
              borderRadius: 6,
              background: "var(--proof-surface)",
              color: "var(--proof-text)",
              appearance: "none"}}
          >
            {TEST_TYPES.map((t) => (
              <option key={t} value={t}>{t} Type</option>
            ))}
          </select>
        </div>
        <div style={{ position: "relative" }}>
          <Target size={10} style={{ position: "absolute", left: 8, top: 8, color: "var(--proof-text-muted)", pointerEvents: "none" }} />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{
              width: "100%",
              fontSize: 11,
              padding: "5px 8px 5px 24px",
              border: "1px solid var(--proof-border)",
              borderRadius: 6,
              background: "var(--proof-surface)",
              color: "var(--proof-text)",
              appearance: "none"}}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s === "All" ? "Any Status" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedSuite && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ 
            marginTop: 10, 
            padding: "4px 8px", 
            background: "var(--proof-blue-bg)", 
            border: "1px solid var(--proof-blue-bright)40", 
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <FolderTree size={10} style={{ color: "var(--proof-blue-bright)" }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: "var(--proof-blue-bright)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selectedSuite.name}
          </span>
          <X 
            size={10} 
            style={{ cursor: "pointer", color: "var(--proof-blue-bright)" }} 
            onClick={() => navigate("/tests")}
          />
        </motion.div>
      )}
    </div>
  );
}

function SuiteTreeItem({ suite, depth, allSuites, currentSuiteId, onSelect }: { 
  suite: TestSuite; 
  depth: number; 
  allSuites: TestSuite[];
  currentSuiteId: string | null;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const children = allSuites.filter((s) => s.parentId === suite.id);
  const isActive = currentSuiteId === suite.id;
  const hasChildren = children.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <motion.div
        onClick={() => onSelect(suite.id)}
        whileHover={{ background: "var(--proof-surface-hover)" }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          paddingLeft: 12 + depth * 16,
          cursor: "pointer",
          background: isActive ? "var(--proof-surface-active)" : "transparent",
          position: "relative",
          transition: "background 0.2s ease"}}
      >
        {isActive && (
          <motion.div
            layoutId="active-suite-pill"
            style={{
              position: "absolute",
              left: 0,
              top: 4,
              bottom: 4,
              width: 3,
              background: "var(--proof-blue)",
              borderRadius: "0 4px 4px 0"}}
          />
        )}
        
        <div 
          onClick={(e) => {
            if (hasChildren) {
              e.stopPropagation();
              setExpanded(!expanded);
            }
          }}
          style={{ width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--proof-text-tertiary)" }}
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
          ) : null}
        </div>

        <FolderTree 
          size={14} 
          style={{ 
            color: isActive ? "var(--proof-blue-bright)" : "var(--proof-text-tertiary)",
            opacity: isActive ? 1 : 0.7
          }} 
        />
        
        <span style={{ 
          flex: 1, 
          fontSize: 11, 
          fontWeight: isActive ? 600 : 500, 
          color: isActive ? "var(--proof-text)" : "var(--proof-text-secondary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}>
          {suite.name}
        </span>

        <span style={{ 
          fontSize: 9, 
          fontFamily: "var(--font-mono)", 
          color: "var(--proof-text-tertiary)",
          background: "var(--proof-surface-3)",
          padding: "1px 4px",
          borderRadius: 4,
          minWidth: 16,
          textAlign: "center"
        }}>
          {suite.testIds.length}
        </span>
      </motion.div>

      <AnimatePresence initial={false}>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            {children.map((child) => (
              <SuiteTreeItem 
                key={child.id} 
                suite={child} 
                depth={depth + 1} 
                allSuites={allSuites} 
                currentSuiteId={currentSuiteId}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SuiteTreePanel() {
  const [, navigate] = useLocation();
  const suites = useSyncExternalStore(subscribeToTestSuites, getTestSuites);
  const tests = useSyncExternalStore(subscribeToTestCases, getTestCases);
  const currentSuiteId = new URLSearchParams(window.location.search).get("suite");

  const rootSuites = React.useMemo(() => {
    return suites.filter((s) => s.parentId === null || !suites.find((p) => p.id === s.parentId));
  }, [suites]);

  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 12px 8px", fontSize: 10, fontWeight: 700, color: "var(--proof-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        Suites Hierarchy
      </div>

      <motion.div
        onClick={() => navigate("/tests")}
        whileHover={{ background: "var(--proof-surface-hover)" }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 16px",
          cursor: "pointer",
          background: !currentSuiteId ? "var(--proof-surface-active)" : "transparent",
          transition: "background 0.2s ease",
          marginBottom: 4
        }}
      >
        <Beaker size={14} style={{ color: "var(--proof-orange)" }} />
        <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: !currentSuiteId ? "var(--proof-text)" : "var(--proof-text-secondary)" }}>
          All Test Cases
        </span>
        <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--proof-text-tertiary)" }}>
          {tests.length}
        </span>
      </motion.div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {rootSuites.map((s) => (
          <SuiteTreeItem 
            key={s.id} 
            suite={s} 
            depth={0} 
            allSuites={suites} 
            currentSuiteId={currentSuiteId}
            onSelect={(id) => navigate(`/tests?suite=${id}`)}
          />
        ))}
      </div>

      {suites.length === 0 && (
        <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--proof-text-muted)" }}>
          <FolderTree size={24} style={{ opacity: 0.1, marginBottom: 12 }} />
          <div style={{ fontSize: 11 }}>No suites found</div>
        </div>
      )}
    </div>
  );
}

export function TestsPanel() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TestKpis />
      <TestFilters />
      <SuiteTreePanel />
      
      <div style={{ padding: "12px", borderTop: "1px solid var(--proof-border)", background: "var(--proof-surface-subtle)" }}>
        <motion.button
          whileHover={{ background: "var(--proof-surface-hover)" }}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "8px",
            borderRadius: 8,
            border: "1px solid var(--proof-border)",
            background: "var(--proof-surface)",
            cursor: "pointer",
            color: "var(--proof-text-secondary)",
            fontSize: 11,
            fontWeight: 600}}
        >
          <Download size={14} /> Export Tests
        </motion.button>
      </div>
    </div>
  );
}
