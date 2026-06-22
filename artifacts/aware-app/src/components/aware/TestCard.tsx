import { Tag, AlertCircle } from "lucide-react";
import { TEST_TAGS, TAG_COLORS } from "@/lib/constants";
import type { TestCase, TestPriority } from "@/lib/types";
import { PRI_COLORS, PRI_BGS } from "@/lib/testColors";

export function TagBadge({ tagId }: { tagId: string }) {
  const tag = TEST_TAGS.find((t) => t.id === tagId);
  const name = tag ? tag.name : tagId.replace("tag_", "");
  const color = TAG_COLORS[name] ?? "#9aa0a6";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "1px 8px",
        borderRadius: "var(--proof-radius-full)",
        fontSize: 10,
        fontWeight: 600,
        backgroundColor: color + "15",
        color,
        border: `1px solid ${color}30`,
      }}
    >
      <Tag size={10} /> {name}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TestPriority }) {
  const color = PRI_COLORS[priority] || "var(--proof-text-secondary)";
  const bg = PRI_BGS[priority] || "rgba(154,160,166,0.08)";
  return (
    <span
      className="proof-badge"
      style={{
        backgroundColor: bg,
        color: color,
        borderColor: color + "30",
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
      }}
    >
      {priority}
    </span>
  );
}

export function TestCaseStatusBadge({ s }: { s: TestCase["status"] }) {
  const map = {
    active: "proof-badge-pass",
    disabled: "proof-badge-flaky",
    deprecated: "proof-badge-fail",
  };
  const labels = { active: "Active", disabled: "Disabled", deprecated: "Deprecated" };
  return (
    <span className={`proof-badge ${map[s]}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
      {labels[s]}
    </span>
  );
}

export function TestCard({ test, onClick }: { test: TestCase; onClick?: () => void }) {
  return (
    <div
      className="proof-card"
      style={{
        padding: "12px 16px",
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onClick={onClick}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span className="proof-meta" style={{ fontFamily: "var(--font-mono)" }}>{test.id}</span>
          <h3 className="proof-section-title" style={{ margin: 0 }}>{test.name}</h3>
        </div>
        <PriorityBadge priority={test.priority} />
      </div>

      <div style={{ fontSize: 13, color: "var(--proof-text-secondary)", lineHeight: 1.5 }}>
        {test.description}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <span
          className="proof-badge"
          style={{
            background: "var(--proof-blue-bg)",
            color: "var(--proof-blue)",
            borderColor: "var(--proof-blue-border)",
            fontSize: 10,
          }}
        >
          {test.category}
        </span>
        <TestCaseStatusBadge s={test.status} />
        {test.tags.slice(0, 3).map(tag => (
          <TagBadge key={tag} tagId={tag} />
        ))}
        {test.tags.length > 3 && (
          <span className="proof-meta">+{test.tags.length - 3} more</span>
        )}
      </div>
    </div>
  );
}
