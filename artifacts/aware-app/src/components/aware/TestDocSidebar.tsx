import React from "react";
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  GitBranch,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { getTestCaseById } from "@/lib/data";
import { DIFF_ROWS } from "@/lib/runs";
import type { TestCase } from "@/lib/types";

const collapseBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "var(--proof-text-secondary)",
  padding: 0,
  display: "flex",
  alignItems: "center",
  transition: "transform 0.2s",
};

function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  children,
  badge,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="gcp-card" style={{ display: "flex", flexDirection: "column" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: "10px 12px",
          borderBottom: open ? "1px solid var(--proof-grey)" : "none",
          background: "var(--proof-surface-hover)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 500,
          color: "var(--proof-text)",
          border: "none",
          textAlign: "left",
          width: "100%",
        }}
      >
        {icon}
        <span style={{ flex: 1 }}>{title}</span>
        {badge}
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && children}
    </div>
  );
}

function RelatedTests({ testCase }: { testCase: TestCase }) {
  const relatedIds = testCase.relatedTestIds ?? [];
  const related = relatedIds
    .map((id) => ({ tc: getTestCaseById(id), diff: DIFF_ROWS.find((d) => d.id === id) }))
    .filter((x) => x.tc || x.diff);

  if (related.length === 0) {
    return (
      <div
        style={{
          padding: 16,
          textAlign: "center",
          fontSize: 12,
          color: "var(--proof-text-secondary)",
        }}
      >
        No related tests
      </div>
    );
  }

  return (
    <div style={{ padding: 0 }}>
      <table className="gcp-table" style={{ width: "100%" }}>
        <tbody>
          {related.map((rel) => {
            const name = rel.tc?.name ?? rel.diff?.name ?? rel.diff?.id ?? "";
            const status = rel.diff?.candStatus ?? rel.tc?.status ?? "SKIP";
            const isFail = status === "FAIL" || status === "deprecated";
            return (
              <tr
                key={rel.tc?.id ?? rel.diff?.id}
                style={{
                  cursor: "pointer",
                  background: isFail ? "var(--proof-red-bg)" : "transparent",
                }}
              >
                <td style={{ padding: "8px 10px" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: 180,
                      whiteSpace: "nowrap",
                    }}
                    title={name}
                  >
                    {name}
                  </div>
                </td>
                <td style={{ padding: "8px 10px", textAlign: "right" }}>
                  <span
                    className={`gcp-badge ${isFail ? "gcp-badge-fail" : "gcp-badge-pass"}`}
                    style={{ fontSize: 9 }}
                  >
                    {status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StripSection({
  title,
  icon,
  color,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div
      style={{
        background: `color-mix(in srgb, ${color} 8%, var(--proof-surface))`,
        borderRadius: 6,
        border: `1px solid ${color}`,
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: "8px 10px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color,
          border: "none",
          background: "transparent",
          textAlign: "left",
          width: "100%",
        }}
      >
        {icon}
        <span style={{ flex: 1 }}>{title}</span>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && children}
    </div>
  );
}

export function TestDocSidebar({ testCase }: { testCase?: TestCase }) {
  const tags = testCase?.tags ?? [];
  const predicates = testCase?.predicates ?? [];
  const preconditions = testCase?.preconditions ?? "";
  const precondLines = preconditions ? preconditions.split("\n").filter((l) => l.trim()) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {testCase?.documentation && (
        <CollapsibleSection
          title="Auto-generated Documentation"
          icon={
            <FileText size={14} style={{ color: "var(--proof-text-secondary)", flexShrink: 0 }} />
          }
          defaultOpen={false}
        >
          <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 4 }}>
            <div
              style={{
                fontSize: 11,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                color: "var(--proof-text)",
                background: "var(--proof-grey-bg)",
                padding: "8px 10px",
                borderRadius: 6,
                maxHeight: 250,
                overflowY: "auto",
              }}
            >
              {testCase.documentation}
            </div>
            {testCase.documentation.toLowerCase().includes("auto-generated") && (
              <div
                style={{ fontSize: 10, color: "var(--proof-text-secondary)", fontStyle: "italic" }}
              >
                Auto-generated by AI on first creation
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      <CollapsibleSection
        title="Test Documentation"
        icon={<FileText size={14} style={{ color: "var(--proof-blue)", flexShrink: 0 }} />}
        badge={
          tags.length > 0 ? (
            <span
              style={{ fontSize: 10, fontWeight: 600, color: "var(--proof-blue)", marginRight: 4 }}
            >
              {tags.length}
            </span>
          ) : undefined
        }
      >
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            {testCase?.description ? (
              <p style={{ fontSize: 12, lineHeight: 1.6, marginBottom: 8 }}>
                {testCase.description}
              </p>
            ) : (
              <p
                style={{
                  fontSize: 12,
                  lineHeight: 1.6,
                  marginBottom: 8,
                  color: "var(--proof-text-secondary)",
                  fontStyle: "italic",
                }}
              >
                No description
              </p>
            )}
            {tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 10,
                      padding: "1px 6px",
                      borderRadius: 10,
                      background: "var(--proof-blue-bg)",
                      color: "var(--proof-blue)",
                      border: "1px solid var(--proof-blue)",
                      fontWeight: 500,
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {predicates.length > 0 && (
            <StripSection
              title="Validates"
              icon={<CheckCircle2 size={12} />}
              color="var(--proof-green)"
              defaultOpen={true}
            >
              <div style={{ padding: "0 8px 8px" }}>
                <ul style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {predicates.map((p) => (
                    <li
                      key={p.id}
                      style={{ display: "flex", alignItems: "flex-start", gap: 5, fontSize: 12 }}
                    >
                      <CheckCircle2
                        size={13}
                        style={{ color: "var(--proof-green)", flexShrink: 0, marginTop: 2 }}
                      />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
                        {p.description || `${p.field} ${p.operator} ${p.expected}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </StripSection>
          )}

          {precondLines.length > 0 && (
            <StripSection
              title="Preconditions"
              icon={<AlertTriangle size={12} />}
              color="var(--proof-yellow)"
              defaultOpen={true}
            >
              <div style={{ padding: "0 8px 8px" }}>
                <ul
                  style={{
                    paddingLeft: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    fontSize: 12,
                    listStyle: "disc",
                  }}
                >
                  {precondLines.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            </StripSection>
          )}

          <StripSection
            title="Known Flakiness"
            icon={<AlertCircle size={12} />}
            color="var(--proof-red)"
            defaultOpen={true}
          >
            <div style={{ padding: "0 8px 8px", fontSize: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ fontWeight: 500 }}>Flake rate:</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--proof-red)",
                    fontWeight: 700,
                  }}
                >
                  N/A
                </span>
                <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
                  (last 90d)
                </span>
              </div>
              <p style={{ fontSize: 12, color: "var(--proof-text-secondary)", marginTop: 3 }}>
                Tracked per-run in test history
              </p>
            </div>
          </StripSection>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Related Tests"
        icon={
          <GitBranch size={14} style={{ color: "var(--proof-text-secondary)", flexShrink: 0 }} />
        }
      >
        {testCase ? (
          <RelatedTests testCase={testCase} />
        ) : (
          <div
            style={{
              padding: 16,
              textAlign: "center",
              fontSize: 12,
              color: "var(--proof-text-secondary)",
            }}
          >
            No test case selected
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
}
