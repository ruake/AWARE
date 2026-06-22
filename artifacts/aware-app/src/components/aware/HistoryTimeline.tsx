import React from "react";
import { useLocation } from "wouter";
import { RUNS, getTestResultsForRun } from "@/lib/data";
import { ChevronLeft, ChevronRight, SkipBack, SkipForward } from "lucide-react";

// ── Shared Time Window Context ──────────────────────────────────────────────

interface TimeWindowState {
  end: Date;
  sizeDays: number;
}

const TimeWindowCtx = React.createContext<{
  window: TimeWindowState;
  setWindow: (w: TimeWindowState) => void;
} | null>(null);

export function TimeWindowProvider({ children }: { children: React.ReactNode }) {
  const [window, setWindow] = React.useState<TimeWindowState>({
    end: new Date(),
    sizeDays: 30,
  });
  return <TimeWindowCtx.Provider value={{ window, setWindow }}>{children}</TimeWindowCtx.Provider>;
}

function useTimeWindow() {
  const ctx = React.useContext(TimeWindowCtx);
  if (!ctx) throw new Error("useTimeWindow must be inside TimeWindowProvider");
  return ctx;
}

// ── Time Window Controls ─────────────────────────────────────────────────────

function formatDate(d: Date) {
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

const ZOOM_PRESETS = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "All", days: Infinity },
];

export function TimeWindowControls() {
  const { window, setWindow } = useTimeWindow();

  const start = new Date(window.end);
  if (window.sizeDays < Infinity) {
    start.setDate(start.getDate() - window.sizeDays);
  } else {
    // All: find earliest run date
    const dates = RUNS.map((r) => new Date(r.started).getTime());
    const minDate = dates.length > 0 ? new Date(Math.min(...dates)) : new Date(0);
    start.setTime(minDate.getTime());
  }

  const label =
    window.sizeDays === Infinity
      ? `All time (${formatDate(start)} - ${formatDate(window.end)})`
      : `${formatDate(start)} - ${formatDate(window.end)}`;

  const shiftWindow = (days: number) => {
    const d = new Date(window.end);
    d.setDate(d.getDate() + days);
    setWindow({ ...window, end: d });
  };

  const setZoom = (days: number) => {
    setWindow({ end: new Date(), sizeDays: days });
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
        background: "var(--proof-surface-2)",
        padding: "4px 8px",
        borderRadius: 8,
        border: "1px solid var(--proof-border)"
      }}
    >
      <button onClick={() => shiftWindow(-window.sizeDays)} title="Skip back" style={navBtnStyle}>
        <SkipBack size={14} />
      </button>
      <button
        onClick={() => shiftWindow(-Math.ceil(window.sizeDays / 4))}
        title="Back"
        style={navBtnStyle}
      >
        <ChevronLeft size={14} />
      </button>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--proof-text)",
          fontFamily: "var(--font-mono)",
          whiteSpace: "nowrap",
          padding: "0 8px",
          minWidth: 160,
          textAlign: "center",
        }}
      >
        {label}
      </span>
      <button
        onClick={() => shiftWindow(Math.ceil(window.sizeDays / 4))}
        title="Forward"
        style={navBtnStyle}
      >
        <ChevronRight size={14} />
      </button>
      <button onClick={() => shiftWindow(window.sizeDays)} title="Skip forward" style={navBtnStyle}>
        <SkipForward size={14} />
      </button>
      <div style={{ width: 1, height: 16, background: "var(--proof-border)", margin: "0 8px" }} />
      <div style={{ display: 'flex', gap: 4 }}>
        {ZOOM_PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => setZoom(p.days)}
            style={{
              ...zoomBtnStyle,
              background:
                window.sizeDays === p.days ? "var(--proof-blue)" : "var(--proof-surface-3)",
              color: window.sizeDays === p.days ? "#fff" : "var(--proof-text-secondary)",
              boxShadow: window.sizeDays === p.days ? "var(--proof-shadow-sm)" : "none",
              border: window.sizeDays === p.days ? "none" : "1px solid var(--proof-border)"
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  background: "var(--proof-surface-3)",
  cursor: "pointer",
  padding: "4px 6px",
  borderRadius: 6,
  color: "var(--proof-text-secondary)",
  display: "flex",
  alignItems: "center",
  transition: "all 0.2s",
  border: "1px solid var(--proof-border)"
};

const zoomBtnStyle: React.CSSProperties = {
  ...navBtnStyle,
  fontSize: 10,
  fontWeight: 700,
  padding: "3px 8px",
};

// ── Per-Test History Strip ───────────────────────────────────────────────────

interface DotData {
  runId: string;
  status: "PASS" | "FAIL";
  date: string;
  resultId: string;
}

export function TestHistoryStrip({
  testName,
  currentRunId,
}: {
  testName: string;
  currentRunId?: string;
}) {
  const [, navigate] = useLocation();
  const { window } = useTimeWindow();

  const dots = React.useMemo(() => {
    const seen = new Set<string>();
    const result: DotData[] = [];
    for (const run of RUNS) {
      const results = getTestResultsForRun(run.id);
      const match = results.find((r) => r.name === testName);
      if (match && !seen.has(run.id)) {
        seen.add(run.id);
        result.push({ runId: run.id, status: match.status, date: run.started, resultId: match.id });
      }
    }
    result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return result;
  }, [testName]);

  const windowStart = React.useMemo(() => {
    const d = new Date(window.end);
    if (window.sizeDays < Infinity) {
      d.setDate(d.getDate() - window.sizeDays);
    } else {
      const dates = RUNS.map((r) => new Date(r.started).getTime());
      d.setTime(dates.length > 0 ? Math.min(...dates) : 0);
    }
    return d;
  }, [window.end, window.sizeDays]);

  const filtered = React.useMemo(
    () =>
      dots.filter((d) => {
        const dt = new Date(d.date);
        return dt >= windowStart && dt <= window.end;
      }),
    [dots, windowStart, window.end],
  );

  // Group dots by day for compact display
  const groups = React.useMemo(() => {
    const map = new Map<string, DotData[]>();
    for (const d of filtered) {
      const day = d.date.slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(d);
    }
    return Array.from(map.entries())
      .map(([day, items]) => ({ day, items }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }, [filtered]);

  if (filtered.length === 0) {
    return (
      <span style={{ fontSize: 10, color: "var(--proof-text-muted)", fontStyle: "italic" }}>—</span>
    );
  }

  // Center on current run, show ~7 before and ~7 after
  const centerIdx = currentRunId
    ? groups.findIndex((g) => g.items.some((i) => i.runId === currentRunId))
    : -1;
  const half = 7;
  const startIdx = centerIdx >= 0 ? Math.max(0, centerIdx - half) : Math.max(0, groups.length - 15);
  const endIdx = centerIdx >= 0 ? Math.min(groups.length, centerIdx + half + 1) : groups.length;
  const visible = groups.slice(startIdx, endIdx);
  const hasOlder = startIdx > 0;
  const hasNewer = endIdx < groups.length;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        flexWrap: "nowrap",
        whiteSpace: "nowrap",
        overflow: "hidden",
        maxWidth: "100%",
        padding: "8px 12px",
        background: "var(--proof-surface-1)",
        borderRadius: "12px",
        border: "1px solid var(--proof-border)"
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {hasOlder && (
        <span
          style={{
            fontSize: 9,
            color: "var(--proof-text-muted)",
            fontFamily: "var(--font-mono)",
            marginRight: 4,
            fontWeight: 800
          }}
        >
          &laquo;
        </span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {visible.map((g) => {
          const pct = g.items.filter((i) => i.status === "PASS").length / g.items.length;
          const allPass = pct === 1;
          const allFail = pct === 0;
          const isDense = g.items.length > 1;
          return (
            <div
              key={g.day}
              title={
                `${g.day}\n${g.items.length} run${g.items.length > 1 ? "s" : ""}\n` +
                g.items
                  .map(
                    (i) =>
                      `  ${i.status} · ${new Date(i.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
                  )
                  .join("\n")
              }
              onClick={(e) => {
                e.stopPropagation();
                if (g.items.length === 1) {
                  navigate(`/runs/${g.items[0].runId}?testId=${g.items[0].resultId}`);
                }
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: isDense ? 1 : 0,
                cursor: "pointer",
                flexShrink: 0,
                transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.4) translateY(-2px)";
                e.currentTarget.style.zIndex = "10";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.zIndex = "1";
              }}
            >
              {/* Dot */}
              {isDense ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 16,
                    height: 16,
                    borderRadius: 4,
                    fontSize: 9,
                    fontWeight: 800,
                    fontFamily: "var(--font-mono)",
                    background: allPass
                      ? "var(--proof-green)"
                      : allFail
                        ? "var(--proof-red)"
                        : "var(--proof-yellow)",
                    color: "white",
                    padding: "0 3px",
                    lineHeight: "16px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }}
                >
                  {g.items.length}
                </span>
              ) : (
                (() => {
                  const color =
                    g.items[0].status === "PASS" ? "var(--proof-green)" : "var(--proof-red)";
                  const isSelected = currentRunId && g.items[0].runId === currentRunId;
                  return (
                    <div
                      style={{
                        position: "relative",
                        width: isSelected ? 20 : 12,
                        height: isSelected ? 20 : 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {isSelected && (
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "50%",
                            border: `2px solid ${color}`,
                            background: "transparent",
                            boxSizing: "border-box",
                            animation: "pulse-dot 2s infinite"
                          }}
                        />
                      )}
                      <div
                        style={{
                          width: isSelected ? 10 : 12,
                          height: isSelected ? 10 : 12,
                          borderRadius: "50%",
                          background: color,
                          flexShrink: 0,
                          border: "1px solid rgba(0,0,0,0.15)",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                        }}
                      />
                    </div>
                  );
                })()
              )}
            </div>
          );
        })}
      </div>
      {hasNewer && (
        <span
          style={{
            fontSize: 9,
            color: "var(--proof-text-muted)",
            fontFamily: "var(--font-mono)",
            marginLeft: 4,
            fontWeight: 800
          }}
        >
          &raquo;
        </span>
      )}
    </div>
  );
}

// ── Full Timeline Section ────────────────────────────────────────────────────

export function HistoryTimelineSection({ testName }: { testName: string }) {
  return (
    <div
      className="proof-card"
      style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
    >
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid var(--proof-grey)",
          background: "var(--proof-surface-hover)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <TimeWindowControls />
      </div>
      <div style={{ padding: "8px 12px" }}>
        <TestHistoryStrip testName={testName} />
      </div>
    </div>
  );
}
