import { Tag } from "lucide-react";
import { TEST_TAGS, TAG_COLORS } from "@/lib/constants";
import type { TestCase } from "@/lib/types";
import type { ColumnFilterState } from "@/components/aware/ColumnFilter";

export const EMPTY_FILTER: ColumnFilterState = { text: "", selected: [] };

export function priorityColor(p: string) {
  return p === "P0" ? "#d93025" : p === "P1" ? "#e8710a" : p === "P2" ? "#1a73e8" : "#5f6368";
}

export function TagBadge({ tagId }: { tagId: string }) {
  const tag = TEST_TAGS.find(t => t.id === tagId);
  const name = tag ? tag.name : tagId.replace("tag_", "");
  const color = TAG_COLORS[name] ?? "#5f6368";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "1px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, backgroundColor: color + "20", color, border: `1px solid ${color}40` }}>
      <Tag size={9} /> {name}
    </span>
  );
}

export function TestCaseStatusBadge({ s }: { s: TestCase["status"] }) {
  const map = { active: "gcp-badge-pass", disabled: "gcp-badge-flaky", deprecated: "gcp-badge-fail" };
  const labels = { active: "Active", disabled: "Disabled", deprecated: "Deprecated" };
  return <span className={`gcp-badge ${map[s]}`}>{labels[s]}</span>;
}
