import { useState } from "react";
import { useStore } from "@/lib/store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Search, Download, Filter } from "lucide-react";
import { format } from "date-fns";

export default function Runs() {
  const runs = useStore(state => state.runs);
  const [search, setSearch] = useState("");
  const [envFilter, setEnvFilter] = useState("ALL");

  const filteredRuns = runs
    .filter(r => envFilter === "ALL" || r.env === envFilter)
    .filter(r => search === "" || r.id.toLowerCase().includes(search.toLowerCase()) || r.label.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.started).getTime() - new Date(a.started).getTime());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Run History</h1>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="flex gap-4 items-center bg-card p-4 rounded-lg border border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search run ID or label..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select 
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={envFilter}
            onChange={(e) => setEnvFilter(e.target.value)}
          >
            <option value="ALL">All Environments</option>
            <option value="QA">QA</option>
            <option value="UAT">UAT</option>
            <option value="PROD">PROD</option>
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
            {filteredRuns.map(run => (
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
                      <div className="h-full bg-primary" style={{ width: `${run.passPct}%` }} />
                    </div>
                    <span className="text-sm font-medium">{run.passPct}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{run.duration}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{format(new Date(run.started), "MMM dd, HH:mm:ss")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredRuns.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">No runs found matching your filters.</div>
        )}
      </div>
    </div>
  );
}
