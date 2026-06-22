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
  onCellClick?: (date: string) => void;
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
  "var(--proof-surface-3)",
  "var(--proof-red-bg)",
  "var(--proof-yellow-bg)",
  "var(--proof-blue-bg)",
  "var(--proof-emerald)",
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function HeatmapCalendar({ data, startDate, endDate, onDayClick, onCellClick }: Props) {
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

  const maxCount = Math.max(1, ...data.map((d) => d.count));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "24px", background: "var(--proof-surface)", borderRadius: "var(--proof-radius-lg)", border: "1px solid var(--proof-border)", height: "100%", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          gap: 0,
          paddingLeft: 36,
          fontSize: 11,
          color: "var(--proof-text-secondary)",
          height: 16,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}
      >
        {weeks.map((week, wi) => {
          const midDay = week[Math.floor(week.length / 2)];
          if (!midDay || !midDay.day.getTime()) return null;
          const month = midDay.day.getMonth();
          const prevMonth =
            wi > 0 && weeks[wi - 1][Math.floor(weeks[wi - 1].length / 2)]?.day.getMonth();
          if (month === prevMonth) return <span key={wi} style={{ width: 16 }} />;
          return (
            <span key={wi} style={{ width: 16 }}>
              {MONTH_LABELS[month]}
            </span>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingRight: 4 }}>
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              style={{
                height: 12,
                fontSize: 10,
                lineHeight: "12px",
                color: "var(--proof-text-muted)",
                textAlign: "right",
                fontWeight: 600,
                visibility: i % 2 === 0 ? "visible" : "hidden"
              }}
            >
              {label}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 4 }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {Array.from({ length: 7 }).map((_, di) => {
                const day = week[di];
                if (!day || !day.date) return <div key={di} style={{ width: 12, height: 12 }} />;
                const level = day.data ? getIntensity(day.data.count, maxCount) : 0;
                const handleClick = () => {
                  if (onCellClick && day.date) {
                    onCellClick(day.date);
                  } else {
                    onDayClick?.(day.data);
                  }
                };
                const Tag = onCellClick ? "button" : "div";
                const cellStyle: React.CSSProperties = {
                  width: 12,
                  height: 12,
                  borderRadius: "3px",
                  cursor: onCellClick || day.data ? "pointer" : "default",
                  backgroundColor: LEVEL_COLORS[level],
                  transition: "all var(--proof-transition)",
                };
                if (Tag === "button") {
                  cellStyle.padding = 0;
                  cellStyle.border = "none";
                  cellStyle.outline = "none";
                } else {
                  cellStyle.border = "none";
                }
                
                return (
                  <Tag
                    key={di}
                    title={day.data ? `${day.date}: ${day.data.count} runs` : day.date}
                    onClick={handleClick}
                    style={cellStyle}
                    className="heatmap-cell"
                    onMouseEnter={(e: any) => {
                      e.currentTarget.style.transform = "scale(1.4)";
                      e.currentTarget.style.zIndex = "10";
                      e.currentTarget.style.boxShadow = "var(--proof-shadow-sm)";
                      e.currentTarget.style.borderRadius = "4px";
                    }}
                    onMouseLeave={(e: any) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.zIndex = "1";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.borderRadius = "3px";
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
          gap: 8,
          justifyContent: "flex-end",
          fontSize: 11,
          color: "var(--proof-text-muted)",
          marginTop: 8,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px"
        }}
      >
        <span>Less</span>
        <div style={{ display: "flex", gap: 4 }}>
          {LEVEL_COLORS.map((c, i) => (
            <div
              key={i}
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                backgroundColor: c,
              }}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
