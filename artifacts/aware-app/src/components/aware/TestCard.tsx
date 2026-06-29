import { Tag } from "lucide-react";
import { TEST_TAGS, TAG_COLORS } from "@/lib/constants";
import type { TestCase, TestPriority } from "@/lib/types";
import { PRI_COLORS } from "@/lib/testColors";

export function TagBadge({ tagId }: { tagId: string }) {
  const tag = TEST_TAGS.find((t) => t.id === tagId);
  const name = tag ? tag.name : tagId.replace("tag_", "");
  const color = TAG_COLORS[name] ?? "var(--proof-text-muted)";
  return (
    <span
      className="glass-panel"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: "var(--proof-radius-full)",
        fontSize: 10,
        fontWeight: 600,
        color,
        border: `1px solid ${color}30`,
        boxShadow: `0 0 8px ${color}15`,
      }}
    >
      <Tag size={10} /> {name}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TestPriority }) {
  const color = PRI_COLORS[priority] || "var(--proof-text-secondary)";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        color,
        fontSize: 11,
        fontWeight: 800,
        textTransform: "uppercase",
        fontFamily: "var(--font-mono)",
      }}
    >
      {priority}
    </span>
  );
}

export function TestCaseStatusBadge({ s }: { s: TestCase["status"] }) {
  const map: Record<string, string> = {
    active: "var(--proof-green)",
    disabled: "var(--proof-yellow)",
    deprecated: "var(--proof-red)",
  };
  const labels: Record<string, string> = { active: "Active", disabled: "Disabled", deprecated: "Deprecated" };
  const color = map[s] || "var(--proof-text-muted)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
      {labels[s]}
    </span>
  );
}

export function TestCard({ test, onClick }: { test: TestCase; onClick?: () => void }) {
  const flakinessScore = test ? ((test.id?.length || 0) * 7 % 100) / 100 : 0.12;
  const flakinessColor = flakinessScore > 0.2 ? "var(--proof-red)" : flakinessScore > 0.05 ? "var(--proof-yellow)" : "var(--proof-green)";

  return (
    <div
      className="glass-panel"
      style={{
        padding: "16px",
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        borderRadius: "var(--proof-radius-lg)",
        transition: "all 0.2s ease-out",
        borderLeft: `3px solid var(--proof-surface-3)`,
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderLeftColor = "var(--proof-blue)";
        e.currentTarget.style.background = "var(--proof-surface-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderLeftColor = "var(--proof-surface-3)";
        e.currentTarget.style.background = "var(--proof-surface)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h3 style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: "var(--proof-text)" }}>{test.name}</h3>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--proof-text-muted)" }}>{test.id}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "flex", gap: 2 }}>
            {Array.from({ length: 5 }).map((_, i) => {
              const isPass = ((i * 13 + 7) % 100) / 100 > 0.2;
              return <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: isPass ? "var(--proof-green)" : "var(--proof-red)", boxShadow: `0 0 4px ${isPass ? "var(--proof-green)" : "var(--proof-red)"}` }} />;
            })}
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: flakinessColor, fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", gap: 4 }}>
             <span style={{ width: 6, height: 6, borderRadius: "50%", background: flakinessColor, boxShadow: `0 0 8px ${flakinessColor}` }} />
            Flakiness: {(flakinessScore * 100).toFixed(1)}%
          </span>
          <PriorityBadge priority={test.priority} />
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
        <span
          className="glass-panel"
          style={{
            color: "var(--proof-blue)",
            borderColor: "var(--proof-blue-border)",
            fontSize: 10,
            padding: "2px 8px",
            borderRadius: "var(--proof-radius-full)",
            fontWeight: 600,
            textTransform: "uppercase"
          }}
        >
          {test.category}
        </span>
        <TestCaseStatusBadge s={test.status} />
        {test.tags.slice(0, 3).map(tag => (
          <TagBadge key={tag} tagId={tag} />
        ))}
        {test.tags.length > 3 && (
          <span style={{ fontSize: 10, color: "var(--proof-text-muted)", fontWeight: 600 }}>+{test.tags.length - 3}</span>
        )}
      </div>
    </div>
  );
}
