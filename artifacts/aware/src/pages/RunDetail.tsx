import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  ChevronDown, ChevronRight, Clock, ShieldAlert, CheckCircle2,
  XCircle, AlertCircle, FileCode, PlayCircle, SkipForward, ArrowLeft,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { format } from "date-fns";
import { usePagination } from "@/hooks/use-pagination";

const PAGE_SIZE = 10;

export default function RunDetail() {
  const params = useParams<{ runId: string }>();
  const runId = params.runId || "";

  const run = useStore(state => state.getRunById(runId));
  const results = useStore(state => state.getTestResultsByRunId(runId));

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<"ALL" | "PASS" | "FAIL" | "SKIPPED" | "FLAKY">("ALL");
  const [search, setSearch] = useState("");

  if (!run) {
    return (
      <div className="p-12 text-center text-muted-foreground border rounded-lg bg-card">
        Run not found.
      </div>
    );
  }

  const stats = {
    total:   results.length,
    passed:  results.filter(r => r.status === "PASS").length,
    failed:  results.filter(r => r.status === "FAIL").length,
    skipped: results.filter(r => r.status === "SKIPPED").length,
    flaky:   results.filter(r => r.status === "FLAKY").length,
  };

  const filteredResults = results
    .filter(r => filter === "ALL" || r.status === filter)
    .filter(r =>
      search === "" ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.testCaseId.toLowerCase().includes(search.toLowerCase())
    );

  const pg = usePagination(filteredResults, PAGE_SIZE);

  const toggleRow = (id: string) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const FILTERS = ["ALL", "PASS", "FAIL", "SKIPPED", "FLAKY"] as const;
  const filterCounts: Record<string, number> = {
    ALL: results.length,
    PASS: stats.passed,
    FAIL: stats.failed,
    SKIPPED: stats.skipped,
    FLAKY: stats.flaky,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <Link href="/runs" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to runs
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              Run {run.id}
              <Badge variant={run.status === "PASS" ? "default" : run.status === "FAIL" ? "destructive" : "secondary"}>
                {run.status}
              </Badge>
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><PlayCircle className="w-4 h-4" />{run.suiteId}</span>
              <span className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{run.env} ({run.network})</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{run.duration}</span>
              <span>{format(new Date(run.started), "MMM dd, yyyy HH:mm:ss")}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-bold">{run.passPct}%</div>
            <div className="text-sm text-muted-foreground">Pass Rate</div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Tests", value: stats.total, icon: <FileCode className="w-7 h-7 text-muted-foreground/30" />, color: "" },
          { label: "Passed",      value: stats.passed,  icon: <CheckCircle2 className="w-7 h-7 text-emerald-500/50" />, color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400" },
          { label: "Failed",      value: stats.failed,  icon: <XCircle className="w-7 h-7 text-destructive/50" />, color: "border-destructive/20 bg-destructive/5 text-destructive" },
          { label: "Skipped",     value: stats.skipped, icon: <SkipForward className="w-7 h-7 text-muted-foreground/30" />, color: "" },
          { label: "Flaky",       value: stats.flaky,   icon: <AlertCircle className="w-7 h-7 text-amber-500/50" />, color: "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400" },
        ].map(({ label, value, icon, color }) => (
          <Card key={label} className={color || undefined}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
              {icon}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-card p-4 rounded-lg border border-border">
        <Input
          placeholder="Search test name or case ID..."
          className="max-w-xs"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className={
                filter === f && f === "FAIL"  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" :
                filter === f && f === "FLAKY" ? "bg-amber-500 text-white hover:bg-amber-500/90" : ""
              }
            >
              {f}
              {filterCounts[f] > 0 && (
                <span className="ml-1.5 text-[10px] opacity-70">({filterCounts[f]})</span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Results table */}
      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Test Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pg.pageItems.map(res => (
              <React.Fragment key={res.id}>
                <TableRow
                  className="hover:bg-muted/30 cursor-pointer"
                  onClick={() => toggleRow(res.id)}
                >
                  <TableCell>
                    {expanded[res.id]
                      ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    }
                  </TableCell>
                  <TableCell className="font-medium">{res.name}</TableCell>
                  <TableCell>{res.category}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        res.status === "PASS"    ? "outline" :
                        res.status === "FAIL"    ? "destructive" :
                        res.status === "FLAKY"   ? "outline" :
                        "secondary"
                      }
                      className={
                        res.status === "PASS"  ? "border-emerald-500 text-emerald-500" :
                        res.status === "FLAKY" ? "border-amber-500 text-amber-500" : ""
                      }
                    >
                      {res.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {res.duration.toFixed(0)}ms
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {res.tags?.map(t => (
                        <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>

                {expanded[res.id] && (
                  <TableRow className="bg-muted/10">
                    <TableCell colSpan={6} className="p-0">
                      <div className="p-6 border-b border-border space-y-6">
                        {/* Assertions */}
                        {res.assertions && res.assertions.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                              <ShieldAlert className="w-4 h-4" /> Assertions
                            </h4>
                            <div className="grid gap-2">
                              {res.assertions.map((a, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between bg-background border p-3 rounded-md text-sm"
                                >
                                  <span className="font-mono">{a.assertion}</span>
                                  <div className="flex items-center gap-4">
                                    <span className="text-muted-foreground">
                                      Expected: <span className="text-foreground">{a.expected}</span>
                                    </span>
                                    <span className="text-muted-foreground">
                                      Actual:{" "}
                                      <span className={!a.passed ? "text-destructive font-bold" : "text-foreground"}>
                                        {a.actual}
                                      </span>
                                    </span>
                                    {a.passed
                                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                      : <XCircle className="w-4 h-4 text-destructive" />
                                    }
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Error message */}
                        {(res as any).error && (
                          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                            <p className="text-xs font-mono text-destructive">{(res as any).error}</p>
                          </div>
                        )}

                        {/* HTTP waterfall */}
                        <div>
                          <h4 className="text-sm font-semibold mb-3">HTTP Timings Waterfall</h4>
                          <div className="h-4 bg-muted rounded-full overflow-hidden flex max-w-xl">
                            {[
                              { w: "12%", bg: "bg-blue-500/80",    label: "DNS" },
                              { w: "22%", bg: "bg-purple-500/80",  label: "TCP" },
                              { w: "38%", bg: "bg-orange-500/80",  label: "TLS" },
                              { w: "14%", bg: "bg-emerald-500/80", label: "TTFB" },
                              { w: "14%", bg: "bg-cyan-500/80",    label: "Download" },
                            ].map(s => (
                              <div key={s.label} className={`${s.bg} h-full`} style={{ width: s.w }} title={s.label} />
                            ))}
                          </div>
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            {[
                              { bg: "bg-blue-500/80",    label: "DNS" },
                              { bg: "bg-purple-500/80",  label: "TCP" },
                              { bg: "bg-orange-500/80",  label: "TLS" },
                              { bg: "bg-emerald-500/80", label: "TTFB" },
                              { bg: "bg-cyan-500/80",    label: "Download" },
                            ].map(s => (
                              <span key={s.label} className="flex items-center gap-1">
                                <div className={`w-2 h-2 ${s.bg} rounded-full`} /> {s.label}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          <Link
                            href={`/compare?candidate=${run.id}&q=${encodeURIComponent(res.name)}`}
                            className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition"
                          >
                            Compare Result
                          </Link>
                          <Link
                            href={`/tests?id=${res.testCaseId}`}
                            className="text-sm border border-border bg-background px-4 py-2 rounded-md font-medium hover:bg-muted transition"
                          >
                            View Definition
                          </Link>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}

            {pg.pageItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center p-8 text-muted-foreground">
                  No tests match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {filteredResults.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{pg.from}–{pg.to}</span> of{" "}
              <span className="font-medium text-foreground">{pg.total}</span> results
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
                    <PaginationItem key={`ellipsis-${i}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
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
      </div>
    </div>
  );
}
