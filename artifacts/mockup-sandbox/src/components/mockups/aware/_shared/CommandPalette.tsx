import React from "react";
import { navTo } from "./nav";
import { useSyncRuns, useSyncDiffs, useSyncTestCases, useSyncTestSuites } from "./hooks";
import { Search, List, GitCompare, Beaker, ArrowUpRight, FolderTree } from "lucide-react";

type SearchResult = {
  id: string;
  label: string;
  description: string;
  type: "test" | "run" | "compare" | "suite";
  path: string;
};

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const runs = useSyncRuns();
  const diffs = useSyncDiffs();
  const testCases = useSyncTestCases();
  const suites = useSyncTestSuites();

  const ALL_RESULTS: SearchResult[] = [
    ...suites.map(s => ({
      id: s.id,
      label: s.name,
      description: `${s.testIds.length} tests · ${s.config.target}/${s.config.environment}`,
      type: "suite" as const,
      path: `TestSuiteManager?sel=${s.id}`,
    })),
    ...testCases.map(tc => ({
      id: tc.id,
      label: tc.name,
      description: `${tc.category} · ${tc.priority} · ${tc.status}`,
      type: "test" as const,
      path: `TestManager?sel=${tc.id}`,
    })),
    ...diffs.map(d => ({
      id: d.id,
      label: d.name,
      description: `${d.category} · ${d.state}`,
      type: "test" as const,
      path: `TestDoc?testId=${d.id}`,
    })),
    ...runs.map(r => ({
      id: r.id,
      label: r.id,
      description: `${r.label} · ${r.passPct}% pass · ${r.status}`,
      type: "run" as const,
      path: `RunDetail?runId=${r.id}`,
    })),
    ...(runs.length >= 4 ? diffs.slice(0, 8).map(d => ({
      id: `compare_${d.id}`,
      label: `${d.name}`,
      description: `baseline vs candidate · ${d.state}`,
      type: "compare" as const,
      path: `Compare?baseline=${runs[0].id}&candidate=${runs[3].id}`,
    })) : []),
  ];
  const [query, setQuery] = React.useState("");
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [typeFilter, setTypeFilter] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const q = query.toLowerCase();
  let filtered = ALL_RESULTS.filter(r => {
    if (typeFilter && r.type !== typeFilter) return false;
    return !q || r.label.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
  });

  React.useEffect(() => {
    if (activeIdx >= filtered.length) setActiveIdx(0);
  }, [activeIdx, filtered.length]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && filtered[activeIdx]) {
      navTo(filtered[activeIdx].path);
      onClose();
    }
  };

  const typeCounts = { test: 0, run: 0, compare: 0, suite: 0 };
  ALL_RESULTS.forEach(r => { if (r.type in typeCounts) typeCounts[r.type as keyof typeof typeCounts]++; });

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl bg-[var(--gcp-surface)] rounded-xl shadow-2xl border border-[var(--gcp-grey)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--gcp-grey)]">
          <Search size={20} className="text-[var(--gcp-text-secondary)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tests, runs, comparisons..."
            className="flex-1 bg-transparent border-none outline-none text-[15px] text-[var(--gcp-text)] placeholder:text-[var(--gcp-text-secondary)]"
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
            onKeyDown={handleKey}
          />
          <kbd className="text-[11px] px-2 py-1 bg-[var(--gcp-grey-bg)] border border-[var(--gcp-grey)] rounded text-[var(--gcp-text-secondary)] font-mono">ESC</kbd>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 px-5 py-2.5 border-b border-[var(--gcp-grey)] bg-[var(--gcp-grey-bg)]">
          {(["test", "suite", "run", "compare"] as const).map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(typeFilter === type ? null : type)}
              className={`text-[11px] px-3 py-1 rounded-full font-medium transition-colors ${
                typeFilter === type
                  ? "bg-[var(--gcp-blue)] text-white"
                  : "bg-[var(--gcp-surface)] text-[var(--gcp-text-secondary)] border border-[var(--gcp-grey)] hover:text-[var(--gcp-text)]"
              }`}
            >
              {type === "test" ? "Tests" : type === "run" ? "Runs" : "Compare"} ({typeCounts[type]})
            </button>
          ))}
          {typeFilter && (
            <button onClick={() => setTypeFilter(null)} className="text-[11px] px-3 py-1 text-[var(--gcp-red)] hover:underline">Clear</button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-[var(--gcp-text-secondary)] text-sm">No results for "{query}"</div>
          ) : (
            filtered.map((r, i) => (
              <div
                key={r.id}
                className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${
                  i === activeIdx ? "bg-[var(--gcp-blue-bg)]" : "hover:bg-[var(--gcp-surface-hover)]"
                }`}
                onClick={() => { navTo(r.path); onClose(); }}
                onMouseEnter={() => setActiveIdx(i)}
              >
                <div className={`w-7 h-7 rounded flex items-center justify-center ${
                  r.type === "test" ? "bg-[var(--gcp-purple-bg)] text-[#9334e6]" :
                  r.type === "suite" ? "bg-[var(--gcp-yellow-bg)] text-[var(--gcp-yellow)]" :
                  r.type === "run" ? "bg-[var(--gcp-blue-bg)] text-[var(--gcp-blue)]" :
                  "bg-[var(--gcp-green-bg)] text-[var(--gcp-green)]"
                }`}>
                  {r.type === "test" ? <Beaker size={14} /> :
                   r.type === "suite" ? <FolderTree size={14} /> :
                   r.type === "run" ? <List size={14} /> :
                   <GitCompare size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--gcp-text)] truncate">{r.label}</div>
                  <div className="text-[11px] text-[var(--gcp-text-secondary)] truncate">{r.description}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                    r.type === "test" ? "bg-[var(--gcp-purple-bg)] text-[#9334e6]" :
                    r.type === "suite" ? "bg-[var(--gcp-yellow-bg)] text-[var(--gcp-yellow)]" :
                    r.type === "run" ? "bg-[var(--gcp-blue-bg)] text-[var(--gcp-blue)]" :
                    "bg-[var(--gcp-green-bg)] text-[var(--gcp-green)]"
                  }`}>
                    {r.type}
                  </span>
                  <ArrowUpRight size={12} className="text-[var(--gcp-text-secondary)]" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-[var(--gcp-grey)] flex gap-4 text-[11px] text-[var(--gcp-text-secondary)]">
          <span><kbd className="px-1.5 py-0.5 bg-[var(--gcp-grey-bg)] border border-[var(--gcp-grey)] rounded font-mono text-[10px]">↑↓</kbd> Navigate</span>
          <span><kbd className="px-1.5 py-0.5 bg-[var(--gcp-grey-bg)] border border-[var(--gcp-grey)] rounded font-mono text-[10px]">↵</kbd> Open</span>
          <span><kbd className="px-1.5 py-0.5 bg-[var(--gcp-grey-bg)] border border-[var(--gcp-grey)] rounded font-mono text-[10px]">⌘K</kbd> Toggle</span>
          <span><kbd className="px-1.5 py-0.5 bg-[var(--gcp-grey-bg)] border border-[var(--gcp-grey)] rounded font-mono text-[10px]">ESC</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
