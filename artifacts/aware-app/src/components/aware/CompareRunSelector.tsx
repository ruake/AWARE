import React from "react";
import { Search, ChevronDown } from "lucide-react";
import type { Run } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  PASS: "var(--proof-green)",
  FAIL: "var(--proof-red)",
  PARTIAL: "var(--proof-yellow)",
  FLAKY: "var(--proof-yellow)",
  RUNNING: "var(--proof-blue)",
};

export function CompareRunSelector({
  label,
  labelColor,
  value,
  onChange,
  accentColor = "var(--proof-blue)",
  runs,
}: {
  label: string;
  labelColor: string;
  value: string;
  onChange: (id: string) => void;
  accentColor?: string;
  runs: Run[];
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [envFilter, setEnvFilter] = React.useState("");
  const [targetFilter, setTargetFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [suiteFilter, setSuiteFilter] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dropPos, setDropPos] = React.useState({ top: 0, left: 0 });
  const selectedRun = runs.find((r) => r.id === value) as Run | undefined;

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
      const btn = ref.current?.querySelector("button");
      if (btn) {
        const r = btn.getBoundingClientRect();
        const dw = 420;
        let left = r.left;
        if (left + dw > window.innerWidth - 8) left = window.innerWidth - dw - 8;
        if (left < 8) left = 8;
        setDropPos({ top: r.bottom + 4, left });
      }
    }
  }, [open]);

  const envs = [...new Set(runs.map((r) => r.env))];
  const targets = [...new Set(runs.map((r) => r.envId))];
  const statuses = [...new Set(runs.map((r) => r.status))] as Run["status"][];
  const suites = [...new Set(runs.map((r) => r.suiteId))];

  const filtered = runs.filter((r) => {
    if (envFilter && r.env !== envFilter) return false;
    if (targetFilter && r.envId !== targetFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    if (suiteFilter && r.suiteId !== suiteFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.id.toLowerCase().includes(q) &&
        !r.env.toLowerCase().includes(q) &&
        !r.suiteId.toLowerCase().includes(q) &&
        !r.envId.toLowerCase().includes(q) &&
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
              {selectedRun.env} · {selectedRun.envId}
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
            {selectedRun.envId}
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
            position: "fixed",
            top: dropPos.top,
            left: dropPos.left,
            zIndex: 300,
            background: "var(--proof-surface)",
            border: `1px solid ${accentColor}`,
            borderRadius: 8,
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            display: "flex",
            flexDirection: "column",
            width: 420,
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
                placeholder="Search runs…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", paddingLeft: 28, fontSize: 12 }}
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: 4,
                marginTop: 8,
                flexWrap: "wrap",
              }}
            >
              <select
                className="proof-input"
                value={envFilter}
                onChange={(e) => setEnvFilter(e.target.value)}
                style={{ fontSize: 10, padding: "2px 6px", flex: 1, minWidth: 60 }}
              >
                <option value="">Env</option>
                {envs.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
              <select
                className="proof-input"
                value={targetFilter}
                onChange={(e) => setTargetFilter(e.target.value)}
                style={{ fontSize: 10, padding: "2px 6px", flex: 1, minWidth: 60 }}
              >
                <option value="">Target</option>
                {targets.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                className="proof-input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ fontSize: 10, padding: "2px 6px", flex: 1, minWidth: 60 }}
              >
                <option value="">Status</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                className="proof-input"
                value={suiteFilter}
                onChange={(e) => setSuiteFilter(e.target.value)}
                style={{ fontSize: 10, padding: "2px 6px", flex: 1, minWidth: 60 }}
              >
                <option value="">Suite</option>
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
                    padding: "2px 6px",
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  fontSize: 12,
                  color: "var(--proof-text-secondary)",
                }}
              >
                No runs match filters
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
                      {r.env} · {r.envId} · {r.suiteId}
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
