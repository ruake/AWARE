import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TestSuite, TestCase } from "@/lib/types";
import { FolderTree, Bug, ChevronDown, ChevronRight, Clock, Shield, Zap, Terminal } from "lucide-react";

function matchesFilter(
  suite: TestSuite,
  filter: string,
  allSuites: TestSuite[],
  testCases: TestCase[],
): boolean {
  if (!filter) return true;
  const q = filter.toLowerCase();
  if (suite.name.toLowerCase().includes(q)) return true;
  if (
    suite.testIds.some((tid) =>
      testCases
        .find((tc) => tc.id === tid)
        ?.name.toLowerCase()
        .includes(q),
    )
  )
    return true;
  return allSuites
    .filter((c) => c.parentId === suite.id)
    .some((child) => matchesFilter(child, q, allSuites, testCases));
}

const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes("security")) return <Shield size={12} />;
  if (cat.includes("perf")) return <Zap size={12} />;
  if (cat.includes("api")) return <Terminal size={12} />;
  return <Bug size={12} />;
};

export function SuiteTreeItem({
  suite,
  depth,
  allSuites,
  testCases,
  onSelect,
  selectedId,
  onTestSelect,
  filter,
  expandedIds,
  onToggle,
}: {
  suite: TestSuite;
  depth: number;
  allSuites: TestSuite[];
  testCases: TestCase[];
  onSelect: (s: TestSuite) => void;
  selectedId: string | null;
  onTestSelect?: (testId: string) => void;
  filter?: string;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const expanded = expandedIds.has(suite.id);
  const children = allSuites.filter((s) => s.parentId === suite.id);
  const suiteTests = testCases.filter((tc) => suite.testIds.includes(tc.id));
  const hasChildren = children.length > 0 || suiteTests.length > 0;

  const filteredTests = filter
    ? suiteTests.filter((tc) => tc.name.toLowerCase().includes(filter.toLowerCase()))
    : suiteTests;

  const filteredChildren = filter
    ? children.filter((child) => matchesFilter(child, filter, allSuites, testCases))
    : children;

  const selfMatch =
    !filter ||
    suite.name.toLowerCase().includes(filter.toLowerCase()) ||
    suite.testIds.some((tid) =>
      testCases
        .find((tc) => tc.id === tid)
        ?.name.toLowerCase()
        .includes(filter.toLowerCase()),
    );
  const hasVisibleContent = selfMatch || filteredChildren.length > 0 || filteredTests.length > 0;

  if (filter && !hasVisibleContent) return null;

  const isSelected = selectedId === suite.id;

  return (
    <div style={{ marginBottom: 4 }}>
      <motion.div
        whileHover={{ x: 4 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 14px",
          cursor: "pointer",
          borderRadius: "var(--proof-radius-md)",
          marginLeft: depth > 0 ? depth * 24 : 0,
          background: isSelected ? "rgba(0,196,255,0.08)" : "rgba(255,255,255,0.02)",
          border: "1px solid",
          borderColor: isSelected ? "rgba(0,196,255,0.3)" : "var(--proof-border)",
          boxShadow: isSelected ? "var(--proof-glow-cyan)" : "none",
          transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
        onClick={() => onSelect(suite)}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            e.currentTarget.style.borderColor = "var(--proof-border-strong)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.background = "rgba(255,255,255,0.02)";
            e.currentTarget.style.borderColor = "var(--proof-border)";
          }
        }}
      >
        <div 
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(suite.id);
          }}
          style={{
            width: 20,
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--proof-text-secondary)",
            opacity: hasChildren ? 1 : 0.3,
            cursor: hasChildren ? "pointer" : "default",
          }}
        >
          {hasChildren && (expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
        </div>
        
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: isSelected ? "var(--proof-blue)" : "rgba(255,255,255,0.05)",
            color: isSelected ? "white" : "var(--proof-blue)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.2s",
            boxShadow: isSelected ? "0 0 12px rgba(0,196,255,0.5)" : "none"
          }}
        >
          <FolderTree size={16} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: isSelected ? "var(--proof-blue)" : "var(--proof-text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {suite.name}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--proof-text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 2,
              opacity: 0.8,
            }}
          >
            <span>{suite.testIds.length} tests</span>
            {suite.schedule && (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={12} />
                {suite.schedule.split(" ").slice(0, 5).join(" ")}
              </span>
            )}
          </div>
        </div>

        {suite.testIds.length > 0 && !isSelected && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              padding: "4px 8px",
              borderRadius: "var(--proof-radius-full)",
              background: "rgba(255,255,255,0.05)",
              color: "var(--proof-text-secondary)",
              border: "1px solid var(--proof-border)"
            }}
          >
            {suite.testIds.length}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            {filteredTests.map((tc) => {
              const isTestSelected = selectedId === tc.id;
              return (
                <motion.div
                  key={tc.id}
                  whileHover={{ x: 2 }}
                  onClick={() => onTestSelect?.(tc.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "6px 12px",
                    cursor: "pointer",
                    marginLeft: (depth + 1) * 20 + 12,
                    background: isTestSelected ? "var(--proof-blue-bg)" : "transparent",
                    color: isTestSelected ? "var(--proof-blue)" : "var(--proof-text-secondary)",
                    borderRadius: 6,
                    fontSize: 12,
                    marginTop: 1,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isTestSelected) e.currentTarget.style.background = "var(--proof-surface-2)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isTestSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div style={{ flexShrink: 0, opacity: 0.7 }}>
                    {getCategoryIcon(tc.category)}
                  </div>
                  <span
                    style={{
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontWeight: isTestSelected ? 600 : 400,
                    }}
                  >
                    {tc.name}
                  </span>
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: tc.status === "active" ? "var(--proof-green)" : "var(--proof-yellow)",
                      boxShadow: tc.status === "active" ? "0 0 4px var(--proof-green)" : "none",
                    }}
                  />
                </motion.div>
              );
            })}
            {filteredChildren.map((child) => (
              <SuiteTreeItem
                key={child.id}
                suite={child}
                depth={depth + 1}
                allSuites={allSuites}
                testCases={testCases}
                onSelect={onSelect}
                selectedId={selectedId}
                onTestSelect={onTestSelect}
                filter={filter}
                expandedIds={expandedIds}
                onToggle={onToggle}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
