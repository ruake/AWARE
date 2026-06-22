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

type SortKey = "runId" | "status" | "duration" | "env";

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
      <div className="proof-card" style={{ padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "var(--proof-text-secondary)" }}>
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
    if (clean !== key) return <ArrowUpDown size={11} style={{ opacity: 0.3 }} />;
    return hSort.startsWith("-") ? <ArrowDown size={11} /> : <ArrowUp size={11} />;
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
            padding: "12px 16px",
            borderBottom: "1px solid var(--proof-border)",
            background: "var(--proof-surface-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--proof-text)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              margin: 0,
            }}
          >
            <Filter size={16} style={{ color: "var(--proof-blue)" }} /> Flakiness Leaderboard
            <span style={{ fontSize: 11, fontWeight: 500, color: "var(--proof-text-muted)", background: "var(--proof-surface-3)", padding: "2px 8px", borderRadius: "10px" }}>
              {filteredHistory.length} of {enriched.length}
            </span>
          </h3>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div
              style={{
                display: "flex",
                gap: 2,
                background: "var(--proof-surface-3)",
                borderRadius: 8,
                padding: 2,
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
                    padding: "4px 12px",
                    fontSize: 11,
                    fontWeight: 600,
                    borderRadius: 6,
                    background: hStatus === s ? "var(--proof-blue)" : "transparent",
                    color: hStatus === s ? "white" : "var(--proof-text-secondary)",
                    transition: "all 0.2s",
                  }}
                >
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>
            <select
              className="proof-select"
              value={hEnv}
              onChange={(e) => setHEnv(e.target.value)}
              style={{ fontSize: 11, padding: "5px 10px", height: "auto", minWidth: 120 }}
            >
              <option value="all">All envs</option>
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
                gap: 6,
                cursor: "pointer",
                padding: "6px 12px",
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 600,
                border: "1px solid var(--proof-border)",
                background: hErrOnly ? "rgba(234, 179, 8, 0.15)" : "var(--proof-surface-3)",
                color: hErrOnly ? "var(--proof-yellow)" : "var(--proof-text-secondary)",
                transition: "all 0.2s",
              }}
            >
              <Bug size={12} /> Errors only
            </button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="proof-table">
            <thead>
              <tr>
                <th
                  onClick={() => toggleSort("runId")}
                  style={{ cursor: "pointer", userSelect: "none" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                    Run ID {sortIcon("runId")}
                  </span>
                </th>
                <th
                  onClick={() => toggleSort("status")}
                  style={{ cursor: "pointer", userSelect: "none" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                    Status {sortIcon("status")}
                  </span>
                </th>
                <th
                  onClick={() => toggleSort("duration")}
                  style={{ textAlign: "right", cursor: "pointer", userSelect: "none" }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                      justifyContent: "flex-end",
                    }}
                  >
                    Duration {sortIcon("duration")}
                  </span>
                </th>
                <th
                  onClick={() => toggleSort("env")}
                  style={{ cursor: "pointer", userSelect: "none" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                    Environment {sortIcon("env")}
                  </span>
                </th>
                <th style={{ textAlign: "right" }}>Flakiness</th>
                <th>Error</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((h) => {
                const isSlow = h.duration > avgDuration * 2;
                const isWarn = h.duration > avgDuration * 1.5;
                const flakiness = enriched.length > 0 ? (enriched.filter(e => e.status !== enriched[0].status).length / (enriched.length - 1 || 1)) * 100 : 0; // Simplified flakiness for the row
                
                return (
                  <tr
                    key={h.runId}
                    onClick={() => setSelectedRow(h)}
                    style={{
                      cursor: "pointer",
                      background: selectedRow?.runId === h.runId ? "var(--proof-blue-bg)" : undefined,
                    }}
                  >
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRow(h);
                        }}
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
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
                    <td>
                      <span
                        className={`proof-badge ${h.status === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`}
                      >
                        {h.status}
                      </span>
                      {h.assertionsFailed > 0 && (
                        <span
                          style={{
                            fontSize: 10,
                            marginLeft: 4,
                            color: "var(--proof-red)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {h.assertionsFailed}✗
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: isSlow ? "var(--proof-red)" : isWarn ? "var(--proof-yellow)" : "var(--proof-text-secondary)",
                        fontWeight: isSlow || isWarn ? 600 : 400,
                      }}
                    >
                      {h.duration}ms
                    </td>
                    <td style={{ fontSize: 12 }}>{h.env}</td>
                    <td style={{ textAlign: "right", width: 80 }}>
                      <div style={{ width: "100%", height: 4, background: "var(--proof-grey-bg)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ 
                          height: "100%", 
                          width: `${flakiness}%`, 
                          background: flakiness > 50 ? "var(--proof-red)" : flakiness > 25 ? "var(--proof-yellow)" : "var(--proof-green)" 
                        }} />
                      </div>
                    </td>
                    <td style={{ fontSize: 11 }}>
                      {h.error ? (
                        <span
                          style={{
                            color: "var(--proof-red)",
                            fontFamily: "var(--font-mono)",
                            fontSize: 10,
                          }}
                        >
                          {h.error.length > 80 ? h.error.slice(0, 80) + "..." : h.error}
                        </span>
                      ) : h.status === "FAIL" ? (
                        <span style={{ color: "var(--proof-text-secondary)", fontSize: 10 }}>
                          no error message
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRow(h);
                        }}
                        className="proof-button proof-button-xs"
                        style={{ padding: "2px 7px" }}
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
                      padding: 24,
                      fontSize: 12,
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
