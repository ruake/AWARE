import React from "react";

export function DiffRowItem({
  label,
  base,
  cand,
  changed,
  indent,
}: {
  label: string;
  base: string;
  cand: string;
  changed: boolean;
  indent?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 12,
        padding: "8px 12px",
        borderBottom: "1px solid var(--proof-border)",
        background: changed ? (label.toLowerCase().includes('fail') || label.toLowerCase().includes('error') ? "rgba(255,51,85,0.06)" : "rgba(0,196,255,0.06)") : "transparent",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        marginLeft: indent ? 16 : 0,
      }}
    >
      <span style={{ color: "var(--proof-text-secondary)", fontWeight: changed ? 700 : 500 }}>
        {label}
      </span>
      <span style={{ color: changed ? "var(--proof-red)" : "var(--proof-text-muted)" }}>
        {base}
      </span>
      <span style={{ color: changed ? "var(--proof-green)" : "var(--proof-text)" }}>
        {cand}
      </span>
    </div>
  );
}

export function compareHeaders(
  base: Record<string, string> | undefined,
  cand: Record<string, string> | undefined,
) {
  const allKeys = [...new Set([...Object.keys(base ?? {}), ...Object.keys(cand ?? {})])].sort();
  return allKeys.map((key) => {
    const b = (base ?? {})[key] ?? "—";
    const c = (cand ?? {})[key] ?? "—";
    return { key, base: b, cand: c, changed: b !== c };
  });
}

export function compareCookies(
  base: any[] | undefined,
  cand: any[] | undefined,
) {
  const allNames = [
    ...new Set([...(base ?? []).map((c) => c.name), ...(cand ?? []).map((c) => c.name)]),
  ].sort();
  return allNames.map((name) => {
    const b = (base ?? []).find((c) => c.name === name);
    const c = (cand ?? []).find((c) => c.name === name);
    return { name, base: b, cand: c, changed: JSON.stringify(b) !== JSON.stringify(c) };
  });
}
