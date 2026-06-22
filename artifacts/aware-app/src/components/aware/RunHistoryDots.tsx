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

  const passCount = dots.filter((d) => d.status === "PASS").length;
  const passRate = Math.round((passCount / dots.length) * 100);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 3,
        flexWrap: "nowrap",
        whiteSpace: "nowrap",
        padding: "4px 8px",
        background: "var(--proof-surface-2)",
        borderRadius: "20px",
        border: "1px solid var(--proof-border)",
      }}
      onClick={(e) => e.stopPropagation()}
      title={`${passRate}% pass rate over ${dots.length} runs`}
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
            border: "none",
            padding: 0,
            width: 10,
            height: 10,
            borderRadius: d.status === "PASS" ? "50%" : "2px",
            background: d.status === "PASS" ? "var(--proof-green)" : "var(--proof-red)",
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            boxShadow: `0 0 0 1px rgba(0,0,0,0.1), 0 0 4px ${d.status === "PASS" ? "var(--proof-green)" : "var(--proof-red)"}40`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.8) translateY(-1px)";
            e.currentTarget.style.zIndex = "10";
            e.currentTarget.style.boxShadow = `0 4px 8px rgba(0,0,0,0.3), 0 0 8px ${d.status === "PASS" ? "var(--proof-green)" : "var(--proof-red)"}80`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.zIndex = "1";
            e.currentTarget.style.boxShadow = `0 0 0 1px rgba(0,0,0,0.1), 0 0 4px ${d.status === "PASS" ? "var(--proof-green)" : "var(--proof-red)"}40`;
          }}
        />
      ))}
      {extra > 0 && (
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "var(--proof-text-muted)",
            marginLeft: 4,
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
