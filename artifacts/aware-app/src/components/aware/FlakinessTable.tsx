import React from "react";
import { useLocation } from "wouter";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Bug,
} from "lucide-react";

export interface EnrichedHistoryRow {
  runId: string;
  status: "PASS" | "FAIL";
  duration: number;
  env: string;
  error?: string;
  assertionsPassed: number;
  assertionsFailed: number;
}

type SortKey = "runId" | "status" | "duration" | "env" | "flakiness";

interface FlakinessTableProps {
  filteredHistory: EnrichedHistoryRow[];
  enriched: EnrichedHistoryRow[];
  hStatus: string;
  setHStatus: (value: string) => void;
  hEnv: string;
  setHEnv: (value: string) => void;
  hErrOnly: boolean;
  setHErrOnly: React.Dispatch<React.SetStateAction<boolean>>;
  hSort: string;
  setHSort: React.Dispatch<React.SetStateAction<string>>;
  uniqueEnvs: string[];
  selectedRow: EnrichedHistoryRow | null;
  setSelectedRow: React.Dispatch<React.SetStateAction<EnrichedHistoryRow | null>>;
  testName: string;
}

export function FlakinessTable({
  filteredHistory,
  enriched,
  hStatus,
  setHStatus,
  hEnv,
  setHEnv,
  hErrOnly,
  setHErrOnly,
  hSort,
  setHSort,
  uniqueEnvs,
  selectedRow,
  setSelectedRow,
  testName: _testName,
}: FlakinessTableProps) {
  const [, _navigate] = useLocation();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedRow(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSelectedRow]);

  const avgDuration = React.useMemo(() => {
    if (enriched.length === 0) return 0;
    return enriched.reduce((s, h) => s + h.duration, 0) / enriched.length;
  }, [enriched]);

  if (filteredHistory.length === 0 && enriched.length === 0) {
    return (
      <div className="proof-card" style={{ padding: "32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <Filter size={32} style={{ color: "var(--proof-text-muted)" }} />
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--proof-text-secondary)" }}>
          No run history data available
        </div>
      </div>
    );
  }

  const toggleSort = (key: SortKey) => {
    setHSort((prev) => {
      const clean = prev.startsWith("-") ? prev.slice(1) : prev;
      if (clean === key) return prev.startsWith("-") ? key : `-${key}`;
      return key;
    });
  };

  const sortIcon = (key: SortKey) => {
    const clean = hSort.startsWith("-") ? hSort.slice(1) : hSort;
    if (clean !== key) return <ArrowUpDown size={12} style={{ opacity: 0.3 }} />;
    return hSort.startsWith("-") ? <ArrowDown size={12} /> : <ArrowUp size={12} />;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div
        className="proof-card"
        style={{
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          flex: selectedRow ? "0 0 auto" : 1,
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--proof-border)",
            background: "var(--proof-surface-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--proof-text)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              margin: 0,
            }}
          >
            <Filter size={18} style={{ color: "var(--proof-blue)" }} /> Flakiness Leaderboard
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--proof-text-muted)", background: "var(--proof-surface-3)", padding: "2px 10px", borderRadius: "12px", marginLeft: 8 }}>
              {filteredHistory.length} of {enriched.length}
            </span>
          </h3>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div
              style={{
                display: "flex",
                gap: 2,
                background: "var(--proof-surface-3)",
                borderRadius: "var(--proof-radius-md)",
                padding: 4,
                border: "1px solid var(--proof-border)",
              }}
            >
              {(["all", "PASS", "FAIL"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setHStatus(s)}
                  style={{
                    border: "none",
                    cursor: "pointer",
                    padding: "6px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: "var(--proof-radius-sm)",
                    background: hStatus === s ? "var(--proof-surface)" : "transparent",
                    color: hStatus === s ? "var(--proof-text)" : "var(--proof-text-secondary)",
                    boxShadow: hStatus === s ? "var(--proof-shadow-xs)" : "none",
                    transition: "all var(--proof-transition)",
                  }}
                >
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>
            <select
              className="proof-input"
              value={hEnv}
              onChange={(e) => setHEnv(e.target.value)}
              style={{ fontSize: 13, height: 32, minWidth: 140 }}
            >
              <option value="all">All Environments</option>
              {uniqueEnvs.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            <button
              onClick={() => setHErrOnly((prev) => !prev)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                padding: "0 16px",
                height: 32,
                borderRadius: "var(--proof-radius-md)",
                fontSize: 13,
                fontWeight: 600,
                border: "1px solid var(--proof-border)",
                background: hErrOnly ? "var(--proof-yellow-bg)" : "var(--proof-surface-3)",
                color: hErrOnly ? "var(--proof-yellow-bright)" : "var(--proof-text-secondary)",
                transition: "all var(--proof-transition)",
              }}
            >
              <Bug size={14} /> Errors only
            </button>
          </div>
        </div>
        <div style={{ overflowX: "auto", flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--proof-border)", background: "var(--proof-surface)", color: "var(--proof-text-muted)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <th
                  onClick={() => toggleSort("runId")}
                  style={{ padding: "16px 20px", cursor: "pointer", userSelect: "none", width: "14%" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    Run ID {sortIcon("runId")}
                  </span>
                </th>
                <th
                  onClick={() => toggleSort("status")}
                  style={{ padding: "16px 20px", cursor: "pointer", userSelect: "none", width: "12%" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    Status {sortIcon("status")}
                  </span>
                </th>
                <th
                  onClick={() => toggleSort("duration")}
                  style={{ padding: "16px 20px", textAlign: "right", cursor: "pointer", userSelect: "none", width: "12%" }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      justifyContent: "flex-end",
                    }}
                  >
                    Duration {sortIcon("duration")}
                  </span>
                </th>
                <th
                  onClick={() => toggleSort("env")}
                  style={{ padding: "16px 20px", cursor: "pointer", userSelect: "none", width: "14%" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    Environment {sortIcon("env")}
                  </span>
                </th>
                <th
                  onClick={() => toggleSort("flakiness")}
                  style={{ padding: "16px 20px", textAlign: "right", cursor: "pointer", userSelect: "none", width: "12%" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                    Pass Rate {sortIcon("flakiness")}
                  </span>
                </th>
                <th style={{ padding: "16px 20px", width: "24%" }}>Error</th>
                <th style={{ padding: "16px 20px", width: "12%", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((h) => {
                const isSlow = h.duration > avgDuration * 2;
                const isWarn = h.duration > avgDuration * 1.5;
                const passRate = enriched.length > 0 ? (enriched.filter(e => e.status === "PASS").length / enriched.length) * 100 : 0; 
                
                return (
                  <tr
                    key={h.runId}
                    onClick={() => setSelectedRow(h)}
                    style={{
                      cursor: "pointer",
                      borderBottom: "1px solid var(--proof-border-light)",
                      background: selectedRow?.runId === h.runId ? "var(--proof-surface-active)" : "var(--proof-surface)",
                      transition: "background var(--proof-transition)"
                    }}
                    onMouseEnter={(e) => {
                      if (selectedRow?.runId !== h.runId) e.currentTarget.style.background = "var(--proof-surface-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (selectedRow?.runId !== h.runId) e.currentTarget.style.background = "var(--proof-surface)";
                    }}
                  >
                    <td style={{ padding: "16px 20px" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRow(h);
                        }}
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--proof-blue)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        {h.runId}
                      </button>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <span className={`proof-badge ${h.status === "PASS" ? "proof-badge-healthy" : "proof-badge-critical"}`}>
                        {h.status}
                      </span>
                      {h.assertionsFailed > 0 && (
                        <span
                          style={{
                            fontSize: 11,
                            marginLeft: 8,
                            color: "var(--proof-red)",
                            fontFamily: "var(--font-mono)",
                            fontWeight: 600
                          }}
                        >
                          {h.assertionsFailed}✗
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "16px 20px",
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                        fontSize: 13,
                        color: isSlow ? "var(--proof-red-bright)" : isWarn ? "var(--proof-yellow-bright)" : "var(--proof-text)",
                        fontWeight: isSlow || isWarn ? 600 : 400,
                      }}
                    >
                      {h.duration}ms
                    </td>
                    <td style={{ padding: "16px 20px", fontSize: 13, color: "var(--proof-text)" }}>{h.env}</td>
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", width: "100%", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--proof-text-muted)" }}>
                          {Math.round(passRate)}%
                        </span>
                        <div style={{ width: "60px", height: 6, background: "var(--proof-surface-3)", borderRadius: "var(--proof-radius-full)", overflow: "hidden" }}>
                          <div style={{ 
                            height: "100%", 
                            width: `${passRate}%`, 
                            background: passRate >= 95 ? "var(--proof-green)" : passRate >= 80 ? "var(--proof-yellow)" : "var(--proof-red)" 
                          }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px", fontSize: 13 }}>
                      {h.error ? (
                        <span
                          style={{
                            color: "var(--proof-red-bright)",
                            fontFamily: "var(--font-mono)",
                            fontSize: 12,
                            display: "inline-block",
                            maxWidth: "100%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                          title={h.error}
                        >
                          {h.error}
                        </span>
                      ) : h.status === "FAIL" ? (
                        <span style={{ color: "var(--proof-text-secondary)", fontSize: 12, fontStyle: "italic" }}>
                          no error message
                        </span>
                      ) : (
                        <span style={{ color: "var(--proof-text-disabled)", fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "right" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRow(h);
                        }}
                        className="proof-btn proof-btn-ghost"
                        style={{ padding: "4px 12px", fontSize: 12 }}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredHistory.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: 48,
                      fontSize: 14,
                      color: "var(--proof-text-secondary)",
                    }}
                  >
                    No matching results for the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
