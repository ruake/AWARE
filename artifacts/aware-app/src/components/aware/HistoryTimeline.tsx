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
  return (
    <TimeWindowCtx.Provider value={{ window, setWindow }}>
      {children}
    </TimeWindowCtx.Provider>
  );
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
        gap: 4,
        flexShrink: 0,
      }}
    >
      <button
        onClick={() => shiftWindow(-window.sizeDays)}
        title="Skip back"
        style={navBtnStyle}
      >
        <SkipBack size={12} />
      </button>
      <button
        onClick={() => shiftWindow(-Math.ceil(window.sizeDays / 4))}
        title="Back"
        style={navBtnStyle}
      >
        <ChevronLeft size={12} />
      </button>
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "var(--proof-text-secondary)",
          fontFamily: "var(--font-mono)",
          whiteSpace: "nowrap",
          padding: "0 4px",
          minWidth: 140,
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
        <ChevronRight size={12} />
      </button>
      <button
        onClick={() => shiftWindow(window.sizeDays)}
        title="Skip forward"
        style={navBtnStyle}
      >
        <SkipForward size={12} />
      </button>
      <div style={{ width: 1, height: 16, background: "var(--proof-border)", margin: "0 4px" }} />
      {ZOOM_PRESETS.map((p) => (
        <button
          key={p.label}
          onClick={() => setZoom(p.days)}
          style={{
            ...zoomBtnStyle,
            background:
              window.sizeDays === p.days ? "var(--proof-blue)" : "var(--proof-surface-hover)",
            color: window.sizeDays === p.days ? "#fff" : "var(--proof-text-secondary)",
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  border: "none",
  background: "var(--proof-surface-hover)",
  cursor: "pointer",
  padding: "3px 5px",
  borderRadius: 3,
  color: "var(--proof-text-secondary)",
  display: "flex",
  alignItems: "center",
  transition: "all 0.1s",
};

const zoomBtnStyle: React.CSSProperties = {
  ...navBtnStyle,
  fontSize: 9,
  fontWeight: 700,
  padding: "2px 6px",
};

// ── Per-Test History Strip ───────────────────────────────────────────────────

interface DotData {
  runId: string;
  status: "PASS" | "FAIL";
  date: string;
}

export function TestHistoryStrip({ testName, currentRunId }: { testName: string; currentRunId?: string }) {
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
        result.push({ runId: run.id, status: match.status, date: run.started });
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
      <span style={{ fontSize: 10, color: "var(--proof-text-muted)", fontStyle: "italic" }}>
        —
      </span>
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
        gap: 2,
        flexWrap: "nowrap",
        whiteSpace: "nowrap",
        overflow: "hidden",
        maxWidth: "100%",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {hasOlder && (
        <span style={{ fontSize: 7, color: "var(--proof-text-muted)", fontFamily: "var(--font-mono)", marginRight: 1 }}>◀</span>
      )}
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
                navigate(`/runs/${g.items[0].runId}`);
              }
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: isDense ? 1 : 0,
              cursor: "pointer",
              flexShrink: 0,
              transition: "transform 0.12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {/* Dot */}
            {isDense ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 14,
                  height: 14,
                  borderRadius: 3,
                  fontSize: 8,
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  background: allPass
                    ? "var(--proof-green)"
                    : allFail
                      ? "var(--proof-red)"
                      : "var(--proof-yellow)",
                  color: allPass || allFail ? "#fff" : "#000",
                  padding: "0 2px",
                  lineHeight: "14px",
                }}
              >
                {g.items.length}
              </span>
            ) : (() => {
              const color = g.items[0].status === "PASS" ? "var(--proof-green)" : "var(--proof-red)";
              const isSelected = currentRunId && g.items[0].runId === currentRunId;
              return (
                <div style={{ position: "relative", width: isSelected ? 18 : 10, height: isSelected ? 18 : 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {isSelected && <div style={{ position: "absolute", width: 16, height: 16, borderRadius: "50%", border: `2px solid ${color}`, background: "transparent", boxSizing: "border-box" }} />}
                  <div style={{ width: isSelected ? 8 : 10, height: isSelected ? 8 : 10, borderRadius: "50%", background: color, flexShrink: 0, border: "1px solid rgba(0,0,0,0.25)" }} />
                </div>
              );
            })()}
          </div>
        );
      })}
      {hasNewer && (
        <span style={{ fontSize: 7, color: "var(--proof-text-muted)", fontFamily: "var(--font-mono)", marginLeft: 1 }}>▶</span>
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
