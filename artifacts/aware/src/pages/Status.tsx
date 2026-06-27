import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ServerCog, Activity, Calendar, Copy, CheckCircle2, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function Status() {
  const status = useStore(state => state.schedulerStatus);
  const suites = useStore(state => state.suites);

  if (!status) return null;

  const yamlConfig = `
# Generated A.W.A.R.E. CI Config
name: CDN Regression Tests
on:
  schedule:
    - cron: '0 0 * * *'
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        environment: [QA, UAT, PROD]
    steps:
      - uses: actions/checkout@v3
      - name: Run Tests
        run: pytest tests/ --env \${{ matrix.environment }}
      - name: Upload Results
        uses: akamai/aware-publish-action@v1
        with:
          token: \${{ secrets.AWARE_TOKEN }}
          path: results.json
`.trim();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><ServerCog className="w-6 h-6"/> Pipeline Status</h1>
        <Badge variant={status.status === 'healthy' ? 'default' : 'destructive'} className={status.status === 'healthy' ? "bg-emerald-500" : ""}>
          SCHEDULER {status.status.toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-sm font-medium text-muted-foreground">Total Suites</p><p className="text-2xl font-bold">{status.summary.totalSuites}</p></div>
            <FileText className="w-8 h-8 text-muted-foreground/30" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-sm font-medium text-muted-foreground">Active Runs</p><p className="text-2xl font-bold text-primary">{status.summary.activeRuns}</p></div>
            <Activity className="w-8 h-8 text-primary/30" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-sm font-medium text-muted-foreground">Pending Dispatches</p><p className="text-2xl font-bold">{status.summary.pendingDispatches}</p></div>
            <Clock className="w-8 h-8 text-muted-foreground/30" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-sm font-medium text-muted-foreground">Last Run</p><p className="text-sm font-bold mt-2">{format(new Date(status.lastRun), "HH:mm:ss")}</p></div>
            <Calendar className="w-8 h-8 text-muted-foreground/30" />
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Suite Status</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Suite ID</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {status.suites.map(s => (
                  <TableRow key={s.suiteId}>
                    <TableCell className="font-medium">{s.suiteId}</TableCell>
                    <TableCell><code className="bg-muted px-1.5 py-0.5 rounded text-xs">{s.schedule}</code></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.lastRun ? format(new Date(s.lastRun), "MMM dd, HH:mm") : "Never"}</TableCell>
                    <TableCell>
                      <Badge variant={s.lastConclusion === "PASS" ? "outline" : "destructive"} className={s.lastConclusion === "PASS" ? "border-emerald-500 text-emerald-500" : ""}>
                        {s.lastConclusion || "UNKNOWN"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Dispatches</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Suite</TableHead>
                  <TableHead>Env</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {status.recentDispatches.map(d => (
                  <TableRow key={d.workflowRunId}>
                    <TableCell className="font-medium text-xs">{d.suiteId}</TableCell>
                    <TableCell><Badge variant="outline">{d.environment}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(d.dispatchedAt), "HH:mm:ss")}</TableCell>
                    <TableCell>
                      {d.status === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-destructive" />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">CI Configuration</CardTitle>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigator.clipboard.writeText(yamlConfig)}>
            <Copy className="w-4 h-4" /> Copy YAML
          </Button>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono text-muted-foreground border border-border">
            {yamlConfig}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

// Internal helper for icon
function FileText(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
}
