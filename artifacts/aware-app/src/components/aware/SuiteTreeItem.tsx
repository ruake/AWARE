import React from "react";
import type { TestSuite, TestCase } from "@/lib/types";
import { FolderTree, ChevronDown, ChevronRight, Plus, Trash2, Clock } from "lucide-react";

export function SuiteTreeItem({
  suite, depth, allSuites, testCases, onSelect, selectedId, onDelete, onAddTest,
}: {
  suite: TestSuite; depth: number; allSuites: TestSuite[]; testCases: TestCase[];
  onSelect: (s: TestSuite) => void; selectedId: string | null; onDelete: (id: string) => void;
  onAddTest: (suiteId: string) => void;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const children = allSuites.filter(s => s.parentId === suite.id);
  const suiteTests = testCases.filter(tc => suite.testIds.includes(tc.id));

  return (
    <div>
      <div
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 12px", cursor: "pointer", borderRadius: 8,
          paddingLeft: `${12 + depth * 20}px`,
          background: selectedId === suite.id ? "var(--gcp-blue-bg)" : "transparent",
          boxShadow: selectedId === suite.id ? "inset 0 0 0 1px var(--gcp-blue)" : "none",
          transition: "background 0.15s",
        }}
        onClick={() => onSelect(suite)}
      >
        {children.length > 0 ? (
          <span
            onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
            style={{ padding: 2, color: "var(--gcp-text-secondary)", cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        ) : <span style={{ width: 18 }} />}
        <FolderTree size={15} style={{ color: "var(--gcp-blue)", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{suite.name}</div>
          <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
            <span>{suite.testIds.length} tests</span>
            {suite.schedule && <span style={{ display: "flex", alignItems: "center", gap: 2 }}><Clock size={10} />{suite.schedule}</span>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }} onClick={e => e.stopPropagation()}>
          <button onClick={() => onAddTest(suite.id)} style={{ padding: 4, border: "none", background: "none", cursor: "pointer", color: "var(--gcp-text-secondary)", borderRadius: 4 }} title="Add tests"><Plus size={13} /></button>
          <button onClick={() => onDelete(suite.id)} style={{ padding: 4, border: "none", background: "none", cursor: "pointer", color: "var(--gcp-text-secondary)", borderRadius: 4 }} title="Delete suite"><Trash2 size={13} /></button>
        </div>
      </div>
      {expanded && children.map(child => (
        <SuiteTreeItem key={child.id} suite={child} depth={depth + 1} allSuites={allSuites} testCases={testCases} onSelect={onSelect} selectedId={selectedId} onDelete={onDelete} onAddTest={onAddTest} />
      ))}
    </div>
  );
}
