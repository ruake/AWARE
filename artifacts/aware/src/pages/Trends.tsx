import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { computePassRateTrend, computeCategoryHeatmap, computeFlakiness } from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Flame, Activity } from "lucide-react";
import { format, subDays } from "date-fns";
import { useLocation } from "wouter";

const WINDOWS = [7, 14, 30, 90] as const;
type Window = typeof WINDOWS[number];

export default function Trends() {
  const runs        = useStore(state => state.runs);
  const testResults = useStore(state => state.testResults);
  const isLoaded    = useStore(state => state.isLoaded);
  const [, navigate] = useLocation();
  const [trendWindow, setTrendWindow] = useState<Window>(30);

  if (!isLoaded) return (
    <div className="animate-pulse space-y-4">
      <div className="h-32 bg-muted rounded-md" />
      <div className="h-64 bg-muted rounded-md" />
    </div>
  );

  const trendData     = useMemo(() => computePassRateTrend(runs, trendWindow), [runs, trendWindow]);
  const heatmapData   = useMemo(() => computeCategoryHeatmap(runs, testResults), [runs, testResults]);
  const flakinessData = useMemo(() => computeFlakiness(runs, testResults).slice(0, 15), [runs, testResults]);

  // 90-day calendar heatmap
  const calendarData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 90 }, (_, i) => {
      const d       = subDays(now, 89 - i);
      const dateStr = format(d, "yyyy-MM-dd");
      const dayRuns = runs.filter(r => r.started.startsWith(dateStr));
      const pr      = dayRuns.length
        ? dayRuns.reduce((a, b) => a + b.passPct, 0) / dayRuns.length
        : null;
      return { date: d, dateStr, passPct: pr, count: dayRuns.length };
    });
  }, [runs]);

  // Weekday labels for calendar header
  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
  const firstDayOfWeek = calendarData[0]?.date.getDay() ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Test Analytics & Trends</h1>
      </div>

      {/* Pass rate trend + flakiness leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Pass Rate Stability
            </CardTitle>
            <div className="flex gap-1">
              {WINDOWS.map(w => (
                <Button
                  key={w}
                  size="sm"
                  variant={trendWindow === w ? "default" : "ghost"}
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setTrendWindow(w)}
                >
                  {w}d
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => v.slice(5)}
                  />
                  <YAxis
                    domain={[50, 100]}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `${v}%`}
                    width={34}
                  />
                  <ReferenceLine
                    y={95}
                    stroke="hsl(var(--primary))"
                    strokeDasharray="4 4"
                    strokeOpacity={0.5}
                    label={{ value: "95% gate", position: "insideTopRight", fontSize: 9, fill: "hsl(var(--primary))" }}
                  />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }}
                    formatter={(v: number) => [`${v?.toFixed(1)}%`, "Pass Rate"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="passPct"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary)/.15)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Flakiness leaderboard */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" /> Flakiness
              </span>
              <Badge variant="outline" className="text-xs">{flakinessData.length} tests</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {flakinessData.length > 0 ? (
              <div className="max-h-[268px] overflow-y-auto divide-y divide-border">
                {flakinessData.map((f, i) => (
                  <div
                    key={f.testCaseId}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 cursor-pointer transition"
                    onClick={() => navigate(`/tests`)}
                    title="View test definition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" title={f.testName}>{f.testName}</p>
                        <p className="text-xs text-muted-foreground">{f.category} · {f.runCount} runs</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`ml-2 shrink-0 ${f.score > 0.4 ? "border-destructive text-destructive" : "border-orange-500 text-orange-500"}`}
                    >
                      {(f.score * 100).toFixed(0)}%
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No flaky tests detected
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category × Environment Performance Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Category</TableHead>
                  {heatmapData.map(h => (
                    <TableHead
                      key={h.env}
                      className="text-center cursor-pointer hover:text-primary"
                      onClick={() => navigate(`/runs?env=${h.env.split(" ")[0]}`)}
                    >
                      {h.env}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {heatmapData[0]?.categories &&
                  Object.keys(heatmapData[0].categories).map(cat => (
                    <TableRow key={cat}>
                      <TableCell className="font-medium text-sm">{cat}</TableCell>
                      {heatmapData.map(envData => {
                        const score = envData.categories[cat] ?? 0;
                        return (
                          <TableCell key={`${envData.env}-${cat}`} className="text-center p-1">
                            <div
                              title={`${envData.env} / ${cat}: ${score}%`}
                              className={`mx-auto py-2 rounded text-sm font-semibold cursor-pointer hover:opacity-80 transition
                                ${score >= 95
                                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                  : score >= 85
                                  ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                  : "bg-destructive/20 text-destructive"
                                }`}
                            >
                              {score}%
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <span>Legend:</span>
            {[
              { color: "bg-emerald-500/20 text-emerald-600", label: "≥ 95% — Healthy" },
              { color: "bg-amber-500/20 text-amber-600",   label: "85–94% — Degraded" },
              { color: "bg-destructive/20 text-destructive", label: "< 85% — Critical" },
            ].map(l => (
              <span key={l.label} className={`px-2 py-0.5 rounded text-xs font-medium ${l.color}`}>
                {l.label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 90-day calendar heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">90-Day Pass Rate Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Day of week labels */}
          <div className="flex gap-1 mb-1">
            {weekDays.map((d, i) => (
              <div key={i} className="w-4 h-4 flex items-center justify-center text-[9px] text-muted-foreground">
                {d}
              </div>
            ))}
          </div>
          {/* Calendar grid with offset for first day of week */}
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`pad-${i}`} className="w-4 h-4" />
            ))}
            {calendarData.map((d, i) => (
              <div
                key={i}
                title={`${format(d.date, "MMM dd, yyyy")}: ${d.passPct != null ? d.passPct.toFixed(1) + "%" : "No runs"} ${d.count > 0 ? `(${d.count} run${d.count > 1 ? "s" : ""})` : ""}`}
                className={`w-4 h-4 rounded-sm transition cursor-pointer hover:opacity-70
                  ${d.passPct == null
                    ? "bg-muted/50"
                    : d.passPct >= 95
                    ? "bg-emerald-500"
                    : d.passPct >= 85
                    ? "bg-emerald-500/50"
                    : "bg-destructive"
                  }`}
                onClick={() => {
                  if (d.count > 0) navigate(`/runs?q=${format(d.date, "yyyy-MM-dd")}`);
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground flex-wrap">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-muted/50" /> <span>No Runs</span>
            <div className="w-3 h-3 rounded-sm bg-destructive" /> <span>&lt; 85%</span>
            <div className="w-3 h-3 rounded-sm bg-emerald-500/50" /> <span>85–94%</span>
            <div className="w-3 h-3 rounded-sm bg-emerald-500" /> <span>≥ 95%</span>
            <span>More</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
