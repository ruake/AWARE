import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/aware/AppLayout";
import { CTAStatCard } from "@/components/aware/CTAStatCard";
import { PanelErrorBoundary } from "@/components/aware/PanelErrorBoundary";
import { useSimpleToast } from "@/hooks/useSimpleToast";
import { useSyncedUrlState } from "@/lib/urlState";
import { RUNS, DIFF_ROWS } from "@/lib/data";
import type { DiffRow } from "@/lib/types";
import {
  Link2,
  Github,
  Share2,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Zap,
  ArrowUpRight,
  Search,
  X,
} from "lucide-react";
import type { Run } from "@/lib/types";

function copy(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

const STATUS_COLORS: Record<string, string> = {
  PASS: "var(--proof-green)",
  FAIL: "var(--proof-red)",
  PARTIAL: "var(--proof-yellow)",
  FLAKY: "#f59e0b",
  RUNNING: "var(--proof-blue)",
};

function RunPicker({
  label,
  labelColor,
  value,
  onChange,
  accentColor = "var(--proof-blue)",
}: {
  label: string;
  labelColor: string;
  value: string;
  onChange: (id: string) => void;
  accentColor?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [envFilter, setEnvFilter] = React.useState("");
  const [targetFilter, setTargetFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [suiteFilter, setSuiteFilter] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const selectedRun = RUNS.find((r) => r.id === value) as Run | undefined;

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const envs = [...new Set(RUNS.map((r) => r.env))];
  const targets = [...new Set(RUNS.map((r) => r.target))];
  const statuses = [...new Set(RUNS.map((r) => r.status))] as Run["status"][];
  const suites = [...new Set(RUNS.map((r) => r.suite))];

  const filtered = RUNS.filter((r) => {
    if (envFilter && r.env !== envFilter) return false;
    if (targetFilter && r.target !== targetFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    if (suiteFilter && r.suite !== suiteFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.id.toLowerCase().includes(q) &&
        !r.env.toLowerCase().includes(q) &&
        !r.suite.toLowerCase().includes(q) &&
        !r.target.toLowerCase().includes(q) &&
        !r.build.toLowerCase().includes(q) &&
        !r.rev.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  const hasFilters = envFilter || targetFilter || statusFilter || suiteFilter || search;
  const clearAll = () => {
    setSearch("");
    setEnvFilter("");
    setTargetFilter("");
    setStatusFilter("");
    setSuiteFilter("");
  };

  return (
    <div ref={ref} style={{ flex: "1 1 240px", minWidth: 200, position: "relative" }}>
      <label
        style={{
          display: "block",
          fontSize: 10,
          fontWeight: 700,
          color: labelColor,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 10px",
          borderRadius: 6,
          border: `1px solid ${open ? accentColor : "var(--proof-grey)"}`,
          background: "var(--proof-surface)",
          color: "var(--proof-text)",
          cursor: "pointer",
          fontSize: 11,
          fontFamily: "var(--font-mono)",
          textAlign: "left",
          boxShadow: open ? `0 0 0 2px ${accentColor}22` : "none",
          transition: "border-color 0.12s, box-shadow 0.12s",
        }}
      >
        {selectedRun ? (
          <>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: STATUS_COLORS[selectedRun.status] ?? "var(--proof-text-secondary)",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {selectedRun.id}
            </span>
            <span
              style={{
                fontSize: 10,
                color: "var(--proof-text-secondary)",
                fontFamily: "var(--font-sans)",
                flexShrink: 0,
              }}
            >
              {selectedRun.env} · {selectedRun.target}
            </span>
          </>
        ) : (
          <span style={{ color: "var(--proof-text-secondary)" }}>Select a run…</span>
        )}
        <ChevronDown
          size={12}
          style={{
            color: "var(--proof-text-secondary)",
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.12s",
          }}
        />
      </button>

      {selectedRun && (
        <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
          <span className="proof-badge proof-badge-skip" style={{ fontSize: 9 }}>
            {selectedRun.target}
          </span>
          <span className="proof-badge proof-badge-skip" style={{ fontSize: 9 }}>
            {selectedRun.env}
          </span>
          <span
            className={`proof-badge ${selectedRun.network === "production" ? "proof-badge-pass" : "proof-badge-flaky"}`}
            style={{ fontSize: 9 }}
          >
            {selectedRun.network}
          </span>
          <span
            style={{
              fontSize: 9,
              fontFamily: "var(--font-mono)",
              color: "var(--proof-text-secondary)",
              background: "var(--proof-grey-bg)",
              padding: "1px 5px",
              borderRadius: 3,
              border: "1px solid var(--proof-grey)",
            }}
          >
            Build {selectedRun.build}
          </span>
          <span
            style={{
              fontSize: 9,
              fontFamily: "var(--font-mono)",
              color: "var(--proof-text-secondary)",
              background: "var(--proof-grey-bg)",
              padding: "1px 5px",
              borderRadius: 3,
              border: "1px solid var(--proof-grey)",
            }}
          >
            Rev {selectedRun.rev}
          </span>
          <span
            style={{
              fontSize: 9,
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              color:
                selectedRun.passPct === 100
                  ? "var(--proof-green)"
                  : selectedRun.passPct < 90
                    ? "var(--proof-red)"
                    : "var(--proof-text-secondary)",
              background: "var(--proof-grey-bg)",
              padding: "1px 5px",
              borderRadius: 3,
              border: "1px solid var(--proof-grey)",
            }}
          >
            {selectedRun.passPct}% pass
          </span>
        </div>
      )}

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 300,
            background: "var(--proof-surface)",
            border: `1px solid ${accentColor}`,
            borderRadius: 8,
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            display: "flex",
            flexDirection: "column",
            width: "max(100%, 480px)",
            maxHeight: 440,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid var(--proof-grey)",
              flexShrink: 0,
            }}
          >
            <div style={{ position: "relative" }}>
              <Search
                size={13}
                style={{
                  position: "absolute",
                  left: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--proof-text-secondary)",
                  pointerEvents: "none",
                }}
              />
              <input
                ref={inputRef}
                className="proof-input"
                style={{ width: "100%", paddingLeft: 28, fontSize: 12 }}
                placeholder="Search by ID, env, suite, build, rev…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    position: "absolute",
                    right: 6,
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    color: "var(--proof-text-secondary)",
                    padding: 2,
                    display: "flex",
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div
            style={{
              padding: "6px 12px",
              borderBottom: "1px solid var(--proof-grey)",
              flexShrink: 0,
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: "var(--proof-text-secondary)",
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              Filter:
            </span>
            <select
              className="proof-input"
              style={{ fontSize: 10, padding: "2px 6px", height: "auto" }}
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
            >
              <option value="">All Envs</option>
              {envs.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
            <select
              className="proof-input"
              style={{ fontSize: 10, padding: "2px 6px", height: "auto" }}
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
            >
              <option value="">All Targets</option>
              {targets.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              className="proof-input"
              style={{ fontSize: 10, padding: "2px 6px", height: "auto" }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="proof-input"
              style={{ fontSize: 10, padding: "2px 6px", height: "auto" }}
              value={suiteFilter}
              onChange={(e) => setSuiteFilter(e.target.value)}
            >
              <option value="">All Suites</option>
              {suites.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {hasFilters && (
              <button
                onClick={clearAll}
                style={{
                  fontSize: 10,
                  color: "var(--proof-red)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  padding: 0,
                }}
              >
                <X size={10} /> Clear
              </button>
            )}
            <span
              style={{
                marginLeft: "auto",
                fontSize: 10,
                color: "var(--proof-text-secondary)",
                flexShrink: 0,
              }}
            >
              {filtered.length} / {RUNS.length}
            </span>
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: "20px 12px",
                  textAlign: "center",
                  color: "var(--proof-text-secondary)",
                  fontSize: 12,
                }}
              >
                No runs match your filters
              </div>
            ) : (
              filtered.map((r) => {
                const isSel = r.id === value;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      onChange(r.id);
                      setOpen(false);
                      setSearch("");
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      border: "none",
                      borderBottom: "1px solid var(--proof-grey)",
                      background: isSel ? `${accentColor}15` : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      outline: isSel ? `2px solid ${accentColor}` : "none",
                      outlineOffset: -2,
                    }}
                    onMouseEnter={(e) => {
                      if (!isSel) e.currentTarget.style.background = "var(--proof-grey-bg)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSel) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: STATUS_COLORS[r.status] ?? "var(--proof-text-secondary)",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: isSel ? accentColor : "var(--proof-blue)",
                        fontWeight: 600,
                        flexShrink: 0,
                        width: 170,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.id}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--proof-text-secondary)",
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.env} · {r.target} · {r.suite}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        fontWeight: 700,
                        color:
                          r.passPct === 100
                            ? "var(--proof-green)"
                            : r.passPct < 90
                              ? "var(--proof-red)"
                              : "var(--proof-text)",
                        flexShrink: 0,
                        width: 40,
                        textAlign: "right",
                      }}
                    >
                      {r.passPct}%
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: "var(--proof-text-secondary)",
                        flexShrink: 0,
                        width: 68,
                        textAlign: "right",
                      }}
                    >
                      {new Date(r.started).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function stateBadge(state: DiffRow["state"]) {
  const map: Record<string, { color: string; label: string }> = {
    regression: { color: "var(--proof-red)", label: "Regression" },
    fixed: { color: "var(--proof-green)", label: "Fixed" },
    duration: { color: "var(--proof-yellow)", label: "Duration ↑" },
    unchanged: { color: "var(--proof-text-secondary)", label: "Unchanged" },
    fishy: { color: "var(--proof-purple)", label: "Fishy ⚠" },
  };
  const s = map[state] ?? { color: "var(--proof-text-secondary)", label: state };
  return <span style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{s.label}</span>;
}

function SidePanel({
  diff,
  diffs,
  selectedId,
  onSelect,
  navigate,
}: {
  diff: DiffRow;
  diffs: DiffRow[];
  selectedId: string;
  onSelect: (id: string | null) => void;
  navigate: (href: string) => void;
}) {
  const { show, Toast } = useSimpleToast();
  const idx = diffs.findIndex((d) => d.id === selectedId);
  const deltaMs = diff.durCand - diff.durBase;

  return (
    <div
      className="proof-card"
      style={{
        width: 340,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderLeft: `3px solid ${diff.state === "regression" ? "var(--proof-red)" : diff.state === "fixed" ? "var(--proof-green)" : "var(--proof-blue)"}`,
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--proof-grey)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "var(--proof-blue-bg)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            border: "1px solid var(--proof-grey)",
            borderRadius: 4,
            background: "var(--proof-surface)",
          }}
        >
          <button
            disabled={idx <= 0}
            onClick={() => onSelect(diffs[idx - 1]?.id)}
            style={{
              padding: "4px 7px",
              border: "none",
              background: "transparent",
              cursor: idx > 0 ? "pointer" : "not-allowed",
              color: idx > 0 ? "var(--proof-blue)" : "var(--proof-grey)",
            }}
          >
            <ChevronLeft size={13} />
          </button>
          <span style={{ fontSize: 10, color: "var(--proof-text-secondary)", padding: "0 4px" }}>
            {idx + 1}/{diffs.length}
          </span>
          <button
            disabled={idx >= diffs.length - 1}
            onClick={() => onSelect(diffs[idx + 1]?.id)}
            style={{
              padding: "4px 7px",
              border: "none",
              background: "transparent",
              cursor: idx < diffs.length - 1 ? "pointer" : "not-allowed",
              color: idx < diffs.length - 1 ? "var(--proof-blue)" : "var(--proof-grey)",
            }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--proof-blue)", flex: 1 }}>
          Comparison Detail
        </span>
        <button
          onClick={() => onSelect(null)}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--proof-text-secondary)",
            fontSize: 18,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--proof-text)",
              lineHeight: 1.5,
              wordBreak: "break-all",
            }}
          >
            {diff.name}
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
            <span className="proof-badge proof-badge-skip" style={{ fontSize: 10 }}>
              {diff.category}
            </span>
            {stateBadge(diff.state)}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div
            style={{
              padding: 10,
              background: `var(--${diff.baseStatus === "PASS" ? "gcp-green-bg" : "gcp-red-bg"})`,
              borderRadius: 6,
              border: `1px solid ${diff.baseStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)"}`,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: diff.baseStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                marginBottom: 4,
              }}
            >
              Baseline
            </div>
            <span
              className={`proof-badge ${diff.baseStatus === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`}
              style={{ fontSize: 10 }}
            >
              {diff.baseStatus}
            </span>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--proof-text)",
                marginTop: 6,
                fontWeight: 600,
              }}
            >
              {diff.durBase}ms
            </div>
          </div>
          <div
            style={{
              padding: 10,
              background: `var(--${diff.candStatus === "PASS" ? "gcp-green-bg" : "gcp-red-bg"})`,
              borderRadius: 6,
              border: `1px solid ${diff.candStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)"}`,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: diff.candStatus === "PASS" ? "var(--proof-green)" : "var(--proof-red)",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
                marginBottom: 4,
              }}
            >
              Candidate
            </div>
            <span
              className={`proof-badge ${diff.candStatus === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`}
              style={{ fontSize: 10 }}
            >
              {diff.candStatus}
            </span>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--proof-text)",
                marginTop: 6,
                fontWeight: 600,
              }}
            >
              {diff.durCand}ms
            </div>
          </div>
        </div>
        <div
          style={{
            padding: 10,
            borderRadius: 6,
            border: "1px solid var(--proof-grey)",
            background:
              deltaMs > 20
                ? "var(--proof-red-bg)"
                : deltaMs < -20
                  ? "var(--proof-green-bg)"
                  : "var(--proof-grey-bg)",
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color:
                deltaMs > 20
                  ? "var(--proof-red)"
                  : deltaMs < -20
                    ? "var(--proof-green)"
                    : "var(--proof-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              marginBottom: 4,
            }}
          >
            Delta
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div>
              <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>Status: </span>
              {diff.baseStatus === diff.candStatus ? (
                <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>—</span>
              ) : (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: diff.state === "regression" ? "var(--proof-red)" : "var(--proof-green)",
                  }}
                >
                  {diff.baseStatus} → {diff.candStatus}
                </span>
              )}
            </div>
            <div>
              <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>Duration: </span>
              {Math.abs(deltaMs) > 20 ? (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    fontWeight: 700,
                    color: deltaMs > 0 ? "var(--proof-red)" : "var(--proof-green)",
                  }}
                >
                  {deltaMs > 0 ? "+" : ""}
                  {deltaMs}ms
                </span>
              ) : (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--proof-text-secondary)",
                  }}
                >
                  ~0ms
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="proof-card" style={{ padding: 10 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--proof-text-secondary)",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Visual Diff (Filmstrip)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {["Baseline", "Candidate"].map((label) => (
              <div
                key={label}
                style={{
                  background: "var(--proof-grey-bg)",
                  borderRadius: 4,
                  height: 80,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 4,
                  border: "1px solid var(--proof-grey)",
                }}
              >
                <span style={{ fontSize: 20 }}>🎞</span>
                <span style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            onClick={() => navigate(`/analytics?testId=${diff.id}`)}
            className="proof-button proof-button-xs"
            style={{ justifyContent: "center" }}
          >
            <BarChart3 size={12} /> View Analytics <ArrowUpRight size={10} />
          </button>
          <button
            onClick={() => {
              copy(`${window.location.origin}/tests/${diff.id}`);
              show("Test permalink copied");
            }}
            className="proof-button proof-button-xs"
            style={{ justifyContent: "center" }}
          >
            <Link2 size={12} /> Copy Test Permalink
          </button>
          <button
            onClick={() => {
              copy(
                `GitHub issue: Regression in ${diff.name}\nBaseline: ${diff.baseStatus} (${diff.durBase}ms)\nCandidate: ${diff.candStatus} (${diff.durCand}ms)`,
              );
              show("GitHub issue template copied");
            }}
            className="proof-button proof-button-xs"
            style={{ justifyContent: "center" }}
          >
            <Github size={12} /> File GitHub Issue
          </button>
        </div>
      </div>
      {Toast}
    </div>
  );
}

export default function Compare() {
  const [, navigate] = useLocation();
  const { show, Toast } = useSimpleToast();

  type ApprovalState = "none" | "approved" | "blocked" | "pending" | "error";
  const [approvals, setApprovals] = React.useState<Record<string, ApprovalState>>({});

  const [baseline, setBaseline] = useSyncedUrlState("baseline", RUNS[RUNS.length - 1]?.id ?? "");
  const [candidate, setCandidate] = useSyncedUrlState("candidate", RUNS[0]?.id ?? "");
  const [selectedId, setSelectedId] = useSyncedUrlState<string | null>("sel", null);
  const [searchText, setSearchText] = useSyncedUrlState("q", "");
  const [regressionsOnly, setRegressionsOnly] = useSyncedUrlState("regressions", false);
  const [activeFilter, setActiveFilter] = React.useState<string | null>(null);
  const [swapped, setSwapped] = React.useState(false);
  const [selectedIdx, setSelectedIdx] = React.useState(-1);
  const baselineRun = RUNS.find((r) => r.id === baseline);
  const candidateRun = RUNS.find((r) => r.id === candidate);

  const diffs = React.useMemo(() => {
    if (!swapped) return DIFF_ROWS;
    return DIFF_ROWS.map((d) => {
      const state: DiffRow["state"] =
        d.state === "regression" ? "fixed" : d.state === "fixed" ? "regression" : d.state;
      return {
        ...d,
        state,
        baseStatus: d.candStatus,
        candStatus: d.baseStatus,
        durBase: d.durCand,
        durCand: d.durBase,
      };
    });
  }, [swapped]);

  const [colFilters, setColFilters] = React.useState<Record<string, string>>({});

  const filtered = React.useMemo(() => {
    return diffs.filter((d) => {
      if (searchText && !d.name.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (regressionsOnly && d.state !== "regression") return false;
      if (activeFilter && d.state !== activeFilter) return false;
      for (const [field, val] of Object.entries(colFilters)) {
        if (!val) continue;
        const cell = String((d as unknown as Record<string, unknown>)[field] ?? "").toLowerCase();
        if (!cell.includes(val.toLowerCase())) return false;
      }
      return true;
    });
  }, [diffs, searchText, regressionsOnly, activeFilter, colFilters]);

  const clampedIdx = selectedIdx >= filtered.length ? -1 : selectedIdx;

  React.useEffect(() => {
    if (clampedIdx >= 0 && clampedIdx < filtered.length) {
      setSelectedId(filtered[clampedIdx].id);
    }
  }, [clampedIdx, filtered, setSelectedId, selectedIdx]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.target instanceof HTMLSelectElement) return;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        const d = selectedIdx >= 0 && selectedIdx < filtered.length ? filtered[selectedIdx] : null;
        if (d) navigate(`/runs/${d.id}`);
      } else if (e.key === "r") {
        setRegressionsOnly((p) => !p);
        setActiveFilter(null);
      } else if (e.key === "f") {
        setActiveFilter((p) => (p === "fixed" ? null : "fixed"));
        setRegressionsOnly(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filtered, navigate, setRegressionsOnly, setActiveFilter, selectedIdx]);

  if (!baselineRun || !candidateRun) {
    return (
      <AppLayout activeHref="/compare">
        <div style={{ textAlign: "center", padding: 64 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--proof-text-primary)" }}>
            No runs to compare
          </h2>
          <p style={{ fontSize: 13, color: "var(--proof-text-secondary)", marginTop: 8 }}>
            At least two runs are required for comparison.
          </p>
          <button
            onClick={() => navigate("/runs")}
            className="proof-button"
            style={{ fontSize: 13, marginTop: 16 }}
          >
            View Runs
          </button>
        </div>
      </AppLayout>
    );
  }

  const regressions = diffs.filter((d) => d.state === "regression");
  const fixed = diffs.filter((d) => d.state === "fixed");
  const duration = diffs.filter((d) => d.state === "duration");
  const unchanged = diffs.filter((d) => d.state === "unchanged");
  const categories = [...new Set(DIFF_ROWS.map((d) => d.category))];
  const approvedCount = Object.values(approvals).filter((a) => a === "approved").length;
  const blockedCount = Object.values(approvals).filter((a) => a === "blocked").length;

  const selectedDiff = selectedId ? (diffs.find((d) => d.id === selectedId) ?? null) : null;
  const hasActiveFilters = Object.values(colFilters).some((v) => v);

  const handleApproval = async (diffId: string, action: "approved" | "blocked") => {
    setApprovals((prev) => ({ ...prev, [diffId]: "pending" }));

    await new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.3) resolve();
        else reject(new Error("API timeout"));
      }, 1000);
    }).then(
      () => {
        setApprovals((prev) => ({ ...prev, [diffId]: action }));
        show(action === "approved" ? "✓ Approved" : "✗ Blocked");
      },
      () => {
        setApprovals((prev) => ({ ...prev, [diffId]: "error" }));
        show("Failed to sync — reverted");
        setTimeout(() => {
          setApprovals((prev) => ({ ...prev, [diffId]: "none" }));
        }, 1500);
      },
    );
  };

  return (
    <AppLayout activeHref="/compare">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Run selectors */}
        <PanelErrorBoundary label="Run selectors">
          <div
            className="proof-card"
            style={{
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <RunPicker
              label="Baseline Run"
              labelColor="var(--proof-text-secondary)"
              value={baseline}
              onChange={(id) => {
                setBaseline(id);
                setSwapped(false);
              }}
              accentColor="var(--proof-text-secondary)"
            />
            <button
              onClick={() => {
                const t = baseline;
                setBaseline(candidate);
                setCandidate(t);
                setSwapped((p) => !p);
              }}
              className="proof-button proof-button-sm"
              style={{ marginTop: 16, flexShrink: 0 }}
            >
              ⇄ Swap
            </button>
            <RunPicker
              label="Candidate Run"
              labelColor="var(--proof-blue)"
              value={candidate}
              onChange={(id) => {
                setCandidate(id);
                setSwapped(false);
              }}
              accentColor="var(--proof-blue)"
            />
            <div
              style={{ display: "flex", gap: 8, flexShrink: 0, marginTop: 16, flexWrap: "wrap" }}
            >
              <button
                onClick={() => {
                  copy(window.location.href);
                  show("Permalink copied — URL always reflects current comparison");
                }}
                className="proof-button proof-button-sm"
              >
                <Link2 size={13} /> Permalink
              </button>
              <button
                onClick={() => {
                  copy(
                    `Comparison: ${baseline} vs ${candidate}\nNew failures: ${regressions.length}\nFixed: ${fixed.length}\nDuration regressions: ${duration.length}`,
                  );
                  show("Slack summary copied");
                }}
                className="proof-button proof-button-sm"
              >
                <Share2 size={13} /> Share
              </button>
              <button
                onClick={() => {
                  copy(
                    `## Regression Report\n**Baseline:** ${baseline}\n**Candidate:** ${candidate}\n\n### Regressions (${regressions.length})\n${regressions.map((r) => `- ${r.name}`).join("\n")}\n\n### Fixed (${fixed.length})\n${fixed.map((r) => `- ${r.name}`).join("\n")}`,
                  );
                  show("Markdown report copied");
                }}
                className="proof-button proof-button-sm"
              >
                <Github size={13} /> Report
              </button>
            </div>
          </div>
        </PanelErrorBoundary>

        {/* Summary tiles — clickable filters */}
        <PanelErrorBoundary label="Stat cards">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {[
              {
                label: "New Failures",
                value: `+${regressions.length}`,
                color: "var(--proof-red)",
                key: "regression",
              },
              {
                label: "Fixed",
                value: `+${fixed.length}`,
                color: "var(--proof-green)",
                key: "fixed",
              },
              {
                label: "Duration Regressions",
                value: `+${duration.length}`,
                color: "var(--proof-yellow)",
                key: "duration",
              },
              {
                label: "Unchanged",
                value: unchanged.length,
                color: "var(--proof-text-secondary)",
                key: "unchanged",
              },
            ].map((tile) => (
              <CTAStatCard
                key={tile.label}
                label={tile.label}
                value={tile.value}
                accentColor={tile.color}
                active={activeFilter === tile.key}
                onClick={() => {
                  if (activeFilter === tile.key) {
                    setActiveFilter(null);
                  } else {
                    setActiveFilter(tile.key);
                    setRegressionsOnly(false);
                  }
                }}
              />
            ))}
          </div>
        </PanelErrorBoundary>

        {/* Run context ribbon */}
        <div
          style={{
            background: "var(--proof-grey-bg)",
            border: "1px solid var(--proof-grey)",
            borderRadius: 4,
            padding: "6px 14px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            fontSize: 11,
          }}
        >
          <span
            style={{
              fontWeight: 600,
              color: "var(--proof-text-secondary)",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.3px",
            }}
          >
            Comparison
          </span>
          <span className="proof-badge proof-badge-skip" style={{ fontSize: 9 }}>
            {baselineRun?.target} / {baselineRun?.env}
          </span>
          <span
            className={`proof-badge ${baselineRun?.network === "production" ? "proof-badge-pass" : "proof-badge-flaky"}`}
            style={{ fontSize: 9 }}
          >
            {baselineRun?.network}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--proof-text-secondary)",
            }}
          >
            Build {baselineRun?.build}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--proof-text-secondary)",
            }}
          >
            Rev {baselineRun?.rev}
          </span>
          <span style={{ color: "var(--proof-grey)", fontSize: 12 }}>|</span>
          <span className="proof-badge proof-badge-skip" style={{ fontSize: 9 }}>
            {candidateRun?.target} / {candidateRun?.env}
          </span>
          <span
            className={`proof-badge ${candidateRun?.network === "production" ? "proof-badge-pass" : "proof-badge-flaky"}`}
            style={{ fontSize: 9 }}
          >
            {candidateRun?.network}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--proof-text-secondary)",
            }}
          >
            Build {candidateRun?.build}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--proof-text-secondary)",
            }}
          >
            Rev {candidateRun?.rev}
          </span>
          {regressions.length > 0 ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "var(--proof-red-bg)",
                border: "1px solid var(--proof-red)",
                borderRadius: 3,
                padding: "1px 6px",
                fontSize: 10,
              }}
            >
              <span
                className="proof-badge proof-badge-fail"
                style={{ fontSize: 8, padding: "0 4px" }}
              >
                {regressions.length}
              </span>
              Blocked
            </span>
          ) : (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                color: "var(--proof-green)",
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              <Zap size={10} /> Ready to promote
            </span>
          )}
          <span style={{ fontSize: 10, color: "var(--proof-text-secondary)" }}>
            {diffs.length} tests
          </span>
        </div>

        {/* Approval summary header */}
        <div
          className="proof-card"
          style={{
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--proof-text)" }}>
            Approvals
          </span>
          <div
            style={{
              flex: 1,
              height: 6,
              background: "var(--proof-grey-bg)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${diffs.length > 0 ? ((approvedCount + blockedCount) / diffs.length) * 100 : 0}%`,
                height: "100%",
                background: "var(--proof-green)",
                borderRadius: 3,
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <span
            style={{
              fontSize: 12,
              color: "var(--proof-text-secondary)",
              whiteSpace: "nowrap",
            }}
          >
            {approvedCount + blockedCount}/{diffs.length} reviewed
          </span>
        </div>

        {/* Table + side panel */}
        <PanelErrorBoundary label="Diff area">
          <div style={{ display: "flex", gap: 14 }}>
            <div
              className="proof-card"
              style={{
                flex: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                maxHeight: "60vh",
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid var(--proof-grey)",
                  background: "var(--proof-grey-bg)",
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  flexWrap: "wrap",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 140 }}
                >
                  <Search size={13} style={{ color: "var(--proof-text-secondary)" }} />
                  <input
                    className="proof-input"
                    placeholder="Search tests…"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ flex: 1, minWidth: 0 }}
                  />
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={regressionsOnly}
                    onChange={(e) => {
                      setRegressionsOnly(e.target.checked);
                      setActiveFilter(null);
                    }}
                  />
                  Regressions only
                </label>
                {hasActiveFilters && (
                  <button
                    onClick={() => setColFilters({})}
                    style={{
                      fontSize: 11,
                      color: "var(--proof-red)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Clear filters
                  </button>
                )}
                <span
                  style={{ fontSize: 11, color: "var(--proof-text-secondary)", marginLeft: "auto" }}
                >
                  {filtered.length}/{diffs.length} tests
                </span>
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                <table className="proof-table">
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      background: "var(--proof-surface)",
                    }}
                  >
                    <tr>
                      <th>
                        <input
                          className="proof-input"
                          placeholder="Name"
                          value={colFilters.name ?? ""}
                          onChange={(e) => setColFilters((f) => ({ ...f, name: e.target.value }))}
                          style={{ width: "100%", fontSize: 10, padding: "2px 6px" }}
                        />
                      </th>
                      <th>
                        <select
                          className="proof-input"
                          style={{ fontSize: 10, padding: "2px 6px", width: "100%" }}
                          value={colFilters.baseStatus ?? ""}
                          onChange={(e) =>
                            setColFilters((f) => ({ ...f, baseStatus: e.target.value }))
                          }
                        >
                          <option value="">Baseline</option>
                          <option value="PASS">PASS</option>
                          <option value="FAIL">FAIL</option>
                        </select>
                      </th>
                      <th>
                        <select
                          className="proof-input"
                          style={{ fontSize: 10, padding: "2px 6px", width: "100%" }}
                          value={colFilters.candStatus ?? ""}
                          onChange={(e) =>
                            setColFilters((f) => ({ ...f, candStatus: e.target.value }))
                          }
                        >
                          <option value="">Candidate</option>
                          <option value="PASS">PASS</option>
                          <option value="FAIL">FAIL</option>
                        </select>
                      </th>
                      <th
                        style={{
                          textAlign: "right",
                          fontSize: 10,
                          color: "var(--proof-text-secondary)",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        Δ Duration
                      </th>
                      <th>
                        <select
                          className="proof-input"
                          style={{ fontSize: 10, padding: "2px 6px", width: "100%" }}
                          value={colFilters.category ?? ""}
                          onChange={(e) =>
                            setColFilters((f) => ({ ...f, category: e.target.value }))
                          }
                        >
                          <option value="">Category</option>
                          {categories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </th>
                      <th>
                        <select
                          className="proof-input"
                          style={{ fontSize: 10, padding: "2px 6px", width: "100%" }}
                          value={colFilters.state ?? ""}
                          onChange={(e) => setColFilters((f) => ({ ...f, state: e.target.value }))}
                        >
                          <option value="">State</option>
                          <option value="regression">Regression</option>
                          <option value="fixed">Fixed</option>
                          <option value="duration">Duration ↑</option>
                          <option value="unchanged">Unchanged</option>
                        </select>
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          fontSize: 10,
                          color: "var(--proof-text-secondary)",
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((d, i) => {
                      const isSelected = selectedId === d.id;
                      const deltams = d.durCand - d.durBase;
                      return (
                        <tr
                          key={d.id}
                          onClick={() => {
                            setSelectedId(isSelected ? null : d.id);
                            setSelectedIdx(isSelected ? -1 : i);
                          }}
                          style={{
                            cursor: "pointer",
                            background: isSelected
                              ? "var(--proof-blue-bg)"
                              : d.state === "regression"
                                ? "rgba(217,48,37,0.04)"
                                : d.state === "fixed"
                                  ? "rgba(30,142,62,0.04)"
                                  : undefined,
                            outline: isSelected ? "2px solid var(--proof-blue)" : "none",
                            outlineOffset: -2,
                          }}
                        >
                          <td
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 11,
                              color: "var(--proof-blue)",
                              fontWeight: 500,
                              maxWidth: 260,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {d.name}
                          </td>
                          <td>
                            <span
                              className={`proof-badge ${d.baseStatus === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`}
                            >
                              {d.baseStatus}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`proof-badge ${d.candStatus === "PASS" ? "proof-badge-pass" : "proof-badge-fail"}`}
                            >
                              {d.candStatus}
                            </span>
                          </td>
                          <td
                            style={{
                              textAlign: "right",
                              fontFamily: "var(--font-mono)",
                              fontSize: 11,
                            }}
                          >
                            {Math.abs(deltams) > 20 ? (
                              <span
                                style={{
                                  color: deltams > 0 ? "var(--proof-red)" : "var(--proof-green)",
                                  fontWeight: 700,
                                }}
                              >
                                {deltams > 0 ? "+" : ""}
                                {deltams}ms
                              </span>
                            ) : (
                              <span style={{ color: "var(--proof-text-secondary)" }}>~0ms</span>
                            )}
                          </td>
                          <td>
                            <span className="proof-badge proof-badge-skip" style={{ fontSize: 10 }}>
                              {d.category}
                            </span>
                          </td>
                          <td>{stateBadge(d.state)}</td>
                          <td>
                            <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                              {approvals[d.id] === "approved" ? (
                                <span
                                  style={{
                                    color: "var(--proof-green)",
                                    fontSize: 12,
                                    fontWeight: 600,
                                  }}
                                >
                                  ✓
                                </span>
                              ) : approvals[d.id] === "blocked" ? (
                                <span
                                  style={{
                                    color: "var(--proof-red)",
                                    fontSize: 12,
                                    fontWeight: 600,
                                  }}
                                >
                                  ✗
                                </span>
                              ) : approvals[d.id] === "pending" ? (
                                <span
                                  style={{
                                    color: "var(--proof-text-secondary)",
                                    fontSize: 11,
                                  }}
                                >
                                  Saving...
                                </span>
                              ) : approvals[d.id] === "error" ? (
                                <span
                                  style={{
                                    color: "var(--proof-yellow)",
                                    fontSize: 11,
                                  }}
                                >
                                  Failed
                                </span>
                              ) : (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApproval(d.id, "approved");
                                    }}
                                    style={{
                                      padding: "2px 8px",
                                      border: "1px solid var(--proof-green)",
                                      borderRadius: 4,
                                      background: "transparent",
                                      color: "var(--proof-green)",
                                      fontSize: 11,
                                      cursor: "pointer",
                                    }}
                                  >
                                    ✓ Approve
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApproval(d.id, "blocked");
                                    }}
                                    style={{
                                      padding: "2px 8px",
                                      border: "1px solid var(--proof-red)",
                                      borderRadius: 4,
                                      background: "transparent",
                                      color: "var(--proof-red)",
                                      fontSize: 11,
                                      cursor: "pointer",
                                    }}
                                  >
                                    ✗ Block
                                  </button>
                                </>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copy(`${window.location.origin}/tests/${d.id}`);
                                  show("Permalink copied");
                                }}
                                style={{
                                  padding: "3px 5px",
                                  border: "none",
                                  background: "transparent",
                                  cursor: "pointer",
                                  color: "var(--proof-text-secondary)",
                                }}
                                title="Copy permalink"
                              >
                                <Link2 size={12} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copy(
                                    `Regression: ${d.name}\nBaseline: ${d.baseStatus} (${d.durBase}ms)\nCandidate: ${d.candStatus} (${d.durCand}ms)`,
                                  );
                                  show("Issue template copied");
                                }}
                                style={{
                                  padding: "3px 5px",
                                  border: "none",
                                  background: "transparent",
                                  cursor: "pointer",
                                  color: "var(--proof-text-secondary)",
                                }}
                                title="File issue"
                              >
                                <Github size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          style={{
                            textAlign: "center",
                            padding: "28px",
                            color: "var(--proof-text-secondary)",
                            fontSize: 13,
                          }}
                        >
                          No tests match your filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {selectedDiff && selectedId && (
              <SidePanel
                diff={selectedDiff}
                diffs={filtered}
                selectedId={selectedId}
                onSelect={setSelectedId}
                navigate={navigate}
              />
            )}
          </div>
        </PanelErrorBoundary>
      </div>
      {Toast}
    </AppLayout>
  );
}
