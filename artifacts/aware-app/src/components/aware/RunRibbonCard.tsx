import React from "react";
import { Clock, Calendar, ArrowRight } from "lucide-react";

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
  const [hovered, setHovered] = React.useState(false);

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

  const passColor = run
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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 16,
        background: hovered
          ? `linear-gradient(90deg, ${accent}10, var(--proof-surface-2))`
          : `linear-gradient(90deg, ${accent}08, var(--proof-surface))`,
        border: `1px solid ${hovered ? accent + "30" : "var(--proof-border)"}`,
        borderLeft: `3px solid ${accent}`,
        cursor: onClick ? "pointer" : "default",
        transition: "all 160ms cubic-bezier(0.2,0,0,1)",
        boxShadow: hovered
          ? `0 0 0 1px ${accent}20, 0 8px 24px rgba(0,0,0,0.5), 0 0 24px ${accent}10`
          : "0 0 0 1px rgba(99,130,178,0.08), 0 2px 8px rgba(0,0,0,0.3)",
        transform: hovered ? "translateY(-2px)" : "none",
        minWidth: 0,
        animation: `card-enter 0.35s cubic-bezier(0.2,0,0,1) ${index * 60}ms both`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Icon */}
      <div
        style={{
          flexShrink: 0,
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `linear-gradient(135deg, ${accent}24, ${accent}10)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid ${accent}30`,
          boxShadow: `0 0 12px ${accent}18`,
        }}
      >
        {icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 9.5,
            fontWeight: 700,
            color: "var(--proof-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.7px",
            marginBottom: 3,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: "var(--proof-text)",
            fontFamily: "var(--font-mono)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            letterSpacing: "-0.3px",
          }}
        >
          {run?.id ?? (nextDue ? "Scheduled" : "—")}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
          {run ? (
            <>
              <span
                style={{
                  fontSize: 10,
                  color: "var(--proof-text-muted)",
                  background: "var(--proof-subtle-bg)",
                  border: "1px solid var(--proof-border-light)",
                  borderRadius: 5,
                  padding: "1px 5px",
                }}
              >
                {run.env}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: passColor,
                  fontFamily: "var(--font-mono)",
                  background: `${passColor}14`,
                  border: `1px solid ${passColor}25`,
                  borderRadius: 5,
                  padding: "1px 5px",
                  letterSpacing: "-0.3px",
                }}
              >
                {run.passPct}%
              </span>
            </>
          ) : nextDue ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontSize: 10,
                color: accent,
                fontWeight: 600,
              }}
            >
              <Calendar size={9} />
              Next due
            </span>
          ) : null}

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              fontSize: 10,
              color: "var(--proof-text-muted)",
            }}
          >
            <Clock size={9} />
            {age}
          </span>
        </div>
      </div>

      {/* Hover arrow */}
      {onClick && (
        <ArrowRight
          size={14}
          style={{
            color: accent,
            opacity: hovered ? 0.8 : 0,
            transition: "opacity 160ms ease, transform 160ms ease",
            transform: hovered ? "translateX(0)" : "translateX(-4px)",
            flexShrink: 0,
          }}
        />
      )}
    </div>
  );
}
