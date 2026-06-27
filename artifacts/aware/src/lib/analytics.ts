import { Run, TestResult, DiffRow } from "./types";
import { subDays, format, parseISO } from "date-fns";

export function computePassRateTrend(runs: Run[], days: number = 30) {
  const trend: { date: string; passPct: number; runCount: number }[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const d = subDays(now, i);
    const dateStr = format(d, "yyyy-MM-dd");
    
    const dayRuns = runs.filter(r => r.started.startsWith(dateStr));
    const passPct = dayRuns.length > 0 
      ? dayRuns.reduce((sum, r) => sum + r.passPct, 0) / dayRuns.length 
      : null;
      
    if (passPct !== null) {
      trend.push({ date: format(d, "MMM dd"), passPct, runCount: dayRuns.length });
    }
  }
  
  return trend;
}

export function computeCategoryHeatmap(runs: Run[], results: TestResult[]) {
  // Return format: { env: string, categories: { [cat: string]: number } }[]
  const envs = ["QA", "UAT", "PROD"];
  const categories = Array.from(new Set(results.map(r => r.category)));
  
  return envs.map(env => {
    const envRuns = runs.filter(r => r.env === env).map(r => r.id);
    const envResults = results.filter(r => envRuns.includes(r.runId));
    
    const catPassRates: Record<string, number> = {};
    categories.forEach(cat => {
      const catResults = envResults.filter(r => r.category === cat);
      if (catResults.length === 0) {
        catPassRates[cat] = 100;
        return;
      }
      const passed = catResults.filter(r => r.status === "PASS").length;
      catPassRates[cat] = Math.round((passed / catResults.length) * 100);
    });
    
    return { env, categories: catPassRates };
  });
}

export function computeFlakiness(runs: Run[], results: TestResult[]) {
  // group by testCaseId, order by run started desc
  const byTestCase: Record<string, { status: string; started: string }[]> = {};
  
  results.forEach(r => {
    if (!byTestCase[r.testCaseId]) byTestCase[r.testCaseId] = [];
    const run = runs.find(run => run.id === r.runId);
    if (run) {
      byTestCase[r.testCaseId].push({ status: r.status, started: run.started });
    }
  });

  const flakinessScores: { testCaseId: string; score: number; runCount: number; testName: string; category: string }[] = [];

  for (const tcId in byTestCase) {
    const h = byTestCase[tcId].sort((a, b) => new Date(a.started).getTime() - new Date(b.started).getTime());
    if (h.length < 5) continue; // need enough history
    
    let transitions = 0;
    for (let i = 1; i < h.length; i++) {
      if (h[i].status !== h[i-1].status && (h[i].status === "PASS" || h[i].status === "FAIL")) {
        transitions++;
      }
    }
    
    const rInfo = results.find(r => r.testCaseId === tcId);
    
    flakinessScores.push({
      testCaseId: tcId,
      score: transitions / (h.length - 1),
      runCount: h.length,
      testName: rInfo?.name || tcId,
      category: rInfo?.category || "Unknown"
    });
  }

  return flakinessScores.sort((a, b) => b.score - a.score);
}

export function computeDiff(baseResults: TestResult[], candResults: TestResult[]): DiffRow[] {
  const baseMap = new Map(baseResults.map(r => [r.testCaseId, r]));
  const candMap = new Map(candResults.map(r => [r.testCaseId, r]));
  
  const allIds = new Set([...baseMap.keys(), ...candMap.keys()]);
  const diffs: DiffRow[] = [];
  
  allIds.forEach(id => {
    const base = baseMap.get(id) || null;
    const cand = candMap.get(id) || null;
    
    let status: DiffRow["status"] = "unchanged";
    if (!base && cand) status = "new";
    else if (base && !cand) status = "missing";
    else if (base?.status === "PASS" && cand?.status === "FAIL") status = "regression";
    else if (base?.status === "FAIL" && cand?.status === "PASS") status = "fixed";
    else if (base?.status !== cand?.status) status = "unchanged"; // other changes
    
    const changed = status !== "unchanged";
    
    diffs.push({
      id,
      name: cand?.name || base?.name || id,
      status,
      baseResult: base,
      candidateResult: cand,
      changed
    });
  });
  
  return diffs.sort((a, b) => {
    const rank = { regression: 0, fixed: 1, new: 2, missing: 3, unchanged: 4 };
    return rank[a.status] - rank[b.status];
  });
}
