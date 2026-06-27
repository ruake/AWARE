import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronRight, Clock, ShieldAlert, CheckCircle2, XCircle, AlertCircle, FileCode, PlayCircle, SkipForward, ArrowLeft } from "lucide-react";
import { Link, useParams } from "wouter";
import { format } from "date-fns";

export default function RunDetail() {
  const params = useParams<{ runId: string }>();
  const runId = params.runId || "";
  
  const run = useStore(state => state.getRunById(runId));
  const results = useStore(state => state.getTestResultsByRunId(runId));
  
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<"ALL" | "PASS" | "FAIL" | "SKIPPED">("ALL");
  const [search, setSearch] = useState("");

  if (!run) {
    return <div className="p-12 text-center text-muted-foreground border rounded-lg bg-card">Run not found.</div>;
  }

  const filteredResults = results
    .filter(r => filter === "ALL" || r.status === filter)
    .filter(r => search === "" || r.name.toLowerCase().includes(search.toLowerCase()) || r.testCaseId.toLowerCase().includes(search.toLowerCase()));

  const stats = {
    total: results.length,
    passed: results.filter(r => r.status === "PASS").length,
    failed: results.filter(r => r.status === "FAIL").length,
    skipped: results.filter(r => r.status === "SKIPPED").length,
  };

  const toggleRow = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 pb-12">
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
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><PlayCircle className="w-4 h-4" /> {run.suiteId}</span>
              <span className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> {run.env} ({run.network})</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {run.duration}</span>
              <span>{format(new Date(run.started), "MMM dd, yyyy HH:mm:ss")}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{run.passPct}%</div>
            <div className="text-sm text-muted-foreground">Pass Rate</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-sm font-medium text-muted-foreground mb-1">Total Tests</p><p className="text-2xl font-bold">{stats.total}</p></div>
            <FileCode className="w-8 h-8 text-muted-foreground/30" />
          </CardContent>
        </Card>
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">Passed</p><p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.passed}</p></div>
            <CheckCircle2 className="w-8 h-8 text-emerald-500/50" />
          </CardContent>
        </Card>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-sm font-medium text-destructive mb-1">Failed</p><p className="text-2xl font-bold text-destructive">{stats.failed}</p></div>
            <XCircle className="w-8 h-8 text-destructive/50" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-sm font-medium text-muted-foreground mb-1">Skipped</p><p className="text-2xl font-bold text-muted-foreground">{stats.skipped}</p></div>
            <SkipForward className="w-8 h-8 text-muted-foreground/30" />
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 items-center bg-card p-4 rounded-lg border border-border">
        <Input 
          placeholder="Search test name..." 
          className="max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2">
          {(["ALL", "FAIL", "PASS", "SKIPPED"] as const).map(f => (
            <Button 
              key={f} 
              variant={filter === f ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter(f)}
              className={filter === f && f === "FAIL" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Test Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResults.map(res => (
              <React.Fragment key={res.id}>
                <TableRow className="hover:bg-muted/30 cursor-pointer" onClick={() => toggleRow(res.id)}>
                  <TableCell>
                    {expanded[res.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </TableCell>
                  <TableCell className="font-medium">{res.name}</TableCell>
                  <TableCell>{res.category}</TableCell>
                  <TableCell>
                    <Badge variant={res.status === "PASS" ? "outline" : res.status === "FAIL" ? "destructive" : "secondary"}
                           className={res.status === "PASS" ? "border-emerald-500 text-emerald-500" : ""}>
                      {res.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{res.duration.toFixed(0)}ms</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {res.tags?.map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                    </div>
                  </TableCell>
                </TableRow>
                {expanded[res.id] && (
                  <TableRow className="bg-muted/10">
                    <TableCell colSpan={6} className="p-0">
                      <div className="p-6 border-b border-border space-y-6">
                        {res.assertions && res.assertions.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                              <ShieldAlert className="w-4 h-4" /> Assertions
                            </h4>
                            <div className="grid gap-2">
                              {res.assertions.map((a, i) => (
                                <div key={i} className="flex items-center justify-between bg-background border p-3 rounded-md text-sm">
                                  <span className="font-mono">{a.assertion}</span>
                                  <div className="flex items-center gap-4">
                                    <span className="text-muted-foreground">Expected: <span className="text-foreground">{a.expected}</span></span>
                                    <span className="text-muted-foreground">Actual: <span className={!a.passed ? "text-destructive font-bold" : "text-foreground"}>{a.actual}</span></span>
                                    {a.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-destructive" />}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-semibold mb-3">HTTP Timings Waterfall</h4>
                          <div className="h-4 bg-muted rounded-full overflow-hidden flex max-w-xl">
                            <div className="bg-blue-500/80 h-full" style={{ width: '15%' }} title="DNS: 15%" />
                            <div className="bg-purple-500/80 h-full" style={{ width: '25%' }} title="TCP: 25%" />
                            <div className="bg-orange-500/80 h-full" style={{ width: '35%' }} title="TLS: 35%" />
                            <div className="bg-emerald-500/80 h-full" style={{ width: '10%' }} title="TTFB: 10%" />
                            <div className="bg-cyan-500/80 h-full" style={{ width: '15%' }} title="Download: 15%" />
                          </div>
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500/80 rounded-full"/> DNS</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-purple-500/80 rounded-full"/> TCP</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-orange-500/80 rounded-full"/> TLS</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500/80 rounded-full"/> TTFB</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-cyan-500/80 rounded-full"/> Download</span>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Link href={`/compare?candidate=${run.id}&q=${encodeURIComponent(res.name)}`} className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90">
                            Compare Result
                          </Link>
                          <Button variant="outline" size="sm">View Definition</Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
            {filteredResults.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center p-8 text-muted-foreground">No tests match criteria.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
