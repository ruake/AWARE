import React from "react";
import { useLocation } from "wouter";
import { RUNS, getTestResultsForRun } from "@/lib/data";

interface RunHistoryDotsProps {
  testName: string;
}

interface DotData {
  runId: string;
  status: "PASS" | "FAIL";
  date: string;
}

export function RunHistoryDots({ testName }: RunHistoryDotsProps) {
  const [, navigate] = useLocation();

  const dots = React.useMemo(() => {
    const seen = new Set<string>();
    const result: DotData[] = [];

    for (const run of RUNS) {
      const results = getTestResultsForRun(run.id);
      const match = results.find((r) => r.name === testName);
      if (match && !seen.has(run.id)) {
        seen.add(run.id);
        result.push({
          runId: run.id,
          status: match.status,
          date: run.started,
        });
      }
    }

    result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return result;
  }, [testName]);

  if (dots.length === 0) {
    return <span style={{ fontSize: 10, color: "var(--proof-text-muted)" }}>—</span>;
  }

  const MAX_DOTS = 30;
  const visible = dots.slice(0, MAX_DOTS);
  const extra = dots.length - MAX_DOTS;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 3,
        flexWrap: "nowrap",
        whiteSpace: "nowrap",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {visible.map((d) => (
        <button
          key={d.runId}
          type="button"
          onClick={() => navigate(`/runs/${d.runId}`)}
          title={`${d.runId} · ${d.status} · ${new Date(d.date).toLocaleDateString()}`}
          aria-label={`Run ${d.runId}: ${d.status} on ${new Date(d.date).toLocaleDateString()}`}
          style={{
            appearance: "none",
            border: "1px solid rgba(0,0,0,0.3)",
            padding: 0,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: d.status === "PASS" ? "var(--proof-green)" : "var(--proof-red)",
            cursor: "pointer",
            flexShrink: 0,
            transition: "transform 0.12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.8)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        />
      ))}
      {extra > 0 && (
        <span
          style={{
            fontSize: 9,
            color: "var(--proof-text-muted)",
            marginLeft: 1,
            fontFamily: "var(--font-mono)",
          }}
          title={`${extra} more runs`}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
