import { useState } from "react";
import { useStore } from "@/lib/store";
import { computeDiff } from "@/lib/analytics";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, CheckCircle2, XCircle, MinusCircle, PlusCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Compare() {
  const runs = useStore(state => state.runs);
  const getTestResultsByRunId = useStore(state => state.getTestResultsByRunId);
  
  const searchParams = new URLSearchParams(window.location.search);
  
  const [baseId, setBaseId] = useState(searchParams.get("baseline") || runs[1]?.id || "");
  const [candId, setCandId] = useState(searchParams.get("candidate") || runs[0]?.id || "");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all"|"regressions"|"fixed">("all");

  const baseResults = baseId ? getTestResultsByRunId(baseId) : [];
  const candResults = candId ? getTestResultsByRunId(candId) : [];
  
  const diffs = computeDiff(baseResults, candResults);
  
  const filteredDiffs = diffs.filter(d => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "regressions" && d.status !== "regression") return false;
    if (filter === "fixed" && d.status !== "fixed") return false;
    return true;
  });

  const summary = {
    regressions: diffs.filter(d => d.status === "regression").length,
    fixed: diffs.filter(d => d.status === "fixed").length,
    unchanged: diffs.filter(d => d.status === "unchanged").length
  };

  const swap = () => {
    setBaseId(candId);
    setCandId(baseId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Compare Runs</h1>
      </div>

      <Card className="bg-card">
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full">
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Baseline Run</label>
            <select 
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={baseId} onChange={e => setBaseId(e.target.value)}
            >
              {runs.map(r => <option key={r.id} value={r.id}>{r.id} - {r.env} ({r.passPct}%)</option>)}
            </select>
          </div>
          <Button variant="outline" size="icon" className="rounded-full mt-6" onClick={swap}>
            <ArrowLeftRight className="w-4 h-4" />
          </Button>
          <div className="flex-1 w-full">
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Candidate Run</label>
            <select 
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={candId} onChange={e => setCandId(e.target.value)}
            >
              {runs.map(r => <option key={r.id} value={r.id}>{r.id} - {r.env} ({r.passPct}%)</option>)}
            </select>
          </div>
        </CardContent>
      </Card>

      {baseId && candId && baseId !== candId ? (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-destructive font-medium mb-1">Regressions</p>
                  <p className="text-3xl font-bold text-destructive">{summary.regressions}</p>
                </div>
                <XCircle className="w-8 h-8 text-destructive/50" />
              </CardContent>
            </Card>
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-1">Fixed</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{summary.fixed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-500/50" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium mb-1">Unchanged</p>
                  <p className="text-3xl font-bold">{summary.unchanged}</p>
                </div>
                <MinusCircle className="w-8 h-8 text-muted-foreground/30" />
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search tests..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>All</Button>
              <Button variant={filter === "regressions" ? "destructive" : "outline"} onClick={() => setFilter("regressions")}>Regressions</Button>
              <Button variant={filter === "fixed" ? "default" : "outline"} onClick={() => setFilter("fixed")}>Fixed</Button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredDiffs.map(diff => (
              <div key={diff.id} className={`p-4 border rounded-lg flex items-center justify-between bg-card
                ${diff.status === 'regression' ? 'border-destructive/40 bg-destructive/5' : ''}
                ${diff.status === 'fixed' ? 'border-emerald-500/40 bg-emerald-500/5' : ''}
              `}>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">{diff.name}</h4>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      Base: <Badge variant="outline" className="text-[10px] uppercase">{diff.baseResult?.status || 'N/A'}</Badge>
                    </span>
                    <ArrowLeftRight className="w-3 h-3" />
                    <span className="flex items-center gap-1.5">
                      Cand: <Badge variant="outline" className="text-[10px] uppercase">{diff.candidateResult?.status || 'N/A'}</Badge>
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  {diff.status === "regression" && <Badge variant="destructive">REGRESSION</Badge>}
                  {diff.status === "fixed" && <Badge className="bg-emerald-500 text-white">FIXED</Badge>}
                  {diff.status === "new" && <Badge variant="secondary">NEW</Badge>}
                  {diff.status === "unchanged" && <span className="text-sm text-muted-foreground">Unchanged</span>}
                </div>
              </div>
            ))}
            {filteredDiffs.length === 0 && <div className="p-8 text-center text-muted-foreground border rounded-lg bg-card">No differences found for current filters.</div>}
          </div>
        </>
      ) : (
        <div className="p-12 text-center border rounded-lg border-dashed text-muted-foreground mt-8">
          Select two different runs to see a comparison.
        </div>
      )}
    </div>
  );
}
