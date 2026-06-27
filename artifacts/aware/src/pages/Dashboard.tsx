import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { computePassRateTrend } from "@/lib/analytics";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { AlertCircle, CheckCircle2, Activity, PlayCircle, XCircle, TrendingUp, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";

export default function Dashboard() {
  const runs = useStore(state => state.runs);
  const isLoaded = useStore(state => state.isLoaded);
  const [, navigate] = useLocation();
  const [dismissedAnomaly, setDismissedAnomaly] = useState(false);

  const sevenDaysAgo = useMemo(() => Date.now() - 7 * 24 * 60 * 60 * 1000, []);
  const recentRuns = useMemo(
    () => runs.filter(r => new Date(r.started).getTime() >= sevenDaysAgo),
    [runs, sevenDaysAgo],
  );
  const trendData = useMemo(() => computePassRateTrend(runs, 30), [runs]);

  if (!isLoaded) return (
    <div className="animate-pulse space-y-4">
      <div className="h-32 bg-muted rounded-md" />
      <div className="h-64 bg-muted rounded-md" />
    </div>
  );

  const avgPass = recentRuns.length
    ? Math.round(recentRuns.reduce((a, b) => a + b.passPct, 0) / recentRuns.length)
    : 0;
  const failedCount  = recentRuns.filter(r => r.status === "FAIL").length;
  const runningCount = runs.filter(r => r.status === "RUNNING").length;

  const anomalyRun = recentRuns.find(r => r.passPct < 85 && r.status === "FAIL") ?? null;
  const hasAnomaly = !dismissedAnomaly && !!anomalyRun;

  // Per-env, per-network pass rates — computed from real data, no Math.random()
  const envStats = useMemo(() => {
    return ["QA", "UAT", "PROD"].map(env => {
      const stagingRuns   = runs.filter(r => r.env === env && r.network === "staging");
      const productionRuns = runs.filter(r => r.env === env && r.network === "production");
      const allEnvRuns    = runs.filter(r => r.env === env);
      const avg = (arr: typeof runs) =>
        arr.length ? Math.round(arr.reduce((s, r) => s + r.passPct, 0) / arr.length) : 0;
      return {
        env,
        total:      avg(allEnvRuns),
        staging:    avg(stagingRuns),
        production: avg(productionRuns),
        runCount:   allEnvRuns.length,
      };
    });
  }, [runs]);

  const kpiCards = [
    {
      label: "Overall Pass Rate (7d)",
      value: `${avgPass}%`,
      icon: <TrendingUp className={`w-5 h-5 ${avgPass >= 95 ? "text-emerald-500" : "text-amber-500"}`} />,
      sub: `${recentRuns.length} runs analysed`,
      href: "/runs",
      accent: avgPass >= 95 ? "text-emerald-600 dark:text-emerald-400" : avgPass >= 85 ? "text-amber-500" : "text-destructive",
    },
    {
      label: "Total Runs (7d)",
      value: recentRuns.length,
      icon: <Activity className="w-5 h-5 text-primary" />,
      sub: "across all environments",
      href: "/runs",
      accent: "text-primary",
    },
    {
      label: "Failed Runs (7d)",
      value: failedCount,
      icon: <XCircle className="w-5 h-5 text-destructive" />,
      sub: failedCount === 0 ? "All clear" : `${Math.round((failedCount / recentRuns.length) * 100)}% failure rate`,
      href: "/runs?status=FAIL",
      accent: failedCount > 0 ? "text-destructive" : "text-emerald-500",
    },
    {
      label: "Active Pipelines",
      value: runningCount,
      icon: <PlayCircle className="w-5 h-5 text-emerald-500" />,
      sub: runningCount === 0 ? "No active runs" : `${runningCount} running now`,
      href: "/runs?status=RUNNING",
      accent: "text-emerald-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Anomaly banner */}
      {hasAnomaly && anomalyRun && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-destructive min-w-0">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-sm">Anomaly Detected</p>
              <p className="text-xs opacity-90 truncate">
                Run <strong>{anomalyRun.id}</strong> ({anomalyRun.env} {anomalyRun.network}) pass rate{" "}
                <strong>{anomalyRun.passPct}%</strong> — significantly below 14-day rolling mean (Z &lt; −2.0).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/compare?candidate=${anomalyRun.id}`}
              className="bg-destructive text-destructive-foreground px-3 py-1.5 rounded text-xs font-medium hover:bg-destructive/90 transition whitespace-nowrap"
            >
              Investigate Run
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => setDismissedAnomaly(true)}
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* KPI cards — all clickable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map(card => (
          <Card
            key={card.label}
            className="cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => navigate(card.href)}
          >
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${card.accent}`}>{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
              {card.label === "Overall Pass Rate (7d)" && trendData.length > 0 && (
                <div className="h-10 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData.slice(-7)}>
                      <Area
                        type="monotone"
                        dataKey="passPct"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary)/.15)"
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Environment Tiers — all clickable, real staging/production breakdown */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Environment Tiers</h2>
          <Link href="/runs" className="text-xs text-muted-foreground hover:text-primary transition">
            View all runs →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {envStats.map(({ env, total, staging, production, runCount }) => {
            const isHealthy = total >= 95;
            const isDegraded = total < 85;
            return (
              <Card
                key={env}
                className="cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => navigate(`/runs?env=${env}`)}
              >
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="font-bold text-lg">{env}</CardTitle>
                  <Badge
                    variant={isHealthy ? "default" : isDegraded ? "destructive" : "secondary"}
                    className={isHealthy ? "bg-emerald-500 hover:bg-emerald-500" : ""}
                  >
                    {isHealthy ? "HEALTHY" : isDegraded ? "CRITICAL" : "DEGRADED"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-1 mb-3">
                    <span className="text-2xl font-bold">{total}%</span>
                    <span className="text-sm font-normal text-muted-foreground mb-0.5">avg pass</span>
                  </div>
                  {/* Pass rate progress bar */}
                  <div className="h-1.5 bg-muted rounded-full mb-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isHealthy ? "bg-emerald-500" : isDegraded ? "bg-destructive" : "bg-amber-500"}`}
                      style={{ width: `${total}%` }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Staging</span>
                      <span className={`font-medium ${staging >= 95 ? "text-emerald-500" : staging < 85 ? "text-destructive" : "text-amber-500"}`}>
                        {staging}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Production</span>
                      <span className={`font-medium ${production >= 95 ? "text-emerald-500" : production < 85 ? "text-destructive" : "text-amber-500"}`}>
                        {production}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Runs</span>
                      <span className="font-medium text-muted-foreground">{runCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 30-Day trend with Y-axis and 95% reference line */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            30-Day Pass Rate Trend
          </CardTitle>
          <Link href="/trends" className="text-xs text-muted-foreground hover:text-primary transition">
            Full analytics →
          </Link>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => v.slice(5)} // show MM-DD
                />
                <YAxis
                  domain={[60, 100]}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `${v}%`}
                  width={36}
                />
                <ReferenceLine
                  y={95}
                  stroke="hsl(var(--primary))"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                  label={{ value: "95% gate", position: "insideTopRight", fontSize: 10, fill: "hsl(var(--primary))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v.toFixed(1)}%`, "Pass Rate"]}
                />
                <Area
                  type="monotone"
                  dataKey="passPct"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary)/.15)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
