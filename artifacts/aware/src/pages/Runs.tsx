import { useState } from "react";
import { useStore } from "@/lib/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Pagination, PaginationContent, PaginationItem,
  PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis,
} from "@/components/ui/pagination";
import { Link } from "wouter";
import { Search, Download, Filter } from "lucide-react";
import { format } from "date-fns";
import { usePagination } from "@/hooks/use-pagination";

const PAGE_SIZE = 20;

export default function Runs() {
  const runs = useStore(state => state.runs);
  const [search, setSearch] = useState("");
  const [envFilter, setEnvFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = runs
    .filter(r => envFilter === "ALL" || r.env === envFilter)
    .filter(r => statusFilter === "ALL" || r.status === statusFilter)
    .filter(r =>
      search === "" ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.label.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime());

  const pg = usePagination(filtered, PAGE_SIZE);

  function exportCsv() {
    const header = ["Run ID", "Environment", "Network", "Status", "Pass Rate", "Failures", "Duration", "Started At", "Build", "Rev"];
    const rows = filtered.map(r => [
      r.id, r.env, r.network, r.status, `${r.passPct}%`, r.failures,
      r.duration, format(new Date(r.started), "yyyy-MM-dd HH:mm:ss"), r.build, r.rev,
    ]);
    const csv = [header, ...rows].map(row => row.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aware-runs-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Run History</h1>
        <Button variant="outline" className="gap-2" onClick={exportCsv}>
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-card p-4 rounded-lg border border-border">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search run ID or label..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={envFilter}
            onChange={e => setEnvFilter(e.target.value)}
          >
            <option value="ALL">All Environments</option>
            <option value="QA">QA</option>
            <option value="UAT">UAT</option>
            <option value="PROD">PROD</option>
          </select>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PASS">PASS</option>
            <option value="FAIL">FAIL</option>
            <option value="RUNNING">RUNNING</option>
          </select>
        </div>
      </div>

      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Run ID</TableHead>
              <TableHead>Environment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pass Rate</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Started At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pg.pageItems.map(run => (
              <TableRow key={run.id} className="hover:bg-muted/30 cursor-pointer">
                <TableCell className="font-medium">
                  <Link href={`/runs/${run.id}`} className="text-primary hover:underline">{run.id}</Link>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{run.env}</Badge>
                    <span className="text-xs text-muted-foreground">{run.network}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={run.status === "PASS" ? "default" : run.status === "FAIL" ? "destructive" : "secondary"}>
                    {run.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full ${run.passPct >= 95 ? "bg-emerald-500" : run.passPct >= 80 ? "bg-amber-500" : "bg-destructive"}`}
                        style={{ width: `${run.passPct}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{run.passPct}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{run.duration}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(run.started), "MMM dd, HH:mm:ss")}
                </TableCell>
              </TableRow>
            ))}
            {pg.pageItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="p-8 text-center text-muted-foreground">
                  No runs found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{pg.from}–{pg.to}</span> of{" "}
              <span className="font-medium text-foreground">{pg.total}</span> runs
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
