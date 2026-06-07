import React from "react";
import { AppLayout } from "@/components/aware/AppLayout";
import { RUNS } from "@/lib/data";
import { navTo } from "@/lib/nav";
import "../_group.css";
import {
  Search, X, Clock, FileText, PlayCircle, GitCompare,
  ChevronRight, Hash, Zap, AlertTriangle, CheckCircle2,
  ArrowUp, ArrowDown, CornerDownLeft,
} from "lucide-react";

const RECENT = [
  { type: "run", label: "run_892_2341.1.0_prod_1001", sub: "Prod/Production · FAIL · 2h ago", status: "fail" },
  { type: "test", label: "test_geo_match_us_locale_prod", sub: "geo-match · 94.8% pass rate", status: "pass" },
  { type: "compare", label: "PM 891 vs PM 892 — Prod/Production", sub: "Compare · 3d ago", status: null },
];

const QUICK_ACTIONS = [
  { icon: PlayCircle, label: "Start a new run", shortcut: "N", color: "var(--gcp-blue)" },
  { icon: GitCompare, label: "Compare two runs", shortcut: "C", color: "var(--gcp-text-secondary)" },
  { icon: FileText, label: "Open test docs", shortcut: "D", color: "var(--gcp-text-secondary)" },
  { icon: Zap, label: "Jump to dashboard", shortcut: "G", color: "var(--gcp-yellow)" },
];

type ResultKind = "test" | "run" | "compare" | "action";

interface Result {
  kind: ResultKind; label: string; sub: string; status?: string | null; meta?: string;
}

const ALL_RESULTS: Result[] = [
  { kind: "test", label: "test_geo_match_us_locale_prod[/us/]", sub: "geo-match · full_suite", status: "fail", meta: "94.8% pass" },
  { kind: "test", label: "test_geo_match_eu_locale_prod[/eu/]", sub: "geo-match · full_suite", status: "pass", meta: "100% pass" },
  { kind: "test", label: "test_edgeworker_cache_key_v3", sub: "cache-key · edgeworker", status: "pass", meta: "98.1% pass" },
  { kind: "test", label: "test_locale_split_fr_staging", sub: "locale-match · smoke", status: "flaky", meta: "81% pass" },
  { kind: "run", label: "run_892_2341.1.0_prod_1001", sub: "Prod/Production · PM 892 · EW 2341.1.0", status: "fail", meta: "45m" },
  { kind: "run", label: "run_892_2341.1.0_uat_1002", sub: "UAT/Production · PM 892 · EW 2341.1.0", status: "pass", meta: "38m" },
  { kind: "run", label: "run_891_2340.0.1_prod_0998", sub: "Prod/Production · PM 891 · EW 2340.0.1", status: "fail", meta: "51m" },
  { kind: "compare", label: "PM 892 vs PM 891 — Prod/Production", sub: "7 regressions · 2 recoveries", status: null, meta: "3d ago" },
  { kind: "compare", label: "EW 2341.1.0 vs 2340.0.1 — UAT", sub: "No regressions detected", status: null, meta: "5d ago" },
  { kind: "action", label: "Start new regression run", sub: "Open workflow dispatcher", status: null, meta: "⌘N" },
];

function filterResults(q: string, results: Result[]): Result[] {
  if (!q.trim()) return [];
  const lower = q.toLowerCase();
  return results.filter(r => r.label.toLowerCase().includes(lower) || r.sub.toLowerCase().includes(lower)).slice(0, 8);
}

function StatusDot({ status }: { status?: string | null }) {
  if (!status) return null;
  const colors: Record<string, string> = { pass: "var(--gcp-green)", fail: "var(--gcp-red)", flaky: "var(--gcp-yellow)" };
  return <span style={{ width: 8, height: 8, borderRadius: "50%", display: "inline-block", flexShrink: 0, backgroundColor: colors[status] ?? "var(--gcp-grey)" }} />;
}

function KindIcon({ kind }: { kind: ResultKind }) {
  const props = { size: 15, style: { color: "var(--gcp-text-secondary)", flexShrink: 0 } };
  if (kind === "test") return <Hash {...props} />;
  if (kind === "run") return <PlayCircle {...props} />;
  if (kind === "compare") return <GitCompare {...props} />;
  return <Zap {...props} />;
}

export default function SearchDemo() {
  const [query, setQuery] = React.useState("");
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [activeFilter, setActiveFilter] = React.useState<"all" | "tests" | "runs" | "compare">("all");

  const navigateToResult = (r: Result) => {
    if (r.kind === "run") navTo(`/runs/${r.label}`);
    else if (r.kind === "test") navTo(`/analytics?testId=${r.label}`);
    else if (r.kind === "compare") navTo(`/compare?baseline=${RUNS[0]?.id}&candidate=${RUNS[3]?.id}`);
    else if (r.kind === "action") navTo("/start");
  };

  const rawResults = filterResults(query, ALL_RESULTS);
  const results = activeFilter === "all" ? rawResults : rawResults.filter(r => {
    if (activeFilter === "tests") return r.kind === "test";
    if (activeFilter === "runs") return r.kind === "run";
    if (activeFilter === "compare") return r.kind === "compare";
    return true;
  });

  const showResults = query.trim().length > 0;
  const kindCounts = { tests: rawResults.filter(r => r.kind === "test").length, runs: rawResults.filter(r => r.kind === "run").length, compare: rawResults.filter(r => r.kind === "compare").length };
  const hasResults = showResults && results.length > 0;
  const hasNoResults = showResults && results.length === 0;

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") setActiveIdx(i => Math.min(i + 1, results.length - 1));
    if (e.key === "ArrowUp") setActiveIdx(i => Math.max(i - 1, 0));
    if (e.key === "Enter" && results[activeIdx]) navigateToResult(results[activeIdx]);
    if (e.key === "Escape") { setQuery(""); setActiveFilter("all"); }
  };

  return (
    <AppLayout activeHref="/search">
      <div style={{ height: "calc(100vh - 100px)", display: "flex", flexDirection: "column", maxWidth: 960, margin: "0 auto" }}>
        <div className="gcp-card" style={{ flexShrink: 0, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--gcp-grey)" }}>
            <Search size={18} style={{ color: "var(--gcp-text-secondary)", flexShrink: 0 }} />
            <input autoFocus className="gcp-input"
              style={{ flex: 1, border: "none", outline: "none", fontSize: 15, background: "transparent", padding: 0 }}
              placeholder="Search tests, runs, comparisons…"
              value={query}
              onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
              onKeyDown={handleKey}
            />
            {query && (
              <button onClick={() => { setQuery(""); setActiveFilter("all"); }} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--gcp-text-secondary)" }}>
                <X size={15} />
              </button>
            )}
          </div>

          {showResults && rawResults.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderBottom: "1px solid var(--gcp-grey)", background: "var(--gcp-grey-bg)" }}>
              {(["all", "tests", "runs", "compare"] as const).map(f => {
                const count = f === "all" ? rawResults.length : kindCounts[f as keyof typeof kindCounts];
                const isActive = activeFilter === f;
                return (
                  <button key={f} onClick={() => setActiveFilter(f)}
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 4, fontSize: 12, fontWeight: 500, border: isActive ? "none" : "1px solid var(--gcp-grey)", background: isActive ? "var(--gcp-blue)" : "var(--gcp-surface)", color: isActive ? "white" : "var(--gcp-text-secondary)", cursor: "pointer" }}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    <span style={{ fontSize: 10, opacity: 0.8 }}>{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 16px", background: "var(--gcp-grey-bg)", flexWrap: "wrap" }}>
            {[
              { icon: <ArrowUp size={10} />, label: "up" },
              { icon: <ArrowDown size={10} />, label: "down" },
              { icon: <CornerDownLeft size={10} />, label: "open" },
              { icon: <span style={{ fontSize: 10 }}>esc</span>, label: "clear" },
            ].map((k, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--gcp-text-secondary)" }}>
                <kbd style={{ fontFamily: "var(--font-mono)", background: "var(--gcp-surface)", border: "1px solid var(--gcp-grey)", borderRadius: 4, padding: "2px 6px", display: "flex", alignItems: "center" }}>{k.icon}</kbd>
                {k.label}
              </div>
            ))}
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--gcp-text-secondary)" }}>
              {hasResults ? `${results.length} result${results.length !== 1 ? "s" : ""}` : "Type to search"}
            </span>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          {hasResults && (
            <div className="gcp-card" style={{ overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--gcp-grey)", background: "var(--gcp-grey-bg)" }}>
                <h2 style={{ fontSize: 13, fontWeight: 500 }}>Results for <span style={{ fontFamily: "var(--font-mono)", color: "var(--gcp-blue)" }}>"{query}"</span></h2>
                <span style={{ fontSize: 12, color: "var(--gcp-text-secondary)" }}>{results.length} results</span>
              </div>
              {results.map((r, i) => (
                <div key={`${r.kind}-${i}`}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", borderBottom: i < results.length - 1 ? "1px solid var(--gcp-grey)" : undefined, background: i === activeIdx ? "var(--gcp-blue-bg)" : undefined, transition: "background 0.15s" }}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => navigateToResult(r)}
                >
                  <KindIcon kind={r.kind} />
                  <StatusDot status={r.status} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: "var(--gcp-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.sub}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                    {r.meta && <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)", fontFamily: "var(--font-mono)" }}>{r.meta}</span>}
                    {i === activeIdx && <ChevronRight size={14} style={{ color: "var(--gcp-blue)", flexShrink: 0 }} />}
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasNoResults && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "80px 0", color: "var(--gcp-text-secondary)" }}>
              <AlertTriangle size={28} style={{ color: "var(--gcp-yellow)" }} />
              <p style={{ fontSize: 14 }}>No results for <span style={{ fontFamily: "var(--font-mono)" }}>"{query}"</span></p>
              <p style={{ fontSize: 12 }}>Try a test name, run ID, or version number.</p>
            </div>
          )}

          {!showResults && (
            <div className="gcp-card" style={{ overflow: "hidden" }}>
              <div style={{ padding: 16 }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={11} /> Recent
                  </div>
                  {RECENT.map((r, i) => (
                    <div key={i} onClick={() => { if (r.type === "run") navTo(`/runs/${r.label}`); }}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 4, cursor: "pointer", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--gcp-surface-hover)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <StatusDot status={r.status} />
                      <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
                      <span style={{ fontSize: 11, color: "var(--gcp-text-secondary)" }}>{r.sub}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "var(--gcp-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <Zap size={11} /> Quick Actions
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {QUICK_ACTIONS.map((a, i) => (
                      <div key={i} onClick={() => { if (i === 0) navTo("/start"); else if (i === 1) navTo("/compare"); else if (i === 2) navTo("/testdoc"); else navTo("/"); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 4, border: "1px solid var(--gcp-grey)", cursor: "pointer", transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--gcp-surface-hover)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <a.icon size={14} style={{ color: a.color }} />
                        <span style={{ fontSize: 12, flex: 1 }}>{a.label}</span>
                        <kbd style={{ fontFamily: "var(--font-mono)", fontSize: 10, background: "var(--gcp-grey-bg)", border: "1px solid var(--gcp-grey)", borderRadius: 4, padding: "1px 4px", color: "var(--gcp-text-secondary)" }}>⌘{a.shortcut}</kbd>
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
