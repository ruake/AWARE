import React from "react";
import { Calendar, Clock, Activity } from "lucide-react";
import { getSchedulerStatus, subscribeToSchedulerStatus } from "@/lib/data";
import type { SchedulerStatus } from "@/lib/data";

const STATUS_COLORS: Record<string, string> = {
  healthy: "var(--proof-green)",
  degraded: "var(--proof-yellow)",
  error: "var(--proof-red)",
};

const SUITE_STATUS_GLYPH: Record<string, string> = {
  idle: "\u26AA",
  running: "\u{1F7E2}",
  passed: "\u2705",
  failed: "\u274C",
};

export function SchedulerStatusCard() {
  const [status, setStatus] = React.useState<SchedulerStatus>(getSchedulerStatus);

  React.useEffect(() => {
    const unsub = subscribeToSchedulerStatus(() => {
      setStatus(getSchedulerStatus());
    });
    return unsub;
  }, []);

  if (!status.lastRun) {
    return (
      <div className="proof-card" style={{ padding: 16 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 8,
          }}
        >
          <Calendar size={14} style={{ color: "var(--proof-text-secondary)" }} />
          Scheduler
        </div>
        <div style={{ fontSize: 12, color: "var(--proof-text-secondary)" }}>
          No scheduler runs yet. The scheduler activates after the next cron cycle.
        </div>
      </div>
    );
  }

  return (
    <div className="proof-card" style={{ overflow: "hidden" }}>
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--proof-grey)",
          background: "var(--proof-grey-bg)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3
          style={{
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Calendar size={14} />
          Suite Scheduler
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: STATUS_COLORS[status.status] || "var(--proof-text-secondary)",
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 11, fontWeight: 500, textTransform: "capitalize" }}>
            {status.status}
          </span>
          <span style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>
            {new Date(status.lastRun).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Summary row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 0,
          borderBottom: "1px solid var(--proof-grey)",
        }}
      >
        {[
          { label: "Suites", value: status.summary.total, color: "var(--proof-text)" },
          { label: "Scheduled", value: status.summary.scheduled, color: "var(--proof-blue)" },
          { label: "Due Now", value: status.summary.due, color: "var(--proof-green)" },
          { label: "Running", value: status.summary.running, color: "var(--proof-yellow)" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: "10px 12px",
              textAlign: "center",
              borderRight: "1px solid var(--proof-grey)",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 10, color: "var(--proof-text-secondary)", marginTop: 2 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Suite status table */}
      <div style={{ overflowX: "auto" }}>
        <table className="proof-table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Suite</th>
              <th>Schedule</th>
              <th>Status</th>
              <th>Runs</th>
            </tr>
          </thead>
          <tbody>
            {status.suites.map((suite) => (
              <tr key={suite.id}>
                <td>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{suite.name}</div>
                  <div style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>
                    {suite.id}
                  </div>
                </td>
                <td>
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                      color: "var(--proof-text-secondary)",
                    }}
                  >
                    {suite.scheduleDesc || suite.schedule || "\u2014"}
                  </div>
                </td>
                <td>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                    }}
                  >
                    {SUITE_STATUS_GLYPH[suite.status] || "\u26AA"}{" "}
                    <span
                      style={{
                        textTransform: "capitalize",
                        color:
                          suite.status === "failed"
                            ? "var(--proof-red)"
                            : suite.status === "passed"
                              ? "var(--proof-green)"
                              : suite.status === "running"
                                ? "var(--proof-blue)"
                                : "var(--proof-text-secondary)",
                      }}
                    >
                      {suite.status}
                    </span>
                  </span>
                </td>
                <td
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--proof-text-secondary)",
                  }}
                >
                  {suite.activeRuns > 0 ? (
                    <span style={{ color: "var(--proof-blue)", fontWeight: 600 }}>
                      {suite.activeRuns} active
                    </span>
                  ) : suite.lastConclusion ? (
                    <span
                      style={{
                        color:
                          suite.lastConclusion === "success"
                            ? "var(--proof-green)"
                            : "var(--proof-red)",
                      }}
                    >
                      {suite.lastConclusion}
                    </span>
                  ) : (
                    "\u2014"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent dispatches */}
      {status.recentDispatches.length > 0 && (
        <div
          style={{
            borderTop: "1px solid var(--proof-grey)",
            padding: "10px 16px",
            background: "var(--proof-surface)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--proof-text-secondary)",
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Activity size={11} />
            Recent Dispatches
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {status.recentDispatches.slice(0, 5).map((d, i) => (
              <div
                key={`${d.timestamp}-${i}`}
                style={{
                  fontSize: 11,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: "var(--proof-text-secondary)",
                }}
              >
                <Clock size={10} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>
                  {new Date(d.timestamp).toLocaleTimeString()}
                </span>
                <span style={{ fontWeight: 500, color: "var(--proof-text)" }}>{d.suite}</span>
                <span>
                  {d.dispatched}/{d.environments.length} envs
                </span>
                {d.failed > 0 && (
                  <span style={{ color: "var(--proof-red)" }}>({d.failed} failed)</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
