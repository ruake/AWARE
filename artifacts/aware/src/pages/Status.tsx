import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ServerCog, Activity, Calendar, Copy, CheckCircle2, Clock, XCircle, FileText, Check, ExternalLink } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

export default function Status() {
  const status  = useStore(state => state.schedulerStatus);
  const suites  = useStore(state => state.suites);
  const runs    = useStore(state => state.runs);
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);

  const activeRunsCount = useMemo(
    () => runs.filter(r => r.status === "RUNNING").length,
    [runs],
  );

  if (!status) return (
    <div className="p-12 text-center text-muted-foreground">Scheduler data unavailable.</div>
  );

  // Generate YAML using actual suite IDs and environments
  const yamlConfig = `# A.W.A.R.E. Generated CI Configuration
# Suites: ${suites.map(s => s.id).join(", ")}
name: CDN Regression Tests
on:
  schedule:
    - cron: '0 0 * * *'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: false
        default: 'QA'

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        environment: [QA, UAT, PROD]
        suite: [${suites.slice(0, 4).map(s => s.id).join(", ")}]
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run Tests
        run: pytest tests/ --env \${{ matrix.environment }} --suite \${{ matrix.suite }} --json-report
      - name: Upload Results to A.W.A.R.E.
        uses: akamai/aware-publish-action@v1
        with:
          token: \${{ secrets.AWARE_TOKEN }}
          suite-id: \${{ matrix.suite }}
          environment: \${{ matrix.environment }}
          path: .report.json`.trim();

  function copyYaml() {
    navigator.clipboard.writeText(yamlConfig).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const summaryCards = [
    {
      label: "Total Suites",
      value: status.summary.totalSuites,
      icon: <FileText className="w-8 h-8 text-muted-foreground/30" />,
    },
    {
      label: "Active Runs",
      value: activeRunsCount,
      icon: <Activity className="w-8 h-8 text-primary/30" />,
      accent: activeRunsCount > 0 ? "text-primary" : undefined,
    },
    {
      label: "Pending Dispatches",
      value: status.summary.pendingDispatches,
      icon: <Clock className="w-8 h-8 text-muted-foreground/30" />,
    },
    {
      label: "Last Reconcile",
      value: formatDistanceToNow(new Date(status.lastRun), { addSuffix: true }),
      icon: <Calendar className="w-8 h-8 text-muted-foreground/30" />,
      small: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ServerCog className="w-6 h-6" /> Pipeline Status
        </h1>
        <Badge
          variant={status.status === "healthy" ? "default" : "destructive"}
          className={`text-sm px-3 py-1 ${status.status === "healthy" ? "bg-emerald-500 hover:bg-emerald-500" : ""}`}
        >
          {status.status === "healthy" ? "✓ SCHEDULER HEALTHY" : "✗ SCHEDULER DEGRADED"}
        </Badge>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map(card => (
          <Card key={card.label}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                <p className={`font-bold mt-1 ${card.small ? "text-sm" : "text-2xl"} ${card.accent ?? ""}`}>
                  {card.value}
                </p>
              </div>
              {card.icon}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Suite Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suite Status</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Suite</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {status.suites.map(s => {
                  const suite = suites.find(su => su.id === s.suiteId);
                  return (
                    <TableRow key={s.suiteId} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-sm">
                        <div>{s.suiteId}</div>
                        {suite && (
                          <div className="text-xs text-muted-foreground truncate max-w-[120px]" title={suite.name}>
                            {suite.name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{s.schedule}</code>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.lastRun
                          ? formatDistanceToNow(new Date(s.lastRun), { addSuffix: true })
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={s.lastConclusion === "PASS" ? "outline" : "destructive"}
                          className={`text-xs ${s.lastConclusion === "PASS" ? "border-emerald-500 text-emerald-500" : ""}`}
                        >
                          {s.lastConclusion || "UNKNOWN"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title={`View runs for ${s.suiteId}`}
                          onClick={() => navigate(`/runs?q=${s.suiteId}`)}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Dispatches */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Dispatches</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Suite</TableHead>
                  <TableHead>Env</TableHead>
                  <TableHead>Dispatched</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {status.recentDispatches.map(d => (
                  <TableRow key={d.workflowRunId} className="hover:bg-muted/30">
                    <TableCell className="text-xs font-mono">{d.suiteId}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{d.environment}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(d.dispatchedAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <span className={`flex items-center gap-1.5 text-xs font-medium
                        ${d.status === "success" ? "text-emerald-500" : "text-destructive"}`}>
                        {d.status === "success"
                          ? <CheckCircle2 className="w-3.5 h-3.5" />
                          : <XCircle className="w-3.5 h-3.5" />
                        }
                        {d.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* CI Configuration */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">CI Configuration</CardTitle>
          <Button
            variant={copied ? "default" : "outline"}
            size="sm"
            className={`gap-2 transition ${copied ? "bg-emerald-500 hover:bg-emerald-500 text-white" : ""}`}
            onClick={copyYaml}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy YAML"}
          </Button>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono text-muted-foreground border border-border leading-relaxed max-h-80">
            {yamlConfig}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
