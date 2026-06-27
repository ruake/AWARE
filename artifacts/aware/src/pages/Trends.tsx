import { useStore } from "@/lib/store";
import { computePassRateTrend, computeCategoryHeatmap, computeFlakiness } from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AreaChart, Area, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Flame, Activity, CheckCircle2, ShieldAlert } from "lucide-react";
import { format, subDays } from "date-fns";

export default function Trends() {
  const { runs, testResults, isLoaded } = useStore();

  if (!isLoaded) return <div className="animate-pulse space-y-4"><div className="h-32 bg-muted rounded-md"/><div className="h-64 bg-muted rounded-md"/></div>;

  const trendData = computePassRateTrend(runs, 30);
  const heatmapData = computeCategoryHeatmap(runs, testResults);
  const flakinessData = computeFlakiness(runs, testResults).slice(0, 20);

  // Generate mock calendar data (90 days)
  const now = new Date();
  const calendarData = Array.from({ length: 90 }).map((_, i) => {
    const d = subDays(now, 89 - i);
    const dayRuns = runs.filter(r => r.started.startsWith(format(d, "yyyy-MM-dd")));
    const pr = dayRuns.length ? dayRuns.reduce((a, b) => a + b.passPct, 0) / dayRuns.length : null;
    return { date: d, passPct: pr, count: dayRuns.length };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Test Analytics & Trends</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-primary"/> 30-Day Pass Rate Stability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="passPct" name="Pass Rate %" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/.2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Flame className="w-5 h-5 text-orange-500"/> Flakiness Leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {flakinessData.length > 0 ? (
              <div className="max-h-[250px] overflow-y-auto px-6 pb-6">
                <div className="space-y-4">
                  {flakinessData.map(f => (
                    <div key={f.testCaseId} className="flex items-start justify-between">
                      <div className="truncate pr-4">
                        <p className="text-sm font-medium truncate" title={f.testName}>{f.testName}</p>
                        <p className="text-xs text-muted-foreground">{f.category} • {f.runCount} runs</p>
                      </div>
                      <Badge variant="outline" className={f.score > 0.4 ? "border-destructive text-destructive" : "border-orange-500 text-orange-500"}>
                        {(f.score * 100).toFixed(0)}% Flaky
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground text-sm">No flaky tests detected in this window</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Category Performance Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Category</TableHead>
                  {heatmapData.map(h => <TableHead key={h.env} className="text-center">{h.env}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {heatmapData[0]?.categories && Object.keys(heatmapData[0].categories).map(cat => (
                  <TableRow key={cat}>
                    <TableCell className="font-medium">{cat}</TableCell>
                    {heatmapData.map(envData => {
                      const score = envData.categories[cat] || 0;
                      return (
                        <TableCell key={`${envData.env}-${cat}`} className="text-center p-1">
                          <div className={`mx-auto w-full py-2 rounded font-medium text-sm
                            ${score >= 95 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 
                              score >= 85 ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' : 
                              'bg-destructive/20 text-destructive'}`}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">90-Day Contribution Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {calendarData.map((d, i) => (
              <div 
                key={i}
                title={`${format(d.date, "MMM dd")}: ${d.passPct ? d.passPct.toFixed(1) + '%' : 'No runs'}`}
                className={`w-4 h-4 rounded-sm
                  ${d.passPct === null ? 'bg-muted/50' : 
                    d.passPct >= 95 ? 'bg-emerald-500' : 
                    d.passPct >= 85 ? 'bg-emerald-500/50' : 
                    'bg-destructive'}
                `}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
            <span>Legend:</span>
            <div className="w-3 h-3 rounded-sm bg-muted/50" /> <span>No Runs</span>
            <div className="w-3 h-3 rounded-sm bg-destructive" /> <span>&lt;85%</span>
            <div className="w-3 h-3 rounded-sm bg-emerald-500/50" /> <span>85-94%</span>
            <div className="w-3 h-3 rounded-sm bg-emerald-500" /> <span>&gt;95%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
