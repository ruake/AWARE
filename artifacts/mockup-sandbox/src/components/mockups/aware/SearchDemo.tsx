import React from "react";
import { AppLayout } from "./_shared/AppLayout";
import { RUNS } from "./_shared/data";
import { navTo } from "./_shared/nav";
import "./_group.css";
import {
  Search, X, Clock, FileText, PlayCircle, GitCompare,
  ChevronRight, Hash, Zap, AlertTriangle, CheckCircle2,
  Command, ArrowUp, ArrowDown, CornerDownLeft
} from "lucide-react";

const RECENT = [
  { type: "run", label: "run_892_2341.1.0_prod_1001", sub: "Prod/Production · FAIL · 2h ago", status: "fail" },
  { type: "test", label: "test_geo_match_us_locale_prod", sub: "geo-match · 94.8% pass rate", status: "pass" },
  { type: "compare", label: "PM 891 vs PM 892 — Prod/Production", sub: "Compare · 3d ago", status: null },
];

const QUICK_ACTIONS = [
  { icon: PlayCircle, label: "Start a new run", shortcut: "N", color: "var(--gcp-blue)" },
  { icon: GitCompare,  label: "Compare two runs",  shortcut: "C", color: "var(--gcp-text-secondary)" },
  { icon: FileText,   label: "Open test docs",    shortcut: "D", color: "var(--gcp-text-secondary)" },
  { icon: Zap,        label: "Jump to dashboard", shortcut: "G", color: "var(--gcp-yellow)" },
];

type ResultKind = "test" | "run" | "compare" | "action";

interface Result {
  kind: ResultKind;
  label: string;
  sub: string;
  status?: string | null;
  meta?: string;
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

function filterResults(q: string): Result[] {
  if (!q.trim()) return [];
  const lower = q.toLowerCase();
  return ALL_RESULTS.filter(
    (r) => r.label.toLowerCase().includes(lower) || r.sub.toLowerCase().includes(lower)
  ).slice(0, 8);
}

function StatusDot({ status }: { status?: string | null }) {
  if (!status) return null;
  const colors: Record<string, string> = {
    pass: "var(--gcp-green)",
    fail: "var(--gcp-red)",
    flaky: "var(--gcp-yellow)",
  };
  return (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ backgroundColor: colors[status] ?? "var(--gcp-grey)" }}
    />
  );
}

function KindIcon({ kind }: { kind: ResultKind }) {
  const props = { size: 15, className: "shrink-0 text-[var(--gcp-text-secondary)]" };
  if (kind === "test") return <Hash {...props} />;
  if (kind === "run") return <PlayCircle {...props} />;
  if (kind === "compare") return <GitCompare {...props} />;
  return <Zap {...props} />;
}

export function SearchDemo() {
  const [query, setQuery] = React.useState("");
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [activeFilter, setActiveFilter] = React.useState<"all" | "tests" | "runs" | "compare">("all");

  const navigateToResult = (r: Result) => {
    if (r.kind === "run") navTo(`RunDetail?runId=${r.label}`);
    else if (r.kind === "test") navTo(`TestAnalytics?testId=${r.label}`);
    else if (r.kind === "compare") navTo(`Compare?baseline=${RUNS[0].id}&candidate=${RUNS[3].id}`);
    else if (r.kind === "action") navTo("StartRun");
  };

  const rawResults = filterResults(query);
  const results = activeFilter === "all"
    ? rawResults
    : rawResults.filter((r) => {
        if (activeFilter === "tests") return r.kind === "test";
        if (activeFilter === "runs") return r.kind === "run";
        if (activeFilter === "compare") return r.kind === "compare";
        return true;
      });

  const showResults = query.trim().length > 0;

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    if (e.key === "ArrowUp") setActiveIdx((i) => Math.max(i - 1, 0));
    if (e.key === "Enter" && results[activeIdx]) navigateToResult(results[activeIdx]);
    if (e.key === "Escape") { setQuery(""); setActiveFilter("all"); }
  };

  const kindCounts = {
    tests: rawResults.filter((r) => r.kind === "test").length,
    runs: rawResults.filter((r) => r.kind === "run").length,
    compare: rawResults.filter((r) => r.kind === "compare").length,
  };

  const hasResults = showResults && results.length > 0;
  const hasNoResults = showResults && results.length === 0;

  return (
    <AppLayout activeTab="search">
      <div className="h-[calc(100vh-100px)] flex flex-col max-w-[960px] mx-auto gap-0">

        {/* Sticky search bar */}
        <div className="gcp-card shrink-0 mb-4">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--gcp-grey)]">
            <Search size={18} className="text-[var(--gcp-text-secondary)] shrink-0" />
            <input
              autoFocus
              className="flex-1 bg-transparent outline-none text-[15px] text-[var(--gcp-text)] placeholder:text-[var(--gcp-text-secondary)]"
              placeholder="Search tests, runs, comparisons…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
              onKeyDown={handleKey}
            />
            {query && (
              <button onClick={() => { setQuery(""); setActiveFilter("all"); }} className="text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-text)]">
                <X size={15} />
              </button>
            )}
            <div className="flex items-center gap-1 text-[11px] text-[var(--gcp-text-secondary)] border border-[var(--gcp-grey)] rounded px-1.5 py-0.5 gcp-mono">
              <Command size={10} />K
            </div>
          </div>

          {/* Filter chips */}
          {showResults && rawResults.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--gcp-grey)] bg-[var(--gcp-grey-bg)]">
              {(["all", "tests", "runs", "compare"] as const).map((f) => {
                const count = f === "all" ? rawResults.length : kindCounts[f as keyof typeof kindCounts];
                return (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-[12px] font-medium transition-colors ${
                      activeFilter === f
                        ? "bg-[var(--gcp-blue)] text-white"
                        : "bg-[var(--gcp-surface)] border border-[var(--gcp-grey)] text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-text)]"
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    <span className={`text-[10px] ${activeFilter === f ? "text-white/80" : "text-[var(--gcp-text-secondary)]"}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Keyboard hints footer */}
          <div className="flex items-center gap-4 px-4 py-2 bg-[var(--gcp-grey-bg)]">
            {[
              { icon: <ArrowUp size={10} />, label: "up" },
              { icon: <ArrowDown size={10} />, label: "down" },
              { icon: <CornerDownLeft size={10} />, label: "open" },
              { icon: <span className="text-[10px]">esc</span>, label: "clear" },
            ].map((k, i) => (
              <div key={i} className="flex items-center gap-1 text-[11px] text-[var(--gcp-text-secondary)]">
                <kbd className="gcp-mono bg-[var(--gcp-surface)] border border-[var(--gcp-grey)] rounded px-1.5 py-0.5 flex items-center">
                  {k.icon}
                </kbd>
                {k.label}
              </div>
            ))}
            <div className="ml-auto text-[11px] text-[var(--gcp-text-secondary)]">
              {hasResults ? `${results.length} result${results.length !== 1 ? "s" : ""}` : "Type to search"}
            </div>
          </div>
        </div>

        {/* Full-page results area — scrolls independently */}
        <div className="flex-1 overflow-auto min-h-0">
          {hasResults && (
            <div className="gcp-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--gcp-grey)] bg-[var(--gcp-grey-bg)]">
                <h2 className="text-[13px] font-medium text-[var(--gcp-text)]">
                  Results for <span className="font-mono text-[var(--gcp-blue)]">"{query}"</span>
                </h2>
                <span className="text-[12px] text-[var(--gcp-text-secondary)]">{results.length} results</span>
              </div>
              {results.map((r, i) => (
                <div
                  key={`${r.kind}-${i}`}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-[var(--gcp-grey)] last:border-0 transition-colors ${
                    i === activeIdx ? "bg-[var(--gcp-blue-bg)]" : "hover:bg-[var(--gcp-surface-hover)]"
                  }`}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => navigateToResult(r)}
                >
                  <KindIcon kind={r.kind} />
                  <StatusDot status={r.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-mono text-[var(--gcp-text)] truncate">{r.label}</div>
                    <div className="text-[11px] text-[var(--gcp-text-secondary)] truncate">{r.sub}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {r.meta && (
                      <span className="text-[11px] text-[var(--gcp-text-secondary)] gcp-mono">{r.meta}</span>
                    )}
                    <span className={`gcp-badge text-[10px] ${r.kind === "test" ? "bg-[var(--gcp-blue-bg)] text-[var(--gcp-blue)]" : r.kind === "run" ? "bg-[var(--gcp-green-bg)] text-[var(--gcp-green)]" : r.kind === "compare" ? "bg-[var(--gcp-yellow-bg)] text-[var(--gcp-yellow)]" : "bg-[var(--gcp-grey-bg)] text-[var(--gcp-text-secondary)]"}`}>
                      {r.kind}
                    </span>
                    {i === activeIdx && (
                      <ChevronRight size={14} className="text-[var(--gcp-blue)] shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasNoResults && (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-[var(--gcp-text-secondary)]">
              <AlertTriangle size={28} className="text-[var(--gcp-yellow)]" />
              <p className="text-[14px]">No results for <span className="font-mono text-[var(--gcp-text)]">"{query}"</span></p>
              <p className="text-[12px]">Try a test name, run ID, or version number.</p>
            </div>
          )}

          {/* Home state — recent + quick actions */}
          {!showResults && (
            <div className="gcp-card overflow-hidden">
              <div className="px-4 py-4">
                {/* Recent */}
                <div className="mb-5">
                  <div className="text-[11px] font-medium text-[var(--gcp-text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock size={11} /> Recent
                  </div>
                  <div className="space-y-0.5">
                    {RECENT.map((r, i) => (
                      <div key={i} onClick={() => { if (r.type === "run") navTo(`RunDetail?runId=${r.label}`); else if (r.type === "compare") navTo(`Compare?baseline=${RUNS[0].id}&candidate=${RUNS[3].id}`); }} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--gcp-surface-hover)] cursor-pointer">
                        <StatusDot status={r.status} />
                        <span className="text-[13px] font-mono text-[var(--gcp-text)] flex-1 truncate">{r.label}</span>
                        <span className="text-[11px] text-[var(--gcp-text-secondary)]">{r.sub}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick actions */}
                <div>
                  <div className="text-[11px] font-medium text-[var(--gcp-text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Zap size={11} /> Quick Actions
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {QUICK_ACTIONS.map((a, i) => (
                      <div key={i} onClick={() => { if (i === 0) navTo("StartRun"); else if (i === 1) navTo(`Compare?baseline=${RUNS[0].id}&candidate=${RUNS[3].id}`); else if (i === 2) navTo("TestDoc"); else navTo("Dashboard"); }} className="flex items-center gap-2 px-3 py-2 rounded border border-[var(--gcp-grey)] hover:bg-[var(--gcp-surface-hover)] cursor-pointer">
                        <a.icon size={14} style={{ color: a.color }} />
                        <span className="text-[12px] text-[var(--gcp-text)] flex-1">{a.label}</span>
                        <kbd className="gcp-mono text-[10px] bg-[var(--gcp-grey-bg)] border border-[var(--gcp-grey)] rounded px-1 py-0.5 text-[var(--gcp-text-secondary)]">
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
