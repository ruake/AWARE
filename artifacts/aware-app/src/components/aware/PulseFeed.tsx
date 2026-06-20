import React from "react";
import { Activity, ExternalLink } from "lucide-react";
import type { Run } from "@/lib/types";
import { RunRow } from "./PulseDetail";

const GH_ACTIONS_URL = `https://github.com/ruake/AWARE/actions`;

interface PulseFeedProps {
  filtered: readonly Run[];
  activeTab: "all" | Run["status"];
  onTabChange: (tab: "all" | Run["status"]) => void;
  tabCounts: Record<string, number>;
  onRunClick: (id: string) => void;
}

const statusTabs: { key: "all" | Run["status"]; label: string }[] = [
  { key: "all", label: "All" },
  { key: "RUNNING", label: "Running" },
  { key: "PASS", label: "Passed" },
  { key: "FAIL", label: "Failed" },
  { key: "FLAKY", label: "Flaky" },
  { key: "PARTIAL", label: "Partial" },
];

export function PulseFeed({ filtered, activeTab, onTabChange, tabCounts, onRunClick }: PulseFeedProps) {
  return (
    <div
      style={{ borderRadius: 10, border: "1px solid var(--proof-border)", overflow: "hidden" }}
    >
      <div
        style={{
          padding: "11px 16px",
          borderBottom: "1px solid var(--proof-border)",
          background: "var(--proof-surface)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <h3
            style={{
              fontSize: 13,
              fontWeight: 700,
              marginRight: 6,
              color: "var(--proof-text)",
            }}
          >
            Workflow History
          </h3>
          <div
            style={{
              width: 1,
              height: 14,
              background: "var(--proof-border-strong)",
              marginRight: 2,
            }}
          />
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              style={{
                padding: "3px 10px",
                borderRadius: 999,
                border: activeTab === tab.key ? "none" : "1px solid transparent",
                background:
                  activeTab === tab.key
                    ? "linear-gradient(135deg, #5b8af5 0%, #7c6af5 100%)"
                    : "transparent",
                color: activeTab === tab.key ? "white" : "var(--proof-text-secondary)",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: activeTab === tab.key ? 600 : 500,
                transition: "all 0.15s",
                boxShadow: activeTab === tab.key ? "0 1px 6px rgba(91,138,245,0.3)" : "none",
              }}
            >
              {tab.label}
              {tabCounts[tab.key] > 0 && (
                <span style={{ marginLeft: 4, opacity: activeTab === tab.key ? 0.85 : 0.6 }}>
                  {tabCounts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: "var(--proof-text-secondary)",
            fontSize: 13,
          }}
        >
          <Activity size={24} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
          No workflows found.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="proof-table" style={{ width: "100%" }}>
            <colgroup>
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th>Workflow</th>
                <th>Status</th>
                <th>Pass %</th>
                <th>Suite · Env</th>
                <th>Duration</th>
                <th>When</th>
                <th>Build</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((run) => (
                <RunRow key={run.id} run={run} onClick={(id) => onRunClick(id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && (
        <div
          style={{
            padding: "8px 16px",
            borderTop: "1px solid var(--proof-grey)",
            fontSize: 11,
            color: "var(--proof-text-secondary)",
            textAlign: "right",
          }}
        >
          {filtered.length} workflow{filtered.length > 1 ? "s" : ""}{" "}
          <a
            href={GH_ACTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--proof-blue)",
              textDecoration: "none",
              marginLeft: 8,
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            View all on GitHub <ExternalLink size={10} />
          </a>
        </div>
      )}
    </div>
  );
}
