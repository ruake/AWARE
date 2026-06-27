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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, FileCode2, User, Tag, Github, X, ExternalLink } from "lucide-react";
import { TestCase } from "@/lib/types";
import { format } from "date-fns";
import { usePagination } from "@/hooks/use-pagination";
import { useLocation } from "wouter";

const PAGE_SIZE = 15;
const CATEGORIES = ["ALL", "CDN", "DNS", "TLS", "Cache", "EdgeWorker", "Redirect", "Auth"];
const TYPES = ["ALL", "playwright", "pytest", "http", "puppeteer"] as const;
const PRIORITIES = ["ALL", "P0", "P1", "P2", "P3"] as const;

const PRIORITY_STYLES: Record<string, string> = {
  P0: "border-destructive text-destructive",
  P1: "border-orange-500 text-orange-500",
  P2: "border-amber-400 text-amber-500",
  P3: "border-muted-foreground text-muted-foreground",
};

export default function Tests() {
  const testCases   = useStore(state => state.testCases);
  const [, navigate] = useLocation();

  const [search,         setSearch]         = useState("");
  const [typeFilter,     setTypeFilter]     = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [ownerFilter,    setOwnerFilter]    = useState("ALL");
  const [selectedTest,   setSelectedTest]   = useState<TestCase | null>(null);

  const owners = useMemo(() => {
    const set = new Set(testCases.map(tc => tc.owner));
    return ["ALL", ...Array.from(set).sort()];
  }, [testCases]);

  const hasActiveFilters = search !== "" || typeFilter !== "ALL" || categoryFilter !== "ALL" || priorityFilter !== "ALL" || ownerFilter !== "ALL";

  const filtered = useMemo(() =>
    testCases
      .filter(tc => typeFilter     === "ALL" || tc.testType  === typeFilter)
      .filter(tc => categoryFilter === "ALL" || tc.category  === categoryFilter)
      .filter(tc => priorityFilter === "ALL" || tc.priority  === priorityFilter)
      .filter(tc => ownerFilter    === "ALL" || tc.owner     === ownerFilter)
      .filter(tc => {
        const q = search.toLowerCase();
        return !q || tc.name.toLowerCase().includes(q) || tc.id.toLowerCase().includes(q) || tc.owner.toLowerCase().includes(q);
      }),
    [testCases, typeFilter, categoryFilter, priorityFilter, ownerFilter, search],
  );

  const pg = usePagination(filtered, PAGE_SIZE);

  function clearFilters() {
    setSearch(""); setTypeFilter("ALL"); setCategoryFilter("ALL");
    setPriorityFilter("ALL"); setOwnerFilter("ALL");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileCode2 className="w-6 h-6" /> Test Case Browser
        </h1>
        <span className="text-sm text-muted-foreground">
          {hasActiveFilters
            ? <><strong className="text-foreground">{filtered.length}</strong> of {testCases.length} tests</>
            : <><strong className="text-foreground">{testCases.length}</strong> tests</>
          }
        </span>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 bg-card p-4 rounded-lg border border-border">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search name, ID, or owner…"
              className="pl-9 pr-8 bg-background"
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
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c === "ALL" ? "All Categories" : c}</option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
          >
            {PRIORITIES.map(p => (
              <option key={p} value={p}>{p === "ALL" ? "All Priorities" : p}</option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={ownerFilter}
            onChange={e => setOwnerFilter(e.target.value)}
          >
            {owners.map(o => (
              <option key={o} value={o}>{o === "ALL" ? "All Owners" : o}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className="h-9 gap-1 text-muted-foreground" onClick={clearFilters}>
              <X className="w-3 h-3" /> Clear
            </Button>
          )}
        </div>
        {/* Type buttons */}
        <div className="flex flex-wrap gap-2">
          {TYPES.map(t => (
            <Button
              key={t}
              variant={typeFilter === t ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(t)}
            >
              {t === "ALL" ? "All Types" : t}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Test ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Owner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pg.pageItems.map(tc => (
              <TableRow
                key={tc.id}
                className="hover:bg-muted/30 cursor-pointer"
                onClick={() => setSelectedTest(tc)}
              >
                <TableCell className="text-xs font-mono text-muted-foreground">{tc.id}</TableCell>
                <TableCell className="font-medium max-w-[260px] truncate" title={tc.name}>{tc.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{tc.category}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">{tc.testType}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${PRIORITY_STYLES[tc.priority] ?? ""}`}>
                    {tc.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <button
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
                    onClick={e => { e.stopPropagation(); setOwnerFilter(tc.owner); }}
                    title={`Filter by ${tc.owner}`}
                  >
                    <User className="w-3 h-3" /> {tc.owner}
                  </button>
                </TableCell>
              </TableRow>
            ))}
            {pg.pageItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center p-10">
                  <p className="text-muted-foreground mb-2">No tests found.</p>
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
              Showing <span className="font-medium text-foreground">{pg.from}–{pg.to}</span> of{" "}
              <span className="font-medium text-foreground">{pg.total}</span> test cases
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

      {/* Detail dialog */}
      <Dialog open={!!selectedTest} onOpenChange={open => !open && setSelectedTest(null)}>
        <DialogContent className="max-w-2xl bg-card border-border text-foreground">
          {selectedTest && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm px-2 py-1 bg-muted rounded text-muted-foreground shrink-0">
                    {selectedTest.id}
                  </span>
                  <span className="truncate">{selectedTest.name}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-2">
                <p className="text-sm text-muted-foreground">{selectedTest.description}</p>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Type</span>
                    <div><Badge variant="secondary">{selectedTest.testType}</Badge></div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Priority</span>
                    <div>
                      <Badge variant="outline" className={PRIORITY_STYLES[selectedTest.priority] ?? ""}>
                        {selectedTest.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Category</span>
                    <div><Badge variant="outline">{selectedTest.category}</Badge></div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Owner</span>
                    <button
                      className="flex items-center gap-1.5 text-sm hover:text-primary transition"
                      onClick={() => { setOwnerFilter(selectedTest.owner); setSelectedTest(null); }}
                      title="Filter by this owner"
                    >
                      <User className="w-3.5 h-3.5" /> {selectedTest.owner}
                    </button>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Severity</span>
                    <div className="text-sm">{(selectedTest as any).severity ?? "—"}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Status</span>
                    <div className="text-sm capitalize">{(selectedTest as any).status ?? "active"}</div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                    <FileCode2 className="w-3.5 h-3.5" /> Script Path
                  </span>
                  <div className="bg-muted p-2 rounded-md font-mono text-xs flex items-center justify-between border border-border gap-2">
                    <span className="truncate">{selectedTest.scriptPath}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      title="Open on GitHub"
                      onClick={() => window.open((selectedTest as any).githubPath || selectedTest.scriptPath, "_blank", "noopener,noreferrer")}
                    >
                      <Github className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Tags
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {selectedTest.tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between flex-wrap gap-3">
                  <span className="text-xs text-muted-foreground">
                    Last updated: {format(new Date(selectedTest.updatedAt), "MMM dd, yyyy")}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => { navigate(`/runs?q=${selectedTest.id}`); setSelectedTest(null); }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View Runs
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedTest(null)}>Close</Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
