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
        padding: "6px 8px",
        borderBottom: "1px solid var(--proof-border)",
        background: changed ? (label.toLowerCase().includes('fail') || label.toLowerCase().includes('error') ? "rgba(239,68,68,0.06)" : "rgba(59,130,246,0.06)") : "transparent",
        borderRadius: changed ? 6 : 0,
        fontSize: 11,
        fontFamily: "var(--font-mono)",
        marginLeft: indent ? 12 : 0,
        transition: "background 0.2s ease",
      }}
    >
      <span
        style={{
          color: "var(--proof-text-secondary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontWeight: changed ? 700 : 500,
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: changed ? "var(--proof-red)" : "var(--proof-text)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          opacity: changed ? 1 : 0.8,
        }}
      >
        {base}
      </span>
      <span
        style={{
          color: changed ? "var(--proof-green)" : "var(--proof-text)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontWeight: changed ? 600 : 400,
        }}
      >
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
  base:
    | {
        name: string;
        value: string;
        domain?: string;
        path?: string;
        httpOnly?: boolean;
        secure?: boolean;
      }[]
    | undefined,
  cand:
    | {
        name: string;
        value: string;
        domain?: string;
        path?: string;
        httpOnly?: boolean;
        secure?: boolean;
      }[]
    | undefined,
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
