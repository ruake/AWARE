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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, FileCode2, User, Tag, Github } from "lucide-react";
import { TestCase } from "@/lib/types";
import { format } from "date-fns";
import { usePagination } from "@/hooks/use-pagination";

const PAGE_SIZE = 15;

export default function Tests() {
  const testCases = useStore(state => state.testCases);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [selectedTest, setSelectedTest] = useState<TestCase | null>(null);

  const categories = ["ALL", "CDN", "DNS", "TLS", "Cache", "EdgeWorker", "Redirect", "Auth"];

  const filtered = testCases
    .filter(tc => typeFilter === "ALL" || tc.testType === typeFilter)
    .filter(tc => categoryFilter === "ALL" || tc.category === categoryFilter)
    .filter(tc =>
      search === "" ||
      tc.name.toLowerCase().includes(search.toLowerCase()) ||
      tc.id.toLowerCase().includes(search.toLowerCase()) ||
      tc.owner.toLowerCase().includes(search.toLowerCase())
    );

  const pg = usePagination(filtered, PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileCode2 className="w-6 h-6" /> Test Case Browser
        </h1>
        <span className="text-sm text-muted-foreground">{filtered.length} tests</span>
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-card p-4 rounded-lg border border-border">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search name, ID, or owner..."
            className="pl-9 bg-background"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["ALL", "playwright", "pytest", "http", "puppeteer"] as const).map(t => (
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
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          {categories.map(c => (
            <option key={c} value={c}>{c === "ALL" ? "All Categories" : c}</option>
          ))}
        </select>
      </div>

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
                <TableCell className="font-medium text-xs font-mono text-muted-foreground">{tc.id}</TableCell>
                <TableCell className="font-medium max-w-[260px] truncate">{tc.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{tc.category}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{tc.testType}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      tc.priority === "P0" ? "border-destructive text-destructive" :
                      tc.priority === "P1" ? "border-orange-500 text-orange-500" : ""
                    }
                  >
                    {tc.priority}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3 h-3" /> {tc.owner}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {pg.pageItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center p-8 text-muted-foreground">
                  No tests found.
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

      {/* Test detail dialog */}
      <Dialog open={!!selectedTest} onOpenChange={open => !open && setSelectedTest(null)}>
        <DialogContent className="max-w-2xl bg-card border-border text-foreground">
          {selectedTest && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-3">
                  <span className="font-mono text-sm px-2 py-1 bg-muted rounded text-muted-foreground">
                    {selectedTest.id}
                  </span>
                  {selectedTest.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <p className="text-sm text-muted-foreground">{selectedTest.description}</p>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Type</span>
                    <p className="font-medium"><Badge variant="secondary">{selectedTest.testType}</Badge></p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Priority</span>
                    <p className="font-medium"><Badge variant="outline">{selectedTest.priority}</Badge></p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground uppercase">Owner</span>
                    <p className="font-medium flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" /> {selectedTest.owner}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                    <FileCode2 className="w-4 h-4" /> Script Path
                  </span>
                  <div className="bg-muted p-2 rounded-md font-mono text-sm flex items-center justify-between border border-border">
                    <span className="truncate mr-2">{selectedTest.scriptPath}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      title="Open on GitHub"
                      onClick={() => {
                        const url = (selectedTest as any).githubPath || selectedTest.scriptPath;
                        window.open(url, "_blank", "noopener,noreferrer");
                      }}
                    >
                      <Github className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                    <Tag className="w-4 h-4" /> Tags
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {selectedTest.tags.map(t => (
                      <Badge key={t} variant="secondary">{t}</Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Last updated: {format(new Date(selectedTest.updatedAt), "MMM dd, yyyy")}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedTest(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
