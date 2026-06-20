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
        gap: 4,
        padding: "3px 0",
        borderBottom: "1px solid rgba(255,255,255,0.03)",
        background: changed ? "rgba(239,68,68,0.04)" : "transparent",
        borderRadius: changed ? 3 : 0,
        fontSize: 10,
        fontFamily: "var(--font-mono)",
        marginLeft: indent ? 8 : 0,
      }}
    >
      <span
        style={{
          color: "var(--proof-text-secondary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontWeight: changed ? 600 : 400,
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
        }}
      >
        {base}
      </span>
      <span
        style={{
          color: changed ? "var(--proof-red)" : "var(--proof-text)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
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
