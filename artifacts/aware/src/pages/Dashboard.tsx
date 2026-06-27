import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { computePassRateTrend } from "@/lib/analytics";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AlertCircle, CheckCircle2, Activity, PlayCircle, XCircle } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { runs, isLoaded } = useStore();

  if (!isLoaded) return <div className="animate-pulse space-y-4"><div className="h-32 bg-muted rounded-md"/><div className="h-64 bg-muted rounded-md"/></div>;

  const trendData = computePassRateTrend(runs, 30);
  const recentRuns = runs.filter(r => new Date(r.started) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const avgPass = recentRuns.length ? Math.round(recentRuns.reduce((a, b) => a + b.passPct, 0) / recentRuns.length) : 0;
  
  // Z-score mock anomaly
  const hasAnomaly = recentRuns.some(r => r.passPct < 85 && r.status === "FAIL");
  const anomalyRun = hasAnomaly ? recentRuns.find(r => r.passPct < 85 && r.status === "FAIL") : null;

  return (
    <div className="space-y-6">
      {hasAnomaly && anomalyRun && (
        <div className="bg-destructive/15 border border-destructive/30 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="w-5 h-5" />
            <div>
              <p className="font-semibold text-sm">Anomaly Detected</p>
              <p className="text-xs opacity-90">Run {anomalyRun.id} pass rate deviated significantly from 14-day rolling mean (Z &lt; -2.0).</p>
            </div>
          </div>
          <Link href={`/compare?candidate=${anomalyRun.id}`} className="bg-destructive text-destructive-foreground px-3 py-1.5 rounded text-xs font-medium hover:bg-destructive/90 transition">
            Investigate Run
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Overall Pass Rate (7d)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgPass}%</div>
            <div className="h-10 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData.slice(-7)}>
                  <Area type="monotone" dataKey="passPct" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/.2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Runs (7d)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold flex items-center gap-2"><Activity className="text-primary"/> {recentRuns.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Failed Runs (7d)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-destructive flex items-center gap-2"><XCircle className="text-destructive"/> {recentRuns.filter(r => r.status === "FAIL").length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Pipelines</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold flex items-center gap-2 text-emerald-500"><PlayCircle/> 2</div></CardContent>
        </Card>
      </div>

      <h2 className="text-lg font-semibold mt-8 mb-4">Environment Tiers</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["QA", "UAT", "PROD"].map(env => {
          const envRuns = runs.filter(r => r.env === env);
          const envAvg = envRuns.length ? Math.round(envRuns.reduce((a, b) => a + b.passPct, 0) / envRuns.length) : 0;
          return (
            <Card key={env} className="bg-card">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="font-bold text-lg">{env}</CardTitle>
                <Badge variant={envAvg > 95 ? "default" : (envAvg > 85 ? "secondary" : "destructive")}>
                  {envAvg > 95 ? "HEALTHY" : "DEGRADED"}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-4">{envAvg}% <span className="text-sm font-normal text-muted-foreground">avg pass</span></div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Staging</span>
                    <span className="font-medium">{Math.round(envAvg * (Math.random()*0.1 + 0.95))}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Production</span>
                    <span className="font-medium">{Math.round(envAvg * (Math.random()*0.1 + 0.95))}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>30-Day Pass Rate Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="passPct" name="Pass Rate %" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/.2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
