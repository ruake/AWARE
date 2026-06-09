import React from "react";

interface DayData {
  date: string;
  count: number;
  envs: Record<string, number>;
}

interface Props {
  data: DayData[];
  startDate?: string;
  endDate?: string;
  onDayClick?: (day: DayData | null) => void;
}

function getIntensity(count: number, max: number): number {
  if (max === 0) return 0;
  const ratio = count / max;
  if (ratio === 0) return 0;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

const LEVEL_COLORS = [
  "transparent",
  "rgba(91,138,245,0.15)",
  "rgba(91,138,245,0.35)",
  "rgba(91,138,245,0.55)",
  "rgba(91,138,245,0.8)",
];

const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function HeatmapCalendar({ data, startDate, endDate, onDayClick }: Props) {
  const today = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(today);
  if (!startDate) start.setDate(start.getDate() - 84);

  const dayMap = new Map<string, DayData>();
  for (const d of data) {
    dayMap.set(d.date, d);
  }

  const days: { date: string; day: Date; data: DayData | null }[] = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const dateStr = cursor.toISOString().slice(0, 10);
    days.push({ date: dateStr, day: new Date(cursor), data: dayMap.get(dateStr) || null });
    cursor.setDate(cursor.getDate() + 1);
  }

  const weeks: (typeof days)[] = [];
  let currentWeek: typeof days = [];
  for (const d of days) {
    currentWeek.push(d);
    if (d.day.getDay() === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  if (weeks.length > 0) {
    const firstDay = weeks[0][0]?.day.getDay() ?? 0;
    for (let i = 0; i < firstDay; i++) {
      weeks[0].unshift({ date: "", day: new Date(0), data: null });
    }
  }

  const maxCount = Math.max(1, ...data.map(d => d.count));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", gap: 0, paddingLeft: 32, fontSize: 10, color: "var(--proof-text-secondary)", height: 14 }}>
        {weeks.map((week, wi) => {
          const midDay = week[Math.floor(week.length / 2)];
          if (!midDay || !midDay.day.getTime()) return null;
          const month = midDay.day.getMonth();
          const prevMonth = wi > 0 && weeks[wi - 1][Math.floor(weeks[wi - 1].length / 2)]?.day.getMonth();
          if (month === prevMonth) return <span key={wi} style={{ width: 14 }} />;
          return <span key={wi} style={{ width: 14, fontSize: 9 }}>{MONTH_LABELS[month].slice(0, 1)}</span>;
        })}
      </div>

      <div style={{ display: "flex", gap: 2 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingRight: 4 }}>
          {DAY_LABELS.map((label, i) => (
            <div key={i} style={{ height: 14, fontSize: 10, lineHeight: "14px", color: "var(--proof-text-secondary)", textAlign: "right" }}>
              {label}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 2 }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {Array.from({ length: 7 }).map((_, di) => {
                const day = week[di];
                if (!day || !day.date) return <div key={di} style={{ width: 14, height: 14 }} />;
                const level = day.data ? getIntensity(day.data.count, maxCount) : 0;
                return (
                  <div
                    key={di}
                    title={day.data ? `${day.date}: ${day.data.count} runs` : day.date}
                    onClick={() => onDayClick?.(day.data)}
                    style={{
                      width: 14, height: 14, borderRadius: 2, cursor: day.data ? "pointer" : "default",
                      backgroundColor: LEVEL_COLORS[level],
                      border: level === 0 ? "1px solid var(--proof-grey)" : "none",
                      transition: "background-color 0.1s",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", fontSize: 10, color: "var(--proof-text-secondary)", marginTop: 4 }}>
        <span>Less</span>
        {LEVEL_COLORS.map((c, i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: c || "transparent", border: i === 0 ? "1px solid var(--proof-grey)" : "none" }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
