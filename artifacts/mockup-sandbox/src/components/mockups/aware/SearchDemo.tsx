import React from "react";
import { AppLayout } from "./_shared/AppLayout";
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
  const [query, setQuery] = React.useState("geo_match");
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [activeFilter, setActiveFilter] = React.useState<"all" | "tests" | "runs" | "compare">("all");

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
    if (e.key === "Escape") setQuery("");
  };

  const kindCounts = {
    tests: rawResults.filter((r) => r.kind === "test").length,
    runs: rawResults.filter((r) => r.kind === "run").length,
    compare: rawResults.filter((r) => r.kind === "compare").length,
  };

  return (
    <AppLayout activeTab="search">
      <div className="max-w-[960px] mx-auto space-y-6">

        {/* Page header */}
        <div>
          <h1 className="text-[22px] font-medium text-[var(--gcp-text)]">Global Search</h1>
          <p className="text-[13px] text-[var(--gcp-text-secondary)] mt-0.5">
            Search across tests, runs, and comparisons. Press <kbd className="gcp-mono text-[11px] bg-[var(--gcp-grey-bg)] border border-[var(--gcp-grey)] rounded px-1.5 py-0.5">⌘K</kbd> anywhere to open.
          </p>
        </div>

        {/* Command palette card */}
        <div className="gcp-card overflow-hidden shadow-lg">

          {/* Search bar */}
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
              <button onClick={() => setQuery("")} className="text-[var(--gcp-text-secondary)] hover:text-[var(--gcp-text)]">
                <X size={15} />
              </button>
            )}
            <div className="flex items-center gap-1 text-[11px] text-[var(--gcp-text-secondary)] border border-[var(--gcp-grey)] rounded px-1.5 py-0.5 gcp-mono">
              <Command size={10} />K
            </div>
          </div>

          {/* Filter chips — only when results exist */}
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

          {/* Results list */}
          {showResults && results.length > 0 && (
            <div className="max-h-[360px] overflow-y-auto">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-[var(--gcp-grey)] last:border-0 ${
                    i === activeIdx ? "bg-[var(--gcp-blue-bg)]" : "hover:bg-[var(--gcp-surface-hover)]"
                  }`}
                  onMouseEnter={() => setActiveIdx(i)}
                >
                  <KindIcon kind={r.kind} />
                  <StatusDot status={r.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-mono text-[var(--gcp-text)] truncate">{r.label}</div>
                    <div className="text-[11px] text-[var(--gcp-text-secondary)] truncate">{r.sub}</div>
                  </div>
                  {r.meta && (
                    <span className="text-[11px] text-[var(--gcp-text-secondary)] shrink-0 gcp-mono">{r.meta}</span>
                  )}
                  {i === activeIdx && (
                    <ChevronRight size={13} className="text-[var(--gcp-blue)] shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* No results state */}
          {showResults && results.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-[var(--gcp-text-secondary)]">
              <AlertTriangle size={24} className="text-[var(--gcp-yellow)]" />
              <p className="text-[13px]">No results for <span className="font-mono text-[var(--gcp-text)]">"{query}"</span></p>
              <p className="text-[12px]">Try a test name, run ID, or version number.</p>
            </div>
          )}

          {/* Empty / home state */}
          {!showResults && (
            <div className="px-4 py-3">
              {/* Recent */}
              <div className="mb-4">
                <div className="text-[11px] font-medium text-[var(--gcp-text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock size={11} /> Recent
                </div>
                <div className="space-y-0.5">
                  {RECENT.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--gcp-surface-hover)] cursor-pointer">
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
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded border border-[var(--gcp-grey)] hover:bg-[var(--gcp-surface-hover)] cursor-pointer">
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
          )}

          {/* Keyboard hints footer */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-[var(--gcp-grey)] bg-[var(--gcp-grey-bg)]">
            {[
              { icon: <ArrowUp size={10} />, label: "up" },
              { icon: <ArrowDown size={10} />, label: "down" },
              { icon: <CornerDownLeft size={10} />, label: "open" },
              { icon: <span className="text-[10px]">esc</span>, label: "close" },
            ].map((k, i) => (
              <div key={i} className="flex items-center gap-1 text-[11px] text-[var(--gcp-text-secondary)]">
                <kbd className="gcp-mono bg-[var(--gcp-surface)] border border-[var(--gcp-grey)] rounded px-1.5 py-0.5 flex items-center">
                  {k.icon}
                </kbd>
                {k.label}
              </div>
            ))}
            <div className="ml-auto text-[11px] text-[var(--gcp-text-secondary)]">
              {showResults ? `${results.length} result${results.length !== 1 ? "s" : ""}` : "Type to search"}
            </div>
          </div>
        </div>

        {/* Full-page search results table (contextual) */}
        {showResults && results.length > 0 && (
          <div className="gcp-card overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--gcp-grey)] bg-[var(--gcp-grey-bg)] flex items-center justify-between">
              <h2 className="text-[13px] font-medium text-[var(--gcp-text)]">
                All matches for <span className="font-mono text-[var(--gcp-blue)]">"{query}"</span>
              </h2>
              <span className="text-[12px] text-[var(--gcp-text-secondary)]">{results.length} results</span>
            </div>
            <table className="gcp-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Detail</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="cursor-pointer">
                    <td>
                      <div className="flex items-center gap-2">
                        <KindIcon kind={r.kind} />
                        <span className="font-mono text-[12px]">{r.label}</span>
                      </div>
                    </td>
                    <td>
                      <span className="gcp-badge bg-[var(--gcp-grey-bg)] text-[var(--gcp-text-secondary)] text-[11px]">
                        {r.kind}
                      </span>
                    </td>
                    <td>
                      {r.status ? (
                        <span className={`gcp-badge gcp-badge-${r.status}`}>{r.status.toUpperCase()}</span>
                      ) : (
                        <span className="text-[var(--gcp-text-secondary)] text-[12px]">—</span>
                      )}
                    </td>
                    <td className="text-[var(--gcp-text-secondary)] text-[12px]">{r.sub}</td>
                    <td>
                      <div className="flex items-center gap-1 text-[var(--gcp-blue)] text-[12px] justify-end">
                        Open <ChevronRight size={12} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pass-rate summary chips when showing test results */}
        {showResults && results.some((r) => r.kind === "test") && (
          <div className="flex flex-wrap gap-3">
            {results.filter((r) => r.kind === "test").map((r, i) => (
              <div key={i} className="gcp-card px-3 py-2 flex items-center gap-2">
                <StatusDot status={r.status} />
                <span className="font-mono text-[11px] text-[var(--gcp-text)]">{r.label.split("[")[0]}</span>
                {r.status === "pass" && <CheckCircle2 size={12} className="text-[var(--gcp-green)]" />}
                {r.status === "fail" && <X size={12} className="text-[var(--gcp-red)]" />}
                {r.status === "flaky" && <AlertTriangle size={12} className="text-[var(--gcp-yellow)]" />}
                <span className="text-[11px] text-[var(--gcp-text-secondary)]">{r.meta}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </AppLayout>
  );
}
