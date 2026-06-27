import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis,
} from "@/components/ui/pagination";
import { Link, useLocation } from "wouter";
import { Search, Download, Filter, X, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { usePagination } from "@/hooks/use-pagination";

const PAGE_SIZE = 20;
type SortKey = "started" | "passPct" | "duration" | "failures";

export default function Runs() {
  const runs = useStore(state => state.runs);
  const [, navigate] = useLocation();

  // Read initial filters from URL search params
  const urlParams = new URLSearchParams(window.location.search);
  const [search, setSearch]           = useState(urlParams.get("q") || "");
  const [envFilter, setEnvFilter]     = useState(urlParams.get("env") || "ALL");
  const [statusFilter, setStatusFilter] = useState(urlParams.get("status") || "ALL");
  const [networkFilter, setNetworkFilter] = useState("ALL");
  const [sortKey, setSortKey]         = useState<SortKey>("started");
  const [sortDir, setSortDir]         = useState<"asc" | "desc">("desc");

  const hasActiveFilters = search !== "" || envFilter !== "ALL" || statusFilter !== "ALL" || networkFilter !== "ALL";

  // Compute status counts for dropdown labels
  const statusCounts = useMemo(() => ({
    PASS:    runs.filter(r => r.status === "PASS").length,
    FAIL:    runs.filter(r => r.status === "FAIL").length,
    RUNNING: runs.filter(r => r.status === "RUNNING").length,
  }), [runs]);

  const envCounts = useMemo(() => ({
    QA:   runs.filter(r => r.env === "QA").length,
    UAT:  runs.filter(r => r.env === "UAT").length,
    PROD: runs.filter(r => r.env === "PROD").length,
  }), [runs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return runs
      .filter(r => envFilter === "ALL" || r.env === envFilter)
      .filter(r => statusFilter === "ALL" || r.status === statusFilter)
      .filter(r => networkFilter === "ALL" || r.network === networkFilter)
      .filter(r =>
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.label.toLowerCase().includes(q) ||
        r.build.toLowerCase().includes(q) ||
        r.suiteId.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        let av: number, bv: number;
        if (sortKey === "started")   { av = new Date(a.started).getTime(); bv = new Date(b.started).getTime(); }
        else if (sortKey === "passPct")  { av = a.passPct; bv = b.passPct; }
        else if (sortKey === "duration") { av = a.durationMs ?? 0; bv = b.durationMs ?? 0; }
        else                          { av = a.failures; bv = b.failures; }
        return sortDir === "asc" ? av - bv : bv - av;
      });
  }, [runs, search, envFilter, statusFilter, networkFilter, sortKey, sortDir]);

  const pg = usePagination(filtered, PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function clearFilters() {
    setSearch("");
    setEnvFilter("ALL");
    setStatusFilter("ALL");
    setNetworkFilter("ALL");
  }

  function exportCsv() {
    const header = ["Run ID", "Environment", "Network", "Status", "Pass Rate %", "Failures", "Duration", "Started At", "Build", "Rev", "Suite"];
    const rows = filtered.map(r => [
      r.id, r.env, r.network, r.status, r.passPct, r.failures,
      r.duration, format(new Date(r.started), "yyyy-MM-dd HH:mm:ss"), r.build, r.rev, r.suiteId,
    ]);
    const csv = [header, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `aware-runs-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const SortHead = ({ label, col }: { label: string; col: SortKey }) => (
    <TableHead
      className="cursor-pointer select-none hover:text-foreground"
      onClick={() => toggleSort(col)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortKey === col ? "text-primary" : "text-muted-foreground/40"}`} />
        {sortKey === col && (
          <span className="text-[9px] text-primary">{sortDir === "asc" ? "↑" : "↓"}</span>
        )}
      </span>
    </TableHead>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Run History</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{runs.length} total runs across all environments</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={exportCsv} title={`Export ${filtered.length} filtered runs as CSV`}>
          <Download className="w-4 h-4" /> Export CSV ({filtered.length})
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-card p-4 rounded-lg border border-border">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search ID, label, build, suite..."
            className="pl-9 pr-8"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch("")}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={envFilter}
            onChange={e => setEnvFilter(e.target.value)}
          >
            <option value="ALL">All Envs ({runs.length})</option>
            <option value="QA">QA ({envCounts.QA})</option>
            <option value="UAT">UAT ({envCounts.UAT})</option>
            <option value="PROD">PROD ({envCounts.PROD})</option>
          </select>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PASS">PASS ({statusCounts.PASS})</option>
            <option value="FAIL">FAIL ({statusCounts.FAIL})</option>
            <option value="RUNNING">RUNNING ({statusCounts.RUNNING})</option>
          </select>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={networkFilter}
            onChange={e => setNetworkFilter(e.target.value)}
          >
            <option value="ALL">All Networks</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
          </select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-9 text-muted-foreground gap-1" onClick={clearFilters}>
              <X className="w-3 h-3" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Run ID</TableHead>
              <TableHead>Environment</TableHead>
              <TableHead>Status</TableHead>
              <SortHead label="Pass Rate" col="passPct" />
              <SortHead label="Failures" col="failures" />
              <SortHead label="Duration" col="duration" />
              <SortHead label="Started At" col="started" />
              <TableHead>Build</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pg.pageItems.map(run => (
              <TableRow
                key={run.id}
                className="hover:bg-muted/30 cursor-pointer"
                onClick={() => navigate(`/runs/${run.id}`)}
              >
                <TableCell className="font-medium">
                  <span
                    className="text-primary hover:underline"
                    onClick={e => e.stopPropagation()}
                  >
                    <Link href={`/runs/${run.id}`}>{run.id}</Link>
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-xs">{run.env}</Badge>
                    <span className="text-xs text-muted-foreground">{run.network}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={run.status === "PASS" ? "default" : run.status === "FAIL" ? "destructive" : "secondary"}
                    className={
                      run.status === "PASS" ? "bg-emerald-500 hover:bg-emerald-500" :
                      run.status === "RUNNING" ? "animate-pulse" : ""
                    }
                  >
                    {run.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 min-w-[90px]">
                    <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${run.passPct >= 95 ? "bg-emerald-500" : run.passPct >= 80 ? "bg-amber-500" : "bg-destructive"}`}
                        style={{ width: `${run.passPct}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium tabular-nums ${run.passPct >= 95 ? "text-emerald-600 dark:text-emerald-400" : run.passPct < 80 ? "text-destructive" : ""}`}>
                      {run.passPct}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {run.failures > 0 ? (
                    <span className="text-sm font-medium text-destructive">{run.failures}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm tabular-nums">{run.duration}</TableCell>
                <TableCell className="text-muted-foreground text-xs tabular-nums whitespace-nowrap">
                  {format(new Date(run.started), "MMM dd, HH:mm")}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">{run.build}</TableCell>
              </TableRow>
            ))}
            {pg.pageItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="p-10 text-center">
                  <p className="text-muted-foreground mb-2">No runs match your filters.</p>
                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">{pg.from}–{pg.to}</span> of{" "}
              <span className="font-medium text-foreground">{pg.total}</span> runs
              {hasActiveFilters && ` (filtered from ${runs.length})`}
            </p>
            {pg.totalPages > 1 && (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
