import React, { useCallback, useMemo, useState } from "react";
import { useLocation } from "wouter";

interface HeatmapDay {
  date: string;
  passRate: number;
  runCount: number;
}

interface PassRateHeatmapProps {
  data: HeatmapDay[];
}

const CELL = 12;
const GAP = 2;

function getColor(passRate: number | null): string {
  if (passRate === null) return "#1a1d24";
  if (passRate >= 100) return "#22c55e";
  if (passRate >= 90) return "#65a30d";
  if (passRate >= 80) return "#f59e0b";
  if (passRate >= 70) return "#f97316";
  return "#ef4444";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Mon", "", "Wed", "", "Fri", "", ""];

export function PassRateHeatmap({ data }: PassRateHeatmapProps) {
  const [, nav] = useLocation();
  const [tip, setTip] = useState<{
    date: string;
    passRate: number | null;
    runCount: number;
    x: number;
    y: number;
  } | null>(null);

  const dayMap = useMemo(() => {
    const m = new Map<string, HeatmapDay>();
    for (const d of data) m.set(d.date, d);
    return m;
  }, [data]);

  const { weeks, mlabels } = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - 364);
    start.setHours(0, 0, 0, 0);
    while (start.getDay() !== 1) start.setDate(start.getDate() - 1);

    const days: { date: string; day: Date; data: HeatmapDay | null }[] = [];
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const s = d.toISOString().slice(0, 10);
      days.push({ date: s, day: new Date(d), data: dayMap.get(s) ?? null });
    }

    const weeks: (typeof days)[] = [];
    let wk: typeof days = [];
    for (const d of days) {
      wk.push(d);
      if (d.day.getDay() === 0) {
        weeks.push(wk);
        wk = [];
      }
    }
    if (wk.length) weeks.push(wk);

    const mlabels: { wi: number; label: string }[] = [];
    for (let i = 0; i < weeks.length; i++) {
      const mid = weeks[i][Math.floor(weeks[i].length / 2)];
      if (!mid) continue;
      const m = mid.day.getMonth();
      const prev = i > 0 ? weeks[i - 1][Math.floor(weeks[i - 1].length / 2)]?.day.getMonth() : -1;
      if (m !== prev) mlabels.push({ wi: i, label: MONTHS[m] });
    }
    return { weeks, mlabels };
  }, [dayMap]);

  return (
    <div style={{ overflowX: "auto", position: "relative" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: GAP }}>
        <div
          style={{
            display: "flex",
            paddingLeft: 30,
            height: 14,
            fontSize: 10,
            color: "var(--proof-text-secondary)",
          }}
        >
          {weeks.map((_, i) => {
            const ml = mlabels.find((m) => m.wi === i);
            return (
              <span
                key={i}
                style={{
                  width: CELL,
                  textAlign: "center",
                  fontSize: 9,
                  visibility: ml ? "visible" : "hidden",
                  lineHeight: "14px",
                }}
              >
                {ml?.label ?? ""}
              </span>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: GAP }}>
          <div style={{ display: "flex", flexDirection: "column", gap: GAP, paddingRight: 2 }}>
            {DAYS.map((l, i) => (
              <div
                key={i}
                style={{
                  height: CELL,
                  fontSize: 10,
                  lineHeight: `${CELL}px`,
                  color: "var(--proof-text-secondary)",
                  textAlign: "right",
                }}
              >
                {l}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: GAP }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: "flex", flexDirection: "column", gap: GAP }}>
                {Array.from({ length: 7 }).map((_, di) => {
                  const day = week[di];
                  if (!day?.date) return <div key={di} style={{ width: CELL, height: CELL }} />;
                  const pr = day.data?.passRate ?? null;
                  return (
                    <div
                      key={di}
                      onClick={() => nav(`/runs?date=${day.date}`)}
                      onMouseEnter={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        setTip({
                          date: day.date,
                          passRate: pr,
                          runCount: day.data?.runCount ?? 0,
                          x: r.left + r.width / 2,
                          y: r.top - 4,
                        });
                      }}
                      onMouseLeave={() => setTip(null)}
                      style={{
                        width: CELL,
                        height: CELL,
                        borderRadius: 2,
                        cursor: "pointer",
                        backgroundColor: getColor(pr),
                        transition: "background-color 0.1s",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            justifyContent: "flex-end",
            fontSize: 10,
            color: "var(--proof-text-secondary)",
            marginTop: 4,
          }}
        >
          <span>Less</span>
          {["#1a1d24", "#ef4444", "#f97316", "#f59e0b", "#65a30d", "#22c55e"].map((c, i) => (
            <div
              key={i}
              style={{
                width: CELL,
                height: CELL,
                borderRadius: 2,
                backgroundColor: c,
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {tip && (
        <div
          style={{
            position: "fixed",
            left: tip.x,
            top: tip.y,
            transform: "translate(-50%,-100%)",
            background: "#1a1d24",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: 11,
            color: "var(--proof-text)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 1000,
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          <div style={{ fontWeight: 600 }}>{tip.date}</div>
          <div>
            {tip.passRate !== null ? `${tip.passRate}% pass rate` : "No runs"}
            {tip.runCount > 0 ? ` · ${tip.runCount} run${tip.runCount !== 1 ? "s" : ""}` : ""}
          </div>
        </div>
      )}
    </div>
  );
}
