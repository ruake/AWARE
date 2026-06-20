import React from "react";

interface RunRibbonCardProps {
  label: string;
  run?: { id: string; passPct: number; env: string; started: string };
  nextDue?: string;
  icon: React.ReactNode;
  accent: string;
  onClick?: () => void;
  index: number;
}

export function RunRibbonCard({
  label,
  run,
  nextDue,
  icon,
  accent,
  onClick,
  index,
}: RunRibbonCardProps) {
  const [now, setNow] = React.useState(Date.now);
  React.useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const age = React.useMemo(() => {
    const ts = run?.started ?? nextDue;
    if (!ts) return "—";
    const diffMs = now - new Date(ts).getTime();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 0) {
      const futureMins = Math.floor(-diffMs / 60_000);
      if (futureMins < 60) return `in ${futureMins}m`;
      const futureHrs = Math.floor(futureMins / 60);
      if (futureHrs < 24) return `in ${futureHrs}h`;
      return `in ${Math.floor(futureHrs / 24)}d`;
    }
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }, [run?.started, nextDue, now]);

  const c = run
    ? run.passPct >= 95
      ? "var(--proof-green)"
      : run.passPct >= 80
        ? "var(--proof-yellow)"
        : "var(--proof-red)"
    : "var(--proof-text-muted)";

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${label}: ${run?.id ?? (nextDue ? "Scheduled" : "No run")}`}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: "var(--proof-radius-lg)",
        background: "var(--proof-surface)",
        border: `1px solid var(--proof-border)`,
        borderLeft: `3px solid ${accent}`,
        cursor: onClick ? "pointer" : "default",
        transition:
          "border-color var(--proof-transition), background var(--proof-transition), box-shadow var(--proof-transition), transform var(--proof-transition)",
        minWidth: 0,
        animation: `card-enter 0.3s cubic-bezier(0.2,0,0,1) ${index * 60}ms both`,
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.background = "var(--proof-hover)";
          e.currentTarget.style.boxShadow = "var(--proof-shadow-card-hover)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--proof-surface)";
        e.currentTarget.style.boxShadow = "";
        e.currentTarget.style.transform = "";
      }}
      onMouseDown={(e) => {
        if (onClick) e.currentTarget.style.transform = "scale(0.985)";
      }}
      onMouseUp={(e) => {
        if (onClick) e.currentTarget.style.transform = "translateY(-1px)";
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: 8,
          background: `${accent}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid ${accent}30`,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "var(--proof-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.3px",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--proof-text)",
            fontFamily: "var(--font-mono)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {run?.id ?? (nextDue ? "Scheduled" : "—")}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
          {run ? (
            <>
              <span style={{ fontSize: 10, color: "var(--proof-text-muted)" }}>{run.env}</span>
              <span
                style={{
                  width: 2,
                  height: 2,
                  borderRadius: "50%",
                  background: "var(--proof-border-strong)",
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: 10, color: c, fontWeight: 700 }}>{run.passPct}%</span>
            </>
          ) : nextDue ? (
            <span style={{ fontSize: 10, color: "var(--proof-text-muted)" }}>Next due</span>
          ) : null}
          <span
            style={{
              width: 2,
              height: 2,
              borderRadius: "50%",
              background: "var(--proof-border-strong)",
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 10, color: "var(--proof-text-muted)" }}>{age}</span>
        </div>
      </div>
    </div>
  );
}
