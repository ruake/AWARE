import React from "react";
import { useLocation } from "wouter";
import { RUNS, getTestResultsForRun } from "@/lib/data";

interface RunHistoryDotsProps {
  testName: string;
}

interface DotData {
  runId: string;
  status: "PASS" | "FAIL" | "PARTIAL";
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
        gap: 4,
        flexWrap: "nowrap",
        whiteSpace: "nowrap",
        padding: "6px 10px",
        background: "rgba(13, 15, 20, 0.6)",
        backdropFilter: "blur(8px)",
        borderRadius: "24px",
        border: "1px solid rgba(255, 255, 255, 0.05)",
      }}
      onClick={(e) => e.stopPropagation()}
      title={`${passRate}% pass rate over ${dots.length} runs`}
    >
      {visible.map((d) => {
        const color = d.status === "PASS" ? "var(--proof-green)" : d.status === "PARTIAL" ? "var(--proof-yellow)" : "var(--proof-red)";
        return (
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
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: color,
              cursor: "pointer",
              flexShrink: 0,
              transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              boxShadow: `0 0 4px ${color}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.8) translateY(-1px)";
              e.currentTarget.style.zIndex = "10";
              e.currentTarget.style.boxShadow = `0 4px 8px rgba(0,0,0,0.4), 0 0 12px ${color}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.zIndex = "1";
              e.currentTarget.style.boxShadow = `0 0 4px ${color}`;
            }}
          />
        );
      })}
      {extra > 0 && (
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "var(--proof-text-muted)",
            marginLeft: 6,
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
