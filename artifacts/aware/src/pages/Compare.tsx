import { useState, useMemo, Fragment } from "react";
import { useStore } from "@/lib/store";
import { computeDiff } from "@/lib/analytics";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis,
} from "@/components/ui/pagination";
import { ArrowLeftRight, CheckCircle2, XCircle, MinusCircle, Search, Copy, Check, ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePagination } from "@/hooks/use-pagination";

const PAGE_SIZE = 25;

export default function Compare() {
  const runs        = useStore(state => state.runs);
  const testResults = useStore(state => state.testResults);

  // Sort runs newest-first for the select options
  const sortedRuns = useMemo(
    () => [...runs].sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime()),
    [runs],
  );

  const urlParams = new URLSearchParams(window.location.search);
  const [baseId, setBaseId] = useState(urlParams.get("baseline") || sortedRuns[1]?.id || "");
  const [candId, setCandId] = useState(urlParams.get("candidate") || sortedRuns[0]?.id || "");
  const [search, setSearch] = useState(urlParams.get("q") || "");
  const [filter, setFilter] = useState<"all" | "regressions" | "fixed" | "unchanged">("all");
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Stable memoized results — avoids new array refs on each render
  const baseResults = useMemo(
    () => testResults.filter(r => r.runId === baseId),
    [testResults, baseId],
  );
  const candResults = useMemo(
    () => testResults.filter(r => r.runId === candId),
    [testResults, candId],
  );

  const diffs = useMemo(() => computeDiff(baseResults, candResults), [baseResults, candResults]);

  const summary = useMemo(() => ({
    regressions: diffs.filter(d => d.status === "regression").length,
    fixed:       diffs.filter(d => d.status === "fixed").length,
    unchanged:   diffs.filter(d => d.status === "unchanged").length,
    newTests:    diffs.filter(d => d.status === "new").length,
  }), [diffs]);

  const filteredDiffs = useMemo(() =>
    diffs.filter(d => {
      if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === "regressions" && d.status !== "regression") return false;
      if (filter === "fixed"       && d.status !== "fixed")       return false;
      if (filter === "unchanged"   && d.status !== "unchanged")   return false;
      return true;
    }),
    [diffs, search, filter],
  );

  const pg = usePagination(filteredDiffs, PAGE_SIZE);

  const swap = () => { setBaseId(candId); setCandId(baseId); };
  const toggleDiff = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  function copyShareUrl() {
    const url = `${window.location.origin}${window.location.pathname}?baseline=${baseId}&candidate=${candId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const isReady = baseId && candId && baseId !== candId;

  const filterButtons: Array<{ key: typeof filter; label: string; count: number; variant?: string }> = [
    { key: "all",         label: "All",         count: diffs.length },
    { key: "regressions", label: "Regressions", count: summary.regressions },
    { key: "fixed",       label: "Fixed",       count: summary.fixed },
    { key: "unchanged",   label: "Unchanged",   count: summary.unchanged },
  ];

  const runLabel = (id: string) => {
    const r = sortedRuns.find(r => r.id === id);
    if (!r) return id;
    return `${r.id} · ${r.env} ${r.network} · ${r.passPct}% · ${r.status}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Compare Runs</h1>
        {isReady && (
          <Button variant="outline" size="sm" className="gap-2" onClick={copyShareUrl}>
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Share URL"}
          </Button>
        )}
      </div>

      {/* Run selectors */}
      <Card className="bg-card">
        <CardContent className="p-6 flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Baseline Run
            </label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={baseId}
              onChange={e => setBaseId(e.target.value)}
            >
              <option value="">— select run —</option>
              {sortedRuns.map(r => (
                <option key={r.id} value={r.id} disabled={r.id === candId}>
                  {runLabel(r.id)}
                </option>
              ))}
            </select>
            {baseId && (
              <p className="text-xs text-muted-foreground mt-1">
                {baseResults.length} test results loaded
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full shrink-0 mb-1"
            onClick={swap}
            title="Swap baseline and candidate"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </Button>
          <div className="flex-1 w-full">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Candidate Run
            </label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={candId}
              onChange={e => setCandId(e.target.value)}
            >
              <option value="">— select run —</option>
              {sortedRuns.map(r => (
                <option key={r.id} value={r.id} disabled={r.id === baseId}>
                  {runLabel(r.id)}
                </option>
              ))}
            </select>
            {candId && (
              <p className="text-xs text-muted-foreground mt-1">
                {candResults.length} test results loaded
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {!isReady ? (
        <div className="p-12 text-center border rounded-lg border-dashed text-muted-foreground">
          {!baseId || !candId
            ? "Select two different runs above to compare their test results."
            : "Baseline and candidate must be different runs."}
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-destructive/20 bg-destructive/5 cursor-pointer hover:border-destructive/50 transition" onClick={() => setFilter("regressions")}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-destructive font-semibold uppercase mb-1">Regressions</p>
                  <p className="text-3xl font-bold text-destructive">{summary.regressions}</p>
                </div>
                <XCircle className="w-8 h-8 text-destructive/40" />
              </CardContent>
            </Card>
            <Card className="border-emerald-500/20 bg-emerald-500/5 cursor-pointer hover:border-emerald-500/50 transition" onClick={() => setFilter("fixed")}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase mb-1">Fixed</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{summary.fixed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary/30 transition" onClick={() => setFilter("unchanged")}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Unchanged</p>
                  <p className="text-3xl font-bold">{summary.unchanged}</p>
                </div>
                <MinusCircle className="w-8 h-8 text-muted-foreground/30" />
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary/30 transition" onClick={() => setFilter("all")}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Total Tests</p>
                  <p className="text-3xl font-bold">{diffs.length}</p>
                </div>
                <ArrowLeftRight className="w-8 h-8 text-muted-foreground/30" />
              </CardContent>
            </Card>
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search test name..."
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearch("")}
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {filterButtons.map(btn => (
                <Button
                  key={btn.key}
                  size="sm"
                  variant={filter === btn.key ? "default" : "outline"}
                  className={
                    filter === btn.key && btn.key === "regressions"
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : filter === btn.key && btn.key === "fixed"
                      ? "bg-emerald-500 text-white hover:bg-emerald-500/90"
                      : ""
                  }
                  onClick={() => setFilter(btn.key)}
                >
                  {btn.label}
                  <span className="ml-1.5 text-[10px] opacity-70">({btn.count})</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Diff list */}
          <div className="space-y-2">
            {pg.pageItems.map(diff => {
              const isExpanded = expanded[diff.id];
              return (
              <Fragment key={diff.id}>
                <div
                  className={`p-4 border rounded-lg flex items-center justify-between gap-4 bg-card transition cursor-pointer hover:bg-muted/30
                    ${diff.status === "regression" ? "border-destructive/40 bg-destructive/5" : ""}
                    ${diff.status === "fixed"      ? "border-emerald-500/40 bg-emerald-500/5" : ""}
                  `}
                  onClick={() => toggleDiff(diff.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {isExpanded
                      ? <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
                      : <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
                    }
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm truncate" title={diff.name}>{diff.name}</h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          Baseline:
                          <Badge
                            variant={diff.baseResult?.status === "PASS" ? "outline" : diff.baseResult?.status === "FAIL" ? "destructive" : "secondary"}
                            className={`text-[10px] ${diff.baseResult?.status === "PASS" ? "border-emerald-500 text-emerald-500" : ""}`}
                          >
                            {diff.baseResult?.status || "N/A"}
                          </Badge>
                        </span>
                        <ArrowLeftRight className="w-3 h-3" />
                        <span className="flex items-center gap-1">
                          Candidate:
                          <Badge
                            variant={diff.candidateResult?.status === "PASS" ? "outline" : diff.candidateResult?.status === "FAIL" ? "destructive" : "secondary"}
                            className={`text-[10px] ${diff.candidateResult?.status === "PASS" ? "border-emerald-500 text-emerald-500" : ""}`}
                          >
                            {diff.candidateResult?.status || "N/A"}
                          </Badge>
                        </span>
                        {diff.baseResult?.duration && diff.candidateResult?.duration && (
                          <span className="text-muted-foreground">
                            Δ:{" "}
                            <span className={diff.candidateResult.duration > diff.baseResult.duration ? "text-destructive" : "text-emerald-500"}>
                              {diff.candidateResult.duration > diff.baseResult.duration ? "+" : ""}
                              {(diff.candidateResult.duration - diff.baseResult.duration).toFixed(0)}ms
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {diff.status === "regression" && <Badge variant="destructive">REGRESSION</Badge>}
                    {diff.status === "fixed"       && <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white">FIXED</Badge>}
                    {diff.status === "new"         && <Badge variant="secondary">NEW</Badge>}
                    {diff.status === "unchanged"   && <span className="text-xs text-muted-foreground">Unchanged</span>}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border border-t-0 border-border rounded-b-lg bg-card overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/10">
                      <div className="flex items-center gap-2">
                        {pg.pageItems.findIndex(d => d.id === diff.id) > 0 && (
                          <button
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
                            onClick={() => { setExpanded({}); setExpanded({ [pg.pageItems[pg.pageItems.findIndex(d => d.id === diff.id) - 1].id]: true }); }}
                          >
                            <ChevronLeft className="w-3.5 h-3.5" /> Prev
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {pg.pageItems.findIndex(d => d.id === diff.id) + 1} of {pg.pageItems.length}
                      </span>
                      <div className="flex items-center gap-2">
                        {pg.pageItems.findIndex(d => d.id === diff.id) < pg.pageItems.length - 1 && (
                          <button
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
                            onClick={() => { setExpanded({}); setExpanded({ [pg.pageItems[pg.pageItems.findIndex(d => d.id === diff.id) + 1].id]: true }); }}
                          >
                            Next <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-0 divide-x divide-border">
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Baseline</h5>
                          {diff.baseResult && (
                            <Badge
                              variant={diff.baseResult.status === "PASS" ? "outline" : diff.baseResult.status === "FAIL" ? "destructive" : "secondary"}
                              className={`text-[10px] ${diff.baseResult.status === "PASS" ? "border-emerald-500 text-emerald-500" : ""}`}
                            >
                              {diff.baseResult.status}
                            </Badge>
                          )}
                        </div>
                        {diff.baseResult ? (
                          <>
                            {diff.baseResult.duration > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Duration: <span className="text-foreground font-medium">{diff.baseResult.duration.toFixed(0)}ms</span>
                              </div>
                            )}
                            {diff.baseResult.error && (
                              <div className="bg-destructive/10 border border-destructive/20 rounded p-2">
                                <p className="text-xs font-mono text-destructive">{diff.baseResult.error}</p>
                              </div>
                            )}
                            {diff.baseResult.assertions && diff.baseResult.assertions.length > 0 && (
                              <div>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Assertions</p>
                                <div className="space-y-1">
                                  {diff.baseResult.assertions.map((a, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-background border rounded p-2 text-xs">
                                      {a.passed
                                        ? <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-500" />
                                        : <XCircle className="w-3 h-3 shrink-0 text-destructive" />
                                      }
                                      <span className="font-mono">{a.assertion}</span>
                                      {!a.passed && (
                                        <span className="text-muted-foreground ml-auto">
                                          exp: {a.expected} · act: <span className="text-destructive">{a.actual}</span>
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No result</p>
                        )}
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Candidate</h5>
                          {diff.candidateResult && (
                            <Badge
                              variant={diff.candidateResult.status === "PASS" ? "outline" : diff.candidateResult.status === "FAIL" ? "destructive" : "secondary"}
                              className={`text-[10px] ${diff.candidateResult.status === "PASS" ? "border-emerald-500 text-emerald-500" : ""}`}
                            >
                              {diff.candidateResult.status}
                            </Badge>
                          )}
                        </div>
                        {diff.candidateResult ? (
                          <>
                            {diff.candidateResult.duration > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Duration: <span className="text-foreground font-medium">{diff.candidateResult.duration.toFixed(0)}ms</span>
                              </div>
                            )}
                            {diff.candidateResult.error && (
                              <div className="bg-destructive/10 border border-destructive/20 rounded p-2">
                                <p className="text-xs font-mono text-destructive">{diff.candidateResult.error}</p>
                              </div>
                            )}
                            {diff.candidateResult.assertions && diff.candidateResult.assertions.length > 0 && (
                              <div>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">Assertions</p>
                                <div className="space-y-1">
                                  {diff.candidateResult.assertions.map((a, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-background border rounded p-2 text-xs">
                                      {a.passed
                                        ? <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-500" />
                                        : <XCircle className="w-3 h-3 shrink-0 text-destructive" />
                                      }
                                      <span className="font-mono">{a.assertion}</span>
                                      {!a.passed && (
                                        <span className="text-muted-foreground ml-auto">
                                          exp: {a.expected} · act: <span className="text-destructive">{a.actual}</span>
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No result</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Fragment>
            )})}
            {pg.pageItems.length === 0 && (
              <div className="p-10 text-center text-muted-foreground border rounded-lg bg-card">
                No differences match the current filter.
              </div>
            )}
          </div>

          {/* Pagination for diffs */}
          {pg.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Showing {pg.from}–{pg.to} of {pg.total} diffs
              </p>
              <Pagination className="w-auto mx-0">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={e => { e.preventDefault(); if (pg.hasPrev) pg.setPage(p => p - 1); }}
                      className={!pg.hasPrev ? "pointer-events-none opacity-40" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {pg.pageRange().map((p, i) =>
                    p === -1 ? (
                      <PaginationItem key={`e-${i}`}><PaginationEllipsis /></PaginationItem>
                    ) : (
                      <PaginationItem key={p}>
                        <PaginationLink
                          isActive={p === pg.page}
                          onClick={e => { e.preventDefault(); pg.setPage(p); }}
                          className="cursor-pointer"
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={e => { e.preventDefault(); if (pg.hasNext) pg.setPage(p => p + 1); }}
                      className={!pg.hasNext ? "pointer-events-none opacity-40" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
}
