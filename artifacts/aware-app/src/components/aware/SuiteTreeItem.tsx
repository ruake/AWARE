import React from "react";
import type { TestSuite, TestCase } from "@/lib/types";
import { FolderTree, Bug, ChevronDown, ChevronRight, Clock } from "lucide-react";

function matchesFilter(suite: TestSuite, filter: string, allSuites: TestSuite[], testCases: TestCase[]): boolean {
  if (!filter) return true;
  const q = filter.toLowerCase();
  if (suite.name.toLowerCase().includes(q)) return true;
  if (suite.testIds.some(tid => testCases.find(tc => tc.id === tid)?.name.toLowerCase().includes(q))) return true;
  return allSuites.filter(c => c.parentId === suite.id).some(child => matchesFilter(child, q, allSuites, testCases));
}

export function SuiteTreeItem({
  suite, depth, allSuites, testCases, onSelect, selectedId, onTestSelect, filter, expandedIds, onToggle,
}: {
  suite: TestSuite; depth: number; allSuites: TestSuite[]; testCases: TestCase[];
  onSelect: (s: TestSuite) => void; selectedId: string | null;
  onTestSelect?: (testId: string) => void;
  filter?: string; expandedIds: Set<string>; onToggle: (id: string) => void;
}) {
  const expanded = expandedIds.has(suite.id);
  const children = allSuites.filter(s => s.parentId === suite.id);
  const suiteTests = testCases.filter(tc => suite.testIds.includes(tc.id));
  const hasChildren = children.length > 0 || suiteTests.length > 0;

  const filteredTests = filter
    ? suiteTests.filter(tc => tc.name.toLowerCase().includes(filter.toLowerCase()))
    : suiteTests;

  const filteredChildren = filter
    ? children.filter(child => matchesFilter(child, filter, allSuites, testCases))
    : children;

  const selfMatch = !filter || suite.name.toLowerCase().includes(filter.toLowerCase()) || suite.testIds.some(tid => testCases.find(tc => tc.id === tid)?.name.toLowerCase().includes(filter.toLowerCase()));
  const hasVisibleContent = selfMatch || filteredChildren.length > 0 || filteredTests.length > 0;

  if (filter && !hasVisibleContent) return null;

  return (
    <div>
      <div
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 12px", cursor: "pointer", borderRadius: 8,
          paddingLeft: `${12 + depth * 20}px`,
          background: selectedId === suite.id ? "var(--proof-blue-bg)" : "transparent",
          boxShadow: selectedId === suite.id ? "inset 0 0 0 1px var(--proof-blue)" : "none",
          transition: "background 0.15s",
        }}
        onClick={() => onSelect(suite)}
      >
        {hasChildren ? (
          <span
            onClick={e => { e.stopPropagation(); onToggle(suite.id); }}
            style={{ padding: 2, color: "var(--proof-text-secondary)", cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        ) : <span style={{ width: 14 }} />}
        <FolderTree size={14} style={{ color: "var(--proof-blue)", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{suite.name}</div>
          <div style={{ fontSize: 11, color: "var(--proof-text-secondary)", display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
            <span>{suite.testIds.length} tests</span>
            {suite.schedule && <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Clock size={10} />{suite.schedule}</span>}
          </div>
        </div>

      </div>
      {expanded && (
        <>
          {filteredTests.map(tc => (
            <div
              key={tc.id}
              onClick={() => onTestSelect?.(tc.id)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 12px", cursor: "pointer",
                paddingLeft: `${26 + depth * 20}px`,
                background: selectedId === tc.id ? "var(--proof-blue-bg)" : "transparent",
                fontSize: 12, color: "var(--proof-text-secondary)", borderRadius: 6,
              }}
              onMouseEnter={e => { if (selectedId !== tc.id) e.currentTarget.style.background = "var(--proof-grey-bg)"; }}
              onMouseLeave={e => { if (selectedId !== tc.id) e.currentTarget.style.background = "transparent"; }}
            >
              <Bug size={12} style={{ flexShrink: 0, color: "var(--proof-text-secondary)" }} />
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tc.name}</span>
              <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: tc.status === "active" ? "var(--proof-green)" : "var(--proof-yellow)" }} />
            </div>
          ))}
          {filteredChildren.map(child => (
            <SuiteTreeItem key={child.id} suite={child} depth={depth + 1} allSuites={allSuites} testCases={testCases}
              onSelect={onSelect} selectedId={selectedId} onTestSelect={onTestSelect}
              filter={filter} expandedIds={expandedIds} onToggle={onToggle} />
          ))}
        </>
      )}
    </div>
  );
}
