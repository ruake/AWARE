import React from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/aware/AppLayout";
import { RUNS, DIFF_ROWS } from "@/lib/data";
import { useTestData } from "@/hooks/useTestData";
import "../_group.css";
import {
  Search,
  X,
  FileText,
  PlayCircle,
  GitCompare,
  ChevronRight,
  Hash,
  Zap,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
} from "lucide-react";

const QUICK_ACTIONS = [
  { icon: PlayCircle, label: "Start a new run", shortcut: "N", color: "var(--proof-blue)" },
  {
    icon: GitCompare,
    label: "Compare two runs",
    shortcut: "C",
    color: "var(--proof-text-secondary)",
  },
  { icon: FileText, label: "Open test docs", shortcut: "D", color: "var(--proof-text-secondary)" },
  { icon: Zap, label: "Jump to dashboard", shortcut: "G", color: "var(--proof-yellow)" },
];

type ResultKind = "test" | "run" | "compare" | "action";

interface Result {
  kind: ResultKind;
  label: string;
  sub: string;
  id?: string;
  status?: string | null;
  meta?: string;
}

function buildResults(
  tcs: ReturnType<typeof useTestData>["tcs"],
  suites: ReturnType<typeof useTestData>["suites"],
): Result[] {
  const results: Result[] = [];
  tcs.slice(0, 20).forEach((tc) => {
    const suiteNames = tc.suiteIds
      .map((id) => suites.find((s) => s.id === id)?.name ?? id)
      .filter(Boolean)
      .join(", ");
    results.push({
      kind: "test",
      label: tc.name,
      sub: `${tc.category} · ${suiteNames || "no suite"}`,
      status: tc.status === "active" ? "pass" : tc.status === "disabled" ? "fail" : undefined,
      id: tc.id,
      meta: tc.id,
    });
  });
  RUNS.forEach((r) => {
    results.push({
      kind: "run",
      label: r.id,
      sub: `${r.env} · ${r.status} · ${r.duration}`,
      status: r.status === "PASS" ? "pass" : r.status === "FAIL" ? "fail" : "flaky",
      id: r.id,
      meta: `${r.passPct}%`,
    });
  });
  DIFF_ROWS.forEach((d) => {
    results.push({
      kind: "compare",
      label: d.name,
      sub: `${d.baseStatus} → ${d.candStatus} · ${d.category}`,
      status: d.state === "fixed" ? "pass" : d.state === "regression" ? "fail" : null,
      id: d.id,
      meta: d.state,
    });
  });
  results.push({
    kind: "action",
    label: "Start new regression run",
    sub: "Open workflow dispatcher",
    status: null,
    meta: "⌘N",
  });
  return results;
}

function filterResults(q: string, results: Result[]): Result[] {
  if (!q.trim()) return [];
  const lower = q.toLowerCase();
  return results
    .filter((r) => r.label.toLowerCase().includes(lower) || r.sub.toLowerCase().includes(lower))
    .slice(0, 8);
}

function StatusDot({ status }: { status?: string | null }) {
  if (!status) return null;
  const colors: Record<string, string> = {
    pass: "var(--proof-green)",
    fail: "var(--proof-red)",
    flaky: "var(--proof-yellow)",
  };
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        display: "inline-block",
        flexShrink: 0,
        backgroundColor: colors[status] ?? "var(--proof-grey)",
      }}
    />
  );
}

function KindIcon({ kind }: { kind: ResultKind }) {
  const props = { size: 15, style: { color: "var(--proof-text-secondary)", flexShrink: 0 } };
  if (kind === "test") return <Hash {...props} />;
  if (kind === "run") return <PlayCircle {...props} />;
  if (kind === "compare") return <GitCompare {...props} />;
  return <Zap {...props} />;
}

export default function SearchDemo() {
  const [, navigate] = useLocation();
  const { tcs, suites } = useTestData();
  const [query, setQuery] = React.useState("");
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [activeFilter, setActiveFilter] = React.useState<"all" | "tests" | "runs" | "compare">(
    "all",
  );
  const allResults = React.useMemo(() => buildResults(tcs, suites), [tcs, suites]);

  const navigateToResult = (r: Result) => {
    if (r.kind === "run" && r.id) navigate(`/runs/${encodeURIComponent(r.id)}`);
    else if (r.kind === "test" && r.id) navigate(`/analytics?testId=${encodeURIComponent(r.id)}`);
    else if (r.kind === "compare")
      navigate(`/compare?baseline=${RUNS[0]?.id}&candidate=${RUNS[3]?.id}`);
    else if (r.kind === "action") navigate("/start");
  };

  const rawResults = filterResults(query, allResults);
  const filteredActive =
    activeFilter === "all"
      ? rawResults
      : rawResults.filter((r) => {
          if (activeFilter === "tests") return r.kind === "test";
          if (activeFilter === "runs") return r.kind === "run";
          if (activeFilter === "compare") return r.kind === "compare";
          return true;
        });

  const showResults = query.trim().length > 0;
  const kindCounts = {
    tests: rawResults.filter((r) => r.kind === "test").length,
    runs: rawResults.filter((r) => r.kind === "run").length,
    compare: rawResults.filter((r) => r.kind === "compare").length,
  };
  const hasResults = showResults && filteredActive.length > 0;
  const hasNoResults = showResults && filteredActive.length === 0;
  const maxIdx = filteredActive.length - 1;

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") setActiveIdx((i) => Math.min(i + 1, maxIdx));
    if (e.key === "ArrowUp") setActiveIdx((i) => Math.max(i - 1, 0));
    if (e.key === "Enter" && filteredActive[activeIdx]) navigateToResult(filteredActive[activeIdx]);
    if (e.key === "Escape") {
      setQuery("");
      setActiveFilter("all");
    }
    if (e.key === "Tab") {
      e.preventDefault();
      setActiveFilter((f) =>
        f === "all" ? "tests" : f === "tests" ? "runs" : f === "runs" ? "compare" : "all",
      );
    }
  };

  return (
    <AppLayout activeHref="/search">
      <div
        style={{
          height: "calc(100vh - 100px)",
          display: "flex",
          flexDirection: "column",
          maxWidth: 960,
          margin: "0 auto",
        }}
      >
        <div className="gcp-card" style={{ flexShrink: 0, marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderBottom: "1px solid var(--proof-grey)",
            }}
          >
            <Search size={18} style={{ color: "var(--proof-text-secondary)", flexShrink: 0 }} />
            <input
              autoFocus
              className="gcp-input"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: 15,
                background: "transparent",
                padding: 0,
              }}
              placeholder="Search tests, runs, comparisons…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIdx(0);
              }}
              onKeyDown={handleKey}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setActiveFilter("all");
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "var(--proof-text-secondary)",
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {showResults && rawResults.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderBottom: "1px solid var(--proof-grey)",
                background: "var(--proof-grey-bg)",
              }}
            >
              {(["all", "tests", "runs", "compare"] as const).map((f) => {
                const count =
                  f === "all" ? rawResults.length : kindCounts[f as keyof typeof kindCounts];
                const isActive = activeFilter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "4px 10px",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 500,
                      border: isActive ? "none" : "1px solid var(--proof-grey)",
                      background: isActive ? "var(--proof-blue)" : "var(--proof-surface)",
                      color: isActive ? "white" : "var(--proof-text-secondary)",
                      cursor: "pointer",
                    }}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    <span style={{ fontSize: 10, opacity: 0.8 }}>{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "8px 16px",
              background: "var(--proof-grey-bg)",
              flexWrap: "wrap",
            }}
          >
            {[
              { icon: <ArrowUp size={10} />, label: "up" },
              { icon: <ArrowDown size={10} />, label: "down" },
              { icon: <CornerDownLeft size={10} />, label: "open" },
              { icon: <span style={{ fontSize: 10 }}>esc</span>, label: "clear" },
            ].map((k, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  color: "var(--proof-text-secondary)",
                }}
              >
                <kbd
                  style={{
                    fontFamily: "var(--font-mono)",
                    background: "var(--proof-surface)",
                    border: "1px solid var(--proof-grey)",
                    borderRadius: 4,
                    padding: "2px 6px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {k.icon}
                </kbd>
                {k.label}
              </div>
            ))}
            <span
              style={{ marginLeft: "auto", fontSize: 11, color: "var(--proof-text-secondary)" }}
            >
              {hasResults
                ? `${filteredActive.length} result${filteredActive.length !== 1 ? "s" : ""}`
                : "Type to search"}
            </span>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          {hasResults && (
            <div className="gcp-card" style={{ overflow: "hidden" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--proof-grey)",
                  background: "var(--proof-grey-bg)",
                }}
              >
                <h2 style={{ fontSize: 13, fontWeight: 500 }}>
                  Results for{" "}
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--proof-blue)" }}>
                    "{query}"
                  </span>
                </h2>
                <span style={{ fontSize: 12, color: "var(--proof-text-secondary)" }}>
                  {filteredActive.length} results
                </span>
              </div>
              {filteredActive.map((r, i) => (
                <div
                  key={`${r.kind}-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    cursor: "pointer",
                    borderBottom:
                      i < filteredActive.length - 1 ? "1px solid var(--proof-grey)" : undefined,
                    background: i === activeIdx ? "var(--proof-blue-bg)" : undefined,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => navigateToResult(r)}
                >
                  <KindIcon kind={r.kind} />
                  <StatusDot status={r.status} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontFamily: "var(--font-mono)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.label}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--proof-text-secondary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.sub}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                    {r.meta && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--proof-text-secondary)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {r.meta}
                      </span>
                    )}
                    {i === activeIdx && (
                      <ChevronRight
                        size={14}
                        style={{ color: "var(--proof-blue)", flexShrink: 0 }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasNoResults && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: "80px 0",
                color: "var(--proof-text-secondary)",
              }}
            >
              <AlertTriangle size={28} style={{ color: "var(--proof-yellow)" }} />
              <p style={{ fontSize: 14 }}>
                No results for <span style={{ fontFamily: "var(--font-mono)" }}>"{query}"</span>
              </p>
              <p style={{ fontSize: 12 }}>Try a test name, run ID, or version number.</p>
            </div>
          )}

          {!showResults && (
            <div className="gcp-card" style={{ overflow: "hidden" }}>
              <div style={{ padding: 16 }}>
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "var(--proof-text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <PlayCircle size={11} /> Recent Runs
                  </div>
                  {RUNS.slice(-5)
                    .reverse()
                    .map((r, i) => (
                      <div
                        key={i}
                        onClick={() => navigate(`/runs/${encodeURIComponent(r.id)}`)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "6px 8px",
                          borderRadius: 4,
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "var(--proof-surface-hover)")
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <StatusDot
                          status={
                            r.status === "PASS" ? "pass" : r.status === "FAIL" ? "fail" : "flaky"
                          }
                        />
                        <span
                          style={{
                            fontSize: 13,
                            fontFamily: "var(--font-mono)",
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.id}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--proof-text-secondary)" }}>
                          {r.env} · {r.status}
                        </span>
                      </div>
                    ))}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: "var(--proof-text-secondary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Zap size={11} /> Quick Actions
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {QUICK_ACTIONS.map((a, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          if (i === 0) navigate("/start");
                          else if (i === 1) navigate("/compare");
                          else if (i === 2) navigate("/testdoc");
                          else navigate("/");
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 12px",
                          borderRadius: 4,
                          border: "1px solid var(--proof-grey)",
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "var(--proof-surface-hover)")
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <a.icon size={14} style={{ color: a.color }} />
                        <span style={{ fontSize: 12, flex: 1 }}>{a.label}</span>
                        <kbd
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 10,
                            background: "var(--proof-grey-bg)",
                            border: "1px solid var(--proof-grey)",
                            borderRadius: 4,
                            padding: "1px 4px",
                            color: "var(--proof-text-secondary)",
                          }}
                        >
                          ⌘{a.shortcut}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
